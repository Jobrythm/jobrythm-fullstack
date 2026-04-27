import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { ChecklistItem } from '../entities/ChecklistItem.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET /api/checklists?jobId=:jobId
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.query as { jobId?: string };
    if (!jobId) {
      res.status(400).json({ error: 'jobId query parameter is required' });
      return;
    }

    const repo = AppDataSource.getRepository(ChecklistItem);
    const items = await repo.find({
      where: { jobId, companyId: req.user!.companyId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    res.json(items);
  } catch (error) {
    console.error('Get checklist items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/checklists
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId, title, sortOrder, notes } = req.body;
    if (!jobId || !title) {
      res.status(400).json({ error: 'jobId and title are required' });
      return;
    }

    const repo = AppDataSource.getRepository(ChecklistItem);
    const item = repo.create({
      jobId,
      companyId: req.user!.companyId,
      title,
      sortOrder: sortOrder ?? 0,
      notes: notes ?? undefined,
      isCompleted: false,
    });

    await repo.save(item);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create checklist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/checklists/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(ChecklistItem);
    const id = String(req.params.id);
    const item = await repo.findOne({ where: { id, companyId: req.user!.companyId } });
    if (!item) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const { title, isCompleted, sortOrder, notes } = req.body;
    if (title !== undefined) item.title = title;
    if (isCompleted !== undefined) item.isCompleted = isCompleted;
    if (sortOrder !== undefined) item.sortOrder = sortOrder;
    if (notes !== undefined) item.notes = notes;

    await repo.save(item);
    res.json(item);
  } catch (error) {
    console.error('Update checklist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/checklists/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(ChecklistItem);
    const id = String(req.params.id);
    const item = await repo.findOne({ where: { id, companyId: req.user!.companyId } });
    if (!item) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    await repo.remove(item);
    res.status(204).send();
  } catch (error) {
    console.error('Delete checklist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/checklists/reorder
router.post('/reorder', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body as { items: { id: string; sortOrder: number }[] };
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'items array is required' });
      return;
    }

    const repo = AppDataSource.getRepository(ChecklistItem);
    const ids = items.map((i) => i.id);
    const existing = await repo.findBy(
      ids.map((id) => ({ id, companyId: req.user!.companyId }))
    );

    if (existing.length !== ids.length) {
      res.status(403).json({ error: 'One or more items not found or access denied' });
      return;
    }

    const updates = existing.map((item) => {
      const match = items.find((i) => i.id === item.id);
      item.sortOrder = match!.sortOrder;
      return item;
    });

    await repo.save(updates);
    res.json(updates);
  } catch (error) {
    console.error('Reorder checklist items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
