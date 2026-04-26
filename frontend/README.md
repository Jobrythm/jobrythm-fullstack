# Jobrythm Frontend

Jobrythm is a SaaS job costing and quoting dashboard for tradespeople.

## Stack

- React 18 + TypeScript (strict mode)
- Vite
- React Router v6
- TanStack Query v5
- Zustand
- React Hook Form + Zod
- Axios
- Tabler UI (`@tabler/core` + `@tabler/icons-react`)
- MSW for local API mocking

## Setup

### Local Development

```bash
npm install
npm run dev
```

The app runs with MSW enabled in development and intercepts `/api/*` requests with mock handlers.

### Docker Deployment

The application is containerized using a multi-stage `Dockerfile` and can be easily managed with `docker-compose`.

#### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

#### Running with Docker Compose

By default, the application will be available at `http://localhost:3000`.

1. **Build and start the container:**

   ```bash
   docker-compose up -d --build
   ```

2. **Access the application:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

#### Configuration & Port Forwarding

The application uses the following default port mappings and environment variables, which can be customized in the `docker-compose.yml` or via a `.env` file:

- **Port Forwarding:** `3000:80` (HOST:CONTAINER). The Nginx server inside the container listens on port `80`, and it's mapped to port `3000` on your host machine.
- **API_URL:** The backend API address used by the Nginx proxy (default: `https://api.jobrythm.aricummings.com`).
- **VITE_API_URL:** The base path for API calls from the frontend (default: `/api`).
- **HOST_PORT:** Customize the host port (default: `3000`).

Example using a `.env` file:
```env
HOST_PORT=4000
API_URL=https://your-api-endpoint.com
```

#### Manual Docker Build

If you prefer to build the image manually:

```bash
docker build -t jobrythm-frontend .

# Run with custom API URL
docker run -d -p 3000:80 -e API_URL=https://api.jobrythm.aricummings.com --name jobrythm jobrythm-frontend
```

## Build

```bash
npm run build
npm run preview
```
