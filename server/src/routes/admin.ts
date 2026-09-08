import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

/**
 * GET /api/admin/system-status
 * Strictly admin-only endpoint
 * 401 if unauthenticated
 * 403 if authenticated but not holding admin role
 * 200 if legitimate administrator
 */
adminRouter.get(
  '/system-status',
  requireAuth,
  requireRole(['admin']),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin authorization verified',
      adminUid: req.user!.uid,
      systemMetrics: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    });
  }
);
