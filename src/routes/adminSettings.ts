import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getStripeConfig, getEmailConfig, setSetting } from '../utils/appSettings.js';
import { sendEmail } from '../utils/email.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const PRICE_SETTING_KEYS = [
  'stripe_starter_monthly_price_id',
  'stripe_starter_annual_price_id',
  'stripe_professional_monthly_price_id',
  'stripe_professional_annual_price_id',
  'stripe_business_monthly_price_id',
  'stripe_business_annual_price_id',
] as const;

type PriceSettingKey = typeof PRICE_SETTING_KEYS[number];

function maskKey(value: string | null): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  const repeatCount = Math.max(0, Math.min(value.length - 11, 20));
  return `${value.slice(0, 7)}${'•'.repeat(repeatCount)}${value.slice(-4)}`;
}

// GET /api/admin/settings
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [config, emailConfig] = await Promise.all([getStripeConfig(), getEmailConfig()]);
    res.json({
      stripeApiKey: maskKey(config.apiKey),
      stripeApiKeySet: Boolean(config.apiKey),
      stripeWebhookSecret: maskKey(config.webhookSecret),
      stripeWebhookSecretSet: Boolean(config.webhookSecret),
      stripeStarterMonthlyPriceId: config.starterMonthlyPriceId ?? '',
      stripeStarterAnnualPriceId: config.starterAnnualPriceId ?? '',
      stripeProfessionalMonthlyPriceId: config.professionalMonthlyPriceId ?? '',
      stripeProfessionalAnnualPriceId: config.professionalAnnualPriceId ?? '',
      stripeBusinessMonthlyPriceId: config.businessMonthlyPriceId ?? '',
      stripeBusinessAnnualPriceId: config.businessAnnualPriceId ?? '',
      smtpHost: emailConfig.host ?? '',
      smtpPort: emailConfig.port?.toString() ?? '',
      smtpSecure: emailConfig.secure,
      smtpUser: emailConfig.user ?? '',
      smtpPassword: maskKey(emailConfig.password),
      smtpPasswordSet: Boolean(emailConfig.password),
      smtpFromEmail: emailConfig.fromEmail ?? '',
      smtpFromName: emailConfig.fromName ?? '',
      emailConfigured: Boolean(emailConfig.host && emailConfig.user && emailConfig.password),
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
      stripeWebhookSecret,
      stripeStarterMonthlyPriceId,
      stripeStarterAnnualPriceId,
      stripeProfessionalMonthlyPriceId,
      stripeProfessionalAnnualPriceId,
      stripeBusinessMonthlyPriceId,
      stripeBusinessAnnualPriceId,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
      smtpFromEmail,
      smtpFromName,
    }: Partial<Record<string, string>> & { smtpSecure?: string | boolean } = req.body;

    const secretUpdates: Array<[string, string]> = [];
    const priceUpdates: Array<[PriceSettingKey, string]> = [];
    const emailUpdates: Array<[string, string | null]> = [];

    // Secrets: only update if non-empty
    if (stripeApiKey?.trim()) secretUpdates.push(['stripe_api_key', stripeApiKey.trim()]);
    if (stripeWebhookSecret?.trim()) secretUpdates.push(['stripe_webhook_secret', stripeWebhookSecret.trim()]);

    // Price IDs: always update if provided (can clear with empty string)
    if (stripeStarterMonthlyPriceId !== undefined) priceUpdates.push(['stripe_starter_monthly_price_id', stripeStarterMonthlyPriceId.trim()]);
    if (stripeStarterAnnualPriceId !== undefined) priceUpdates.push(['stripe_starter_annual_price_id', stripeStarterAnnualPriceId.trim()]);
    if (stripeProfessionalMonthlyPriceId !== undefined) priceUpdates.push(['stripe_professional_monthly_price_id', stripeProfessionalMonthlyPriceId.trim()]);
    if (stripeProfessionalAnnualPriceId !== undefined) priceUpdates.push(['stripe_professional_annual_price_id', stripeProfessionalAnnualPriceId.trim()]);
    if (stripeBusinessMonthlyPriceId !== undefined) priceUpdates.push(['stripe_business_monthly_price_id', stripeBusinessMonthlyPriceId.trim()]);
    if (stripeBusinessAnnualPriceId !== undefined) priceUpdates.push(['stripe_business_annual_price_id', stripeBusinessAnnualPriceId.trim()]);

    // Email / SMTP: always update if provided
    if (smtpHost !== undefined) emailUpdates.push(['smtp_host', smtpHost.trim() || null]);
    if (smtpPort !== undefined) emailUpdates.push(['smtp_port', smtpPort.trim() || null]);
    if (smtpSecure !== undefined) emailUpdates.push(['smtp_secure', String(smtpSecure)]);
    if (smtpUser !== undefined) emailUpdates.push(['smtp_user', smtpUser.trim() || null]);
    if (smtpPassword?.trim()) emailUpdates.push(['smtp_password', smtpPassword.trim()]);
    if (smtpFromEmail !== undefined) emailUpdates.push(['smtp_from_email', smtpFromEmail.trim() || null]);
    if (smtpFromName !== undefined) emailUpdates.push(['smtp_from_name', smtpFromName.trim() || null]);

    const allUpdates = [...secretUpdates, ...priceUpdates] as Array<[string, string]>;
    await Promise.all([
      ...allUpdates.map(([key, value]) => setSetting(key, value || null)),
      ...emailUpdates.map(([key, value]) => setSetting(key, value)),
    ]);

    const [config, emailConfig] = await Promise.all([getStripeConfig(), getEmailConfig()]);
    res.json({
      stripeApiKey: maskKey(config.apiKey),
      stripeApiKeySet: Boolean(config.apiKey),
      stripeWebhookSecret: maskKey(config.webhookSecret),
      stripeWebhookSecretSet: Boolean(config.webhookSecret),
      stripeStarterMonthlyPriceId: config.starterMonthlyPriceId ?? '',
      stripeStarterAnnualPriceId: config.starterAnnualPriceId ?? '',
      stripeProfessionalMonthlyPriceId: config.professionalMonthlyPriceId ?? '',
      stripeProfessionalAnnualPriceId: config.professionalAnnualPriceId ?? '',
      stripeBusinessMonthlyPriceId: config.businessMonthlyPriceId ?? '',
      stripeBusinessAnnualPriceId: config.businessAnnualPriceId ?? '',
      smtpHost: emailConfig.host ?? '',
      smtpPort: emailConfig.port?.toString() ?? '',
      smtpSecure: emailConfig.secure,
      smtpUser: emailConfig.user ?? '',
      smtpPassword: maskKey(emailConfig.password),
      smtpPasswordSet: Boolean(emailConfig.password),
      smtpFromEmail: emailConfig.fromEmail ?? '',
      smtpFromName: emailConfig.fromName ?? '',
      emailConfigured: Boolean(emailConfig.host && emailConfig.user && emailConfig.password),
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
