import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getStripeConfig, setSetting } from '../utils/appSettings.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const SETTING_KEYS = ['stripe_api_key', 'stripe_webhook_secret', 'stripe_pro_price_id', 'stripe_team_price_id'] as const;
type SettingKey = typeof SETTING_KEYS[number];

function maskKey(value: string | null): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  const repeatCount = Math.max(0, Math.min(value.length - 11, 20));
  return `${value.slice(0, 7)}${'•'.repeat(repeatCount)}${value.slice(-4)}`;
}

// GET /api/admin/settings
// Returns masked versions of the keys and boolean flags for whether each is set.
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getStripeConfig();

    res.json({
      stripeApiKey: maskKey(config.apiKey),
      stripeApiKeySet: Boolean(config.apiKey),
      stripeWebhookSecret: maskKey(config.webhookSecret),
      stripeWebhookSecretSet: Boolean(config.webhookSecret),
      stripeProPriceId: config.proPriceId ?? '',
      stripeProPriceIdSet: Boolean(config.proPriceId),
      stripeTeamPriceId: config.teamPriceId ?? '',
      stripeTeamPriceIdSet: Boolean(config.teamPriceId),
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/settings
// Saves Stripe configuration. Any key not provided (or empty string) is left unchanged.
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      stripeApiKey,
      stripeWebhookSecret,
      stripeProPriceId,
      stripeTeamPriceId,
    }: Partial<Record<string, string>> = req.body;

    const updates: Array<[SettingKey, string]> = [];

    if (stripeApiKey && stripeApiKey.trim()) updates.push(['stripe_api_key', stripeApiKey.trim()]);
    if (stripeWebhookSecret && stripeWebhookSecret.trim()) updates.push(['stripe_webhook_secret', stripeWebhookSecret.trim()]);
    // Price IDs can be cleared by sending empty string
    if (stripeProPriceId !== undefined) updates.push(['stripe_pro_price_id', stripeProPriceId.trim()]);
    if (stripeTeamPriceId !== undefined) updates.push(['stripe_team_price_id', stripeTeamPriceId.trim()]);

    await Promise.all(updates.map(([key, value]) => setSetting(key, value || null)));

    const config = await getStripeConfig();
    res.json({
      stripeApiKey: maskKey(config.apiKey),
      stripeApiKeySet: Boolean(config.apiKey),
      stripeWebhookSecret: maskKey(config.webhookSecret),
      stripeWebhookSecretSet: Boolean(config.webhookSecret),
      stripeProPriceId: config.proPriceId ?? '',
      stripeProPriceIdSet: Boolean(config.proPriceId),
      stripeTeamPriceId: config.teamPriceId ?? '',
      stripeTeamPriceIdSet: Boolean(config.teamPriceId),
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
