# API Reference

All protected endpoints require an `Authorization: Bearer <token>` header. Tokens are obtained via `POST /api/auth/login` and refreshed via `POST /api/auth/refresh`. See [[Authentication]].

All responses are JSON. Errors use a JSON body with an `error` (and optional `details`) field.

> The base URL in production depends on deployment. With the default Docker setup the API is served at `http://<host>:8080/api`.

---

## Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Exchange email/password for an access + refresh token |
| `POST` | `/api/auth/refresh` | Exchange a refresh token for a new access token |
| `POST` | `/api/auth/logout` | Revoke the current refresh token |

Auth endpoints are rate-limited to 10 requests per minute per IP.

## Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users/me` | Get the authenticated user |
| `PUT` | `/api/users/me` | Update profile (name, business info, branding) |
| `POST` | `/api/users/me/logo` | Upload a logo (multipart) |

## Clients

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/clients` | List clients (paginated, searchable) |
| `GET` | `/api/clients/:id` | Get client detail |
| `POST` | `/api/clients` | Create client |
| `PUT` | `/api/clients/:id` | Update client |
| `DELETE` | `/api/clients/:id` | Delete client |

## Jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | List jobs (paginated, filter by status / client) |
| `GET` | `/api/jobs/:id` | Get job detail (incl. line items) |
| `POST` | `/api/jobs` | Create job |
| `PUT` | `/api/jobs/:id` | Update job |
| `PATCH` | `/api/jobs/:id/status` | Update status (see [[Status Workflows]]) |
| `DELETE` | `/api/jobs/:id` | Delete job |
| `POST` | `/api/jobs/:id/line-items` | Add a line item |
| `PUT` | `/api/jobs/line-items/:id` | Update a line item |
| `DELETE` | `/api/jobs/line-items/:id` | Delete a line item |
| `POST` | `/api/jobs/:id/ai-suggest-line-items` | AI line-item suggestions (see [[AI Features]]) |

## Quotes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/quotes` | List quotes |
| `GET` | `/api/quotes/:id` | Get quote detail |
| `POST` | `/api/quotes` | Create from a job (`{ jobId }` in body) |
| `PUT` | `/api/quotes/:id` | Update quote |
| `POST` | `/api/quotes/:id/send` | Send via email |
| `GET` | `/api/quotes/:id/pdf` | Download branded PDF |

## Invoices

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/invoices` | List invoices |
| `GET` | `/api/invoices/:id` | Get invoice detail |
| `POST` | `/api/invoices` | Create from a job (`{ jobId }` in body) |
| `PUT` | `/api/invoices/:id` | Update invoice |
| `PATCH` | `/api/invoices/:id/paid` | Mark as paid |
| `POST` | `/api/invoices/:id/send` | Send via email |
| `GET` | `/api/invoices/:id/pdf` | Download branded PDF |

## Appointments / Expenses / Checklists / Attachments / Time Entries

| Resource | Base path |
|---|---|
| Appointments | `/api/appointments` |
| Expenses | `/api/expenses` |
| Checklists | `/api/checklists` |
| Attachments | `/api/attachments` |
| Time entries | `/api/time-entries` |

Each follows the standard `GET / GET /:id / POST / PUT / DELETE` convention.

## Recurring jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/recurring-jobs` | List recurring job templates |
| `POST` | `/api/recurring-jobs` | Create a template |
| `PUT` | `/api/recurring-jobs/:id` | Update |
| `DELETE` | `/api/recurring-jobs/:id` | Delete |

## Team & company members / messages

| Resource | Base path |
|---|---|
| Team | `/api/team` |
| Company members | `/api/company-members` |
| Messages | `/api/messages` |

## Dashboard & reports

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Aggregated stats: active jobs, revenue, outstanding invoices, recent activity |
| `GET` | `/api/reports/...` | Various reporting endpoints |

## AI

See [[AI Features]] for full payload examples.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/jobs/:id/ai-suggest-line-items` | Suggest line items for a job |
| `POST` | `/api/ai/suggest-client` | Parse a free-text description into client fields |
| `POST` | `/api/ai/suggest-job` | Parse a free-text description into job fields |

## Billing (Stripe)

See [[Stripe Billing]].

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/billing/checkout` | Create a Stripe Checkout session for a plan/interval |
| `POST` | `/api/billing/portal` | Create a Stripe Customer Portal session |
| `POST` | `/api/billing/webhook` | Stripe webhook (signed) — handles subscription lifecycle |

## Public

Used for unauthenticated quote/invoice viewing portals.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/public/quotes/:token` | Public view of a quote |
| `GET` | `/api/public/invoices/:token` | Public view of an invoice |

## Integrations

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/integrations/status` | Per-provider connection status |
| `GET` | `/api/integrations/:provider/connect` | Begin OAuth flow |
| `GET` | `/api/integrations/:provider/callback` | OAuth callback |
| `POST` | `/api/integrations/:provider/disconnect` | Revoke a connection |

Providers: `quickbooks`, `xero`, `google-ads`, `meta-ads`. See [[Integrations]].

## Admin (admin role required)

See [[Admin Panel]].

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/users` | List users |
| `POST` | `/api/admin/users` | Create user |
| `PUT` | `/api/admin/users/:id` | Update user |
| `DELETE` | `/api/admin/users/:id` | Delete user |
| `GET` | `/api/admin/settings` | Get app settings (secrets masked, `*Set` flags returned) |
| `PUT` | `/api/admin/settings` | Update app settings |
| `POST` | `/api/admin/settings/test-email` | Send a test email through configured SMTP |
| `GET` | `/api/admin/sales/...` | Sales reports |
| `GET` | `/api/admin/ads/...` | Aggregated ads data |

## Demo data

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/demo-data/seed` | Seed sample clients/jobs/quotes/invoices for the current user |
| `POST` | `/api/demo-data/clear` | Wipe demo data |
