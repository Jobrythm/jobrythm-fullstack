import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { RefreshToken } from '../entities/RefreshToken.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/auth.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { addDays } from 'date-fns';

const router = Router();
const REFRESH_TOKEN_EXPIRES_IN_DAYS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || '30'
);

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password, and full name are required' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if user exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = userRepository.create({
      email,
      passwordHash,
      fullName,
    });

    await userRepository.save(user);

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken();
    const tokenHash = await hashToken(refreshToken);

    // Save refresh token
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const refreshTokenEntity = refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRES_IN_DAYS),
    });

    await refreshTokenRepository.save(refreshTokenEntity);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      session: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken();
    const tokenHash = await hashToken(refreshToken);

    // Save refresh token
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const refreshTokenEntity = refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRES_IN_DAYS),
    });

    await refreshTokenRepository.save(refreshTokenEntity);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      session: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const tokenHash = await hashToken(refreshToken);
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    const tokenEntity = await refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!tokenEntity || !tokenEntity.isActive) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: tokenEntity.user.id,
      email: tokenEntity.user.email,
    });

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

    res.json({
      session: {
        accessToken,
        refreshToken, // Return same refresh token
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = await hashToken(refreshToken);
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

      await refreshTokenRepository.update({ tokenHash }, { revokedAt: new Date() });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
