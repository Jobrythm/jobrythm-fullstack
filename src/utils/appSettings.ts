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

export interface StripeConfig {
  apiKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  portalConfigurationId: string | null;
  starterMonthlyPriceId: string | null;
  starterAnnualPriceId: string | null;
  professionalMonthlyPriceId: string | null;
  professionalAnnualPriceId: string | null;
  businessMonthlyPriceId: string | null;
  businessAnnualPriceId: string | null;
}

export async function getStripeConfig(): Promise<StripeConfig> {
  const [
    apiKey,
    publishableKey,
    webhookSecret,
    portalConfigurationId,
    starterMonthlyPriceId,
    starterAnnualPriceId,
    professionalMonthlyPriceId,
    professionalAnnualPriceId,
    businessMonthlyPriceId,
    businessAnnualPriceId,
  ] = await Promise.all([
    getSetting('stripe_api_key'),
    getSetting('stripe_publishable_key'),
    getSetting('stripe_webhook_secret'),
    getSetting('stripe_portal_configuration_id'),
    getSetting('stripe_starter_monthly_price_id'),
    getSetting('stripe_starter_annual_price_id'),
    getSetting('stripe_professional_monthly_price_id'),
    getSetting('stripe_professional_annual_price_id'),
    getSetting('stripe_business_monthly_price_id'),
    getSetting('stripe_business_annual_price_id'),
  ]);

  return {
    apiKey: apiKey ?? process.env.STRIPE_API_KEY ?? null,
    publishableKey: publishableKey ?? process.env.STRIPE_PUBLISHABLE_KEY ?? null,
    webhookSecret: webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET ?? null,
    portalConfigurationId:      portalConfigurationId      ?? process.env.STRIPE_PORTAL_CONFIGURATION_ID      ?? null,
    starterMonthlyPriceId:      starterMonthlyPriceId      ?? process.env.STRIPE_STARTER_MONTHLY_PRICE_ID      ?? null,
    starterAnnualPriceId:       starterAnnualPriceId       ?? process.env.STRIPE_STARTER_ANNUAL_PRICE_ID       ?? null,
    professionalMonthlyPriceId: professionalMonthlyPriceId ?? process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID ?? null,
    professionalAnnualPriceId:  professionalAnnualPriceId  ?? process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID  ?? null,
    businessMonthlyPriceId:     businessMonthlyPriceId     ?? process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID     ?? null,
    businessAnnualPriceId:      businessAnnualPriceId      ?? process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID      ?? null,
  };
}

/** Returns the app's base URL for constructing portal links in emails. DB setting first, then env, then localhost fallback. */
export async function getAppUrl(): Promise<string> {
  const stored = await getSetting('app_url');
  return (stored ?? process.env.APP_URL ?? 'http://localhost:8080').replace(/\/$/, '');
}

export interface GitHubModelsConfig {
  token: string | null;
  model: string | null;
}

export async function getGitHubModelsConfig(): Promise<GitHubModelsConfig> {
  const [token, model] = await Promise.all([
    getSetting('github_models_token'),
    getSetting('github_models_model'),
  ]);
  return {
    token: token ?? process.env.GITHUB_MODELS_TOKEN ?? null,
    model: model ?? process.env.GITHUB_MODELS_MODEL ?? 'gpt-4o',
  };
}

export interface EmailConfig {
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
}

export async function getEmailConfig(): Promise<EmailConfig> {
  const [host, port, secure, user, password, fromEmail, fromName] = await Promise.all([
    getSetting('smtp_host'),
    getSetting('smtp_port'),
    getSetting('smtp_secure'),
    getSetting('smtp_user'),
    getSetting('smtp_password'),
    getSetting('smtp_from_email'),
    getSetting('smtp_from_name'),
  ]);

  return {
    host: host ?? process.env.SMTP_HOST ?? null,
    port: port ? parseInt(port, 10) : process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null,
    secure: secure !== null ? secure === 'true' : process.env.SMTP_SECURE === 'true',
    user: user ?? process.env.SMTP_USER ?? null,
    password: password ?? process.env.SMTP_PASSWORD ?? null,
    fromEmail: fromEmail ?? process.env.SMTP_FROM_EMAIL ?? null,
    fromName: fromName ?? process.env.SMTP_FROM_NAME ?? null,
  };
}

/** Returns true if the key looks like it was already saved (non-empty). */
export function isKeySet(value: string | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

export interface AdPlatformConfig {
  googleClientId: string | null;
  googleClientSecret: string | null;
  googleDeveloperToken: string | null;
  metaAppId: string | null;
  metaAppSecret: string | null;
}

export async function getAdPlatformConfig(): Promise<AdPlatformConfig> {
  const [googleClientId, googleClientSecret, googleDeveloperToken, metaAppId, metaAppSecret] =
    await Promise.all([
      getSetting('google_ads_client_id'),
      getSetting('google_ads_client_secret'),
      getSetting('google_ads_developer_token'),
      getSetting('meta_app_id'),
      getSetting('meta_app_secret'),
    ]);

  return {
    googleClientId: googleClientId ?? process.env.GOOGLE_ADS_CLIENT_ID ?? null,
    googleClientSecret: googleClientSecret ?? process.env.GOOGLE_ADS_CLIENT_SECRET ?? null,
    googleDeveloperToken: googleDeveloperToken ?? process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? null,
    metaAppId: metaAppId ?? process.env.META_APP_ID ?? null,
    metaAppSecret: metaAppSecret ?? process.env.META_APP_SECRET ?? null,
  };
}
