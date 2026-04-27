import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { TimeEntry } from '../entities/TimeEntry.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TimeEntry);
    const { jobId } = req.query as { jobId?: string };
    const where: Record<string, unknown> = { userId: req.user!.userId };
    if (jobId) where.jobId = jobId;

    const entries = await repo.find({
      where,
      relations: ['job', 'job.client'],
      order: { startTime: 'DESC' },
      take: 200,
    });
    res.json(entries);
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TimeEntry);
    const { jobId, startTime, endTime, description, isBillable, hourlyRateCents, durationMinutes, teamMemberId } = req.body;

    if (!startTime) { res.status(400).json({ error: 'startTime is required' }); return; }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : undefined;
    const computed = end
      ? Math.round((end.getTime() - start.getTime()) / 60000)
      : (durationMinutes ?? undefined);

    const entry = repo.create({
      userId: req.user!.userId,
      jobId: jobId || undefined,
      teamMemberId: teamMemberId || undefined,
      startTime: start,
      endTime: end,
      description,
      isBillable: isBillable ?? false,
      hourlyRateCents: hourlyRateCents ?? undefined,
      durationMinutes: computed,
    });

    await repo.save(entry);

    const saved = await repo.findOne({ where: { id: entry.id }, relations: ['job', 'job.client'] });
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clock in (start without endTime)
router.post('/clock-in', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TimeEntry);
    const { jobId, description, isBillable, hourlyRateCents } = req.body;

    // Check for existing open entry
    const existing = await repo.findOne({
      where: { userId: req.user!.userId, endTime: undefined as unknown as Date },
    });
    if (existing) {
      res.status(409).json({ error: 'You already have an open timer. Clock out first.' });
      return;
    }

    const entry = repo.create({
      userId: req.user!.userId,
      jobId: jobId || undefined,
      startTime: new Date(),
      description,
      isBillable: isBillable ?? false,
      hourlyRateCents: hourlyRateCents ?? undefined,
    });

    await repo.save(entry);
    res.status(201).json(entry);
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clock out
router.post('/clock-out', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TimeEntry);
    const entry = await repo.findOne({
      where: { userId: req.user!.userId, endTime: undefined as unknown as Date },
      order: { startTime: 'DESC' },
    });

    if (!entry) {
      res.status(404).json({ error: 'No active timer found' });
      return;
    }

    entry.endTime = new Date();
    entry.durationMinutes = Math.round((entry.endTime.getTime() - entry.startTime.getTime()) / 60000);
    await repo.save(entry);

    res.json(entry);
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TimeEntry);
    const id = String(req.params.id);
    const entry = await repo.findOne({ where: { id, userId: req.user!.userId } });
    if (!entry) { res.status(404).json({ error: 'Not found' }); return; }

    const { startTime, endTime, description, isBillable, hourlyRateCents, jobId } = req.body;
    if (startTime !== undefined) entry.startTime = new Date(startTime);
    if (endTime !== undefined) {
      entry.endTime = new Date(endTime);
      entry.durationMinutes = Math.round((entry.endTime.getTime() - entry.startTime.getTime()) / 60000);
    }
    if (description !== undefined) entry.description = description;
    if (isBillable !== undefined) entry.isBillable = isBillable;
    if (hourlyRateCents !== undefined) entry.hourlyRateCents = hourlyRateCents;
    if (jobId !== undefined) entry.jobId = jobId || undefined;

    await repo.save(entry);
    res.json(entry);
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TimeEntry);
    const id = String(req.params.id);
    const entry = await repo.findOne({ where: { id, userId: req.user!.userId } });
    if (!entry) { res.status(404).json({ error: 'Not found' }); return; }
    await repo.remove(entry);
    res.status(204).send();
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
