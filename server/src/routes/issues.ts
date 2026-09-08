import { Router } from 'express';
import {
  createIssueSchema,
  updateIssueStatusSchema,
  overrideIssueDetailsSchema,
  assignPersonSchema,
  type IssueStatus,
  type IssueDepartment,
  type IssueSeverity,
} from '@fixora/shared';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  overrideIssueDetails,
  assignTechnician,
} from '../services/issueService.js';
import { getIssueImage } from '../services/storageService.js';

export const issuesRouter = Router();

/**
 * POST /api/issues
 * Create a new campus issue.
 * Protected: Authenticated student or admin.
 * Reporter identity is derived strictly from verified token req.user.
 */
issuesRouter.post(
  '/',
  requireAuth,
  validateBody(createIssueSchema),
  async (req, res, next) => {
    try {
      const issue = await createIssue(req.body, req.user!);
      res.status(201).json({
        success: true,
        issue,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/issues
 * List issues.
 * - Students receive only their own reported issues.
 * - Admins receive all campus issues with optional filtering.
 */
issuesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, department, severity, search } = req.query;

    const filters = {
      status: status ? (status as IssueStatus) : undefined,
      department: department ? (department as IssueDepartment) : undefined,
      severity: severity ? (severity as IssueSeverity) : undefined,
      search: typeof search === 'string' ? search : undefined,
    };

    const issues = await getIssues(req.user!, filters);
    res.status(200).json({
      success: true,
      issues,
      total: issues.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/issues/:id
 * Retrieve issue details along with complete timeline updates.
 * Protected: Students can only view their own reported tickets; Admins can view any.
 */
issuesRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getIssueById(id, req.user!);
    res.status(200).json({
      success: true,
      issue: result.issue,
      updates: result.updates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/issues/:id/status
 * Update the status of an issue and append a lifecycle update.
 * Protected: Admin only.
 */
issuesRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole(['admin']),
  validateBody(updateIssueStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, note, resolutionNote } = req.body;
      const result = await updateIssueStatus(id, status, note, resolutionNote, req.user!);
      res.status(200).json({
        success: true,
        issue: result.issue,
        update: result.update,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/issues/:id/override
 * Override category, severity, or department of an issue.
 * Protected: Admin only.
 */
issuesRouter.patch(
  '/:id/override',
  requireAuth,
  requireRole(['admin']),
  validateBody(overrideIssueDetailsSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await overrideIssueDetails(id, req.body, req.user!);
      res.status(200).json({
        success: true,
        issue: result.issue,
        update: result.update,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/issues/:id/assign
 * Assign a campus facility staff member/technician to an issue.
 * Protected: Admin only.
 */
issuesRouter.patch(
  '/:id/assign',
  requireAuth,
  requireRole(['admin']),
  validateBody(assignPersonSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { personId } = req.body;
      const result = await assignTechnician(id, personId, req.user!);
      res.status(200).json({
        success: true,
        issue: result.issue,
        update: result.update,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/issues/:id/image
 * Retrieve the photograph associated with an issue.
 * Protected: Only the ticket reporter or campus admins are authorized to view the image.
 * Students attempting to view another student's image receive HTTP 403 Forbidden.
 */
issuesRouter.get('/:id/image', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    // getIssueById automatically enforces RBAC: students can only access their own issues (403 if unauthorized)
    const { issue } = await getIssueById(id, req.user!);

    if (!issue.hasImage || !issue.imageStoragePath) {
      res.status(404).json({
        success: false,
        error: 'This issue does not have an attached photograph',
      });
      return;
    }

    const image = await getIssueImage(issue.imageStoragePath);
    if (!image) {
      res.status(404).json({
        success: false,
        error: 'Photograph not found in storage',
      });
      return;
    }

    res.setHeader('Content-Type', issue.imageContentType || image.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.status(200).send(image.buffer);
  } catch (error) {
    next(error);
  }
});
