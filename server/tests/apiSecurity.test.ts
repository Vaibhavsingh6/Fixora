import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API Security & Token Authorization', () => {
  const app = createApp();

  const studentToken = 'Bearer test-token:student-uid-123:student';
  const adminToken = 'Bearer test-token:admin-uid-999:admin';
  const invalidToken = 'Bearer invalid-garbage-token';

  describe('Unauthenticated Request Handling (401)', () => {
    it('rejects GET /api/user/profile without Authorization header with 401', async () => {
      const res = await request(app).get('/api/user/profile');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Authentication required');
    });

    it('rejects GET /api/user/profile with an invalid/malformed token with 401', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', invalidToken);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Invalid or expired authentication token');
    });

    it('rejects GET /api/admin/system-status without token with 401', async () => {
      const res = await request(app).get('/api/admin/system-status');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('rejects POST /api/auth/claim-admin without token with 401', async () => {
      const res = await request(app)
        .post('/api/auth/claim-admin')
        .send({ adminSecret: 'campus-admin-2026-secret' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Role Authorization & RBAC Enforcement (403 vs 200)', () => {
    it('allows authenticated student to access their own protected profile (200)', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', studentToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toEqual({
        uid: 'student-uid-123',
        email: 'student-uid-123@vitbhopal.ac.in',
        role: 'student',
      });
    });

    it('rejects authenticated student attempting to access admin-only endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/system-status')
        .set('Authorization', studentToken);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Access forbidden: requires admin privileges');
    });

    it('allows legitimate authenticated admin to access admin-only endpoint with 200 OK', async () => {
      const res = await request(app)
        .get('/api/admin/system-status')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('systemMetrics');
      expect(res.body.adminUid).toBe('admin-uid-999');
    });

    it('does NOT trust client-spoofed body parameters (identity comes from verified token)', async () => {
      // Attacker tries to pass body spoofing admin identity
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', studentToken)
        .send({ role: 'admin', uid: 'admin-999', isAdmin: true });

      expect(res.status).toBe(200);
      // Server derived role strictly from the verified token, ignoring request body
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.uid).toBe('student-uid-123');
    });
  });

  describe('Server-Verified Admin Claiming Flow', () => {
    it('returns 403 if authenticated user supplies an incorrect admin secret', async () => {
      const res = await request(app)
        .post('/api/auth/claim-admin')
        .set('Authorization', studentToken)
        .send({ adminSecret: 'wrong-secret-code' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Invalid administrator authorization code');
    });

    it('returns 200 and grants admin role if authenticated user supplies the valid server secret', async () => {
      const res = await request(app)
        .post('/api/auth/claim-admin')
        .set('Authorization', studentToken)
        .send({ adminSecret: 'campus-admin-2026-secret' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.role).toBe('admin');
    });
  });
});
