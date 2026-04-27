import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Job } from '../entities/Job.js';
import { Invoice } from '../entities/Invoice.js';
import { User } from '../entities/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { InvoiceStatus } from '../types/enums.js';
import { addDays } from 'date-fns';
import { nanoid } from 'nanoid';
import { getNextNumber } from '../utils/numberSequence.js';
import { getAppUrl } from '../utils/appSettings.js';
import { calculateTotals } from '../utils/calculations.js';
import { sendInvoiceEmail } from '../utils/email.js';
import { generateInvoicePdf } from '../utils/pdf.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all invoices with pagination
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const pageSize = parseInt((req.query.pageSize as string) || '30');

    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const skip = (page - 1) * pageSize;

    const [invoices, total] = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.userId = :userId', { userId: req.user!.userId })
      .skip(skip)
      .take(pageSize)
      .orderBy('invoice.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      items: invoices,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoice by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .where('invoice.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create invoice for a job
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: req.body.jobId, userId: req.user!.userId },
      relations: ['lineItems'],
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Get user settings
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const invoiceRepository = AppDataSource.getRepository(Invoice);

    // Prevent duplicate invoices per job
    const existingInvoice = await invoiceRepository.findOne({ where: { jobId: job.id } });
    if (existingInvoice) {
      res.status(409).json({ error: 'An invoice already exists for this job' });
      return;
    }

    const { notes, terms, dueDate } = req.body;

    // Calculate totals from line items
    const totalNet = job.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatRate = Number(user.defaultVatRate) || 20;
    const totals = calculateTotals(totalNet, vatRate);

    // Generate invoice number
    const invoiceNumber = await getNextNumber(req.user!.userId, 'INV');

    const invoice = invoiceRepository.create({
      jobId: job.id,
      invoiceNumber,
      status: InvoiceStatus.DRAFT,
      dueDate: dueDate ? new Date(dueDate) : addDays(new Date(), 30),
      notes,
      terms: terms || user.defaultPaymentTerms,
      totalNet: totals.totalNet,
      vatRate,
      vatAmount: totals.vatAmount,
      totalGross: totals.totalGross,
      publicToken: nanoid(32),
    });

    await invoiceRepository.save(invoice);

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .where('invoice.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const { status, notes, terms, dueDate } = req.body;

    if (status !== undefined) invoice.status = status;
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;
    if (dueDate !== undefined) invoice.dueDate = dueDate ? new Date(dueDate) : undefined;

    await invoiceRepository.save(invoice);

    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark invoice as paid
router.patch('/:id/paid', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .where('invoice.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();

    await invoiceRepository.save(invoice);

    res.json(invoice);
  } catch (error) {
    console.error('Mark invoice as paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send invoice (integrates with SMTP email service)
router.post('/:id/send', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .where('invoice.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    invoice.status = InvoiceStatus.SENT;
    invoice.sentAt = new Date();

    await invoiceRepository.save(invoice);

    // Send email to client if they have an email address on file
    const clientEmail = invoice.job?.client?.email;
    if (clientEmail) {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user!.userId } });
        const appUrl = await getAppUrl();
        const portalUrl = invoice.publicToken ? `${appUrl}/portal/invoices/${invoice.publicToken}` : undefined;
        await sendInvoiceEmail(
          clientEmail,
          invoice.invoiceNumber,
          invoice.job.client!.name,
          user?.companyName,
          Number(invoice.totalGross),
          invoice.dueDate,
          portalUrl,
        );
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError);
        // Email failure is non-fatal — the invoice is already marked sent
      }
    }

    res.json({ message: 'Invoice sent successfully', invoice });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download invoice PDF
router.get('/:id/pdf', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoice = await invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .where('invoice.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    generateInvoicePdf(res, invoice as any, user);
  } catch (error) {
    console.error('Download invoice PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
