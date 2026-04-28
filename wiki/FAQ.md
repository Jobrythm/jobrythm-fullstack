# FAQ & Troubleshooting

---

## "I just ran `docker compose up` and the page doesn't load."

The first boot needs ~30–60 seconds for PostgreSQL to initialise and TypeORM to create the schema. Tail the logs:

```bash
docker compose logs -f app
```

Wait for `Server listening on port 8080`. If you see TypeORM connection errors, check `DB_*` env vars in `docker-compose.yml`.

---

## "How do I log in for the first time?"

A default admin is auto-seeded if no users exist:

| Email | Password |
|---|---|
| `admin@example.com` | `adminpassword` |

**Change the password immediately** in **Settings → Profile**.

---

## "AI buttons are disabled — why?"

You haven't configured Gemini. Open **Admin → Settings → AI** and paste an API key (free at <https://aistudio.google.com/app/apikey>). See [[AI Features]].

---

## "I configured SMTP but emails don't send / fail with TLS errors."

Two things to know:

- The **Send test email** button in the admin Email tab surfaces the exact SMTP error — start there.
- The transport currently derives TLS from `port === 465` and **does not honour the saved `smtp_secure` flag**. Use port 465 for implicit TLS, port 587 for STARTTLS.

See [[Email SMTP]].

---

## "Stripe checkout works in test but redirects to localhost in production."

Set `APP_URL` to your public URL (e.g. `https://app.example.com`) in your environment. This value is used to build Checkout success/cancel URLs and public quote/invoice links. See [[Environment Variables]].

---

## "I changed an entity but the table didn't update."

TypeORM `synchronize: true` runs on **app startup**, so restart the container/process. Some destructive changes (rename/drop column, change column type) cannot be inferred from entity diffs and must be applied manually with SQL.

---

## "I want to wipe the database and start over."

```bash
docker compose down -v
docker compose up -d --build
```

The `-v` flag removes the named volume holding PostgreSQL data.

---

## "Why is everything in cents?"

To avoid floating-point rounding errors when summing line items, applying tax, or computing margins. All monetary values are integer pence/cents in the database, in API payloads, and in frontend state. The display layer is the **only** place that converts to a formatted string.

---

## "How do I add a new admin-configurable credential?"

Five steps — see [[Backend Development]] → "Adding a new admin setting".

---

## "Can I run only the backend (no frontend)?"

Yes. `npm run dev` (or `npm start` on a build) runs the API on port 8080. The SPA is optional — every UI feature is also exposed as a REST endpoint (see [[API Reference]]).

---

## "Where do I report a security issue?"

Email the maintainer privately rather than opening a public issue. See [[Contributing]].

---

## "I'm building an integration. Where do I start?"

1. Read [[API Reference]] for the endpoint surface.
2. Read [[Authentication]] for the JWT + refresh-token flow.
3. Optionally use the OAuth integration scaffolding under `/api/integrations/*` (see [[Integrations]]) as a reference if you're adding a new third-party provider.
