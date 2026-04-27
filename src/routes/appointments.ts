import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Appointment } from '../entities/Appointment.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { AppointmentStatus } from '../types/enums.js';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

const router = Router();
router.use(authenticateToken);

// List appointments (optionally filtered by date range)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Appointment);
    const { start, end } = req.query as { start?: string; end?: string };

    const where: Record<string, unknown> = { userId: req.user!.userId };

    if (start && end) {
      where.startTime = Between(new Date(start), new Date(end));
    } else if (start) {
      where.startTime = MoreThanOrEqual(new Date(start));
    } else if (end) {
      where.startTime = LessThanOrEqual(new Date(end));
    }

    const appointments = await repo.find({
      where,
      relations: ['job', 'client', 'job.client'],
      order: { startTime: 'ASC' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single appointment
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Appointment);
    const id = String(req.params.id);
    const appt = await repo.findOne({
      where: { id, userId: req.user!.userId },
      relations: ['job', 'client', 'job.client'],
    });
    if (!appt) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(appt);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create appointment
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Appointment);
    const { title, description, startTime, endTime, location, jobId, clientId, assignedTo } = req.body;

    if (!title || !startTime || !endTime) {
      res.status(400).json({ error: 'title, startTime and endTime are required' });
      return;
    }

    const appt = repo.create({
      userId: req.user!.userId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      jobId: jobId || undefined,
      clientId: clientId || undefined,
      assignedTo: assignedTo || undefined,
      status: AppointmentStatus.SCHEDULED,
    });

    await repo.save(appt);

    const saved = await repo.findOne({
      where: { id: appt.id },
      relations: ['job', 'client', 'job.client'],
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update appointment (supports partial updates + drag-and-drop reschedule)
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Appointment);
    const id = String(req.params.id);
    const appt = await repo.findOne({ where: { id, userId: req.user!.userId } });
    if (!appt) { res.status(404).json({ error: 'Not found' }); return; }

    const { title, description, startTime, endTime, location, jobId, clientId, assignedTo, status } = req.body;

    if (title !== undefined) appt.title = title;
    if (description !== undefined) appt.description = description;
    if (startTime !== undefined) appt.startTime = new Date(startTime);
    if (endTime !== undefined) appt.endTime = new Date(endTime);
    if (location !== undefined) appt.location = location;
    if (jobId !== undefined) appt.jobId = jobId || undefined;
    if (clientId !== undefined) appt.clientId = clientId || undefined;
    if (assignedTo !== undefined) appt.assignedTo = assignedTo || undefined;
    if (status !== undefined) appt.status = status;

    await repo.save(appt);

    const saved = await repo.findOne({
      where: { id: appt.id },
      relations: ['job', 'client', 'job.client'],
    });

    res.json(saved);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete appointment
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Appointment);
    const id = String(req.params.id);
    const appt = await repo.findOne({ where: { id, userId: req.user!.userId } });
    if (!appt) { res.status(404).json({ error: 'Not found' }); return; }
    await repo.remove(appt);
    res.status(204).send();
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
