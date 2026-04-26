# Jobrythm Frontend API Integration

## Base Transport
- Base URL: `VITE_API_URL` if set; otherwise by frontend hostname: `http://localhost:8080/api` (local), `https://api.jobrythm.aricummings.com/api` (aricummings), `https://api.jobrythm.com/api` (production). See `src/api/hosts.ts`.
- No MSW or mock API; all traffic hits a real backend.
- **Docker:** the image is built with `VITE_API_URL=/api`. Set `API_URL` to `1`, `2`, or `3` in `docker-compose.yml` to choose the nginx proxy target (see comments there).
- Auth: bearer token is attached by `src/api/client.ts`
- Refresh: automatic single-flight refresh on near-expiry and `401` replay
- Errors: all Axios errors normalized to `ApiError` in `src/api/errors.ts`

## Screen to Endpoint Mapping
- Auth (`/login`, `/register`)
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- Settings/Profile (`/settings`)
  - `GET /api/users/me`
  - `PUT /api/users/me`
  - `POST /api/users/me/logo`
  - `POST /api/billing/checkout`
  - `POST /api/billing/portal`
- Clients (`/clients`, `/clients/:id`)
  - `GET /api/clients`
  - `GET /api/clients/{id}`
  - `POST /api/clients`
  - `PUT /api/clients/{id}`
  - `DELETE /api/clients/{id}`
- Jobs (`/jobs`, `/jobs/:id`, `/jobs/:id/edit`)
  - `GET /api/jobs`
  - `GET /api/jobs/{id}`
  - `POST /api/jobs`
  - `PUT /api/jobs/{id}`
  - `PATCH /api/jobs/{id}/status`
  - `DELETE /api/jobs/{id}`
- Line Items (job detail line-item tab)
  - `POST /api/jobs/{jobId}/line-items`
  - `PUT /api/line-items/{id}`
  - `DELETE /api/line-items/{id}`
- Quotes (`/quotes`, `/quotes/:id`, job quote tab)
  - `GET /api/quotes`
  - `GET /api/quotes/{id}`
  - `POST /api/jobs/{jobId}/quotes`
  - `PUT /api/quotes/{id}`
  - `GET /api/quotes/{id}/pdf`
  - `POST /api/quotes/{id}/send`
- Invoices (`/invoices`, `/invoices/:id`, job invoice tab)
  - `GET /api/invoices`
  - `GET /api/invoices/{id}`
  - `POST /api/jobs/{jobId}/invoices`
  - `PUT /api/invoices/{id}`
  - `PATCH /api/invoices/{id}/paid`
  - `GET /api/invoices/{id}/pdf`
  - `POST /api/invoices/{id}/send`
- Dashboard (`/dashboard`)
  - `GET /api/dashboard`

## Compatibility Notes
- List endpoints are now treated as paginated (`{ items, page, pageSize, total }`).
- Dashboard response supports both direct stats payloads and wrapped widget/data payloads.
- When backend payloads differ, update `src/api/types.ts` first and keep feature hooks typed against shared DTOs.
