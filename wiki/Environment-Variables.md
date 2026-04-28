# Environment Variables

Jobrythm has two layers of configuration:

1. **Environment variables** — bootstrap values (database, JWT secret) plus optional fallbacks for API credentials.
2. **`app_settings` DB table** — the canonical store for runtime credentials (Stripe, Gemini, SMTP, integrations), configured via the [[Admin Panel]]. **DB values take precedence over env vars.**

The reference file is [`.env.example`](https://github.com/Jobrythm/jobrythm-fullstack/blob/main/.env.example).

---

## Required

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default `5432`) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret used to sign JWT access tokens |
| `JWT_EXPIRES_IN` | Access-token TTL (e.g. `1h`, `30m`) |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh-token TTL in days |

---

## Server

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port for the API | `8080` |
| `NODE_ENV` | `development` or `production` | `development` |
| `APP_URL` | Public app URL — used in Stripe return URLs and quote/invoice email links | `http://localhost:8080` |
| `CORS_ORIGINS` | Comma-separated allow-list of CORS origins | `http://localhost:8080,http://127.0.0.1:8080` |

---

## File uploads

| Variable | Description | Default |
|---|---|---|
| `MAX_FILE_SIZE_MB` | Per-upload size limit | `5` |
| `UPLOAD_DIR` | Where uploads are written on disk | `./uploads` |

---

## Stripe (optional fallbacks — prefer the Admin Panel)

| Variable | Description |
|---|---|
| `STRIPE_API_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Legacy fallback for Professional price |
| `STRIPE_TEAM_PRICE_ID` | Legacy fallback for Business price |

See [[Stripe Billing]].

---

## AI / Gemini (optional fallbacks)

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key — enables AI features | _(unset)_ |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.0-flash` |

See [[AI Features]].

---

## Frontend build-time

The Vite frontend reads one variable **at build time** only:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the API. The Docker image is built with `/api`. |

If unset, the SPA falls back to hostname-based resolution in `frontend/src/api/hosts.ts`.
