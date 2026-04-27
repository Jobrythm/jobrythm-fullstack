import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Job } from '../entities/Job.js';
import { Quote } from '../entities/Quote.js';
import { User } from '../entities/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { QuoteStatus } from '../types/enums.js';
import { addDays } from 'date-fns';
import { nanoid } from 'nanoid';
import { getNextNumber } from '../utils/numberSequence.js';
import { getAppUrl } from '../utils/appSettings.js';
import { calculateTotals } from '../utils/calculations.js';
import { sendQuoteEmail } from '../utils/email.js';
import { generateQuotePdf } from '../utils/pdf.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all quotes with pagination
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const pageSize = parseInt((req.query.pageSize as string) || '30');

    const quoteRepository = AppDataSource.getRepository(Quote);
    const skip = (page - 1) * pageSize;

    const [quotes, total] = await quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.userId = :userId', { userId: req.user!.userId })
      .skip(skip)
      .take(pageSize)
      .orderBy('quote.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      items: quotes,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quote by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .where('quote.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    res.json(quote);
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quote for a job
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

    // Prevent duplicate quotes per job
    const quoteRepository = AppDataSource.getRepository(Quote);
    const existing = await quoteRepository.findOne({ where: { jobId: job.id } });
    if (existing) {
      res.status(409).json({ error: 'A quote already exists for this job' });
      return;
    }

    // Get user settings
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { notes, terms } = req.body;

    // Calculate totals from line items
    const totalNet = job.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatRate = Number(user.defaultVatRate) || 20;
    const totals = calculateTotals(totalNet, vatRate);

    // Generate quote number
    const quoteNumber = await getNextNumber(req.user!.userId, 'QT');

    const quote = quoteRepository.create({
      jobId: job.id,
      quoteNumber,
      status: QuoteStatus.DRAFT,
      validUntil: addDays(new Date(), Number(user.defaultQuoteValidityDays) || 30),
      notes,
      terms: terms || user.defaultPaymentTerms,
      totalNet: totals.totalNet,
      vatRate,
      vatAmount: totals.vatAmount,
      totalGross: totals.totalGross,
      publicToken: nanoid(32),
    });

    await quoteRepository.save(quote);

    res.status(201).json(quote);
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quote
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.job', 'job')
      .where('quote.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    const { status, notes, terms, validUntil } = req.body;

    if (status !== undefined) quote.status = status;
    if (notes !== undefined) quote.notes = notes;
    if (terms !== undefined) quote.terms = terms;
    if (validUntil !== undefined) quote.validUntil = validUntil ? new Date(validUntil) : undefined;

    await quoteRepository.save(quote);

    res.json(quote);
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send quote (integrates with SMTP email service)
router.post('/:id/send', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .where('quote.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    quote.status = QuoteStatus.SENT;
    quote.sentAt = new Date();

    await quoteRepository.save(quote);

    // Send email to client if they have an email address on file
    const clientEmail = quote.job?.client?.email;
    if (clientEmail) {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user!.userId } });
        const appUrl = await getAppUrl();
        const portalUrl = quote.publicToken ? `${appUrl}/portal/quotes/${quote.publicToken}` : undefined;
        await sendQuoteEmail(
          clientEmail,
          quote.quoteNumber,
          quote.job.client!.name,
          user?.companyName,
          Number(quote.totalGross),
          portalUrl,
        );
      } catch (emailError) {
        console.error('Failed to send quote email:', emailError);
        // Email failure is non-fatal — the quote is already marked sent
      }
    }

    res.json({ message: 'Quote sent successfully', quote });
  } catch (error) {
    console.error('Send quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download quote PDF
router.get('/:id/pdf', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.job', 'job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.lineItems', 'lineItems')
      .where('quote.id = :id', { id: req.params.id })
      .andWhere('job.userId = :userId', { userId: req.user!.userId })
      .getOne();

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    generateQuotePdf(res, quote as any, user);
  } catch (error) {
    console.error('Download quote PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
