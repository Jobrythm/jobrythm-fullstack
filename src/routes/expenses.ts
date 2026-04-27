import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Expense } from '../entities/Expense.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET /api/expenses — list expenses for company with optional filters
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Expense);
    const cid = req.user!.companyId;
    const { jobId, category, startDate, endDate } = req.query as Record<string, string | undefined>;

    const qb = repo
      .createQueryBuilder('e')
      .where('e.companyId = :cid', { cid })
      .orderBy('e.date', 'DESC')
      .addOrderBy('e.createdAt', 'DESC');

    if (jobId) qb.andWhere('e.jobId = :jobId', { jobId });
    if (category) qb.andWhere('e.category = :category', { category });
    if (startDate) qb.andWhere('e.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('e.date <= :endDate', { endDate });

    const expenses = await qb.getMany();
    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/expenses/summary — aggregate totals by category, billable, and this month
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Expense);
    const cid = req.user!.companyId;

    const byCategory = await repo
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('SUM(e.amountCents)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('e.companyId = :cid', { cid })
      .groupBy('e.category')
      .getRawMany();

    const billableTotal = await repo
      .createQueryBuilder('e')
      .select('SUM(e.amountCents)', 'total')
      .where('e.companyId = :cid AND e.isBillable = true', { cid })
      .getRawOne();

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEndStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

    const thisMonthTotal = await repo
      .createQueryBuilder('e')
      .select('SUM(e.amountCents)', 'total')
      .where('e.companyId = :cid AND e.date >= :monthStart AND e.date <= :monthEnd', {
        cid,
        monthStart,
        monthEnd: monthEndStr,
      })
      .getRawOne();

    res.json({
      byCategory: byCategory.map((r) => ({
        category: r.category,
        total: Number(r.total) || 0,
        count: Number(r.count) || 0,
      })),
      billableTotal: Number(billableTotal?.total) || 0,
      nonBillableTotal:
        (byCategory.reduce((sum: number, r) => sum + (Number(r.total) || 0), 0)) -
        (Number(billableTotal?.total) || 0),
      thisMonthTotal: Number(thisMonthTotal?.total) || 0,
    });
  } catch (error) {
    console.error('Get expenses summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/expenses — create expense
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Expense);
    const { jobId, description, amountCents, category, date, isBillable, notes } = req.body;

    if (!description) { res.status(400).json({ error: 'description is required' }); return; }
    if (amountCents === undefined || amountCents === null) { res.status(400).json({ error: 'amountCents is required' }); return; }
    if (!date) { res.status(400).json({ error: 'date is required' }); return; }

    const expense = repo.create({
      companyId: req.user!.companyId,
      jobId: jobId || undefined,
      description,
      amountCents: Math.round(Number(amountCents)),
      category: category || 'other',
      date,
      isBillable: isBillable ?? false,
      notes: notes || undefined,
    });

    await repo.save(expense);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id — update expense
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Expense);
    const id = String(req.params.id);
    const expense = await repo.findOne({ where: { id, companyId: req.user!.companyId } });
    if (!expense) { res.status(404).json({ error: 'Not found' }); return; }

    const { jobId, description, amountCents, category, date, isBillable, notes } = req.body;
    if (description !== undefined) expense.description = description;
    if (amountCents !== undefined) expense.amountCents = Math.round(Number(amountCents));
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (isBillable !== undefined) expense.isBillable = isBillable;
    if (notes !== undefined) expense.notes = notes || undefined;
    if (jobId !== undefined) expense.jobId = jobId || undefined;

    await repo.save(expense);
    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/expenses/:id — delete expense
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(Expense);
    const id = String(req.params.id);
    const expense = await repo.findOne({ where: { id, companyId: req.user!.companyId } });
    if (!expense) { res.status(404).json({ error: 'Not found' }); return; }
    await repo.remove(expense);
    res.status(204).send();
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
