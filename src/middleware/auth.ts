import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/auth.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { SubscriptionPlan } from '../types/enums.js';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const userRepository = AppDataSource.getRepository(User);
  userRepository
    .findOne({ where: { id: req.user.userId } })
    .then((user) => {
      if (!user || user.plan !== SubscriptionPlan.ADMIN) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }
      next();
    })
    .catch(() => {
      res.status(500).json({ error: 'Internal server error' });
    });
}
