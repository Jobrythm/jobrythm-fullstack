# Frontend Development

The frontend is a React 18 + TypeScript SPA built with Vite. It lives under `frontend/`.

---

## Conventions

### Stack
- React 18, TypeScript strict.
- **Vite** for dev/build.
- **React Router v6** (config in `frontend/src/router/index.tsx`).
- **TanStack Query** (React Query) for all server data.
- **Zustand** for client state — particularly `frontend/src/store/authStore.ts` (token + user).
- **Axios** API client in `frontend/src/api/client.ts`.
- **React Hook Form + Zod** (`zodResolver`) for every form.
- **Tabler CSS** + `@tabler/icons-react` for UI consistency.

### Folder layout

```
frontend/src/
├── api/             # One module per resource, typed Axios calls
├── components/      # Reusable UI (ConfirmModal, EmptyState, TableSkeleton, …)
├── features/        # Feature-scoped: pages, hooks, sub-components
├── layouts/         # AppLayout (sidebar + topbar), AuthLayout
├── router/          # React Router v6 configuration
├── store/           # Zustand stores
└── types/           # Shared TypeScript types (canonical domain types)
```

### API base URL
`frontend/src/api/hosts.ts` resolves the API base URL:
- Honours `VITE_API_URL` if set (Docker uses `/api`).
- Otherwise routes by hostname: localhost → `http://localhost:8080/api`, etc.

### Auth & token refresh
The Axios client:
- Attaches `Authorization: Bearer <token>` on every request.
- Watches token expiry and performs **single-flight refresh** against `POST /api/auth/refresh` on near-expiry or `401` replay.
- Normalises every Axios error into `ApiError` (`frontend/src/api/errors.ts`).

### Forms
Always use React Hook Form with a Zod schema:

```tsx
const schema = z.object({ name: z.string().min(1), email: z.string().email() });
type Values = z.infer<typeof schema>;

const { register, handleSubmit, formState } = useForm<Values>({
  resolver: zodResolver(schema),
});
```

### Server state
- Each feature has its own hooks file with query keys per resource (e.g. `['clients']`, `['clients', id]`).
- Mutations invalidate related keys via `queryClient.invalidateQueries`.

### Money in the UI
- Server payloads and form state hold integer cents/pence.
- Format to display with a single shared helper (e.g. divide by 100 and format with `Intl.NumberFormat`).
- Convert user-typed currency strings to integer cents at form-submit time, never earlier.

### UI patterns
- Confirm destructive actions with `ConfirmModal`.
- Use `EmptyState` for empty list/table screens.
- Use `TableSkeleton` or `LoadingSpinner` for loading states.
- Prefer Tabler badge / button / table / card classes — avoid bespoke CSS.

---

## Adding a feature module

1. Create `frontend/src/features/<feature>/` with subfolders `pages/`, `hooks/`, `components/`.
2. Add a typed API module in `frontend/src/api/<feature>.ts`.
3. Add canonical domain types to `frontend/src/types/index.ts`.
4. Register routes in `frontend/src/router/index.tsx`.
5. Wire navigation links into `frontend/src/layouts/AppLayout.tsx`.

---

## Build, lint, run

```bash
cd frontend
npm install
npm run dev          # Vite dev server on :5173, proxies /api → :8080
npm run build        # → frontend/dist/
npm run lint         # ESLint
```

The Vite dev server is configured to proxy `/api` to the backend, so you can run the frontend on port 5173 against a backend on port 8080 with no extra setup.
