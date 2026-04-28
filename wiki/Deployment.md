# Deployment

Jobrythm is designed to be deployed as a **single Docker image** that bundles the React frontend (built statically and served by nginx) and the Express API (Node.js). PostgreSQL runs as a sibling service.

---

## Quick deploy (Docker Compose)

```bash
git clone https://github.com/Jobrythm/jobrythm-fullstack.git
cd jobrythm-fullstack
docker compose up -d --build
```

Wait ~30–60 seconds on the first run for the database to initialise. Then visit <http://localhost:8080>.

See the bundled `docker-compose.yml` for the full service definition.

---

## Image structure

`Dockerfile` is multi-stage:

1. **frontend builder** — runs `npm ci && npm run build` in `frontend/` → produces `frontend/dist/`.
2. **backend builder** — runs `npm ci && npm run build` at the repo root → produces `dist/`.
3. **runtime** — Node + nginx; copies the compiled backend, the static frontend, and `nginx.conf.template`. nginx serves the SPA and proxies `/api/*` to the local Node process.

The image is built with `VITE_API_URL=/api`, which makes the SPA call the same origin (the bundled nginx).

---

## Environment

In `docker-compose.yml`, the app reads its config from environment variables. At minimum, set:

```env
JWT_SECRET=<long-random-string>
DB_PASSWORD=<strong-postgres-password>
APP_URL=https://your-public-url
CORS_ORIGINS=https://your-public-url
```

Optional credentials (Stripe, Gemini, SMTP, integrations) **should be configured via the [[Admin Panel]]** rather than environment variables, so they live in the database with the rest of your settings.

See [[Environment Variables]] for the full list.

---

## Reverse proxy / TLS

The bundled image listens on port 8080 over HTTP. For production you should put a TLS-terminating reverse proxy in front of it (Caddy, Traefik, nginx, or your cloud provider's load balancer):

```
Internet → Caddy/Traefik (TLS) → http://app:8080
```

`docker-compose.yml` exposes only the app port — keep PostgreSQL on the internal Docker network.

---

## Database persistence

The Compose file mounts a named volume for PostgreSQL data so it survives container rebuilds. To wipe the database:

```bash
docker compose down -v
```

---

## Backups

Back up two things:

1. **PostgreSQL** — `pg_dump` against the running container, or volume-level backups.
2. **`uploads/`** — the directory mounted into the container holds user-uploaded files (logos, attachments, receipts).

---

## Updating

```bash
git pull
docker compose up -d --build
```

Schema changes are applied automatically by TypeORM (`synchronize: true`) on container start. Watch the logs for any errors:

```bash
docker compose logs -f app
```

---

## Bare-metal / non-Docker

You can also run Jobrythm directly on a host:

1. Install Node 20+, npm 10+, PostgreSQL 14+.
2. `npm ci && npm run build` at the repo root.
3. `cd frontend && npm ci && npm run build`.
4. Configure a process manager (systemd, pm2) to run `node dist/server.js`.
5. Configure nginx (or another reverse proxy) to serve `frontend/dist/` and proxy `/api` to the Node process.

The repo's bundled `nginx.conf.template` is a good starting point.
