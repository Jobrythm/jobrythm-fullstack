import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user profile
router.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      logoUrl: user.logoUrl,
      defaultVatRate: user.defaultVatRate,
      defaultPaymentTerms: user.defaultPaymentTerms,
      defaultQuoteValidityDays: user.defaultQuoteValidityDays,
      plan: user.plan,
      subscriptionEndsAt: user.subscriptionEndsAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const {
      fullName,
      companyName,
      companyAddress,
      defaultVatRate,
      defaultPaymentTerms,
      defaultQuoteValidityDays,
    } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (companyName !== undefined) user.companyName = companyName;
    if (companyAddress !== undefined) user.companyAddress = companyAddress;
    if (defaultVatRate !== undefined) user.defaultVatRate = defaultVatRate;
    if (defaultPaymentTerms !== undefined) user.defaultPaymentTerms = defaultPaymentTerms;
    if (defaultQuoteValidityDays !== undefined)
      user.defaultQuoteValidityDays = defaultQuoteValidityDays;

    await userRepository.save(user);

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      logoUrl: user.logoUrl,
      defaultVatRate: user.defaultVatRate,
      defaultPaymentTerms: user.defaultPaymentTerms,
      defaultQuoteValidityDays: user.defaultQuoteValidityDays,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
