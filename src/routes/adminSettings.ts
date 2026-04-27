import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getStripeConfig, getEmailConfig, getSetting, setSetting, getGitHubModelsConfig, getIntegrationsConfig } from '../utils/appSettings.js';
import { sendEmail } from '../utils/email.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

function maskKey(value: string | null): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  const repeatCount = Math.max(0, Math.min(value.length - 11, 20));
  return `${value.slice(0, 7)}${'•'.repeat(repeatCount)}${value.slice(-4)}`;
}

// GET /api/admin/settings
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [config, emailConfig, appUrl, aiConfig, intConfig] = await Promise.all([
      getStripeConfig(),
      getEmailConfig(),
      getSetting('app_url'),
      getGitHubModelsConfig(),
      getIntegrationsConfig(),
    ]);
    res.json({
      stripeApiKey: maskKey(config.apiKey),
      stripeApiKeySet: Boolean(config.apiKey),
      stripePublishableKey: config.publishableKey ?? '',
      stripeWebhookSecret: maskKey(config.webhookSecret),
      stripeWebhookSecretSet: Boolean(config.webhookSecret),
      stripePortalConfigurationId: config.portalConfigurationId ?? '',
      stripeStarterMonthlyPriceId: config.starterMonthlyPriceId ?? '',
      stripeStarterAnnualPriceId: config.starterAnnualPriceId ?? '',
      stripeProfessionalMonthlyPriceId: config.professionalMonthlyPriceId ?? '',
      stripeProfessionalAnnualPriceId: config.professionalAnnualPriceId ?? '',
      stripeBusinessMonthlyPriceId: config.businessMonthlyPriceId ?? '',
      stripeBusinessAnnualPriceId: config.businessAnnualPriceId ?? '',
      appUrl: appUrl ?? '',
      smtpHost: emailConfig.host ?? '',
      smtpPort: emailConfig.port?.toString() ?? '',
      smtpUser: emailConfig.user ?? '',
      smtpPassword: maskKey(emailConfig.password),
      smtpPasswordSet: Boolean(emailConfig.password),
      smtpFromEmail: emailConfig.fromEmail ?? '',
      smtpFromName: emailConfig.fromName ?? '',
      emailConfigured: Boolean(emailConfig.host && emailConfig.user && emailConfig.password),
      githubModelsToken: maskKey(aiConfig.token),
      githubModelsTokenSet: Boolean(aiConfig.token),
      githubModelsModel: aiConfig.model ?? 'gpt-4o',
      aiConfigured: Boolean(aiConfig.token),
      quickbooksClientId: intConfig.quickbooksClientId ?? '',
      quickbooksClientSecret: maskKey(intConfig.quickbooksClientSecret),
      quickbooksClientSecretSet: Boolean(intConfig.quickbooksClientSecret),
      quickbooksRedirectUri: intConfig.quickbooksRedirectUri ?? '',
      quickbooksSandbox: intConfig.quickbooksSandbox,
      xeroClientId: intConfig.xeroClientId ?? '',
      xeroClientSecret: maskKey(intConfig.xeroClientSecret),
      xeroClientSecretSet: Boolean(intConfig.xeroClientSecret),
      xeroRedirectUri: intConfig.xeroRedirectUri ?? '',
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/settings
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      stripeApiKey,
      stripePublishableKey,
      stripeWebhookSecret,
      stripePortalConfigurationId,
      stripeStarterMonthlyPriceId,
      stripeStarterAnnualPriceId,
      stripeProfessionalMonthlyPriceId,
      stripeProfessionalAnnualPriceId,
      stripeBusinessMonthlyPriceId,
      stripeBusinessAnnualPriceId,
      appUrl,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFromEmail,
      smtpFromName,
      githubModelsToken,
      githubModelsModel,
      quickbooksClientId,
      quickbooksClientSecret,
      quickbooksRedirectUri,
      quickbooksSandbox,
      xeroClientId,
      xeroClientSecret,
      xeroRedirectUri,
    }: Partial<Record<string, string>> = req.body;

    const secretUpdates: Array<[string, string]> = [];
    const generalUpdates: Array<[string, string | null]> = [];
    const emailUpdates: Array<[string, string | null]> = [];

    // Secrets: only update if non-empty (blank = keep existing)
    if (stripeApiKey?.trim()) secretUpdates.push(['stripe_api_key', stripeApiKey.trim()]);
    if (stripeWebhookSecret?.trim()) secretUpdates.push(['stripe_webhook_secret', stripeWebhookSecret.trim()]);
    if (githubModelsToken?.trim()) secretUpdates.push(['github_models_token', githubModelsToken.trim()]);

    // Non-secret Stripe / general settings: always update if provided
    if (stripePublishableKey !== undefined) generalUpdates.push(['stripe_publishable_key', stripePublishableKey.trim() || null]);
    if (stripePortalConfigurationId !== undefined) generalUpdates.push(['stripe_portal_configuration_id', stripePortalConfigurationId.trim() || null]);
    if (stripeStarterMonthlyPriceId !== undefined) generalUpdates.push(['stripe_starter_monthly_price_id', stripeStarterMonthlyPriceId.trim() || null]);
    if (stripeStarterAnnualPriceId !== undefined) generalUpdates.push(['stripe_starter_annual_price_id', stripeStarterAnnualPriceId.trim() || null]);
    if (stripeProfessionalMonthlyPriceId !== undefined) generalUpdates.push(['stripe_professional_monthly_price_id', stripeProfessionalMonthlyPriceId.trim() || null]);
    if (stripeProfessionalAnnualPriceId !== undefined) generalUpdates.push(['stripe_professional_annual_price_id', stripeProfessionalAnnualPriceId.trim() || null]);
    if (stripeBusinessMonthlyPriceId !== undefined) generalUpdates.push(['stripe_business_monthly_price_id', stripeBusinessMonthlyPriceId.trim() || null]);
    if (stripeBusinessAnnualPriceId !== undefined) generalUpdates.push(['stripe_business_annual_price_id', stripeBusinessAnnualPriceId.trim() || null]);
    if (appUrl !== undefined) generalUpdates.push(['app_url', appUrl.trim() || null]);
    if (githubModelsModel !== undefined) generalUpdates.push(['github_models_model', githubModelsModel.trim() || null]);

    // Email / SMTP
    if (smtpHost !== undefined) emailUpdates.push(['smtp_host', smtpHost.trim() || null]);
    if (smtpPort !== undefined) emailUpdates.push(['smtp_port', smtpPort.trim() || null]);
    if (smtpUser !== undefined) emailUpdates.push(['smtp_user', smtpUser.trim() || null]);
    if (smtpPassword?.trim()) emailUpdates.push(['smtp_password', smtpPassword.trim()]);
    if (smtpFromEmail !== undefined) emailUpdates.push(['smtp_from_email', smtpFromEmail.trim() || null]);
    if (smtpFromName !== undefined) emailUpdates.push(['smtp_from_name', smtpFromName.trim() || null]);

    // QuickBooks / Xero integration
    if (quickbooksClientId !== undefined) generalUpdates.push(['quickbooks_client_id', quickbooksClientId.trim() || null]);
    if (quickbooksClientSecret?.trim()) secretUpdates.push(['quickbooks_client_secret', quickbooksClientSecret.trim()]);
    if (quickbooksRedirectUri !== undefined) generalUpdates.push(['quickbooks_redirect_uri', quickbooksRedirectUri.trim() || null]);
    if (quickbooksSandbox !== undefined) generalUpdates.push(['quickbooks_sandbox', quickbooksSandbox.trim() || 'true']);
    if (xeroClientId !== undefined) generalUpdates.push(['xero_client_id', xeroClientId.trim() || null]);
    if (xeroClientSecret?.trim()) secretUpdates.push(['xero_client_secret', xeroClientSecret.trim()]);
    if (xeroRedirectUri !== undefined) generalUpdates.push(['xero_redirect_uri', xeroRedirectUri.trim() || null]);

    await Promise.all([
      ...secretUpdates.map(([key, value]) => setSetting(key, value)),
      ...generalUpdates.map(([key, value]) => setSetting(key, value)),
      ...emailUpdates.map(([key, value]) => setSetting(key, value)),
    ]);

    const [config, emailConfig, savedAppUrl, aiConfig, intConfig] = await Promise.all([
      getStripeConfig(),
      getEmailConfig(),
      getSetting('app_url'),
      getGitHubModelsConfig(),
      getIntegrationsConfig(),
    ]);
    res.json({
      stripeApiKey: maskKey(config.apiKey),
      stripeApiKeySet: Boolean(config.apiKey),
      stripePublishableKey: config.publishableKey ?? '',
      stripeWebhookSecret: maskKey(config.webhookSecret),
      stripeWebhookSecretSet: Boolean(config.webhookSecret),
      stripePortalConfigurationId: config.portalConfigurationId ?? '',
      stripeStarterMonthlyPriceId: config.starterMonthlyPriceId ?? '',
      stripeStarterAnnualPriceId: config.starterAnnualPriceId ?? '',
      stripeProfessionalMonthlyPriceId: config.professionalMonthlyPriceId ?? '',
      stripeProfessionalAnnualPriceId: config.professionalAnnualPriceId ?? '',
      stripeBusinessMonthlyPriceId: config.businessMonthlyPriceId ?? '',
      stripeBusinessAnnualPriceId: config.businessAnnualPriceId ?? '',
      appUrl: savedAppUrl ?? '',
      smtpHost: emailConfig.host ?? '',
      smtpPort: emailConfig.port?.toString() ?? '',
      smtpUser: emailConfig.user ?? '',
      smtpPassword: maskKey(emailConfig.password),
      smtpPasswordSet: Boolean(emailConfig.password),
      smtpFromEmail: emailConfig.fromEmail ?? '',
      smtpFromName: emailConfig.fromName ?? '',
      emailConfigured: Boolean(emailConfig.host && emailConfig.user && emailConfig.password),
      githubModelsToken: maskKey(aiConfig.token),
      githubModelsTokenSet: Boolean(aiConfig.token),
      githubModelsModel: aiConfig.model ?? 'gpt-4o',
      aiConfigured: Boolean(aiConfig.token),
      quickbooksClientId: intConfig.quickbooksClientId ?? '',
      quickbooksClientSecret: maskKey(intConfig.quickbooksClientSecret),
      quickbooksClientSecretSet: Boolean(intConfig.quickbooksClientSecret),
      quickbooksRedirectUri: intConfig.quickbooksRedirectUri ?? '',
      quickbooksSandbox: intConfig.quickbooksSandbox,
      xeroClientId: intConfig.xeroClientId ?? '',
      xeroClientSecret: maskKey(intConfig.xeroClientSecret),
      xeroClientSecretSet: Boolean(intConfig.xeroClientSecret),
      xeroRedirectUri: intConfig.xeroRedirectUri ?? '',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/settings/test-email
router.post('/test-email', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { to } = req.body as { to?: string };
    const recipient = to?.trim() || req.user?.email;
    if (!recipient) {
      res.status(400).json({ error: 'Recipient email is required' });
      return;
    }
    await sendEmail({
      to: recipient,
      subject: 'Jobrythm — test email',
      html: '<p>This is a test email from Jobrythm. Your SMTP configuration is working correctly.</p>',
      text: 'This is a test email from Jobrythm. Your SMTP configuration is working correctly.',
    });
    res.json({ message: `Test email sent to ${recipient}` });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
