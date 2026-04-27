import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { AdPlatformConnection } from '../entities/AdPlatformConnection.js';
import { AdCampaign } from '../entities/AdCampaign.js';
import { AdCreative } from '../entities/AdCreative.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getAdPlatformConfig } from '../utils/appSettings.js';
import { AdPlatform, AdCampaignStatus, AdCreativeType } from '../types/enums.js';
import { google } from 'googleapis';
import FacebookAdsApi from 'facebook-nodejs-business-sdk';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build Google OAuth2 client using stored credentials */
async function buildGoogleOAuth2Client(redirectUri: string) {
  const cfg = await getAdPlatformConfig();
  if (!cfg.googleClientId || !cfg.googleClientSecret) {
    throw new Error('Google Ads OAuth credentials not configured. Set them in Admin → Settings → Ad Platforms.');
  }
  return new google.auth.OAuth2(cfg.googleClientId, cfg.googleClientSecret, redirectUri);
}

/** Build Meta/Facebook app configuration */
async function getMetaConfig() {
  const cfg = await getAdPlatformConfig();
  if (!cfg.metaAppId || !cfg.metaAppSecret) {
    throw new Error('Meta app credentials not configured. Set them in Admin → Settings → Ad Platforms.');
  }
  return { appId: cfg.metaAppId, appSecret: cfg.metaAppSecret };
}

function googleRedirectUri(req: AuthRequest) {
  return `${req.protocol}://${req.get('host')}/api/admin/ads/auth/google/callback`;
}

function youtubeRedirectUri(req: AuthRequest) {
  return `${req.protocol}://${req.get('host')}/api/admin/ads/auth/youtube/callback`;
}

// ── Platform connections ───────────────────────────────────────────────────────

router.get('/connections', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const connections = await AppDataSource.getRepository(AdPlatformConnection).find({
      where: { adminUserId: req.user!.userId },
    });

    const cfg = await getAdPlatformConfig();
    const connected = new Set(connections.map((c) => c.platform));

    res.json({
      platforms: [
        {
          platform: AdPlatform.GOOGLE_ADS,
          connected: connected.has(AdPlatform.GOOGLE_ADS),
          credentialsConfigured: Boolean(cfg.googleClientId && cfg.googleClientSecret && cfg.googleDeveloperToken),
          connection: connections.find((c) => c.platform === AdPlatform.GOOGLE_ADS)
            ? serialiseConnection(connections.find((c) => c.platform === AdPlatform.GOOGLE_ADS)!)
            : null,
        },
        {
          platform: AdPlatform.META,
          connected: connected.has(AdPlatform.META),
          credentialsConfigured: Boolean(cfg.metaAppId && cfg.metaAppSecret),
          connection: connections.find((c) => c.platform === AdPlatform.META)
            ? serialiseConnection(connections.find((c) => c.platform === AdPlatform.META)!)
            : null,
        },
        {
          platform: AdPlatform.YOUTUBE,
          connected: connected.has(AdPlatform.YOUTUBE),
          credentialsConfigured: Boolean(cfg.googleClientId && cfg.googleClientSecret),
          connection: connections.find((c) => c.platform === AdPlatform.YOUTUBE)
            ? serialiseConnection(connections.find((c) => c.platform === AdPlatform.YOUTUBE)!)
            : null,
        },
      ],
    });
  } catch (error) {
    console.error('List connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── OAuth flows ────────────────────────────────────────────────────────────────

router.get('/auth/google', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const oauth2Client = await buildGoogleOAuth2Client(googleRedirectUri(req));
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent',
      state: req.user!.userId,
    });
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/auth/google/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, state: adminUserId } = req.query as { code?: string; state?: string };
    if (!code || !adminUserId) {
      res.status(400).json({ error: 'Missing code or state' });
      return;
    }

    const oauth2Client = await buildGoogleOAuth2Client(googleRedirectUri(req));
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch Google account info for display
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const repo = AppDataSource.getRepository(AdPlatformConnection);
    let connection = await repo.findOne({ where: { adminUserId, platform: AdPlatform.GOOGLE_ADS } });
    if (!connection) connection = repo.create({ adminUserId, platform: AdPlatform.GOOGLE_ADS });

    connection.accessToken = tokens.access_token!;
    connection.refreshToken = tokens.refresh_token ?? connection.refreshToken;
    connection.tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
    connection.accountId = userInfo.id ?? undefined;
    connection.accountName = userInfo.email ?? undefined;

    await repo.save(connection);
    res.redirect('/admin?tab=sales&panel=ads&connected=google');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('/admin?tab=sales&panel=ads&error=google_auth_failed');
  }
});

router.get('/auth/youtube', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const oauth2Client = await buildGoogleOAuth2Client(youtubeRedirectUri(req));
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent',
      state: req.user!.userId,
    });
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/auth/youtube/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, state: adminUserId } = req.query as { code?: string; state?: string };
    if (!code || !adminUserId) {
      res.status(400).json({ error: 'Missing code or state' });
      return;
    }

    const oauth2Client = await buildGoogleOAuth2Client(youtubeRedirectUri(req));
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch channel info
    const yt = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelRes = await yt.channels.list({ part: ['snippet'], mine: true });
    const channel = channelRes.data.items?.[0];

    const repo = AppDataSource.getRepository(AdPlatformConnection);
    let connection = await repo.findOne({ where: { adminUserId, platform: AdPlatform.YOUTUBE } });
    if (!connection) connection = repo.create({ adminUserId, platform: AdPlatform.YOUTUBE });

    connection.accessToken = tokens.access_token!;
    connection.refreshToken = tokens.refresh_token ?? connection.refreshToken;
    connection.tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
    connection.accountId = channel?.id ?? undefined;
    connection.accountName = channel?.snippet?.title ?? undefined;

    await repo.save(connection);
    res.redirect('/admin?tab=sales&panel=ads&connected=youtube');
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    res.redirect('/admin?tab=sales&panel=ads&error=youtube_auth_failed');
  }
});

router.get('/auth/meta', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId } = await getMetaConfig();
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/admin/ads/auth/meta/callback`);
    const state = req.user!.userId;
    const scope = 'ads_management,ads_read,business_management';
    const url = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/auth/meta/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, state: adminUserId } = req.query as { code?: string; state?: string };
    if (!code || !adminUserId) {
      res.status(400).json({ error: 'Missing code or state' });
      return;
    }

    const { appId, appSecret } = await getMetaConfig();
    const redirectUri = `${req.protocol}://${req.get('host')}/api/admin/ads/auth/meta/callback`;

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: { message: string } };

    if (!tokenData.access_token) {
      throw new Error(tokenData.error?.message ?? 'Failed to get Meta access token');
    }

    // Get user info
    const userRes = await fetch(`https://graph.facebook.com/me?access_token=${tokenData.access_token}&fields=id,name`);
    const userData = (await userRes.json()) as { id?: string; name?: string };

    // Exchange for long-lived token
    const llTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`;
    const llRes = await fetch(llTokenUrl);
    const llData = (await llRes.json()) as { access_token?: string };
    const finalToken = llData.access_token ?? tokenData.access_token;

    FacebookAdsApi.init(finalToken);

    const repo = AppDataSource.getRepository(AdPlatformConnection);
    let connection = await repo.findOne({ where: { adminUserId, platform: AdPlatform.META } });
    if (!connection) connection = repo.create({ adminUserId, platform: AdPlatform.META });

    connection.accessToken = finalToken;
    connection.accountId = userData.id ?? undefined;
    connection.accountName = userData.name ?? undefined;
    connection.tokenExpiresAt = undefined; // long-lived tokens don't expire soon

    await repo.save(connection);
    res.redirect('/admin?tab=sales&panel=ads&connected=meta');
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    res.redirect('/admin?tab=sales&panel=ads&error=meta_auth_failed');
  }
});

router.delete('/connections/:platform', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(AdPlatformConnection);
    const connection = await repo.findOne({
      where: { adminUserId: req.user!.userId, platform: req.params.platform as AdPlatform },
    });

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    await repo.remove(connection);
    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect platform error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Ad campaigns ───────────────────────────────────────────────────────────────

router.get('/campaigns', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaigns = await AppDataSource.getRepository(AdCampaign).find({ order: { createdAt: 'DESC' } });
    res.json(campaigns);
  } catch (error) {
    console.error('List ad campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { platform, name, budgetCents, startDate, endDate } = req.body as {
      platform?: AdPlatform;
      name?: string;
      budgetCents?: number;
      startDate?: string;
      endDate?: string;
    };

    if (!platform || !name) {
      res.status(400).json({ error: 'platform and name are required' });
      return;
    }

    const connection = await AppDataSource.getRepository(AdPlatformConnection).findOne({
      where: { adminUserId: req.user!.userId, platform },
    });

    if (!connection) {
      res.status(400).json({ error: `Platform ${platform} is not connected` });
      return;
    }

    let platformCampaignId: string | undefined;

    if (platform === AdPlatform.GOOGLE_ADS) {
      platformCampaignId = await createGoogleAdsCampaign(connection, name, budgetCents ?? 0, startDate, endDate);
    } else if (platform === AdPlatform.META) {
      platformCampaignId = await createMetaCampaign(connection, name, budgetCents ?? 0);
    }
    // YouTube campaigns are managed via Google Ads

    const campaign = AppDataSource.getRepository(AdCampaign).create({
      platform,
      platformCampaignId,
      name,
      status: AdCampaignStatus.PAUSED,
      budgetCents: budgetCents ?? 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    await AppDataSource.getRepository(AdCampaign).save(campaign);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create ad campaign error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/campaigns/sync', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const connections = await AppDataSource.getRepository(AdPlatformConnection).find({
      where: { adminUserId: req.user!.userId },
    });

    const campaigns = await AppDataSource.getRepository(AdCampaign).find();
    const now = new Date();
    const errors: string[] = [];

    await Promise.allSettled(
      campaigns.map(async (campaign) => {
        const connection = connections.find((c) => c.platform === campaign.platform);
        if (!connection || !campaign.platformCampaignId) return;

        try {
          if (campaign.platform === AdPlatform.GOOGLE_ADS) {
            const stats = await fetchGoogleAdsStats(connection, campaign.platformCampaignId);
            campaign.impressions = stats.impressions;
            campaign.clicks = stats.clicks;
            campaign.spendCents = stats.spendCents;
          } else if (campaign.platform === AdPlatform.META) {
            const stats = await fetchMetaStats(connection, campaign.platformCampaignId);
            campaign.impressions = stats.impressions;
            campaign.clicks = stats.clicks;
            campaign.spendCents = stats.spendCents;
          }
          campaign.lastSyncedAt = now;
          await AppDataSource.getRepository(AdCampaign).save(campaign);
        } catch (err) {
          errors.push(`${campaign.name}: ${(err as Error).message}`);
        }
      }),
    );

    res.json({ synced: campaigns.length, errors });
  } catch (error) {
    console.error('Sync campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Ad creatives ───────────────────────────────────────────────────────────────

router.get('/creatives', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatives = await AppDataSource.getRepository(AdCreative).find({ order: { createdAt: 'DESC' } });
    res.json(creatives);
  } catch (error) {
    console.error('List ad creatives error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/creatives', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { platform, type, title, body, mediaUrl } = req.body as Partial<AdCreative>;

    if (!platform || !type || !title) {
      res.status(400).json({ error: 'platform, type, and title are required' });
      return;
    }

    let platformCreativeId: string | undefined;

    if (type === AdCreativeType.VIDEO && mediaUrl && platform === AdPlatform.YOUTUBE) {
      const connection = await AppDataSource.getRepository(AdPlatformConnection).findOne({
        where: { adminUserId: req.user!.userId, platform: AdPlatform.YOUTUBE },
      });
      if (connection) {
        try {
          platformCreativeId = await uploadYouTubeVideo(connection, title, body ?? '', mediaUrl);
        } catch (err) {
          console.warn('YouTube upload failed, saving creative locally:', (err as Error).message);
        }
      }
    }

    const creative = AppDataSource.getRepository(AdCreative).create({
      platform: platform as AdPlatform,
      type: type as AdCreativeType,
      title,
      body,
      mediaUrl,
      platformCreativeId,
    });

    await AppDataSource.getRepository(AdCreative).save(creative);
    res.status(201).json(creative);
  } catch (error) {
    console.error('Create ad creative error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/creatives/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(AdCreative);
    const creative = await repo.findOne({ where: { id: String(req.params.id) } });

    if (!creative) {
      res.status(404).json({ error: 'Creative not found' });
      return;
    }

    await repo.remove(creative);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete ad creative error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Platform-specific helpers ──────────────────────────────────────────────────

async function createGoogleAdsCampaign(
  connection: AdPlatformConnection,
  name: string,
  budgetCents: number,
  startDate?: string,
  endDate?: string,
): Promise<string> {
  const cfg = await getAdPlatformConfig();
  // Dynamic import to avoid issues if package is not installed
  const { GoogleAdsApi } = await import('google-ads-api');

  const client = new GoogleAdsApi({
    client_id: cfg.googleClientId!,
    client_secret: cfg.googleClientSecret!,
    developer_token: cfg.googleDeveloperToken!,
  });

  // Refresh token is required for Google Ads API
  if (!connection.refreshToken) {
    throw new Error('Google Ads connection missing refresh token. Please reconnect.');
  }

  const customer = client.Customer({
    customer_id: connection.accountId ?? '',
    refresh_token: connection.refreshToken,
  });

  const budgetResponse = await customer.campaignBudgets.create([
    {
      name: `${name} Budget`,
      amount_micros: budgetCents * 10000, // cents → micros (1 USD = 1,000,000 micros)
      delivery_method: 1, // STANDARD
    },
  ]);

  const budgetResourceName = (budgetResponse as { results: Array<{ resource_name?: string }> }).results[0]?.resource_name;

  const campaignResponse = await customer.campaigns.create([
    {
      name,
      advertising_channel_type: 2, // SEARCH
      status: 3, // PAUSED
      campaign_budget: budgetResourceName,
      /* eslint-disable @typescript-eslint/no-explicit-any */
      ...(startDate ? { start_date: startDate.replace(/-/g, '') } : {}),
      ...(endDate ? { end_date: endDate.replace(/-/g, '') } : {}) as any,
      /* eslint-enable @typescript-eslint/no-explicit-any */
    },
  ]);

  const campaignResourceName = (campaignResponse as { results: Array<{ resource_name?: string }> }).results[0]?.resource_name ?? '';
  // Resource name format: customers/{customer_id}/campaigns/{campaign_id}
  return campaignResourceName.split('/').pop() ?? campaignResourceName;
}

async function createMetaCampaign(
  connection: AdPlatformConnection,
  name: string,
  budgetCents: number,
): Promise<string> {
  FacebookAdsApi.init(connection.accessToken);
  // Get ad accounts for the user
  const adAccountsRes = await fetch(
    `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name&access_token=${connection.accessToken}`,
  );
  const adAccountsData = (await adAccountsRes.json()) as { data?: Array<{ id: string }> };
  const adAccountId = adAccountsData.data?.[0]?.id;

  if (!adAccountId) {
    throw new Error('No Meta Ad Account found for the connected user');
  }

  const campaignRes = await fetch(
    `https://graph.facebook.com/v20.0/${adAccountId}/campaigns`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        objective: 'OUTCOME_AWARENESS',
        status: 'PAUSED',
        daily_budget: budgetCents * 10, // cents to "smallest currency unit" (Meta uses integers for USD cents)
        access_token: connection.accessToken,
      }),
    },
  );

  const campaignData = (await campaignRes.json()) as { id?: string; error?: { message: string } };
  if (!campaignData.id) {
    throw new Error(campaignData.error?.message ?? 'Failed to create Meta campaign');
  }

  return campaignData.id;
}

async function fetchGoogleAdsStats(
  connection: AdPlatformConnection,
  campaignId: string,
): Promise<{ impressions: number; clicks: number; spendCents: number }> {
  const cfg = await getAdPlatformConfig();
  const { GoogleAdsApi } = await import('google-ads-api');

  const client = new GoogleAdsApi({
    client_id: cfg.googleClientId!,
    client_secret: cfg.googleClientSecret!,
    developer_token: cfg.googleDeveloperToken!,
  });

  if (!connection.refreshToken) {
    throw new Error('Google Ads connection missing refresh token');
  }

  const customer = client.Customer({
    customer_id: connection.accountId ?? '',
    refresh_token: connection.refreshToken,
  });

  const [row] = await customer.query(`
    SELECT
      campaign.id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM campaign
    WHERE campaign.id = ${campaignId}
    DURING LAST_30_DAYS
  `);

  if (!row) return { impressions: 0, clicks: 0, spendCents: 0 };

  const metrics = (row as { metrics?: { impressions?: number; clicks?: number; cost_micros?: number } }).metrics;

  return {
    impressions: metrics?.impressions ?? 0,
    clicks: metrics?.clicks ?? 0,
    spendCents: Math.round((metrics?.cost_micros ?? 0) / 10000), // micros → cents
  };
}

async function fetchMetaStats(
  connection: AdPlatformConnection,
  campaignId: string,
): Promise<{ impressions: number; clicks: number; spendCents: number }> {
  const insightsRes = await fetch(
    `https://graph.facebook.com/v20.0/${campaignId}/insights?fields=impressions,clicks,spend&date_preset=last_30d&access_token=${connection.accessToken}`,
  );
  const data = (await insightsRes.json()) as {
    data?: Array<{ impressions?: string; clicks?: string; spend?: string }>;
    error?: { message: string };
  };

  if (data.error) {
    throw new Error(data.error.message);
  }

  const row = data.data?.[0];
  return {
    impressions: parseInt(row?.impressions ?? '0', 10),
    clicks: parseInt(row?.clicks ?? '0', 10),
    spendCents: Math.round(parseFloat(row?.spend ?? '0') * 100),
  };
}

async function uploadYouTubeVideo(
  connection: AdPlatformConnection,
  title: string,
  description: string,
  videoUrl: string,
): Promise<string> {
  const cfg = await getAdPlatformConfig();
  const oauth2Client = new google.auth.OAuth2(
    cfg.googleClientId!,
    cfg.googleClientSecret!,
  );
  oauth2Client.setCredentials({ access_token: connection.accessToken, refresh_token: connection.refreshToken });

  const yt = google.youtube({ version: 'v3', auth: oauth2Client });

  // Fetch the video from URL and upload it
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to fetch video from URL: ${videoUrl}`);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

  const uploadRes = await yt.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title, description, categoryId: '22' },
      status: { privacyStatus: 'unlisted' },
    },
    media: { mimeType: 'video/*', body: videoBuffer },
  });

  return uploadRes.data.id!;
}

function serialiseConnection(c: AdPlatformConnection) {
  return {
    id: c.id,
    platform: c.platform,
    accountId: c.accountId ?? null,
    accountName: c.accountName ?? null,
    tokenExpiresAt: c.tokenExpiresAt ?? null,
    createdAt: c.createdAt,
  };
}

// ── Ad platform settings ───────────────────────────────────────────────────────

router.get('/settings', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cfg = await getAdPlatformConfig();
    res.json({
      googleClientId: cfg.googleClientId ?? '',
      googleClientIdSet: Boolean(cfg.googleClientId),
      googleClientSecretSet: Boolean(cfg.googleClientSecret),
      googleDeveloperTokenSet: Boolean(cfg.googleDeveloperToken),
      metaAppId: cfg.metaAppId ?? '',
      metaAppIdSet: Boolean(cfg.metaAppId),
      metaAppSecretSet: Boolean(cfg.metaAppSecret),
    });
  } catch (error) {
    console.error('Get ad settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/settings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { setSetting } = await import('../utils/appSettings.js');
    const { googleClientId, googleClientSecret, googleDeveloperToken, metaAppId, metaAppSecret } = req.body as
      Partial<Record<string, string>>;

    await Promise.all([
      googleClientId !== undefined ? setSetting('google_ads_client_id', googleClientId.trim() || null) : Promise.resolve(),
      googleClientSecret?.trim() ? setSetting('google_ads_client_secret', googleClientSecret.trim()) : Promise.resolve(),
      googleDeveloperToken?.trim() ? setSetting('google_ads_developer_token', googleDeveloperToken.trim()) : Promise.resolve(),
      metaAppId !== undefined ? setSetting('meta_app_id', metaAppId.trim() || null) : Promise.resolve(),
      metaAppSecret?.trim() ? setSetting('meta_app_secret', metaAppSecret.trim()) : Promise.resolve(),
    ]);

    const cfg = await getAdPlatformConfig();
    res.json({
      googleClientId: cfg.googleClientId ?? '',
      googleClientIdSet: Boolean(cfg.googleClientId),
      googleClientSecretSet: Boolean(cfg.googleClientSecret),
      googleDeveloperTokenSet: Boolean(cfg.googleDeveloperToken),
      metaAppId: cfg.metaAppId ?? '',
      metaAppIdSet: Boolean(cfg.metaAppId),
      metaAppSecretSet: Boolean(cfg.metaAppSecret),
    });
  } catch (error) {
    console.error('Update ad settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
