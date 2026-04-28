# Jobrythm

Welcome to the **Jobrythm** wiki — a full-stack SaaS job-management platform built for trade businesses (plumbers, electricians, HVAC technicians, handymen). Manage jobs, clients, quotes, invoices, team members, recurring jobs, expenses, and more, all in one place.

> 🔗 Source code: [Jobrythm/jobrythm-fullstack](https://github.com/Jobrythm/jobrythm-fullstack)

---

## What is Jobrythm?

Jobrythm is a self-hostable, opinionated workflow tool for small trade businesses. It bundles a CRM, a job tracker, branded quote/invoice PDFs with email delivery, Stripe-powered subscription billing, AI-assisted data entry, and an admin panel — all in a single deployable image.

Key entities flow like this:

```
Client ──► Job ──► Line Items ──► Quote ──► Invoice ──► Payment
                       │
                       ├── Appointments
                       ├── Expenses
                       ├── Checklists
                       ├── Attachments
                       └── Time Entries
```

---

## Quick links

### Getting started
- [[Getting Started]] — install and run with Docker, plus local development
- [[Environment Variables]] — full reference for `.env` configuration
- [[Deployment]] — production deployment guide

### Architecture & development
- [[Architecture]] — high-level design, request flow, monorepo layout
- [[Backend Development]] — TypeScript / Express / TypeORM conventions
- [[Frontend Development]] — React / Vite / TanStack Query conventions
- [[Database Schema]] — entities and relationships
- [[API Reference]] — full REST API
- [[Authentication]] — JWT + refresh-token flow
- [[Status Workflows]] — Job, Quote, and Invoice state machines

### Features
- [[Admin Panel]] — manage users, plans, and credentials
- [[AI Features]] — Google Gemini integration
- [[Stripe Billing]] — subscriptions, checkout, customer portal, webhooks
- [[Email SMTP]] — outgoing email configuration
- [[Integrations]] — QuickBooks, Xero, Google Ads, Meta Ads

### Operations
- [[Security]] — security model and best practices
- [[Contributing]] — contribution workflow
- [[FAQ]] — common questions and troubleshooting

---

## Tech stack at a glance

| Layer | Technology |
|---|---|
| Backend language | TypeScript (strict, ES Modules) |
| Backend framework | Express.js |
| Database | PostgreSQL via TypeORM |
| Auth | JWT + bcrypt + refresh tokens |
| PDF | PDFKit |
| Email | Nodemailer (SMTP) |
| Payments | Stripe |
| AI | `@google/genai` (Gemini) |
| Scheduler | node-cron |
| Validation | Zod |
| Frontend framework | React 18 + TypeScript |
| Frontend build | Vite |
| Routing | React Router v6 |
| Server state | TanStack Query |
| Client state | Zustand |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| UI | Tabler CSS + Tabler Icons |

---

## License

MIT — see [LICENSE](https://github.com/Jobrythm/jobrythm-fullstack/blob/main/LICENSE).
