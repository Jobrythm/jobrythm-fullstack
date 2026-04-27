import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Job } from '../entities/Job.js';
import { Invoice } from '../entities/Invoice.js';
import { Quote } from '../entities/Quote.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { hashPassword } from '../utils/auth.js';
import { SubscriptionPlan, InvoiceStatus, JobStatus } from '../types/enums.js';
import { MoreThanOrEqual } from 'typeorm';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

const VALID_PLANS = Object.values(SubscriptionPlan) as string[];

function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    companyName: user.companyName ?? null,
    plan: user.plan,
    createdAt: user.createdAt,
  };
}

// List all users
router.get('/users', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({ order: { createdAt: 'DESC' } });
    res.json(users.map(serializeUser));
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new user (any plan, including admin)
router.post('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, companyName, plan } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'email, password, and fullName are required' });
      return;
    }

    const resolvedPlan: SubscriptionPlan = VALID_PLANS.includes(plan)
      ? (plan as SubscriptionPlan)
      : SubscriptionPlan.STARTER;

    const userRepository = AppDataSource.getRepository(User);

    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'A user with that email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = userRepository.create({
      email,
      passwordHash,
      fullName,
      companyName: companyName ?? undefined,
      plan: resolvedPlan,
    });

    await userRepository.save(user);
    res.status(201).json(serializeUser(user));
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a user's plan or details
router.put('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: String(req.params.id) } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { fullName, companyName, plan } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (companyName !== undefined) user.companyName = companyName;
    if (plan !== undefined) {
      if (!VALID_PLANS.includes(plan)) {
        res.status(400).json({ error: `Invalid plan. Valid values: ${VALID_PLANS.join(', ')}` });
        return;
      }
      user.plan = plan as SubscriptionPlan;
    }

    await userRepository.save(user);
    res.json(serializeUser(user));
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a user
router.delete('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Prevent self-deletion
    if (String(req.params.id) === req.user!.userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: String(req.params.id) } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await userRepository.remove(user);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const since30d = new Date();
    since30d.setDate(since30d.getDate() - 30);

    const userRepo    = AppDataSource.getRepository(User);
    const jobRepo     = AppDataSource.getRepository(Job);
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const quoteRepo   = AppDataSource.getRepository(Quote);

    // Run all queries in parallel
    const [
      allUsers,
      newUsersLast30d,
      allJobs,
      activeJobs,
      paidInvoices,
      paidInvoicesLast30d,
      quotesLast30d,
    ] = await Promise.all([
      userRepo.find(),
      userRepo.count({ where: { createdAt: MoreThanOrEqual(since30d) } }),
      jobRepo.count(),
      jobRepo.count({ where: { status: JobStatus.ACTIVE } }),
      invoiceRepo.find({ where: { status: InvoiceStatus.PAID } }),
      invoiceRepo.find({ where: { status: InvoiceStatus.PAID, paidAt: MoreThanOrEqual(since30d) } }),
      quoteRepo.count({ where: { createdAt: MoreThanOrEqual(since30d) } }),
    ]);

    // Separate customers from admins
    const customers = allUsers.filter((u) => u.plan !== SubscriptionPlan.ADMIN);

    // Plan breakdown (customers only)
    const planCounts: Record<string, number> = {};
    for (const plan of [SubscriptionPlan.STARTER, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.BUSINESS]) {
      planCounts[plan] = customers.filter((u) => u.plan === plan).length;
    }

    // Revenue — invoices store amounts as integer cents
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0);
    const revenueLaste30d = paidInvoicesLast30d.reduce((sum, inv) => sum + Number(inv.totalGross), 0);

    res.json({
      totalCustomers: customers.length,
      newCustomersLast30d: newUsersLast30d,
      planBreakdown: planCounts,
      totalJobs: allJobs,
      activeJobs,
      quotesLast30d,
      totalPaidInvoices: paidInvoices.length,
      totalRevenueCents: totalRevenue,
      revenueLast30dCents: revenueLaste30d,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
