# Database Schema

Jobrythm uses **PostgreSQL** via **TypeORM**. Tables are auto-created at startup (`synchronize: true`), so the schema is defined entirely by the entity classes under `src/entities/`.

> The DataSource (`src/config/database.ts`) loads entities via the glob `dist/entities/**/*.js` to avoid module-level circular imports. All entity-to-entity relationships use the `Relation<T>` wrapper for the same reason.

---

## Conventions

- Every domain entity extends `BaseEntity` (`id`, `createdAt`, `updatedAt`).
- Every domain entity has a `userId` foreign key — Jobrythm is multi-tenant by user, and queries must always filter by `userId`. See [[Security]].
- All monetary columns are **integer cents/pence**.
- All status columns are **lowercase string enums** (see [[Status Workflows]]).

---

## Entities

### Identity & access

| Entity | Purpose |
|---|---|
| `User` | Account holder. Roles: `admin`, `user`. Holds Stripe customer/subscription IDs, plan, trial status, profile/branding. |
| `RefreshToken` | Hashed refresh tokens, scoped to a `User`, with expiry and revocation. |
| `OAuthToken` | OAuth tokens for QuickBooks / Xero / Ads integrations (per user, per provider). |
| `AppSettings` | Key/value pairs for runtime configuration (Stripe keys, SMTP, Gemini, etc.). |

### CRM

| Entity | Purpose |
|---|---|
| `Client` | Customer record: name, contact info, address, notes. Has many `Job`s. |
| `Lead` | Pre-client enquiry record. |

### Job lifecycle

| Entity | Purpose |
|---|---|
| `Job` | Core entity. Belongs to a `Client`. Has many `LineItem`s, `Appointment`s, `Expense`s, `Checklist`s, `Attachment`s, `TimeEntry`s. Status: see [[Status Workflows]]. |
| `LineItem` | Cost line on a job. Categories: `labour`, `materials`, `equipment`, `subcontractor`, `other`. Stores quantity, unit price (cents), and cost (cents) for margin calculation. |
| `RecurringJobTemplate` | Schedule template (daily / weekly / monthly / yearly) used by the cron scheduler to instantiate new jobs. |
| `Appointment` | Scheduled visit linked to a job and/or client. |
| `Expense` | Job-level expense with category and optional receipt attachment. |
| `Checklist` + `ChecklistItem` | Task lists attached to a job. |
| `Attachment` | Uploaded files attached to a job. |
| `TimeEntry` | Time logged against a job by a team member. |

### Quoting & invoicing

| Entity | Purpose |
|---|---|
| `Quote` | Generated from a job. Has its own number (e.g. `QT0001`), status, expiry, totals. PDF/email enabled. |
| `Invoice` | Generated from a job. Has its own number (e.g. `INV0001`), status, due date, totals, payment tracking. |
| `NumberSequence` | Per-user counter used to allocate the next quote/invoice number safely. |

### Team & messaging

| Entity | Purpose |
|---|---|
| `TeamMember` | Staff member belonging to a user (the business owner). Can be assigned to jobs. |
| `Message` | In-app messaging between user and team / clients. |

### Marketing

| Entity | Purpose |
|---|---|
| `EmailCampaign`, `EmailTemplate` | Outbound marketing email. |
| `AdPlatformConnection`, `AdCampaign`, `AdCreative` | Google Ads / Meta Ads integration data. |

---

## Relationship overview

```
User ─┬─ Client ─── Job ─┬─ LineItem
      │                  ├─ Appointment
      │                  ├─ Expense
      │                  ├─ Attachment
      │                  ├─ Checklist ── ChecklistItem
      │                  ├─ TimeEntry
      │                  ├─ Quote
      │                  └─ Invoice
      ├─ RecurringJobTemplate
      ├─ TeamMember
      ├─ Message
      ├─ Lead
      ├─ EmailCampaign / EmailTemplate
      ├─ AdPlatformConnection ── AdCampaign ── AdCreative
      ├─ OAuthToken
      ├─ RefreshToken
      └─ NumberSequence (one per sequence type)

AppSettings   (singleton-ish key/value table; not user-scoped)
```

---

## Migrations

There are **no migrations** in the repo today — `synchronize: true` handles schema changes for the Docker-first deployment story. If you change an entity, restart the app and TypeORM will alter the table.

If you need destructive changes (rename column, drop column, change column type) you must do them manually in SQL or accept data loss in development databases.
