# AGENTS

## Purpose

This document helps future coding agents work quickly and safely in the Jobrythm fullstack workspace.

## Project Overview

Jobrythm is a full-stack SaaS job management platform for trade businesses (plumbers, electricians, HVAC, handymen). It is a **monorepo** with:

- **Backend** — TypeScript/Express API at `src/`, built with `npm run build` (tsc)
- **Frontend** — React/TypeScript SPA at `frontend/`, built with `cd frontend && npm run build`

Key business domains:
- Jobs and line items (the core entity)
- Clients (CRM)
- Quotes and Invoices (PDF generation, email delivery)
- Recurring jobs, appointments, expenses, checklists, attachments, team members
- Stripe subscription billing (Starter / Professional / Business, 14-day trial)
- AI features powered by Google Gemini (`@google/genai`)
- Admin panel for managing users, plans, and all credentials

## Tech and Conventions

### Backend
- TypeScript strict mode + ES Modules (always use `.js` extensions in imports)
- Express route handlers: always `async`, always `try/catch`, always `Promise<void>` return type
- TypeORM with `synchronize: true` (tables auto-created on startup)
- Use `Relation<T>` wrapper for all entity relationships (prevents circular dep errors)
- Entity glob `'dist/entities/**/*.js'` in DataSource — do NOT import entity classes there
- All monetary values stored as **integer cents/pence** (never floats)
- All backend enums use **lowercase** string values (`'draft'`, `'active'`, etc.)
- User data isolation: every query must filter by `userId`
- Secrets saved via `setSetting(key, value)` in `app_settings` table; read with typed config helpers in `src/utils/appSettings.ts`

### Frontend
- React 18 + strict TypeScript
- Vite build tool
- React Router v6 in `frontend/src/router/index.tsx`
- TanStack Query for all server data
- Zustand auth state in `frontend/src/store/authStore.ts`
- Axios API client in `frontend/src/api/client.ts`
- React Hook Form + Zod for all forms (`zodResolver`)
- Tabler CSS classes and `@tabler/icons-react` for UI consistency
- Currency always in cents in state/server payloads

## Key Paths

### Backend
- `src/server.ts` → Express entry point (port 8080)
- `src/config/database.ts` → TypeORM DataSource
- `src/entities/` → TypeORM entities (extend `BaseEntity`)
- `src/routes/` → Express route handlers
- `src/utils/appSettings.ts` → DB-backed config helpers (`getGeminiConfig`, `getStripeConfig`, `getEmailConfig`, etc.)
- `src/utils/email.ts` → Nodemailer SMTP wrapper
- `src/utils/pdf.ts` → PDFKit quote/invoice renderer
- `src/routes/ai.ts` → Gemini AI endpoints
- `src/routes/adminSettings.ts` → Admin settings GET/PUT

### Frontend
- `frontend/src/types/index.ts` → canonical domain and payload types
- `frontend/src/api/` → typed API resource modules
- `frontend/src/features/` → feature hooks/pages/components
- `frontend/src/features/admin/pages/AdminPage.tsx` → admin panel (users, settings tabs)
- `frontend/src/layouts/AppLayout.tsx` → sidebar + topbar shell
- `frontend/src/api/hosts.ts` → resolves API base URL

## AI Integration

AI features use **Google Gemini** via `@google/genai`.

- Config stored in DB keys `gemini_api_key` and `gemini_model`
- Read via `getGeminiConfig()` in `src/utils/appSettings.ts`
- Env var fallbacks: `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.0-flash`)
- Endpoints in `src/routes/ai.ts`:
  - `POST /api/jobs/:id/ai-suggest-line-items`
  - `POST /api/ai/suggest-client`
  - `POST /api/ai/suggest-job`
- Admin configures the key and model in **Admin → Settings → AI tab**
- Frontend `AppSettings` type uses `geminiApiKey`, `geminiApiKeySet`, `geminiModel`, `aiConfigured`

## Admin Settings Pattern

All credentials are stored in the `app_settings` DB table as key/value rows:
- Secrets (API keys, passwords) are only updated when a non-empty value is submitted
- Responses always mask secrets via `maskKey()` and include a `*Set` boolean flag
- Adding a new credential: add key to `app_settings`, add typed getter in `appSettings.ts`, expose via `adminSettings.ts` GET/PUT, update frontend types + admin panel

## Implementation Rules

1. Keep new API responses strongly typed — no `any`.
2. Keep money values as integer cents in state/server payloads.
3. Use form schemas with Zod and `zodResolver`.
4. Use Tabler badge/button/table/card styles, not custom CSS.
5. Use query keys per feature hooks and invalidate related keys in mutations.
6. For destructive actions, use `ConfirmModal`.
7. For empty list/table experiences, use `EmptyState`.
8. For list loading states, use `TableSkeleton` or `LoadingSpinner`.

## Validation Workflow

Run after every backend change:
```bash
npm run build
npm run lint
```

Run after every frontend change:
```bash
cd frontend && npm run build && npm run lint
```

If admin settings API is modified, verify matching updates in:
- `src/utils/appSettings.ts` (config getter)
- `src/routes/adminSettings.ts` (GET + PUT handlers)
- `frontend/src/types/index.ts` (`AppSettings` interface)
- `frontend/src/api/admin.ts` (`UpdateSettingsPayload`)
- `frontend/src/features/admin/pages/AdminPage.tsx` (relevant settings panel)

## Status Workflows

```
Job:     Draft → Quoted → Active → Completed → Invoiced
Quote:   Draft → Sent → Accepted / Rejected / Expired
Invoice: Draft → Sent → Paid / Overdue / Cancelled
```

## Useful Extension Tasks

- Add automated tests for route protection and cents conversion.
- Add optimistic UI updates for inline edits on the job detail page.
- Add pagination and server-side filtering if list sizes grow.
- Replace PDF preview stub with a real in-browser preview endpoint.

