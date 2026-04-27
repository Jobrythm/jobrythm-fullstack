import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { hashPassword } from '../utils/auth.js';

const router = Router();
router.use(authenticateToken);

const PLAN_LIMITS: Record<string, number> = {
  starter: 0,
  professional: 3,
  business: 10,
  admin: 9999,
};

// Only owner or business_admin of the same company can manage members
function canManage(req: AuthRequest): boolean {
  return req.user!.companyRole === 'owner' || req.user!.companyRole === 'business_admin';
}

// GET /api/company/members
router.get('/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId ?? req.user!.userId;
    const repo = AppDataSource.getRepository(User);
    const members = await repo.find({
      where: { parentUserId: companyId },
      order: { createdAt: 'ASC' },
    });
    res.json(
      members.map((m) => ({
        id: m.id,
        email: m.email,
        name: m.fullName,
        companyRole: m.companyRole,
        createdAt: m.createdAt,
      })),
    );
  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/company/members
router.post('/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!canManage(req)) {
      res.status(403).json({ error: 'Only owners and business admins can add team members' });
      return;
    }

    const companyId = req.user!.companyId ?? req.user!.userId;
    const repo = AppDataSource.getRepository(User);

    // Fetch owner to check plan
    const owner = await repo.findOne({ where: { id: companyId } });
    if (!owner) {
      res.status(404).json({ error: 'Company owner not found' });
      return;
    }

    const limit = PLAN_LIMITS[owner.plan] ?? 0;
    if (limit === 0) {
      res.status(403).json({
        error: `Your ${owner.plan} plan does not include team login accounts. Upgrade to Professional (3 members) or Business (10 members).`,
      });
      return;
    }

    const existingCount = await repo.count({ where: { parentUserId: companyId } });
    if (existingCount >= limit) {
      res.status(403).json({
        error: `You've reached your plan limit of ${limit} team member${limit === 1 ? '' : 's'}. Upgrade to add more.`,
      });
      return;
    }

    const { name, email, password, companyRole = 'member' } = req.body as {
      name: string; email: string; password: string; companyRole?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email, and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const allowedRoles = ['member', 'business_admin'];
    if (!allowedRoles.includes(companyRole)) {
      res.status(400).json({ error: 'companyRole must be member or business_admin' });
      return;
    }

    const existing = await repo.findOne({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }

    const member = repo.create({
      email,
      fullName: name,
      passwordHash: await hashPassword(password),
      parentUserId: companyId,
      companyRole,
      plan: owner.plan,  // inherit for display; billing is owner's
    });

    await repo.save(member);

    res.status(201).json({
      id: member.id,
      email: member.email,
      name: member.fullName,
      companyRole: member.companyRole,
      createdAt: member.createdAt,
    });
  } catch (err) {
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/company/members/:id
router.put('/members/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!canManage(req)) {
      res.status(403).json({ error: 'Only owners and business admins can update team members' });
      return;
    }

    const companyId = req.user!.companyId ?? req.user!.userId;
    const repo = AppDataSource.getRepository(User);
    const member = await repo.findOne({ where: { id: String(req.params.id), parentUserId: companyId } });

    if (!member) {
      res.status(404).json({ error: 'Team member not found' });
      return;
    }

    const { name, email, companyRole } = req.body as { name?: string; email?: string; companyRole?: string };

    if (name) member.fullName = name;
    if (email) {
      const taken = await repo.findOne({ where: { email } });
      if (taken && taken.id !== member.id) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
      member.email = email;
    }
    if (companyRole) {
      if (!['member', 'business_admin'].includes(companyRole)) {
        res.status(400).json({ error: 'companyRole must be member or business_admin' });
        return;
      }
      member.companyRole = companyRole;
    }

    await repo.save(member);
    res.json({ id: member.id, email: member.email, name: member.fullName, companyRole: member.companyRole });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/company/members/:id
router.delete('/members/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.companyRole !== 'owner') {
      res.status(403).json({ error: 'Only owners can remove team members' });
      return;
    }

    const companyId = req.user!.companyId ?? req.user!.userId;
    const repo = AppDataSource.getRepository(User);
    const member = await repo.findOne({ where: { id: String(req.params.id), parentUserId: companyId } });

    if (!member) {
      res.status(404).json({ error: 'Team member not found' });
      return;
    }

    await repo.remove(member);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/company/members/:id/reset-password
router.post('/members/:id/reset-password', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!canManage(req)) {
      res.status(403).json({ error: 'Only owners and business admins can reset passwords' });
      return;
    }

    const companyId = req.user!.companyId ?? req.user!.userId;
    const repo = AppDataSource.getRepository(User);
    const member = await repo.findOne({ where: { id: String(req.params.id), parentUserId: companyId } });

    if (!member) {
      res.status(404).json({ error: 'Team member not found' });
      return;
    }

    const { newPassword } = req.body as { newPassword?: string };
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'newPassword must be at least 8 characters' });
      return;
    }

    member.passwordHash = await hashPassword(newPassword);
    await repo.save(member);
    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
