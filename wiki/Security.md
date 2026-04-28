# Security

This page documents Jobrythm's security model and the conventions every contributor must follow.

---

## Threat model summary

- **Multi-tenant SaaS** — every business owner sees only their own data.
- **Self-hostable** — operators are responsible for TLS, network exposure, and database/file-system security of the host.
- **Admin role** — full access to all users and credentials; treat admin accounts as privileged.

---

## Authentication

- Passwords hashed with **bcrypt (10 rounds)**.
- **JWT access tokens** (default 1-hour TTL) attached as `Authorization: Bearer <token>`.
- **Refresh tokens** stored hashed in the `refresh_tokens` table; rotated on every refresh; revocable.
- **Rate limiting** on all `/api/auth/*` endpoints (10 req/min/IP).

See [[Authentication]] for the full flow.

---

## Authorisation

- Two roles: `user` and `admin`. Admin-only endpoints live under `/api/admin/*` and are guarded by middleware that re-checks the JWT role claim against the database.
- **All domain queries must be scoped by `req.user.userId`.** This is the single most important convention in the codebase. There is no row-level security at the database layer; data isolation is enforced exclusively in route handlers. Reviewers should reject any query that does not filter by `userId`.

---

## Sensitive data

- **Secrets are masked** in admin API responses (Stripe keys, SMTP passwords, Gemini key, OAuth client secrets). The GET endpoint returns a `*Set: boolean` flag instead of the raw value.
- **Updates only persist non-empty submissions** so admins can re-save the form without retyping every secret.
- **Webhooks are signature-verified** (Stripe webhook handler reads the raw body and validates against `STRIPE_WEBHOOK_SECRET`).

---

## Transport & headers

- `helmet` is mounted at the top of the middleware chain with a Content-Security-Policy.
- `cors` is restricted to the configured `CORS_ORIGINS`.
- `compression` and `morgan` are mounted globally.

---

## File uploads

- Server-enforced size limit via `MAX_FILE_SIZE_MB` (default 5 MB).
- Files are persisted to `UPLOAD_DIR` (default `./uploads/`) and served via authenticated routes only — there is no directory listing.
- **Always validate MIME types** when adding new upload routes.

---

## Database

- TypeORM uses parameterised queries everywhere — never concatenate user input into a query.
- `synchronize: true` is enabled. This is acceptable for the Docker-first deployment story but means destructive schema changes require care; back up before upgrading.

---

## Things contributors must NOT do

- ❌ Skip the `userId` filter on a query — this leaks cross-tenant data.
- ❌ Return raw secrets from any API endpoint — always mask + flag.
- ❌ Persist a secret if the user submitted an empty value — this would silently clear it.
- ❌ Trust the client-provided JWT claims without re-checking the user record where role/permission matters.
- ❌ Commit secrets to the repo — use `.env` (gitignored) or the Admin Panel.
