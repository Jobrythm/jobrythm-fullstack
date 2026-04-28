# Architecture

Jobrythm is a **monorepo** containing a TypeScript Express API and a React SPA. Both are built into a single Docker image that serves the frontend as static assets behind an nginx reverse proxy alongside the API.

---

## High-level diagram

```
                         ┌────────────────────────────────────┐
                         │             Browser                │
                         │  React SPA (Vite build)            │
                         └─────────────┬──────────────────────┘
                                       │  HTTPS
                                       ▼
                  ┌───────────────────────────────────────┐
                  │           nginx (port 8080)           │
                  │  - serves static frontend             │
                  │  - proxies /api/* to Express          │
                  └─────────────┬─────────────────────────┘
                                │
                                ▼
                  ┌───────────────────────────────────────┐
                  │      Express API (TypeScript, ESM)    │
                  │  - JWT auth                           │
                  │  - TypeORM (synchronize: true)        │
                  │  - PDFKit, Nodemailer, Stripe         │
                  │  - Gemini (AI)                        │
                  │  - node-cron (recurring jobs)         │
                  └─────────────┬─────────────────────────┘
                                │
                                ▼
                  ┌───────────────────────────────────────┐
                  │             PostgreSQL                │
                  └───────────────────────────────────────┘
```

External services (optional): **Stripe**, **Google Gemini**, **SMTP server**, **QuickBooks**, **Xero**, **Google Ads**, **Meta Ads**.

---

## Monorepo layout

```
jobrythm-fullstack/
├── src/                        # Backend (TypeScript / Express)
│   ├── config/
│   │   └── database.ts         # TypeORM DataSource (synchronize: true)
│   ├── entities/               # TypeORM entity definitions (see [[Database Schema]])
│   ├── middleware/
│   │   ├── auth.ts             # JWT auth middleware
│   │   └── errorHandler.ts
│   ├── routes/                 # Express route handlers
│   ├── types/
│   │   └── enums.ts            # Job/Quote/Invoice/LineItem enums
│   ├── utils/
│   │   ├── appSettings.ts      # DB-backed settings (Stripe, SMTP, Gemini, …)
│   │   ├── email.ts            # Nodemailer SMTP wrapper
│   │   ├── pdf.ts              # PDFKit quote/invoice renderer
│   │   ├── calculations.ts     # Line-item totals, margins
│   │   └── recurringJobs.ts    # node-cron scheduler
│   └── server.ts               # Express entry point (port 8080)
├── frontend/                   # React frontend
│   └── src/
│       ├── api/                # Typed Axios client modules
│       ├── components/         # Shared UI components
│       ├── features/           # Feature-scoped hooks/pages/components
│       ├── layouts/            # AppLayout, AuthLayout
│       ├── router/             # React Router v6 config
│       ├── store/              # Zustand stores (e.g. authStore)
│       └── types/              # Shared TS types
├── docker-compose.yml
├── Dockerfile                  # multi-stage: build frontend + backend → runtime image
├── nginx.conf.template
└── .env.example
```

---

## Request flow

1. **Browser** issues `GET /clients` → React Router resolves the page; a TanStack Query hook calls `GET /api/clients` via Axios.
2. **Axios client** (`frontend/src/api/client.ts`) attaches the JWT bearer token from Zustand `authStore`. If the token is near expiry or the response is `401`, the client performs a single-flight refresh against `POST /api/auth/refresh`.
3. **nginx** (in Docker) proxies `/api/*` to the Express server.
4. **Express middleware** chain runs: helmet, cors, compression, morgan, rate-limit, body parser, then the auth middleware verifies the JWT and populates `req.user`.
5. **Route handler** queries TypeORM, scoping every query by `req.user.userId` to enforce data isolation (see [[Security]]).
6. **Response** flows back. Errors are normalised to `ApiError` on the frontend (`src/api/errors.ts`).

---

## Data isolation model

Jobrythm is **multi-tenant by user**: every domain entity (Client, Job, Quote, Invoice, etc.) carries a `userId` foreign key. Every read/write must filter by the authenticated user's id. This is enforced in route handlers and is a non-negotiable convention — see [[Security]].

---

## Configuration model

Jobrythm has two layers of configuration:

1. **Environment variables** (`.env` / Docker env) — bootstrapping values (DB connection, JWT secret) and optional fallbacks for things like `STRIPE_API_KEY`, `GEMINI_API_KEY`.
2. **Database-backed `app_settings` table** — administrators configure Stripe, Gemini, SMTP, integrations, and other credentials at runtime through the [[Admin Panel]]. DB values **take precedence** over env vars.

All settings are accessed through typed helpers in `src/utils/appSettings.ts` (`getStripeConfig()`, `getGeminiConfig()`, `getEmailConfig()`, etc.). Secrets are masked in API responses; the GET endpoint returns a `*Set` boolean flag instead of the raw value.

---

## Money handling

All monetary values are stored as **integer pence/cents** in the database, in API payloads, and in frontend state — never floats. Conversion to display strings happens in the rendering layer only. This avoids floating-point rounding errors when summing line items, applying tax, or computing margins.

---

## Status enums

All backend status enums use **lowercase string values** (`'draft'`, `'sent'`, `'paid'`, …) to match the frontend TypeScript union types verbatim. See [[Status Workflows]] for state machines.

---

## Background jobs

`node-cron` runs inside the API process (started in `src/server.ts` via `startRecurringJobCron()`). It instantiates new jobs from `RecurringJobTemplate` rows on schedule (daily/weekly/monthly/yearly).
