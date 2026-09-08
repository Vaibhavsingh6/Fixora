import { Router } from 'express';

export const healthRouter = Router();

/**
 * GET /api/health
 * Simple health check probe
 */
healthRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    service: 'fixora-backend',
  });
});
