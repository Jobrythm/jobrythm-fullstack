# Email & SMTP

Jobrythm sends quotes, invoices, and admin test emails via **Nodemailer** over a configured SMTP transport.

---

## Configuration

All SMTP settings live in the `app_settings` DB table and are configured via **Admin → Settings → Email / SMTP**:

| DB key | Description |
|---|---|
| `smtp_host` | SMTP server hostname |
| `smtp_port` | SMTP port (e.g. `587`, `465`, `25`) |
| `smtp_secure` | Whether to use implicit TLS (boolean) |
| `smtp_user` | SMTP username |
| `smtp_password` | SMTP password (stored as a secret; masked in API responses) |
| `smtp_from_email` | Default `From:` address |
| `smtp_from_name` | Default `From:` name |

Read at runtime via `getEmailConfig()` in `src/utils/appSettings.ts`. The transport is constructed inside `src/utils/email.ts`.

> **Known limitation:** the transport currently derives TLS from `port === 465` and **does not honour the saved `smtp_secure` flag**. Use port 465 for implicit TLS and 587 for STARTTLS.

---

## What gets emailed

| Event | Template |
|---|---|
| Quote sent (`POST /api/quotes/:id/send`) | Body with quote summary + PDF attachment + public quote link |
| Invoice sent (`POST /api/invoices/:id/send`) | Body with invoice summary + PDF attachment + public invoice link |
| Admin test (`POST /api/admin/settings/test-email`) | Plain confirmation email to the admin's address |
| Marketing campaigns | Scheduled via `EmailCampaign` / `EmailTemplate` entities |

Public quote/invoice links use `process.env.APP_URL` as the base — set this to your production URL so customers receive working links.

---

## Test email

In **Admin → Settings → Email** click **Send test email** to validate the configuration. The endpoint surfaces SMTP errors directly in the UI, which is the fastest way to debug auth/TLS issues.

---

## Common providers

| Provider | Host | Port | Notes |
|---|---|---|---|
| Gmail | `smtp.gmail.com` | `587` | Requires an App Password (with 2FA on) |
| SendGrid | `smtp.sendgrid.net` | `587` | Username `apikey`, password = API key |
| Mailgun | `smtp.mailgun.org` | `587` | EU host: `smtp.eu.mailgun.org` |
| Postmark | `smtp.postmarkapp.com` | `587` | Username = server token |
| AWS SES | `email-smtp.<region>.amazonaws.com` | `587` | SMTP credentials from IAM |
