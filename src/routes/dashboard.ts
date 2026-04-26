import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Job } from '../entities/Job.js';
import { Quote } from '../entities/Quote.js';
import { Invoice } from '../entities/Invoice.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { JobStatus, QuoteStatus, InvoiceStatus } from '../types/enums.js';
import { startOfMonth, endOfMonth } from 'date-fns';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard statistics
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobRepository = AppDataSource.getRepository(Job);
    const quoteRepository = AppDataSource.getRepository(Quote);
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const userId = req.user!.userId;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Active jobs count
    const activeJobsCount = await jobRepository.count({
      where: {
        userId,
        status: JobStatus.ACTIVE,
      },
    });

    // Quotes this month
    const quotesThisMonth = await quoteRepository
      .createQueryBuilder('quote')
      .leftJoin('quote.job', 'job')
      .where('job.userId = :userId', { userId })
      .andWhere('quote.createdAt >= :monthStart', { monthStart })
      .andWhere('quote.createdAt <= :monthEnd', { monthEnd })
      .getCount();

    // Revenue this month (from invoices)
    const invoicesThisMonth = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.job', 'job')
      .where('job.userId = :userId', { userId })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('invoice.paidAt >= :monthStart', { monthStart })
      .andWhere('invoice.paidAt <= :monthEnd', { monthEnd })
      .getMany();

    const revenueThisMonth = invoicesThisMonth.reduce((sum, inv) => sum + Number(inv.totalGross), 0);

    // Outstanding invoices
    const outstandingInvoices = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.job', 'job')
      .where('job.userId = :userId', { userId })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
      })
      .getMany();

    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0);

    // Recent activity (last 10 jobs)
    const recentJobs = await jobRepository.find({
      where: { userId },
      relations: ['client'],
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    res.json({
      activeJobs: activeJobsCount,
      quotesThisMonth,
      revenueThisMonth,
      outstandingAmount,
      recentActivity: recentJobs,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
