import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getResponsiblePeople } from '../services/responsiblePeopleService.js';

export const responsiblePeopleRouter = Router();

/**
 * GET /api/responsible-people
 * Returns list of campus facility staff members.
 * Protected: Requires authenticated user.
 */
responsiblePeopleRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const people = await getResponsiblePeople();
    res.status(200).json({
      success: true,
      people,
    });
  } catch (error) {
    next(error);
  }
});
