# Jobrythm Fullstack

A comprehensive job management system with quoting, invoicing, and client management built with TypeScript, Express, React, and PostgreSQL.

## Features

- 🔐 **Authentication** - JWT-based authentication with refresh tokens
- 👥 **Client Management** - Track clients with contact information
- 💼 **Job Management** - Create and track jobs through their lifecycle
- 📋 **Line Items** - Detailed costing with categories (labour, materials, equipment, etc.)
- 📄 **Quotes** - Generate quotes from jobs
- 💵 **Invoices** - Create and track invoices with payment status
- 📊 **Dashboard** - Overview of active jobs, revenue, and outstanding invoices
- 🔢 **Automatic Numbering** - Sequential quote and invoice numbers
- 💱 **Currency Handling** - Precise currency calculations (stored as pence/cents)
- 🧮 **Margin Tracking** - Automatic profit margin calculations

## Tech Stack

### Backend
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **TypeORM** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Zod** - Schema validation

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **React Query** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client
- **Tabler** - UI components
- **Vite** - Build tool

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Running with Docker Compose

1. Clone the repository:
\`\`\`bash
git clone https://github.com/Jobrythm/jobrythm-fullstack.git
cd jobrythm-fullstack
\`\`\`

2. Start the application:
\`\`\`bash
docker compose up -d --build
\`\`\`

3. Wait for the database to initialize and tables to be created (first run may take a minute)

4. Access the application at http://localhost:8080

5. Login with default admin credentials:
   - Email: \`admin@example.com\`
   - Password: \`adminpassword\`

**⚠️ IMPORTANT: Change this password immediately in production!**

### Checking Logs

To view application logs:
\`\`\`bash
docker compose logs -f app
\`\`\`

To check if containers are running:
\`\`\`bash
docker compose ps
\`\`\`

### Stopping the Application

\`\`\`bash
docker compose down
\`\`\`

To stop and remove all data (including database):
\`\`\`bash
docker compose down -v
\`\`\`

## Default Admin Account

On first run, the application creates a default admin account:
- Email: \`admin@example.com\`
- Password: \`adminpassword\`

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - Login
- \`POST /api/auth/refresh\` - Refresh access token
- \`POST /api/auth/logout\` - Logout

### Users
- \`GET /api/users/me\` - Get current user profile
- \`PUT /api/users/me\` - Update profile

### Clients
- \`GET /api/clients\` - List clients (paginated, searchable)
- \`GET /api/clients/:id\` - Get client details
- \`POST /api/clients\` - Create client
- \`PUT /api/clients/:id\` - Update client
- \`DELETE /api/clients/:id\` - Delete client

### Jobs
- \`GET /api/jobs\` - List jobs (paginated, filterable)
- \`GET /api/jobs/:id\` - Get job details
- \`POST /api/jobs\` - Create job
- \`PUT /api/jobs/:id\` - Update job
- \`PATCH /api/jobs/:id/status\` - Update job status
- \`DELETE /api/jobs/:id\` - Delete job

### Line Items
- \`POST /api/jobs/:jobId/line-items\` - Create line item
- \`PUT /api/line-items/:id\` - Update line item
- \`DELETE /api/line-items/:id\` - Delete line item

### Quotes
- \`GET /api/quotes\` - List quotes (paginated)
- \`GET /api/quotes/:id\` - Get quote details
- \`POST /api/quotes\` - Create quote
- \`PUT /api/quotes/:id\` - Update quote
- \`POST /api/quotes/:id/send\` - Send quote via email
- \`GET /api/quotes/:id/pdf\` - Download quote PDF

### Invoices
- \`GET /api/invoices\` - List invoices (paginated)
- \`GET /api/invoices/:id\` - Get invoice details
- \`POST /api/invoices\` - Create invoice
- \`PUT /api/invoices/:id\` - Update invoice
- \`PATCH /api/invoices/:id/paid\` - Mark invoice as paid
- \`POST /api/invoices/:id/send\` - Send invoice via email
- \`GET /api/invoices/:id/pdf\` - Download invoice PDF

### Dashboard
- \`GET /api/dashboard\` - Get dashboard statistics

## License

MIT License - see LICENSE file for details
