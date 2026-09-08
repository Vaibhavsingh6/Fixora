import express, { type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  saveIssueImage,
  deleteIssueImage,
  ALLOWED_IMAGE_MIME_TYPES,
  type AllowedImageMimeType,
  MAX_IMAGE_SIZE_BYTES,
} from '../services/storageService.js';

const uploadRouter = express.Router();

/**
 * POST /api/upload-image
 * Authenticated endpoint for students to upload an issue photograph to Firebase Storage
 */
uploadRouter.post(
  '/',
  authRateLimiter,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { imageBase64, mimeType } = req.body || {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Image data is required (base64 string)',
        });
        return;
      }

      if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType)) {
        res.status(400).json({
          success: false,
          error: `Unsupported image type (${mimeType}). Only JPEG, PNG, and WebP are allowed.`,
        });
        return;
      }

      // Strip data URL prefix if present (e.g. data:image/jpeg;base64,...)
      const cleanedBase64 = imageBase64.replace(/^data:image\/[a-z0-9-+.]+;base64,/i, '');
      const imageBuffer = Buffer.from(cleanedBase64, 'base64');

      if (imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
        res.status(400).json({
          success: false,
          error: `Image exceeds maximum allowed size of 5 MB (${(imageBuffer.length / (1024 * 1024)).toFixed(2)} MB)`,
        });
        return;
      }

      // Generate a collision-safe upload identity
      const uploadId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const saved = await saveIssueImage(
        req.user.uid,
        uploadId,
        imageBuffer,
        mimeType as AllowedImageMimeType
      );

      res.status(200).json({
        success: true,
        data: {
          storagePath: saved.storagePath,
          contentType: saved.contentType,
          base64Data: cleanedBase64,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: (err as Error).message || 'Failed to process image upload',
      });
    }
  }
);

/**
 * DELETE /api/upload-image
 * Cleans up an uploaded image if ticket creation is aborted
 */
uploadRouter.delete(
  '/',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { storagePath } = req.body || {};
      if (!storagePath || typeof storagePath !== 'string') {
        res.status(400).json({ success: false, error: 'storagePath is required' });
        return;
      }

      // Enforce isolation: Students can only delete images in their own directory
      const userPrefix = `issues/${req.user.uid}/`;
      if (!storagePath.startsWith(userPrefix) && req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot delete images belonging to another user',
        });
        return;
      }

      await deleteIssueImage(storagePath);
      res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: (err as Error).message || 'Failed to delete image',
      });
    }
  }
);

export { uploadRouter };
