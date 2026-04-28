# Contributing

Thanks for considering a contribution to Jobrythm!

---

## Getting set up

Follow [[Getting Started]] to run the app locally. The fastest loop is:

- Backend: `npm run dev` (tsx watch mode, port 8080)
- Frontend: `cd frontend && npm run dev` (Vite, port 5173, proxies `/api` to the backend)

---

## Required checks

Before opening a PR, all of the following must pass:

```bash
# Backend
npm run build
npm run lint

# Frontend
cd frontend
npm run build
npm run lint
```

If your change touches admin settings, also verify the matching updates in:

- `src/utils/appSettings.ts` (typed config getter)
- `src/routes/adminSettings.ts` (GET + PUT handlers)
- `frontend/src/types/index.ts` (`AppSettings`)
- `frontend/src/api/admin.ts` (`UpdateSettingsPayload`)
- `frontend/src/features/admin/pages/AdminPage.tsx` (UI)

See [[Admin Panel]] and [[Backend Development]].

---

## Coding conventions

Read these before submitting:

- [[Backend Development]] — TypeScript / Express / TypeORM rules (especially: `Relation<T>` wrappers, `userId` scoping, `.js` import extensions, lowercase enum values).
- [[Frontend Development]] — React / TanStack Query / React Hook Form patterns, money in cents, Tabler UI.
- [[Security]] — non-negotiable rules around tenant isolation and secret handling.

The repo also includes an [`AGENTS.MD`](https://github.com/Jobrythm/jobrythm-fullstack/blob/main/AGENTS.MD) file that summarises these conventions for AI coding agents — it's a useful cheat-sheet for humans too.

---

## PR checklist

- [ ] Code builds (`npm run build` in repo root **and** in `frontend/`).
- [ ] Lint passes (`npm run lint` in both).
- [ ] No new TypeScript `any` in public APIs.
- [ ] All new queries scoped by `userId`.
- [ ] All new monetary values stored as integer cents.
- [ ] Forms use React Hook Form + Zod (`zodResolver`).
- [ ] If you added an admin setting, all 5 surface areas updated (see above).
- [ ] If you added an entity, route, and frontend feature, types in `frontend/src/types/index.ts` updated.
- [ ] Updated docs / wiki where the change is user-visible.
- [ ] No secrets committed.

---

## Reporting issues

Open an issue with:

- A clear title.
- Steps to reproduce.
- Expected vs actual behaviour.
- Environment: Docker / bare metal, Node version, Postgres version, browser.

For security-sensitive issues, please email the maintainer privately rather than filing a public issue.
