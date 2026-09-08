import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { isAuthorizedRole, isValidRole } from '@fixora/shared';

describe('Role & Authorization Logic', () => {
  const app = createApp();

  describe('Role Validation Helpers', () => {
    it('only permits student and admin as valid roles', () => {
      expect(isValidRole('student')).toBe(true);
      expect(isValidRole('admin')).toBe(true);

      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('moderator')).toBe(false);
      expect(isValidRole('guest')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
    });

    it('correctly assesses role authorization against permitted roles', () => {
      // Student attempting to access student route
      expect(isAuthorizedRole('student', ['student'])).toBe(true);

      // Student attempting to access admin-only route
      expect(isAuthorizedRole('student', ['admin'])).toBe(false);

      // Admin attempting to access admin route
      expect(isAuthorizedRole('admin', ['admin'])).toBe(true);

      // Unauthenticated / null user attempting access
      expect(isAuthorizedRole(null, ['student'])).toBe(false);
      expect(isAuthorizedRole(undefined, ['admin'])).toBe(false);
    });
  });

  describe('Admin Authorization Claiming API', () => {
    it('returns 401 Unauthorized when attempting to claim admin without authentication', async () => {
      const res = await request(app)
        .post('/api/auth/claim-admin')
        .send({ adminSecret: 'campus-admin-2026-secret' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('returns 403 Forbidden when authenticated user provides an incorrect secret', async () => {
      const res = await request(app)
        .post('/api/auth/claim-admin')
        .set('Authorization', 'Bearer test-token:student-1:student')
        .send({ adminSecret: 'wrong-secret-code' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Invalid administrator authorization code');
    });

    it('returns 400 Bad Request when request body is missing adminSecret', async () => {
      const res = await request(app)
        .post('/api/auth/claim-admin')
        .set('Authorization', 'Bearer test-token:student-1:student')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Validation failed');
    });
  });
});
