# Jobrythm

A full-stack SaaS job management platform built for trade businesses — plumbers, electricians, HVAC technicians, and handymen. Manage jobs, clients, quotes, invoices, team members, recurring jobs, expenses, and more, all in one place.

---

## Features

### Core
- 🔐 **Auth** — JWT + refresh-token authentication with role-based access (admin / user)
- 👥 **Client Management** — Full CRM with contact info, address, notes, and job history
- 💼 **Job Management** — Create and track jobs through their full lifecycle (Draft → Quoted → Active → Completed → Invoiced)
- 📋 **Line Items** — Detailed cost breakdown per job with categories: Labour, Materials, Equipment, Subcontractor, Other
- 📄 **Quotes** — Generate branded PDF quotes, send via email, track acceptance
- 💵 **Invoices** — Create invoices from jobs, send via email, mark paid, track overdue
- 📊 **Dashboard** — Live summary of active jobs, revenue, outstanding invoices, and recent activity

### Business
- 🔁 **Recurring Jobs** — Schedule repeating jobs (daily / weekly / monthly / yearly)
- 🧑‍🤝‍🧑 **Team Members** — Add staff with roles, assign to jobs
- 📅 **Appointments** — Schedule and track appointments linked to jobs and clients
- 💸 **Expenses** — Track job-level expenses with categories and receipts
- ✅ **Checklists** — Attach task checklists to jobs
- 📎 **Attachments** — Upload and attach files to jobs

### AI (powered by Google Gemini)
- ✨ **AI Line-Item Suggestions** — Describe a job in plain English; the AI suggests appropriate line items with quantities and prices, drawing on the contractor's past job history
- ✨ **AI Client Autofill** — Paste a contact description and the AI extracts name, email, phone, address, and notes
- ✨ **AI Job Autofill** — Describe a job in plain English and the AI fills in the title, description, and dates

### Integrations & Admin
- 💳 **Stripe Billing** — Subscription plans (Starter / Professional / Business) with 14-day free trial, customer portal
- 📧 **SMTP Email** — Configurable outgoing email for quotes, invoices, and test emails
- 🔗 **QuickBooks & Xero** — OAuth integration for accounting exports
- 📣 **Ad Platforms** — Google Ads and Meta Ads connections
- 🛠️ **Admin Panel** — Manage users, plans, all credentials, and app-wide settings

### Technical
- 🔢 **Automatic Numbering** — Sequential quote (QT0001) and invoice (INV0001) numbers per user
- 💱 **Precise Currency** — All monetary values stored as integer pence/cents to avoid floating-point errors
- 🧮 **Margin Tracking** — Automatic profit margin calculation on jobs and line items
- 📑 **PDF Generation** — Server-side PDFs for quotes and invoices using PDFKit

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | TypeScript (strict, ES Modules) |
| Framework | Express.js |
| Database | PostgreSQL via TypeORM |
| Authentication | JWT + bcrypt |
| PDF | PDFKit |
| Email | Nodemailer (SMTP) |
| Payments | Stripe |
| AI | `@google/genai` (Gemini) |
| Scheduler | node-cron |
| Validation | Zod |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| Server state | TanStack Query (React Query) |
| Client state | Zustand |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| UI | Tabler CSS + Tabler Icons |

---

## Project Structure

```
jobrythm-fullstack/
├── src/                        # Backend (TypeScript/Express)
│   ├── config/
│   │   └── database.ts         # TypeORM DataSource (synchronize: true)
│   ├── entities/               # TypeORM entity definitions
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   └── errorHandler.ts
│   ├── routes/                 # Express route handlers
│   │   ├── ai.ts               # Gemini AI endpoints
│   │   ├── adminSettings.ts    # Admin settings CRUD
│   │   ├── auth.ts
│   │   ├── billing.ts          # Stripe checkout + portal
│   │   ├── clients.ts
│   │   ├── jobs.ts
│   │   ├── quotes.ts
│   │   ├── invoices.ts
│   │   └── ...
│   ├── utils/
│   │   ├── appSettings.ts      # DB-backed settings (Stripe, SMTP, Gemini, etc.)
│   │   ├── email.ts            # Nodemailer SMTP wrapper
│   │   ├── pdf.ts              # PDFKit quote/invoice renderer
│   │   ├── calculations.ts     # Line-item totals, margins
│   │   └── recurringJobs.ts    # Cron job scheduler
│   └── server.ts               # Express app entry point (port 8080)
├── frontend/                   # React frontend
│   └── src/
│       ├── api/                # Typed API client modules
│       ├── components/         # Shared UI components
│       ├── features/           # Feature modules (admin, jobs, clients, etc.)
│       ├── layouts/            # AppLayout, AuthLayout
│       ├── router/             # React Router config
│       ├── store/              # Zustand stores
│       └── types/              # Shared TypeScript types
├── docker-compose.yml
├── Dockerfile
├── nginx.conf.template         # Nginx reverse proxy config for Docker
└── .env.example
```

---

## Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose

### Run

```bash
git clone https://github.com/Jobrythm/jobrythm-fullstack.git
cd jobrythm-fullstack
docker compose up -d --build
```

Wait ~30–60 seconds on the first run for the database to initialise and tables to be created.

Then open **http://localhost:8080** and log in with the default admin account:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `adminpassword` |

> ⚠️ **Change this password immediately in production.**

### Useful commands

```bash
# View logs
docker compose logs -f app

# Check container status
docker compose ps

# Stop
docker compose down

# Stop and wipe database
docker compose down -v
```

---

## Local Development

### Backend

```bash
# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env

# Start with hot reload (requires a running Postgres instance)
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:8080` automatically.

### Build

```bash
# Backend
npm run build       # tsc → dist/

# Frontend
cd frontend
npm run build       # Vite → frontend/dist/
```

### Lint

```bash
npm run lint              # Backend ESLint
cd frontend && npm run lint   # Frontend ESLint
```

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `DB_HOST` | Postgres host |
| `DB_PORT` | Postgres port (default `5432`) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Access token TTL (e.g. `1h`) |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh token TTL in days |

### Optional

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `8080`) |
| `APP_URL` | Public app URL, used in email links |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins |
| `GEMINI_API_KEY` | Google Gemini API key (enables AI features) |
| `GEMINI_MODEL` | Gemini model to use (default `gemini-2.0-flash`) |
| `STRIPE_API_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

> All optional credentials can also be set via the **Admin → Settings** panel in the UI, which stores them in the database and takes precedence over environment variables.

---

## AI Features

AI features are powered by **Google Gemini** via the `@google/genai` SDK.

### Setup

1. Get a free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Go to **Admin → Settings → AI** in the app
3. Paste the key and select a model, then click **Save AI settings**

Alternatively, set `GEMINI_API_KEY` in your `.env` file.

### Available Models

| Model | Notes |
|---|---|
| `gemini-2.5-pro-preview-05-06` | Most capable, best reasoning |
| `gemini-2.5-flash-preview-04-17` | Fast, great quality |
| `gemini-2.0-flash` | **Recommended default** — fast & free tier |
| `gemini-2.0-flash-lite` | Lightest, cheapest |
| `gemini-1.5-pro` | Stable, highly capable |
| `gemini-1.5-flash` | Stable, fast |

### AI Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/jobs/:id/ai-suggest-line-items` | Suggest line items for a job based on description and history |
| `POST /api/ai/suggest-client` | Parse a plain-English description into client fields |
| `POST /api/ai/suggest-job` | Parse a plain-English description into job fields |

---

## API Overview

All protected endpoints require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |

### Clients
| Method | Path | Description |
|---|---|---|
| GET | `/api/clients` | List (paginated, searchable) |
| GET | `/api/clients/:id` | Get detail |
| POST | `/api/clients` | Create |
| PUT | `/api/clients/:id` | Update |
| DELETE | `/api/clients/:id` | Delete |

### Jobs
| Method | Path | Description |
|---|---|---|
| GET | `/api/jobs` | List (paginated, filterable) |
| GET | `/api/jobs/:id` | Get detail |
| POST | `/api/jobs` | Create |
| PUT | `/api/jobs/:id` | Update |
| PATCH | `/api/jobs/:id/status` | Update status |
| DELETE | `/api/jobs/:id` | Delete |
| POST | `/api/jobs/:id/line-items` | Add line item |
| PUT | `/api/jobs/line-items/:id` | Update line item |
| DELETE | `/api/jobs/line-items/:id` | Delete line item |
| POST | `/api/jobs/:id/ai-suggest-line-items` | AI line-item suggestions |

### Quotes
| Method | Path | Description |
|---|---|---|
| GET | `/api/quotes` | List |
| GET | `/api/quotes/:id` | Get detail |
| POST | `/api/quotes` | Create from job |
| PUT | `/api/quotes/:id` | Update |
| POST | `/api/quotes/:id/send` | Send via email |
| GET | `/api/quotes/:id/pdf` | Download PDF |

### Invoices
| Method | Path | Description |
|---|---|---|
| GET | `/api/invoices` | List |
| GET | `/api/invoices/:id` | Get detail |
| POST | `/api/invoices` | Create from job |
| PUT | `/api/invoices/:id` | Update |
| PATCH | `/api/invoices/:id/paid` | Mark paid |
| POST | `/api/invoices/:id/send` | Send via email |
| GET | `/api/invoices/:id/pdf` | Download PDF |

### Admin (admin role required)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/settings` | Get app settings |
| PUT | `/api/admin/settings` | Update app settings |
| POST | `/api/admin/settings/test-email` | Send test email |

---

## Status Workflows

```
Job:     Draft → Quoted → Active → Completed → Invoiced
Quote:   Draft → Sent → Accepted / Rejected / Expired
Invoice: Draft → Sent → Paid / Overdue / Cancelled
```

---

## Subscription Plans

Managed via Stripe. All plans include a **14-day free trial**.

| Plan | Monthly | Annual |
|---|---|---|
| Starter | $14/mo | $9/mo |
| Professional | $29/mo | $24/mo |
| Business | $59/mo | $49/mo |

Plan price IDs and the Stripe API key are configurable in **Admin → Settings → Stripe**.

---

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT access tokens (1-hour default TTL)
- Refresh tokens stored hashed in the database
- All user data scoped by `userId` — no cross-user data leakage
- Rate limiting on auth endpoints (10 req/min)
- Sensitive settings (API keys, passwords) masked in admin API responses
- CORS restricted to configured origins

---

## License

MIT — see [LICENSE](LICENSE) for details.
