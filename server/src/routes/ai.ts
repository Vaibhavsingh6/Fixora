import { Router } from 'express';
import { analyzeIssueSchema } from '@fixora/shared';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { analyzeIssueWithGemini } from '../services/geminiService.js';

export const aiRouter = Router();

/**
 * POST /api/analyze-issue
 * Analyzes reported issue description, title, and location using Gemini 3.8 Flash.
 * Enforces structured output JSON schema.
 * Protected: Requires authenticated user (student or admin).
 * Rate Limited: Dedicated limits against quota exhaustion and abuse.
 */
aiRouter.post(
  '/analyze-issue',
  requireAuth,
  aiRateLimiter,
  validateBody(analyzeIssueSchema),
  async (req, res, next) => {
    try {
      const analysis = await analyzeIssueWithGemini(req.body);
      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }
);
