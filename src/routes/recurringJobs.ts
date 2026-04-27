import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { RecurringJobTemplate } from '../entities/RecurringJobTemplate.js';
import { Job } from '../entities/Job.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { format, parseISO } from 'date-fns';

const router = Router();
router.use(authenticateToken);

function cid(req: AuthRequest): string {
  return req.user!.companyId ?? req.user!.userId;
}

// GET /api/recurring-jobs
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(RecurringJobTemplate);
    const templates = await repo.find({
      where: { userId: cid(req) },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
    res.json(templates);
  } catch (err) {
    console.error('List recurring jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recurring-jobs
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, title, description, frequency, startDate, endDate } = req.body as {
      clientId?: string; title: string; description?: string;
      frequency: string; startDate: string; endDate?: string;
    };

    if (!title || !frequency || !startDate) {
      res.status(400).json({ error: 'title, frequency, and startDate are required' });
      return;
    }

    const valid = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!valid.includes(frequency)) {
      res.status(400).json({ error: `frequency must be one of: ${valid.join(', ')}` });
      return;
    }

    const repo = AppDataSource.getRepository(RecurringJobTemplate);
    const tpl = repo.create({
      userId: cid(req),
      clientId,
      title,
      description,
      frequency: frequency as RecurringJobTemplate['frequency'],
      startDate,
      endDate,
      nextRunAt: startDate,
      isActive: true,
    });
    await repo.save(tpl);
    res.status(201).json(tpl);
  } catch (err) {
    console.error('Create recurring job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/recurring-jobs/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(RecurringJobTemplate);
    const tpl = await repo.findOne({ where: { id: String(req.params.id), userId: cid(req) } });
    if (!tpl) { res.status(404).json({ error: 'Template not found' }); return; }

    const { title, description, frequency, endDate, isActive } = req.body as {
      title?: string; description?: string; frequency?: string; endDate?: string; isActive?: boolean;
    };

    if (title !== undefined) tpl.title = title;
    if (description !== undefined) tpl.description = description;
    if (endDate !== undefined) tpl.endDate = endDate;
    if (isActive !== undefined) tpl.isActive = isActive;
    if (frequency !== undefined) {
      const valid = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
      if (!valid.includes(frequency)) {
        res.status(400).json({ error: `frequency must be one of: ${valid.join(', ')}` });
        return;
      }
      tpl.frequency = frequency as RecurringJobTemplate['frequency'];
    }

    await repo.save(tpl);
    res.json(tpl);
  } catch (err) {
    console.error('Update recurring job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/recurring-jobs/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(RecurringJobTemplate);
    const tpl = await repo.findOne({ where: { id: String(req.params.id), userId: cid(req) } });
    if (!tpl) { res.status(404).json({ error: 'Template not found' }); return; }
    await repo.remove(tpl);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete recurring job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recurring-jobs/:id/jobs — spawned jobs for this template
router.get('/:id/jobs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tplRepo = AppDataSource.getRepository(RecurringJobTemplate);
    const tpl = await tplRepo.findOne({ where: { id: String(req.params.id), userId: cid(req) } });
    if (!tpl) { res.status(404).json({ error: 'Template not found' }); return; }

    const jobRepo = AppDataSource.getRepository(Job);
    const jobs = await jobRepo.find({
      where: { recurringTemplateId: String(req.params.id) },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    res.json(jobs);
  } catch (err) {
    console.error('List spawned jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// Silence unused import warning
void format;
void parseISO;
