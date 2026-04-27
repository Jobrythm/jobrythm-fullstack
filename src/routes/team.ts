import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { TeamMember } from '../entities/TeamMember.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { TeamMemberRole } from '../types/enums.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TeamMember);
    const members = await repo.find({
      where: { ownerId: req.user!.userId },
      order: { name: 'ASC' },
    });
    res.json(members);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TeamMember);
    const id = String(req.params.id);
    const member = await repo.findOne({ where: { id, ownerId: req.user!.userId } });
    if (!member) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(member);
  } catch (error) {
    console.error('Get team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TeamMember);
    const { name, email, phone, role, notes } = req.body;
    if (!name) { res.status(400).json({ error: 'name is required' }); return; }

    const member = repo.create({
      ownerId: req.user!.userId,
      name,
      email,
      phone,
      role: role ?? TeamMemberRole.TECHNICIAN,
      notes,
      isActive: true,
    });
    await repo.save(member);
    res.status(201).json(member);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TeamMember);
    const id = String(req.params.id);
    const member = await repo.findOne({ where: { id, ownerId: req.user!.userId } });
    if (!member) { res.status(404).json({ error: 'Not found' }); return; }

    const { name, email, phone, role, notes, isActive } = req.body;
    if (name !== undefined) member.name = name;
    if (email !== undefined) member.email = email;
    if (phone !== undefined) member.phone = phone;
    if (role !== undefined) member.role = role;
    if (notes !== undefined) member.notes = notes;
    if (isActive !== undefined) member.isActive = isActive;

    await repo.save(member);
    res.json(member);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(TeamMember);
    const id = String(req.params.id);
    const member = await repo.findOne({ where: { id, ownerId: req.user!.userId } });
    if (!member) { res.status(404).json({ error: 'Not found' }); return; }
    await repo.remove(member);
    res.status(204).send();
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
