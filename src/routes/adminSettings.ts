import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getStripeConfig, setSetting } from '../utils/appSettings.js';

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
    const config = await getStripeConfig();
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
    }: Partial<Record<string, string>> = req.body;

    const secretUpdates: Array<[string, string]> = [];
    const priceUpdates: Array<[PriceSettingKey, string]> = [];

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

    const allUpdates = [...secretUpdates, ...priceUpdates] as Array<[string, string]>;
    await Promise.all(allUpdates.map(([key, value]) => setSetting(key, value || null)));

    const config = await getStripeConfig();
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
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
