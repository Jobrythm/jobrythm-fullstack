import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import clientsRoutes from './routes/clients.js';
import jobsRoutes from './routes/jobs.js';
import quotesRoutes from './routes/quotes.js';
import invoicesRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import adminSettingsRoutes from './routes/adminSettings.js';
import adminSalesRoutes from './routes/adminSales.js';
import adminAdsRoutes from './routes/adminAds.js';
import billingRoutes, { stripeWebhookHandler } from './routes/billing.js';
import publicRoutes from './routes/public.js';
import demoDataRoutes from './routes/demoData.js';
import appointmentsRoutes from './routes/appointments.js';
import teamRoutes from './routes/team.js';
import timeEntriesRoutes from './routes/timeEntries.js';
import aiRoutes from './routes/ai.js';
import attachmentRoutes from './routes/attachments.js';
import expenseRoutes from './routes/expenses.js';
import checklistRoutes from './routes/checklists.js';
import reportsRoutes from './routes/reports.js';
import companyMembersRoutes from './routes/companyMembers.js';
import messagesRoutes from './routes/messages.js';
import recurringJobsRoutes from './routes/recurringJobs.js';
import { startRecurringJobCron } from './utils/recurringJobs.js';
import { User } from './entities/User.js';
import { hashPassword } from './utils/auth.js';
import { SubscriptionPlan } from './types/enums.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8080'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Stripe webhook — must come BEFORE express.json() so we get the raw body
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later',
});

// Rate limiting for API endpoints (more generous)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/clients', apiLimiter, clientsRoutes);
app.use('/api/jobs', apiLimiter, jobsRoutes);
app.use('/api/quotes', apiLimiter, quotesRoutes);
app.use('/api/invoices', apiLimiter, invoicesRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/admin/settings', apiLimiter, adminSettingsRoutes);
app.use('/api/admin/sales', apiLimiter, adminSalesRoutes);
app.use('/api/admin/ads', apiLimiter, adminAdsRoutes);
app.use('/api/billing', apiLimiter, billingRoutes);
app.use('/api/public', apiLimiter, publicRoutes);
app.use('/api/demo-data', apiLimiter, demoDataRoutes);
app.use('/api/appointments', apiLimiter, appointmentsRoutes);
app.use('/api/team', apiLimiter, teamRoutes);
app.use('/api/time-entries', apiLimiter, timeEntriesRoutes);
app.use('/api/attachments', apiLimiter, attachmentRoutes);
app.use('/api', apiLimiter, aiRoutes);
app.use('/api/expenses', apiLimiter, expenseRoutes);
app.use('/api/checklists', apiLimiter, checklistRoutes);
app.use('/api/reports', apiLimiter, reportsRoutes);
app.use('/api/company', apiLimiter, companyMembersRoutes);
app.use('/api/jobs', apiLimiter, messagesRoutes);
app.use('/api/recurring-jobs', apiLimiter, recurringJobsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).json({ error: 'Not found' });
      }
    });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Database initialization and server start
async function bootstrap() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    // Seed default admin user
    await seedAdminUser();

    // Start recurring job scheduler
    startRecurringJobCron();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Seed default admin user
async function seedAdminUser() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const adminEmail = 'admin@example.com';

    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      console.log('Creating default admin user...');
      const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
      const passwordHash = await hashPassword(adminPassword);

      const admin = userRepository.create({
        email: adminEmail,
        passwordHash,
        fullName: 'Admin',
        plan: SubscriptionPlan.ADMIN,
      });

      await userRepository.save(admin);
      if (process.env.ADMIN_PASSWORD) {
        console.log(`Admin user created: ${adminEmail}`);
      } else {
        console.log(`Admin user created: ${adminEmail} / adminpassword (set ADMIN_PASSWORD env var to override)`);
      }
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

bootstrap();
