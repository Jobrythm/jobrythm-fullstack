# AGENTS

## Purpose

This document helps future coding agents work quickly and safely in the Jobrythm frontend workspace.

## Project Overview

Jobrythm is a React + TypeScript SaaS dashboard for trade businesses to manage:

- Jobs and line items
- Clients
- Quotes
- Invoices
- Settings and auth flow

Server requests go to a real Jobrythm API base URL (see `src/api/hosts.ts`); there is no mock API.

## Tech and Conventions

- React 18 + strict TypeScript
- Vite build tool
- React Router v6 routing in `src/router/index.tsx`
- TanStack Query for all server data
- Zustand auth state in `src/store/authStore.ts`
- Axios API client in `src/api/client.ts`
- React Hook Form + Zod for forms
- Tabler classes/components for UI consistency
- Currency persisted in cents

## Key Paths

- `src/types/index.ts` -> canonical domain and payload types
- `src/api/*` -> typed API resource modules
- `src/features/*` -> feature hooks/pages/components
- `src/layouts/AppLayout.tsx` -> sidebar + topbar shell
- `src/layouts/AuthLayout.tsx` -> auth page wrapper
- `src/api/hosts.ts` -> which real API base URL to use
- `src/main.tsx` -> providers

## Runtime Notes

- Vite can proxy relative `/api` to `http://localhost:8080` (see `vite.config.ts`). The app uses an absolute base URL from `resolveApiBaseUrl()` by default.
- Auth token is stored with Zustand persist key `jobrythm-auth`.
- Axios 401 handler clears auth and redirects to `/login`.

## Implementation Rules for Future Changes

1. Keep new API responses strongly typed.
2. Keep money values as integer cents in state/server payloads.
3. Use form schemas with Zod and `zodResolver`.
4. Use Tabler badge/button/table/card styles instead of custom component libraries.
5. Use query keys per feature hooks and invalidate related keys in mutations.
6. For destructive actions, use `ConfirmModal`.
7. For empty list/table experiences, use `EmptyState`.
8. For list loading states, use `TableSkeleton` or `LoadingSpinner`.

## Validation Workflow

Use these commands after changes:

```bash
npm run build
npm run lint
```

If API behavior is modified, verify matching updates in:

- relevant `src/api/*.ts` file
- relevant feature hooks query invalidation

## Useful Extension Tasks

- Replace stub actions for PDF preview/send with real API endpoints.
- Add automated tests for:
  - route protection
  - line-item cents conversion
  - quote/invoice status transitions
- Add optimistic UI updates for inline edits on job detail page.
- Add pagination and server-side filtering if list sizes grow.

