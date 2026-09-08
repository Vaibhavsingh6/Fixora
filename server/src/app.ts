import express from 'express';
import { securityHeaders, corsMiddleware } from './middleware/security.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export function createApp(): express.Application {
  const app = express();

  // Security HTTP Headers
  app.use(securityHeaders);

  // Cross-Origin Resource Sharing
  app.use(corsMiddleware);

  // Request Body Parsers: Enforces strict 10kb limit on standard endpoints to prevent DoS,
  // while allowing up to 10MB specifically for authenticated image uploads and multimodal analysis.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/analyze-issue') || req.path.startsWith('/api/upload-image')) {
      express.json({ limit: '10mb' })(req, res, next);
    } else {
      express.json({ limit: '10kb' })(req, res, next);
    }
  });
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Root Informational Route
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'Fixora API Service',
      description: 'AI-powered campus issue reporting and resolution platform API',
      healthCheck: '/api/health',
      version: '1.0.0',
    });
  });

  // Mount API endpoints under /api
  app.use('/api', apiRouter);

  // Handle Unmatched Routes (404)
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
