import { AppDataSource } from '../config/database.js';
import { AppSettings } from '../entities/AppSettings.js';

export async function getSetting(key: string): Promise<string | null> {
  try {
    const repo = AppDataSource.getRepository(AppSettings);
    const setting = await repo.findOne({ where: { key } });
    return setting?.value ?? null;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const repo = AppDataSource.getRepository(AppSettings);
  let setting = await repo.findOne({ where: { key } });
  if (!setting) {
    setting = repo.create({ key });
  }
  setting.value = value ?? undefined;
  await repo.save(setting);
}

export async function getStripeConfig(): Promise<{
  apiKey: string | null;
  webhookSecret: string | null;
  proPriceId: string | null;
  teamPriceId: string | null;
}> {
  const [apiKey, webhookSecret, proPriceId, teamPriceId] = await Promise.all([
    getSetting('stripe_api_key'),
    getSetting('stripe_webhook_secret'),
    getSetting('stripe_pro_price_id'),
    getSetting('stripe_team_price_id'),
  ]);

  return {
    apiKey: apiKey ?? process.env.STRIPE_API_KEY ?? null,
    webhookSecret: webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET ?? null,
    proPriceId: proPriceId ?? process.env.STRIPE_PRO_PRICE_ID ?? null,
    teamPriceId: teamPriceId ?? process.env.STRIPE_TEAM_PRICE_ID ?? null,
  };
}

/** Returns true if the key looks like it was already saved (non-empty). */
export function isKeySet(value: string | null): boolean {
  return Boolean(value && value.trim().length > 0);
}
