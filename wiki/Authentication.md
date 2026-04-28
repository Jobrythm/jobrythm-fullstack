# Authentication

Jobrythm uses **JWT access tokens** with **rotating refresh tokens**.

---

## Tokens

| Token | Where it lives | TTL | Purpose |
|---|---|---|---|
| Access token | In-memory on the client (Zustand `authStore`), sent as `Authorization: Bearer <token>` | `JWT_EXPIRES_IN` (default `1h`) | Authenticates API calls |
| Refresh token | Stored on the client (typically `localStorage`); a hashed copy lives in the `refresh_tokens` DB table | `REFRESH_TOKEN_EXPIRES_IN_DAYS` (default `30`) | Used to obtain a new access token |

Refresh tokens are stored **hashed** server-side and can be revoked individually (logout) or per-user (admin).

---

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ email, password, name }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` (new pair) |
| `POST` | `/api/auth/logout` | `{ refreshToken }` | `204` |

All endpoints are rate-limited to **10 requests/min/IP** via `express-rate-limit`.

---

## Client behaviour

The frontend Axios client (`frontend/src/api/client.ts`) handles tokens automatically:

1. Attaches the access token as a `Bearer` header on every request.
2. Detects "near-expiry" (small skew before the JWT `exp`) and proactively refreshes.
3. On a `401` response, performs a single-flight refresh and **replays the original request** once.
4. If the refresh itself fails, the user is logged out and routed to `/login`.

`single-flight` means concurrent requests during a refresh queue up behind the same in-flight refresh promise — the server only sees one refresh call.

---

## Roles

Two roles are enforced server-side:

- `user` — standard account; sees only their own data.
- `admin` — also has access to `/api/admin/*` (see [[Admin Panel]]).

Role is encoded in the JWT and re-checked by the auth middleware on every request.

---

## Default admin

On first boot the backend seeds an admin account if no users exist:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `adminpassword` |

**Change this password immediately in production.**

---

## Password storage

Passwords are hashed with **bcrypt (10 rounds)** before being persisted. Plain-text passwords never touch the database.
