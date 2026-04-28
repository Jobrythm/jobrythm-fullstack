# Stripe Billing

Jobrythm uses **Stripe Subscriptions** with Checkout and the Customer Portal. All plans include a **14-day free trial**.

---

## Plans

| Plan | Monthly | Annual | Stripe product |
|---|---|---|---|
| Starter | $14/mo | $9/mo | `prod_UPX393kv3F2yh5` |
| Professional | $29/mo | $24/mo | `prod_UPX4C6Nne6bwPo` |
| Business | $59/mo | $49/mo | `prod_UPX4oXqZn9sVuS` |

Default price IDs are baked into `src/utils/appSettings.ts` as fallbacks. Override per-environment in **Admin → Settings → Stripe**.

---

## Configuration

| Setting | DB key | Env fallback |
|---|---|---|
| API key (secret) | `stripe_api_key` | `STRIPE_API_KEY` |
| Webhook signing secret | `stripe_webhook_secret` | `STRIPE_WEBHOOK_SECRET` |
| Starter monthly/annual price IDs | `stripe_starter_monthly_price_id`, `stripe_starter_annual_price_id` | — |
| Professional monthly/annual price IDs | `stripe_pro_monthly_price_id`, `stripe_pro_annual_price_id` | `STRIPE_PRO_PRICE_ID` (legacy) |
| Business monthly/annual price IDs | `stripe_business_monthly_price_id`, `stripe_business_annual_price_id` | `STRIPE_TEAM_PRICE_ID` (legacy) |
| Customer-portal configuration ID | `portal_configuration_id` | _(default `bpc_1TQiJWIvlX8po9Ur7uSuYtZi`)_ |

Read at runtime via `getStripeConfig()` in `src/utils/appSettings.ts`. DB values take precedence over env vars.

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/billing/checkout` | Create a Checkout session for a `{ plan, interval }` and return the URL |
| `POST` | `/api/billing/portal` | Create a Customer Portal session and return the URL |
| `POST` | `/api/billing/webhook` | Stripe webhook (signature-verified) |

---

## Trial

Every Checkout session is created with:

```ts
subscription_data: { trial_period_days: 14 }
```

so all plans give a 14-day free trial regardless of which one the user picks.

---

## Customer Portal

`/api/billing/portal` opens the portal scoped by the `portalConfigurationId` setting, allowing the customer to:

- Switch plans
- Cancel
- Update payment method
- Download invoices

---

## Webhooks

The Stripe webhook handler (`stripeWebhookHandler` in `src/routes/billing.ts`) reads the raw request body (mounted **before** `express.json()`), verifies the Stripe signature with `STRIPE_WEBHOOK_SECRET`, and updates the user's `subscriptionStatus`, `currentPlan`, and `currentPeriodEnd` columns.

Configure a webhook endpoint in Stripe pointing at:

```
POST https://<your-host>/api/billing/webhook
```

Subscribe to at least:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## App URL

Checkout success/cancel URLs are built from `process.env.APP_URL`. Set this to your public URL (e.g. `https://app.jobrythm.com`) so Stripe can redirect the customer back to the app after payment.

> **Known limitation:** `APP_URL` is currently read from the env only — it is not surfaced as a DB-backed admin setting.
