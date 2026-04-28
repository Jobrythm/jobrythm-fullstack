# Integrations

Jobrythm supports OAuth integrations for accounting and ad-platform data:

- **QuickBooks Online** — accounting export
- **Xero** — accounting export
- **Google Ads** — campaign data into the admin ads dashboard
- **Meta Ads** (Facebook/Instagram) — campaign data into the admin ads dashboard

All integrations are **per-user** and store tokens in the `OAuthToken` table (refresh tokens encrypted-at-rest where applicable).

---

## OAuth flow

```
  User → Settings → Integrations → "Connect QuickBooks"
       │
       └─► GET /api/integrations/quickbooks/connect
              │
              └─► Redirect to provider's OAuth consent screen
                     │
                     └─► Provider redirects to
                         GET /api/integrations/quickbooks/callback?code=...
                              │
                              └─► Backend exchanges the code for tokens,
                                  persists them in OAuthToken, and redirects
                                  the user back to Settings → Integrations.
```

The same pattern is used for Xero, Google Ads, and Meta Ads.

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/integrations/status` | Per-provider connection status for the current user |
| `GET` | `/api/integrations/:provider/connect` | Begin OAuth (redirects to provider) |
| `GET` | `/api/integrations/:provider/callback` | OAuth callback (handles code exchange) |
| `POST` | `/api/integrations/:provider/disconnect` | Revoke and delete the stored token |

`:provider` ∈ `quickbooks`, `xero`, `google-ads`, `meta-ads`.

---

## Configuration

Each provider needs an OAuth **client ID** and **client secret**, configured in **Admin → Settings → Integrations**. They are stored in `app_settings` (e.g. `quickbooks_client_id`, `quickbooks_client_secret`) and accessed via `getIntegrationConfig(provider)` in `src/utils/appSettings.ts`.

The OAuth **redirect URI** registered with each provider must match:

```
<APP_URL>/api/integrations/<provider>/callback
```

---

## Ads dashboard

Once `google-ads` and/or `meta-ads` are connected, **Admin → Ads** aggregates campaign performance via the routes in `src/routes/adminAds.ts`. The provider-specific creative/campaign data is persisted in the `AdPlatformConnection`, `AdCampaign`, and `AdCreative` entities.
