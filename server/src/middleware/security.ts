import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

const defaultLocalOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
];

export function isOriginAllowed(origin?: string): boolean {
  // Allow requests with no origin (like mobile apps, curl, server-to-server)
  if (!origin) return true;

  const configuredOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  if (configuredOrigins.includes('*')) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (defaultLocalOrigins.includes(origin)) return true;

  // Allow secure Vercel production and preview deployment origins (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked request from origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
