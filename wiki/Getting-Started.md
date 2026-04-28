# Getting Started

This page walks you through running Jobrythm with Docker (recommended for evaluation and self-hosting) and setting up a local development environment.

---

## Option 1 — Docker (recommended)

### Prerequisites

- Docker
- Docker Compose v2 (`docker compose` command)

### Run

```bash
git clone https://github.com/Jobrythm/jobrythm-fullstack.git
cd jobrythm-fullstack
docker compose up -d --build
```

> ⏱ On the **first run**, wait ~30–60 seconds for PostgreSQL to initialise and TypeORM to create the tables (the app uses `synchronize: true`).

Then open <http://localhost:8080> and log in with the seeded admin account:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `adminpassword` |

> ⚠️ **Change the admin password immediately** in production.

### Useful Docker commands

```bash
docker compose logs -f app          # follow app logs
docker compose ps                   # container status
docker compose down                 # stop
docker compose down -v              # stop and wipe database
docker compose up -d --build        # rebuild + restart
```

See [[Deployment]] for production deployment guidance.

---

## Option 2 — Local development

You need:

- Node.js 20+
- npm 10+
- A running PostgreSQL instance (local install, Docker, or hosted)

### 1. Backend

```bash
# From the repo root
npm install
cp .env.example .env       # edit DB_*, JWT_SECRET, etc.
npm run dev                # tsx watch mode on http://localhost:8080
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:8080` automatically, so you can use the frontend on port 5173 while the backend serves the API on 8080.

### 3. First admin user

The backend auto-seeds an admin (`admin@example.com` / `adminpassword`) on first boot if no users exist. You can change credentials immediately from **Settings → Profile**, or create new users from the [[Admin Panel]].

---

## Build commands

```bash
# Backend (TypeScript → dist/)
npm run build

# Frontend (Vite → frontend/dist/)
cd frontend && npm run build
```

## Lint commands

```bash
npm run lint                       # backend ESLint
cd frontend && npm run lint        # frontend ESLint
```

Both build and lint must pass before shipping changes — see [[Contributing]].

---

## Next steps

- Read [[Architecture]] for an overview of how everything fits together.
- Configure your [[Environment Variables]].
- Set up [[AI Features]], [[Stripe Billing]], and [[Email SMTP]] as needed.
- Browse the [[API Reference]] if you intend to integrate.
