import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Job } from '../entities/Job.js';
import { LineItem } from '../entities/LineItem.js';
import { Quote } from '../entities/Quote.js';
import { Invoice } from '../entities/Invoice.js';
import { NumberSequence } from '../entities/NumberSequence.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { JobStatus, QuoteStatus, InvoiceStatus } from '../types/enums.js';
import { Like } from 'typeorm';
import { addDays } from 'date-fns';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all jobs with pagination and filters
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const pageSize = parseInt((req.query.pageSize as string) || '30');
    const search = (req.query.search as string) || '';
    const status = req.query.status as JobStatus | undefined;

    const jobRepository = AppDataSource.getRepository(Job);
    const skip = (page - 1) * pageSize;

    const where: any = { userId: req.user!.userId };
    if (search) {
      where.title = Like(`%${search}%`);
    }
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await jobRepository.findAndCount({
      where,
      relations: ['client', 'lineItems', 'quote', 'invoice'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    res.json({
      items: jobs,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
      relations: ['client', 'lineItems', 'quote', 'invoice'],
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create job
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, title, description, startDate, endDate } = req.body;

    if (!clientId || !title) {
      res.status(400).json({ error: 'Client ID and title are required' });
      return;
    }

    const jobRepository = AppDataSource.getRepository(Job);
    const job = jobRepository.create({
      userId: req.user!.userId,
      clientId,
      title,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: JobStatus.DRAFT,
    });

    await jobRepository.save(job);

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const { clientId, title, description, startDate, endDate } = req.body;

    if (clientId !== undefined) job.clientId = clientId;
    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (startDate !== undefined) job.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) job.endDate = endDate ? new Date(endDate) : undefined;

    await jobRepository.save(job);

    res.json(job);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job status
router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const { status } = req.body;

    if (!Object.values(JobStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    job.status = status;
    await jobRepository.save(job);

    res.json(job);
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete job
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    await jobRepository.remove(job);

    res.status(204).send();
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LINE ITEMS

// Create line item
router.post('/:jobId/line-items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: req.params.jobId, userId: req.user!.userId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const { description, category, quantity, unit, unitCost, unitPrice } = req.body;

    if (!description || !category || quantity === undefined || unitCost === undefined || unitPrice === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const lineItemRepository = AppDataSource.getRepository(LineItem);
    const lineItem = lineItemRepository.create({
      jobId: job.id,
      description,
      category,
      quantity,
      unit,
      unitCost,
      unitPrice,
    });

    await lineItemRepository.save(lineItem);

    res.status(201).json(lineItem);
  } catch (error) {
    console.error('Create line item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update line item
router.put('/line-items/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lineItemRepository = AppDataSource.getRepository(LineItem);
    const lineItem = await lineItemRepository.findOne({
      where: { id: req.params.id },
      relations: ['job'],
    });

    if (!lineItem || lineItem.job.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Line item not found' });
      return;
    }

    const { description, category, quantity, unit, unitCost, unitPrice } = req.body;

    if (description !== undefined) lineItem.description = description;
    if (category !== undefined) lineItem.category = category;
    if (quantity !== undefined) lineItem.quantity = quantity;
    if (unit !== undefined) lineItem.unit = unit;
    if (unitCost !== undefined) lineItem.unitCost = unitCost;
    if (unitPrice !== undefined) lineItem.unitPrice = unitPrice;

    await lineItemRepository.save(lineItem);

    res.json(lineItem);
  } catch (error) {
    console.error('Update line item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete line item
router.delete('/line-items/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lineItemRepository = AppDataSource.getRepository(LineItem);
    const lineItem = await lineItemRepository.findOne({
      where: { id: req.params.id },
      relations: ['job'],
    });

    if (!lineItem || lineItem.job.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Line item not found' });
      return;
    }

    await lineItemRepository.remove(lineItem);

    res.status(204).send();
  } catch (error) {
    console.error('Delete line item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
