import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Client } from '../entities/Client.js';
import { Job } from '../entities/Job.js';
import { LineItem } from '../entities/LineItem.js';
import { Quote } from '../entities/Quote.js';
import { Invoice } from '../entities/Invoice.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { JobStatus, LineItemCategory, QuoteStatus, InvoiceStatus } from '../types/enums.js';
import { addDays } from 'date-fns';
import { nanoid } from 'nanoid';
import { getNextNumber } from '../utils/numberSequence.js';
import { calculateTotals } from '../utils/calculations.js';

const router = Router();

router.use(authenticateToken);

/**
 * POST /api/demo-data
 * Seeds sample data so new users can see the app in action.
 * Idempotent — deletes any existing demo data for this user first.
 */
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const clientRepo = AppDataSource.getRepository(Client);
  const jobRepo = AppDataSource.getRepository(Job);
  const lineItemRepo = AppDataSource.getRepository(LineItem);
  const quoteRepo = AppDataSource.getRepository(Quote);
  const invoiceRepo = AppDataSource.getRepository(Invoice);

  try {
    // ── 1. Remove previous demo data ─────────────────────────────────────────
    const existingDemo = await clientRepo.findOne({
      where: { userId, name: 'Acme Plumbing Co. (Demo)' },
    });

    if (existingDemo) {
      // Cascade deletes line items via DB; quotes/invoices need explicit removal
      const existingJobs = await jobRepo.find({ where: { clientId: existingDemo.id } });
      for (const job of existingJobs) {
        const q = await quoteRepo.findOne({ where: { jobId: job.id } });
        const inv = await invoiceRepo.findOne({ where: { jobId: job.id } });
        if (q) await quoteRepo.remove(q);
        if (inv) await invoiceRepo.remove(inv);
      }
      await jobRepo.delete({ clientId: existingDemo.id });
      await clientRepo.remove(existingDemo);
    }

    // ── 2. Create demo client ─────────────────────────────────────────────────
    const client = clientRepo.create({
      userId,
      name: 'Acme Plumbing Co. (Demo)',
      email: 'demo@acmeplumbing.example',
      phone: '07700 900000',
      address: '42 Demo Street, London, SW1A 1AA',
    });
    await clientRepo.save(client);

    // ── 3. Job 1: Boiler replacement (with quote + draft invoice) ─────────────
    const job1 = jobRepo.create({
      userId,
      clientId: client.id,
      title: 'Boiler Replacement — Combi 30kW',
      description: 'Supply and fit Worcester Bosch Greenstar 30i combi boiler. Remove old unit.',
      status: JobStatus.ACTIVE,
      startDate: new Date(),
      endDate: addDays(new Date(), 2),
    });
    await jobRepo.save(job1);

    const lineItems1 = lineItemRepo.create([
      {
        jobId: job1.id,
        description: 'Worcester Bosch Greenstar 30i Combi',
        category: LineItemCategory.MATERIALS,
        quantity: 1,
        unit: 'unit',
        unitCost: 65000,   // £650
        unitPrice: 85000,  // £850
      },
      {
        jobId: job1.id,
        description: 'Boiler installation labour (8 hours)',
        category: LineItemCategory.LABOUR,
        quantity: 8,
        unit: 'hr',
        unitCost: 3000,    // £30/hr cost
        unitPrice: 5000,   // £50/hr charge
      },
      {
        jobId: job1.id,
        description: 'Flue kit and fittings',
        category: LineItemCategory.MATERIALS,
        quantity: 1,
        unit: 'kit',
        unitCost: 4000,    // £40
        unitPrice: 7500,   // £75
      },
      {
        jobId: job1.id,
        description: 'Gas safety certificate (CP12)',
        category: LineItemCategory.OTHER,
        quantity: 1,
        unit: 'cert',
        unitCost: 0,
        unitPrice: 6000,   // £60
      },
    ]);
    await lineItemRepo.save(lineItems1);

    // Calculate totals from line items
    const totalNet1 = lineItems1.reduce((sum, li) => sum + Number(li.unitPrice) * Number(li.quantity), 0);
    const { vatAmount: vatAmount1, totalGross: totalGross1 } = calculateTotals(totalNet1, 20);

    const quoteNumber1 = await getNextNumber(userId, 'QU-');
    const quote1 = quoteRepo.create({
      jobId: job1.id,
      quoteNumber: quoteNumber1,
      status: QuoteStatus.ACCEPTED,
      validUntil: addDays(new Date(), 30),
      totalNet: totalNet1,
      vatRate: 20,
      vatAmount: vatAmount1,
      totalGross: totalGross1,
      notes: 'All work carried out to Gas Safe standards.',
      terms: 'Payment due within 14 days of invoice.',
      publicToken: nanoid(32),
      acceptedAt: new Date(),
    });
    await quoteRepo.save(quote1);

    const invoiceNumber1 = await getNextNumber(userId, 'INV-');
    const invoice1 = invoiceRepo.create({
      jobId: job1.id,
      invoiceNumber: invoiceNumber1,
      status: InvoiceStatus.SENT,
      dueDate: addDays(new Date(), 14),
      totalNet: totalNet1,
      vatRate: 20,
      vatAmount: vatAmount1,
      totalGross: totalGross1,
      notes: 'All work carried out to Gas Safe standards.',
      terms: 'Payment due within 14 days of invoice.',
      publicToken: nanoid(32),
      sentAt: new Date(),
    });
    await invoiceRepo.save(invoice1);

    // ── 4. Job 2: Drain clearance (draft quote) ───────────────────────────────
    const job2 = jobRepo.create({
      userId,
      clientId: client.id,
      title: 'Emergency Drain Clearance',
      description: 'Blocked main drain — rod and clear.',
      status: JobStatus.DRAFT,
    });
    await jobRepo.save(job2);

    const lineItems2 = lineItemRepo.create([
      {
        jobId: job2.id,
        description: 'Drain rodding (up to 2 hours)',
        category: LineItemCategory.LABOUR,
        quantity: 2,
        unit: 'hr',
        unitCost: 3000,
        unitPrice: 7500,
      },
      {
        jobId: job2.id,
        description: 'CCTV drain survey',
        category: LineItemCategory.OTHER,
        quantity: 1,
        unit: 'job',
        unitCost: 4000,
        unitPrice: 12000,
      },
    ]);
    await lineItemRepo.save(lineItems2);

    const totalNet2 = lineItems2.reduce((sum, li) => sum + Number(li.unitPrice) * Number(li.quantity), 0);
    const { vatAmount: vatAmount2, totalGross: totalGross2 } = calculateTotals(totalNet2, 20);

    const quoteNumber2 = await getNextNumber(userId, 'QU-');
    const quote2 = quoteRepo.create({
      jobId: job2.id,
      quoteNumber: quoteNumber2,
      status: QuoteStatus.DRAFT,
      validUntil: addDays(new Date(), 14),
      totalNet: totalNet2,
      vatRate: 20,
      vatAmount: vatAmount2,
      totalGross: totalGross2,
      publicToken: nanoid(32),
    });
    await quoteRepo.save(quote2);

    res.status(201).json({
      message: 'Demo data loaded successfully',
      client: { id: client.id, name: client.name },
      jobs: [
        { id: job1.id, title: job1.title },
        { id: job2.id, title: job2.title },
      ],
    });
  } catch (error) {
    console.error('Demo data error:', error);
    res.status(500).json({ error: 'Failed to load demo data' });
  }
});

export default router;
