import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const userRouter = Router();

/**
 * GET /api/user/profile
 * Protected endpoint: Returns profile of the authenticated user
 * UID and identity are obtained exclusively from the verified token
 */
userRouter.get('/profile', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      uid: req.user!.uid,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});
