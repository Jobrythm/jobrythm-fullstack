import { Router, Response } from 'express';
import { Between } from 'typeorm';
import { AppDataSource } from '../config/database.js';
import { Job } from '../entities/Job.js';
import { Invoice } from '../entities/Invoice.js';
import { Expense } from '../entities/Expense.js';
import { TimeEntry } from '../entities/TimeEntry.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { InvoiceStatus } from '../types/enums.js';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

const router = Router();
router.use(authenticateToken);

// GET /api/reports/overview
// Revenue, jobs completed, expenses and hours worked for the last N months.
router.get('/overview', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.companyId ?? req.user!.userId;
    const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);

    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const jobRepo = AppDataSource.getRepository(Job);
    const expenseRepo = AppDataSource.getRepository(Expense);
    const timeRepo = AppDataSource.getRepository(TimeEntry);

    // Build monthly buckets
    const now = new Date();
    const buckets: { label: string; start: Date; end: Date }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      buckets.push({
        label: format(d, 'MMM yyyy'),
        start: startOfMonth(d),
        end: endOfMonth(d),
      });
    }

    // Revenue per month (paid invoices)
    const revenueByMonth = await Promise.all(
      buckets.map(async ({ start, end }) => {
        const invoices = await invoiceRepo
          .createQueryBuilder('inv')
          .leftJoin('inv.job', 'job')
          .where('job.userId = :userId', { userId })
          .andWhere('inv.status = :status', { status: InvoiceStatus.PAID })
          .andWhere('inv.paidAt BETWEEN :start AND :end', { start, end })
          .getMany();
        return invoices.reduce((s, i) => s + Number(i.totalGross), 0);
      }),
    );

    // Jobs completed per month
    const jobsByMonth = await Promise.all(
      buckets.map(async ({ start, end }) => {
        return jobRepo
          .createQueryBuilder('job')
          .where('job.userId = :userId', { userId })
          .andWhere("job.status = 'completed'")
          .andWhere('job.updatedAt BETWEEN :start AND :end', { start, end })
          .getCount();
      }),
    );

    // Expenses per month
    const expensesByMonth = await Promise.all(
      buckets.map(async ({ start, end }) => {
        const rows = await expenseRepo.find({
          where: { companyId: userId, date: Between(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)) },
        });
        return rows.reduce((s, e) => s + Number(e.amountCents), 0);
      }),
    );

    // Hours worked per month
    const hoursByMonth = await Promise.all(
      buckets.map(async ({ start, end }) => {
        const entries = await timeRepo
          .createQueryBuilder('te')
          .leftJoin('te.job', 'job')
          .where('job.userId = :userId', { userId })
          .andWhere('te.startTime BETWEEN :start AND :end', { start, end })
          .getMany();
        return entries.reduce((s, e) => s + (Number(e.durationMinutes) || 0), 0) / 60;
      }),
    );

    res.json({
      labels: buckets.map((b) => b.label),
      revenue: revenueByMonth,
      jobsCompleted: jobsByMonth,
      expenses: expensesByMonth,
      hoursWorked: hoursByMonth.map((h) => Math.round(h * 10) / 10),
    });
  } catch (err) {
    console.error('Report overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/jobs-by-status
// Count of jobs by status.
router.get('/jobs-by-status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.companyId ?? req.user!.userId;
    const rows = await AppDataSource.getRepository(Job)
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('job.userId = :userId', { userId })
      .groupBy('job.status')
      .getRawMany<{ status: string; count: string }>();
    res.json(rows.map((r) => ({ status: r.status, count: Number(r.count) })));
  } catch (err) {
    console.error('Report jobs-by-status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/top-clients
// Top clients by total invoiced revenue.
router.get('/top-clients', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.companyId ?? req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const rows = await AppDataSource.getRepository(Invoice)
      .createQueryBuilder('inv')
      .leftJoin('inv.job', 'job')
      .leftJoin('job.client', 'client')
      .select('client.id', 'clientId')
      .addSelect('client.name', 'clientName')
      .addSelect('SUM(inv.totalGross)', 'totalRevenue')
      .addSelect('COUNT(DISTINCT inv.id)', 'invoiceCount')
      .where('job.userId = :userId', { userId })
      .andWhere('inv.status = :status', { status: InvoiceStatus.PAID })
      .groupBy('client.id')
      .addGroupBy('client.name')
      .orderBy('SUM(inv.totalGross)', 'DESC')
      .limit(limit)
      .getRawMany<{ clientId: string; clientName: string; totalRevenue: string; invoiceCount: string }>();
    res.json(rows.map((r) => ({
      clientId: r.clientId,
      clientName: r.clientName,
      totalRevenue: Number(r.totalRevenue),
      invoiceCount: Number(r.invoiceCount),
    })));
  } catch (err) {
    console.error('Report top-clients error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/expenses-by-category
// Total expenses grouped by category.
router.get('/expenses-by-category', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.companyId ?? req.user!.userId;
    const rows = await AppDataSource.getRepository(Expense)
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('SUM(e.amountCents)', 'total')
      .where('e.companyId = :userId', { userId })
      .groupBy('e.category')
      .orderBy('SUM(e.amountCents)', 'DESC')
      .getRawMany<{ category: string; total: string }>();
    res.json(rows.map((r) => ({ category: r.category, total: Number(r.total) })));
  } catch (err) {
    console.error('Report expenses-by-category error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
