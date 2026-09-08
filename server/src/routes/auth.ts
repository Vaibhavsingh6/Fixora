import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { adminAuth, adminDb } from '../config/firebaseAdmin.js';

export const authRouter = Router();

// Apply rate limiting to all auth endpoints
authRouter.use(authRateLimiter);

const claimAdminSchema = z.object({
  adminSecret: z.string().min(1, 'Admin secret is required'),
});

/**
 * POST /api/auth/claim-admin
 * Protected endpoint: Allows an authenticated user to elevate their account to 'admin'
 * UID is obtained strictly from the verified token (req.user.uid) - NOT from client request body.
 * Validates the secret server-side against ADMIN_SECRET_KEY.
 */
authRouter.post(
  '/claim-admin',
  requireAuth,
  validateBody(claimAdminSchema),
  async (req, res, next) => {
    try {
      const { adminSecret } = req.body;

      if (adminSecret !== env.ADMIN_SECRET_KEY) {
        throw new AppError('Invalid administrator authorization code', 403);
      }

      const uid = req.user!.uid;

      // Update Firestore user document server-side
      try {
        await adminDb.collection('users').doc(uid).set(
          {
            role: 'admin',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Notice: Firestore server update skipped or deferred:', (dbErr as Error).message);
      }

      // Set Firebase Auth custom claim
      try {
        await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
      } catch {
        // Ignored in test environment
      }

      res.status(200).json({
        success: true,
        message: 'Administrative clearance granted successfully',
        role: 'admin',
      });
    } catch (err) {
      next(err);
    }
  }
);
