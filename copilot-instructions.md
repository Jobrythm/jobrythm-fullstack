# Copilot Instructions for Jobrythm Fullstack

## Project Overview

Jobrythm is a full-stack job management system with quoting, invoicing, and client management. It combines a TypeScript Express backend with a React frontend in a monorepo structure.

## Architecture

### Backend (src/)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with refresh tokens
- **Module Resolution**: ES Modules (Node16)
- **Port**: 8080

### Frontend (frontend/)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: 
  - React Query (TanStack Query) for server state
  - Zustand for client state
- **Routing**: React Router v6
- **Styling**: Tabler CSS framework

## Directory Structure

```
/
├── src/                    # Backend source
│   ├── entities/          # TypeORM entities
│   ├── routes/            # Express route handlers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   └── server.ts          # Express app entry point
├── frontend/              # Frontend React app
│   ├── src/
│   │   ├── api/          # API client and endpoints
│   │   ├── components/   # Reusable components
│   │   ├── features/     # Feature-based modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Layout components
│   │   ├── pages/        # Page components
│   │   ├── router/       # Router configuration
│   │   ├── store/        # Zustand stores
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── dist/                 # Backend build output
└── docker-compose.yml    # Docker configuration
```

## Coding Conventions

### TypeScript
- **Strict mode enabled**: All TypeScript strict checks are on
- **Use explicit types**: Avoid `any`, prefer interfaces/types
- **ES Modules**: Always use `.js` extensions in imports from TypeScript files
- **No unused variables**: Remove or prefix with `_` if intentionally unused

### Backend Conventions

#### Entity Definitions
```typescript
// Always extend BaseEntity for automatic timestamps
@Entity('table_name')
export class EntityName extends BaseEntity {
  @Column()
  propertyName!: string;
  
  @ManyToOne(() => RelatedEntity)
  @JoinColumn({ name: 'relatedId' })
  related!: RelatedEntity;
}
```

#### Route Handlers
```typescript
// Always use async/await with try-catch
// Always return typed responses
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Cast req.params.id to string for TypeORM
    const entity = await repository.findOne({
      where: { id: String(req.params.id), userId: req.user!.userId }
    });
    
    if (!entity) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    
    res.json(entity);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### Authentication Middleware
- Always use `authenticateToken` middleware for protected routes
- Access user via `req.user!.userId` after authentication
- User isolation: Always filter queries by `userId`

#### Currency Handling
- Store currency values as **bigint** (pence/cents)
- Frontend displays as formatted currency (£1.00)
- Calculations are done in pence to avoid floating-point errors

### Frontend Conventions

#### Component Structure
```typescript
// Use functional components with TypeScript
interface ComponentProps {
  propName: string;
}

export function ComponentName({ propName }: ComponentProps) {
  // Hooks at the top
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(...);
  
  // Event handlers
  const handleAction = () => {
    // ...
  };
  
  // Render logic
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### API Client Pattern
```typescript
// All API calls go through src/api/client.ts
// Automatic token management and refresh
export async function getEntity(id: string) {
  const response = await apiClient.get(`/endpoint/${id}`);
  return response.data;
}
```

#### React Query Usage
```typescript
// Use custom hooks for API operations
export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: () => getEntities(),
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
}
```

## Database Schema

### Key Entities
- **User**: Authentication, company settings, subscription plan
- **Client**: Client contact information
- **Job**: Main work unit with status (Draft → Quoted → Active → Completed → Invoiced)
- **LineItem**: Individual cost items (Labour, Materials, Equipment, Subcontractor, Other)
- **Quote**: Generated quote linked to Job
- **Invoice**: Generated invoice linked to Job
- **RefreshToken**: JWT refresh token storage
- **NumberSequence**: Auto-incrementing sequences (QT0001, INV0001)

### Schema Management

**TypeORM Synchronize**: Currently enabled (`synchronize: true`) for Docker deployments. This automatically creates/updates database tables on application startup.

**⚠️ Important**: 
- Auto-synchronize is suitable for development and single-instance self-hosted deployments
- For production systems with multiple instances or sensitive data, use proper database migrations
- TypeORM will automatically create tables based on entity definitions on first run

### Relationships
- User → many Clients, Jobs, RefreshTokens
- Client → many Jobs
- Job → many LineItems, one Quote (optional), one Invoice (optional)

### Computed Properties
Jobs and LineItems have computed getters:
```typescript
get totalCost(): number { /* sum of unitCost * quantity */ }
get totalRevenue(): number { /* sum of unitPrice * quantity */ }
get marginPercent(): number { /* profit margin % */ }
```

## API Conventions

### Endpoints Pattern
- `GET /api/resource` - List with pagination
- `GET /api/resource/:id` - Get by ID
- `POST /api/resource` - Create (returns 201)
- `PUT /api/resource/:id` - Full update
- `PATCH /api/resource/:id/action` - Partial update or action
- `DELETE /api/resource/:id` - Delete (returns 204)

### Pagination
```typescript
// Query params: ?page=1&pageSize=30&search=term
// Response format:
{
  items: [...],
  page: 1,
  pageSize: 30,
  total: 100
}
```

### Authentication
- All protected routes use `authenticateToken` middleware
- Token in header: `Authorization: Bearer <token>`
- 401 responses trigger frontend token refresh

### Error Handling
```typescript
// Always return consistent error format
res.status(400).json({ error: 'Error message' });
```

## Common Patterns

### Creating Related Entities
When creating quotes/invoices from a job:
1. Load job with line items
2. Calculate totals from line items
3. Generate sequence number (getNextNumber)
4. Apply user's default settings (VAT rate, terms)
5. Create and save entity

### Status Workflows
- **Job**: Draft → Quoted → Active → Completed → Invoiced
- **Quote**: Draft → Sent → Accepted/Rejected/Expired
- **Invoice**: Draft → Sent → Paid/Overdue/Cancelled

### Number Generation
```typescript
// Auto-incrementing with prefix
const number = await getNextNumber(userId, 'QT'); // QT0001
const number = await getNextNumber(userId, 'INV'); // INV0001
```

## Testing Approach

### Backend
- Use tsx for running TypeScript directly in development
- Test with actual database (Docker PostgreSQL)
- Manual testing via API clients (Postman, curl)

### Frontend  
- React Query manages server state and caching
- Form validation with React Hook Form + Zod
- Error boundaries for graceful error handling

## Environment Variables

### Required
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `PORT` (default: 8080)

### Optional
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` (for payments)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (for emails)
- `CORS_ORIGINS` (comma-separated URLs)

## Docker

### Development
```bash
docker-compose up postgres  # Just database
npm run dev                # Backend with hot reload
cd frontend && npm run dev # Frontend with HMR
```

### Production
```bash
docker-compose up --build  # Full stack
```

## Common Tasks

### Adding a New Entity
1. Create entity in `src/entities/`
2. Add to `AppDataSource` entities array in `src/config/database.ts`
3. Create routes in `src/routes/`
4. Add routes to `src/server.ts`
5. Create API client in `frontend/src/api/`
6. Create React Query hooks in feature directory
7. Create UI pages in `frontend/src/features/`

### Adding a New API Endpoint
1. Add route handler in appropriate `src/routes/*.ts` file
2. Use `authenticateToken` middleware if protected
3. Cast `req.params` values to string for TypeORM
4. Add corresponding function in `frontend/src/api/`
5. Create React Query hook if needed
6. Update UI to use new endpoint

### Modifying Database Schema
1. Update entity definition
2. TypeORM will auto-sync in development (synchronize: true)
3. In production, create and run migrations

## Best Practices

✅ **DO**:
- Use TypeScript strict mode
- Validate user input with Zod on backend
- Filter all queries by `userId` for data isolation
- Use React Query for all server state
- Handle loading and error states in UI
- Use semantic HTTP status codes
- Log errors with context

❌ **DON'T**:
- Don't use `any` type
- Don't expose sensitive data in API responses
- Don't store plaintext passwords
- Don't use floating-point for currency
- Don't bypass authentication checks
- Don't hardcode configuration values
- Don't commit `.env` files

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiry (1 hour default)
- Refresh tokens stored hashed in database
- CORS configured for specific origins
- Rate limiting on auth endpoints (10 req/min)
- All user data scoped by userId
- Input validation on all endpoints

## Performance Tips

- Use database indexes on frequently queried columns
- Paginate all list endpoints
- Use React Query caching (5 minutes default)
- Lazy load components and routes
- Optimize images and assets
- Use database relations efficiently (avoid N+1)

## File Naming

- **Backend**: camelCase for files, PascalCase for classes/entities
- **Frontend**: PascalCase for components, camelCase for utilities
- **Routes**: Plural names (clients.ts, jobs.ts)
- **Components**: Component per file, named exports preferred
