# Admin Panel

The Admin Panel is reachable at `/admin` to users with the `admin` role and exposes user management, plan management, and all app-wide credentials.

---

## Tabs

- **Users** — list, create, edit, delete users; promote/demote admin role; reset passwords; impersonate (where supported); see plan/trial status.
- **Plans** — view configured Stripe plans (Starter / Professional / Business). Price IDs are configured under the Stripe tab.
- **Settings** — credentials and app-wide configuration, organised in sub-tabs:
  - **Stripe** — API key, webhook secret, plan price IDs (monthly + annual), portal configuration ID
  - **AI** — Gemini API key and model selection (see [[AI Features]])
  - **Email / SMTP** — host, port, secure flag, user, password, from-email, from-name; "Send test email" button (see [[Email SMTP]])
  - **Integrations** — OAuth client IDs / secrets for QuickBooks, Xero, Google Ads, Meta Ads (see [[Integrations]])

---

## How settings are stored

Every credential lives as a row in the `app_settings` table (key/value). They are accessed at runtime through typed helpers in `src/utils/appSettings.ts`:

- `getStripeConfig()`
- `getGeminiConfig()`
- `getEmailConfig()`
- `getIntegrationConfig(provider)`
- `getAppUrl()`

DB values **take precedence** over environment variables. Any env-var fallback is a convenience for bootstrapping; the production model is "configure in the UI".

---

## Secret masking

The GET `/api/admin/settings` response **masks every secret** via `maskKey()` (returning something like `sk_test_…XYZ`) and exposes a boolean `*Set` flag for each secret (e.g. `geminiApiKeySet: true`). The frontend uses the flag to decide whether to render "Configured ✅" or "Not configured" without leaking the real value.

## Update semantics

The PUT `/api/admin/settings` handler **only writes a secret if the submitted value is non-empty**. This lets admins:

- Re-save the form to update non-secret fields (model name, from-email, etc.) without re-typing the API key.
- Clear a secret by submitting a sentinel (where supported).

---

## Adding a new admin setting

See [[Backend Development]] → "Adding a new admin setting" for the canonical 5-step workflow. In summary:

1. Add the key + getter in `src/utils/appSettings.ts`.
2. Extend GET in `src/routes/adminSettings.ts` with masking + `*Set` flag.
3. Extend PUT in the same file with the "non-empty only" rule.
4. Update `frontend/src/types/index.ts` (`AppSettings`) and `frontend/src/api/admin.ts` (`UpdateSettingsPayload`).
5. Add the UI in `frontend/src/features/admin/pages/AdminPage.tsx`.

---

## Test email

`POST /api/admin/settings/test-email` sends a small test message through the currently configured SMTP transport, surfacing any connection/authentication errors directly to the admin UI.
