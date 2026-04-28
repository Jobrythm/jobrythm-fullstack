# Backend Development

The backend is a TypeScript Express API using ES Modules and TypeORM. It lives under `src/`.

---

## Conventions

### Language & module system
- **TypeScript strict mode**, no `any` in public APIs.
- **ES Modules** throughout. Always use `.js` extensions in import paths even when importing `.ts` source — the compiler emits ESM and Node resolves `.js`:
  ```ts
  import { AppDataSource } from './config/database.js';
  ```
- Decorator metadata is enabled (TypeORM requires `reflect-metadata`, imported once at the top of `src/server.ts`).

### Route handlers
- Always declared as `async` functions returning `Promise<void>`.
- Always wrapped in `try / catch`, with errors forwarded to the central error middleware via `next(err)`.
- Validate input with **Zod** schemas at the top of the handler.
- Always filter queries by `req.user.userId` (see [[Security]]).

```ts
router.get('/', authMiddleware, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const items = await Client.find({ where: { userId } });
    res.json(items);
  } catch (err) {
    next(err);
  }
});
```

### TypeORM
- Connection is configured in `src/config/database.ts`.
- `synchronize: true` is enabled — tables are auto-created/altered on startup. This is intentional for the Docker-first deployment story; do not switch it off without adding a migration strategy.
- The DataSource references entities via the **glob `dist/entities/**/*.js`** rather than importing entity classes directly. This avoids module-level circular-dependency errors.
- All entity-to-entity relationships use the **`Relation<T>` wrapper** from `typeorm` to prevent ESM circular import issues:
  ```ts
  @ManyToOne(() => Client)
  client!: Relation<Client>;
  ```
- Every domain entity extends `BaseEntity` (see `src/entities/BaseEntity.ts`) and includes a `userId` column scoped to the authenticated user.

### Enums
All status enums live in `src/types/enums.ts` and use **lowercase** string values to align with the frontend TypeScript union types. Examples: `JobStatus.Draft = 'draft'`, `InvoiceStatus.Paid = 'paid'`. See [[Status Workflows]].

### Money
Monetary values are stored as **integer pence/cents** (`number`, never `decimal`/`float`). Helpers in `src/utils/calculations.ts` compute line-item totals and margins in cents.

### Settings
Runtime settings (Stripe, SMTP, Gemini, integrations) live in the `app_settings` DB table. Read with typed getters in `src/utils/appSettings.ts`:

```ts
const { apiKey, model } = await getGeminiConfig();
const { host, port, secure, user, password, fromEmail, fromName } = await getEmailConfig();
const stripeConfig = await getStripeConfig();
```

DB values take precedence over env vars.

### Logging & errors
- Request logging via `morgan`.
- All errors funnel into `src/middleware/errorHandler.ts`, which returns a JSON body and an appropriate HTTP status.
- Don't `console.log` in route handlers — throw a typed error instead.

### Rate limiting
`express-rate-limit` is applied to auth endpoints (10 req/min) — see `src/server.ts`.

---

## Adding a new entity

1. Create `src/entities/MyThing.ts` extending `BaseEntity`. Use `Relation<T>` for any relationships.
2. Add a `userId` column and any indexes you need.
3. Restart — TypeORM will create the table.
4. Add a route file `src/routes/myThings.ts` with the standard CRUD pattern.
5. Mount the router in `src/server.ts`.
6. Add a typed API module in `frontend/src/api/myThings.ts` and a feature folder under `frontend/src/features/myThings/`.
7. Add types to `frontend/src/types/index.ts`.

---

## Adding a new admin setting

When adding a new credential (API key, password, etc.):

1. Choose a snake_case key (e.g. `myservice_api_key`) and add a typed getter in `src/utils/appSettings.ts` that:
   - Reads from `app_settings` first.
   - Falls back to `process.env.MYSERVICE_API_KEY`.
2. Extend the GET handler in `src/routes/adminSettings.ts` to expose the value via `maskKey()` and a `myserviceApiKeySet: boolean` flag.
3. Extend the PUT handler to persist via `setSetting(key, value)`. **Only update if the submitted value is non-empty** so admins can leave the field blank to keep the existing secret.
4. Update `frontend/src/types/index.ts` (`AppSettings`) and `frontend/src/api/admin.ts` (`UpdateSettingsPayload`).
5. Add the form fields to `frontend/src/features/admin/pages/AdminPage.tsx`.

See [[Admin Panel]] for the conventions around the panel itself.

---

## Build, lint, run

```bash
npm install
npm run dev          # tsx watch mode on :8080
npm run build        # tsc → dist/
npm run lint         # ESLint
npm start            # node dist/server.js (production)
```

Both `npm run build` and `npm run lint` must pass before shipping.
