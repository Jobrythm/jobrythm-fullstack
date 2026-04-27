import { Router, Response } from 'express';
import OAuthClient from 'intuit-oauth';
import { XeroClient } from 'xero-node';
import { AppDataSource } from '../config/database.js';
import { OAuthToken } from '../entities/OAuthToken.js';
import { Client } from '../entities/Client.js';
import { Job } from '../entities/Job.js';
import { getIntegrationsConfig } from '../utils/appSettings.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

export const integrationsRouter = Router();
integrationsRouter.use(authenticateToken);

// ─────────────────────────── helpers ────────────────────────────────────────

async function getToken(userId: string, provider: 'quickbooks' | 'xero') {
  return AppDataSource.getRepository(OAuthToken).findOne({ where: { userId, provider } });
}

async function upsertToken(userId: string, provider: 'quickbooks' | 'xero', data: Partial<OAuthToken>) {
  const repo = AppDataSource.getRepository(OAuthToken);
  let token = await repo.findOne({ where: { userId, provider } });
  if (!token) token = repo.create({ userId, provider });
  Object.assign(token, data);
  return repo.save(token);
}

function companyId(req: AuthRequest): string {
  return req.user!.companyId ?? req.user!.userId;
}

// ─────────────────────────── status ─────────────────────────────────────────

integrationsRouter.get('/status', async (req: AuthRequest, res: Response) => {
  const userId = companyId(req);
  const [qb, xero] = await Promise.all([
    getToken(userId, 'quickbooks'),
    getToken(userId, 'xero'),
  ]);
  res.json({
    quickbooks: qb
      ? { connected: true, realmId: qb.realmId, lastSyncAt: qb.lastSyncAt }
      : { connected: false },
    xero: xero
      ? { connected: true, tenantId: xero.tenantId, lastSyncAt: xero.lastSyncAt }
      : { connected: false },
  });
});

// ═══════════════════════════ QuickBooks ══════════════════════════════════════

function makeQBClient(cfg: Awaited<ReturnType<typeof getIntegrationsConfig>>) {
  return new OAuthClient({
    clientId:     cfg.quickbooksClientId!,
    clientSecret: cfg.quickbooksClientSecret!,
    environment:  cfg.quickbooksSandbox ? 'sandbox' : 'production',
    redirectUri:  cfg.quickbooksRedirectUri!,
  });
}

integrationsRouter.get('/quickbooks/connect', async (req: AuthRequest, res: Response) => {
  const cfg = await getIntegrationsConfig();
  if (!cfg.quickbooksClientId || !cfg.quickbooksClientSecret || !cfg.quickbooksRedirectUri) {
    res.status(503).json({ error: 'QuickBooks is not configured. Ask your admin to set up the QuickBooks integration.' });
    return;
  }
  const client = makeQBClient(cfg);
  const authUri = client.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: companyId(req),
  });
  res.json({ url: authUri });
});

integrationsRouter.get('/quickbooks/callback', async (req: AuthRequest, res: Response) => {
  const cfg = await getIntegrationsConfig();
  if (!cfg.quickbooksClientId) { res.status(503).json({ error: 'QuickBooks not configured.' }); return; }
  const client = makeQBClient(cfg);
  try {
    const tokenResponse = await client.createToken(req.url);
    const token = tokenResponse.getJson();
    const userId: string = String(req.query['state'] ?? '');
    await upsertToken(userId, 'quickbooks', {
      accessToken:  token.access_token,
      refreshToken: token.refresh_token,
      expiresAt:    Date.now() + (token.expires_in ?? 3600) * 1000,
      realmId:      String(req.query['realmId'] ?? token.realmId ?? ''),
    });
    res.redirect('/#/settings?integration=quickbooks&status=connected');
  } catch (err) {
    console.error('[QB callback]', err);
    res.redirect('/#/settings?integration=quickbooks&status=error');
  }
});

integrationsRouter.delete('/quickbooks/disconnect', async (req: AuthRequest, res: Response) => {
  await AppDataSource.getRepository(OAuthToken).delete({ userId: companyId(req), provider: 'quickbooks' });
  res.json({ ok: true });
});

async function refreshQBTokenIfNeeded(cfg: Awaited<ReturnType<typeof getIntegrationsConfig>>, userId: string): Promise<string> {
  const oauthToken = await getToken(userId, 'quickbooks');
  if (!oauthToken) throw new Error('QuickBooks not connected.');
  let accessToken = oauthToken.accessToken;
  if (oauthToken.expiresAt && Date.now() > oauthToken.expiresAt - 60_000) {
    const client = makeQBClient(cfg);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.setToken({ refresh_token: oauthToken.refreshToken!, access_token: accessToken } as any);
    const refreshed = await client.refreshUsingToken(oauthToken.refreshToken!);
    const newTokenData = refreshed.getJson();
    accessToken = newTokenData.access_token;
    await upsertToken(userId, 'quickbooks', {
      accessToken,
      refreshToken: newTokenData.refresh_token,
      expiresAt: Date.now() + (newTokenData.expires_in ?? 3600) * 1000,
    });
  }
  return accessToken;
}

// ── QuickBooks sync: push clients ────────────────────────────────────────────

integrationsRouter.post('/quickbooks/sync-clients', async (req: AuthRequest, res: Response) => {
  const userId = companyId(req);
  const cfg = await getIntegrationsConfig();
  const oauthToken = await getToken(userId, 'quickbooks');
  if (!oauthToken) { res.status(400).json({ error: 'QuickBooks not connected.' }); return; }

  let accessToken: string;
  try { accessToken = await refreshQBTokenIfNeeded(cfg, userId); }
  catch (e) { res.status(400).json({ error: String(e) }); return; }

  const clients = await AppDataSource.getRepository(Client).find({ where: { userId } });
  const realmId = oauthToken.realmId!;
  const baseUrl = cfg.quickbooksSandbox
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

  let created = 0, errors = 0;
  for (const c of clients) {
    const body = {
      DisplayName: c.name,
      PrimaryEmailAddr: c.email ? { Address: c.email } : undefined,
      PrimaryPhone: c.phone ? { FreeFormNumber: c.phone } : undefined,
    };
    try {
      const resp = await fetch(`${baseUrl}/v3/company/${realmId}/customer?minorversion=65`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Customer: body }),
      });
      if (resp.ok) created++;
      else { errors++; console.error('[QB sync client]', await resp.text()); }
    } catch (e) {
      errors++;
      console.error('[QB sync client]', e);
    }
  }

  await upsertToken(userId, 'quickbooks', { lastSyncAt: new Date() });
  res.json({ message: `Synced ${clients.length} clients. Created: ${created}, Errors: ${errors}` });
});

// ── QuickBooks sync: push invoices ───────────────────────────────────────────

integrationsRouter.post('/quickbooks/sync-invoices', async (req: AuthRequest, res: Response) => {
  const userId = companyId(req);
  const cfg = await getIntegrationsConfig();
  const oauthToken = await getToken(userId, 'quickbooks');
  if (!oauthToken) { res.status(400).json({ error: 'QuickBooks not connected.' }); return; }

  let accessToken: string;
  try { accessToken = await refreshQBTokenIfNeeded(cfg, userId); }
  catch (e) { res.status(400).json({ error: String(e) }); return; }

  const jobs = await AppDataSource.getRepository(Job).find({
    where: { userId },
    relations: ['lineItems', 'client', 'invoice'],
  });

  const realmId = oauthToken.realmId!;
  const baseUrl = cfg.quickbooksSandbox
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

  let created = 0, errors = 0;
  for (const job of jobs) {
    if (!job.invoice) continue;
    const lines = (job.lineItems ?? []).map((li, idx) => ({
      Id: String(idx + 1),
      Amount: Number(li.unitPrice) * Number(li.quantity) / 100,
      DetailType: 'SalesItemLineDetail',
      Description: li.description,
      SalesItemLineDetail: {
        Qty: Number(li.quantity),
        UnitPrice: Number(li.unitPrice) / 100,
      },
    }));
    const body = {
      Line: lines,
      CustomerRef: { name: job.client?.name || 'Unknown' },
      DocNumber: job.invoice.invoiceNumber,
      DueDate: job.invoice.dueDate ? new Date(job.invoice.dueDate).toISOString().split('T')[0] : undefined,
    };
    try {
      const resp = await fetch(`${baseUrl}/v3/company/${realmId}/invoice?minorversion=65`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Invoice: body }),
      });
      if (resp.ok) created++;
      else { errors++; console.error('[QB sync invoice]', await resp.text()); }
    } catch (e) {
      errors++;
      console.error('[QB sync invoice]', e);
    }
  }

  await upsertToken(userId, 'quickbooks', { lastSyncAt: new Date() });
  res.json({ message: `Synced invoices. Created: ${created}, Errors: ${errors}` });
});

// ═══════════════════════════ Xero ════════════════════════════════════════════

async function makeXeroClient(cfg: Awaited<ReturnType<typeof getIntegrationsConfig>>) {
  return new XeroClient({
    clientId:     cfg.xeroClientId!,
    clientSecret: cfg.xeroClientSecret!,
    redirectUris: [cfg.xeroRedirectUri!],
    scopes:       ['openid', 'profile', 'email', 'accounting.transactions', 'accounting.contacts'],
  });
}

async function getXeroClientReady(userId: string, cfg: Awaited<ReturnType<typeof getIntegrationsConfig>>): Promise<{ xero: XeroClient; tenantId: string }> {
  const oauthToken = await getToken(userId, 'xero');
  if (!oauthToken) throw new Error('Xero not connected.');
  const xero = await makeXeroClient(cfg);
  xero.setTokenSet({
    access_token:  oauthToken.accessToken,
    refresh_token: oauthToken.refreshToken ?? undefined,
    expires_at:    oauthToken.expiresAt ? oauthToken.expiresAt / 1000 : undefined,
  });
  if (oauthToken.expiresAt && Date.now() > oauthToken.expiresAt - 60_000) {
    const newSet = await xero.refreshToken();
    await upsertToken(userId, 'xero', {
      accessToken:  newSet.access_token ?? '',
      refreshToken: newSet.refresh_token ?? null,
      expiresAt:    newSet.expires_at ? newSet.expires_at * 1000 : null,
    });
    xero.setTokenSet(newSet);
  }
  await xero.updateTenants();
  const tenantId = oauthToken.tenantId ?? xero.tenants?.[0]?.tenantId;
  if (!tenantId) throw new Error('No Xero tenant found.');
  return { xero, tenantId };
}

integrationsRouter.get('/xero/connect', async (req: AuthRequest, res: Response) => {
  const cfg = await getIntegrationsConfig();
  if (!cfg.xeroClientId || !cfg.xeroClientSecret || !cfg.xeroRedirectUri) {
    res.status(503).json({ error: 'Xero is not configured. Ask your admin to set up the Xero integration.' });
    return;
  }
  const xero = await makeXeroClient(cfg);
  const consentUrl = await xero.buildConsentUrl();
  const urlWithState = consentUrl + `&state=${encodeURIComponent(companyId(req))}`;
  res.json({ url: urlWithState });
});

integrationsRouter.get('/xero/callback', async (req: AuthRequest, res: Response) => {
  const cfg = await getIntegrationsConfig();
  if (!cfg.xeroClientId) { res.status(503).json({ error: 'Xero not configured.' }); return; }
  const xero = await makeXeroClient(cfg);
  try {
    const tokenSet = await xero.apiCallback(req.url);
    await xero.updateTenants();
    const tenantId = xero.tenants?.[0]?.tenantId ?? null;
    const userId: string = String(req.query['state'] ?? '');
    await upsertToken(userId, 'xero', {
      accessToken:  tokenSet.access_token ?? '',
      refreshToken: tokenSet.refresh_token ?? null,
      expiresAt:    tokenSet.expires_at ? tokenSet.expires_at * 1000 : null,
      tenantId,
    });
    res.redirect('/#/settings?integration=xero&status=connected');
  } catch (err) {
    console.error('[Xero callback]', err);
    res.redirect('/#/settings?integration=xero&status=error');
  }
});

integrationsRouter.delete('/xero/disconnect', async (req: AuthRequest, res: Response) => {
  await AppDataSource.getRepository(OAuthToken).delete({ userId: companyId(req), provider: 'xero' });
  res.json({ ok: true });
});

// ── Xero sync: push contacts (clients) ───────────────────────────────────────

integrationsRouter.post('/xero/sync-clients', async (req: AuthRequest, res: Response) => {
  const userId = companyId(req);
  const cfg = await getIntegrationsConfig();
  let xeroCtx: { xero: XeroClient; tenantId: string };
  try { xeroCtx = await getXeroClientReady(userId, cfg); }
  catch (e) { res.status(400).json({ error: String(e) }); return; }
  const { xero, tenantId } = xeroCtx;

  const clients = await AppDataSource.getRepository(Client).find({ where: { userId } });
  let created = 0, errors = 0;
  for (const c of clients) {
    try {
      await xero.accountingApi.createContacts(tenantId, {
        contacts: [{ name: c.name, emailAddress: c.email ?? undefined }],
      });
      created++;
    } catch (e) {
      errors++;
      console.error('[Xero sync client]', e);
    }
  }

  await upsertToken(userId, 'xero', { lastSyncAt: new Date() });
  res.json({ message: `Synced ${clients.length} clients to Xero. Created: ${created}, Errors: ${errors}` });
});

// ── Xero sync: push invoices ─────────────────────────────────────────────────

integrationsRouter.post('/xero/sync-invoices', async (req: AuthRequest, res: Response) => {
  const userId = companyId(req);
  const cfg = await getIntegrationsConfig();
  let xeroCtx: { xero: XeroClient; tenantId: string };
  try { xeroCtx = await getXeroClientReady(userId, cfg); }
  catch (e) { res.status(400).json({ error: String(e) }); return; }
  const { xero, tenantId } = xeroCtx;

  const jobs = await AppDataSource.getRepository(Job).find({
    where: { userId },
    relations: ['lineItems', 'client', 'invoice'],
  });

  let created = 0, errors = 0;
  for (const job of jobs) {
    if (!job.invoice) continue;
    try {
      const lineItems = (job.lineItems ?? []).map(li => ({
        description: li.description,
        quantity: Number(li.quantity),
        unitAmount: Number(li.unitPrice) / 100,
        lineAmount: Number(li.unitPrice) * Number(li.quantity) / 100,
      }));
      await xero.accountingApi.createInvoices(tenantId, {
        invoices: [{
          type: 'ACCREC' as never,
          contact: { name: job.client?.name || 'Unknown' },
          lineItems,
          invoiceNumber: job.invoice.invoiceNumber ?? undefined,
          dueDate: job.invoice.dueDate ? new Date(job.invoice.dueDate).toISOString().split('T')[0] as unknown as never : undefined,
          status: 'DRAFT' as never,
        }],
      });
      created++;
    } catch (e) {
      errors++;
      console.error('[Xero sync invoice]', e);
    }
  }

  await upsertToken(userId, 'xero', { lastSyncAt: new Date() });
  res.json({ message: `Synced invoices to Xero. Created: ${created}, Errors: ${errors}` });
});
