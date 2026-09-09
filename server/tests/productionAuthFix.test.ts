import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { adminAuth, adminDb, resolveFirebaseProjectId } from '../src/config/firebaseAdmin.js';

describe('Production Authentication & Project ID Alignment', () => {
  const app = createApp();

  describe('1. Authoritative Firebase Project ID Resolution', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('uses FIREBASE_PROJECT_ID as the authoritative source when provided', () => {
      process.env.FIREBASE_PROJECT_ID = 'authoritative-prod-proj';
      delete process.env.VITE_FIREBASE_PROJECT_ID;

      expect(resolveFirebaseProjectId()).toBe('authoritative-prod-proj');
    });

    it('falls back to VITE_FIREBASE_PROJECT_ID if FIREBASE_PROJECT_ID is omitted', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      process.env.VITE_FIREBASE_PROJECT_ID = 'unified-vercel-proj';

      expect(resolveFirebaseProjectId()).toBe('unified-vercel-proj');
    });

    it('prioritizes FIREBASE_PROJECT_ID over VITE_FIREBASE_PROJECT_ID when both are set', () => {
      process.env.FIREBASE_PROJECT_ID = 'primary-server-proj';
      process.env.VITE_FIREBASE_PROJECT_ID = 'secondary-vite-proj';

      expect(resolveFirebaseProjectId()).toBe('primary-server-proj');
    });

    it('throws a fatal error in production if no project ID is provided (no unsafe fallback)', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.VITE_FIREBASE_PROJECT_ID;

      expect(() => resolveFirebaseProjectId()).toThrow(
        /Missing FIREBASE_PROJECT_ID in production environment/
      );
    });

    it('uses fixora-test in test/development if no project ID is provided', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.VITE_FIREBASE_PROJECT_ID;

      expect(resolveFirebaseProjectId()).toBe('fixora-test');
    });
  });

  describe('2. Demo Token Restriction by Environment & Controlled DEMO_MODE', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('preserves test token support in development/test environment', async () => {
      process.env.NODE_ENV = 'test';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer test-token:student-uid-123:student');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.uid).toBe('student-uid-123');
    });

    it('strictly rejects demo tokens in production when DEMO_MODE is absent (default secure state)', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DEMO_MODE;
      delete process.env.ENABLE_DEMO_MODE;

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer demo-token:demo-admin-999:admin');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });

    it('strictly rejects demo tokens in production when DEMO_MODE is explicitly false', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEMO_MODE = 'false';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer demo-token:demo-admin-999:admin');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });

    it('strictly rejects test tokens in production even if DEMO_MODE is true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEMO_MODE = 'true';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer test-token:admin-uid:admin');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });

    it('allows predefined admin demo identity in production when DEMO_MODE is true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEMO_MODE = 'true';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer demo-token:demo-admin-999:admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.uid).toBe('demo-admin-999');
      expect(res.body.user.email).toBe('admin@vitbhopal.ac.in');
      expect(res.body.user.role).toBe('admin');
    });

    it('allows predefined student demo identity in production when DEMO_MODE is true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEMO_MODE = 'true';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer demo-token:demo-student-101:student');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.uid).toBe('demo-student-101');
      expect(res.body.user.email).toBe('student@vitbhopal.ac.in');
      expect(res.body.user.role).toBe('student');
    });

    it('SECURITY: prevents role spoofing - student token claiming admin role is authoritatively forced to student', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEMO_MODE = 'true';

      // Malicious attempt: student UID with forged ':admin' role
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer demo-token:demo-student-101:admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.uid).toBe('demo-student-101');
      // Server-authoritative role must remain 'student':
      expect(res.body.user.role).toBe('student');
    });

    it('SECURITY: strictly rejects arbitrary demo user IDs with 401', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEMO_MODE = 'true';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer demo-token:unauthorized-attacker:admin');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });
  });

  describe('3. Firebase Token Verification & Categorized Diagnostic Logging', () => {
    let verifySpy;

    beforeEach(() => {
      verifySpy = vi.spyOn(adminAuth, 'verifyIdToken');
    });

    afterEach(() => {
      verifySpy.mockRestore();
    });

    it('accepts valid token from configured project and resolves identity', async () => {
      verifySpy.mockResolvedValueOnce({
        uid: 'firebase-admin-123',
        email: 'admin.user@vitbhopal.ac.in',
        email_verified: true,
        role: 'admin',
      });

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer valid-firebase-prod-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('admin.user@vitbhopal.ac.in');
      expect(res.body.user.role).toBe('admin');
    });

    it('rejects token with audience/project mismatch and returns 401', async () => {
      const err = new Error(
        'Firebase ID token has incorrect "aud" (audience) claim. Expected "fixora-prod" but got "other-project".'
      );
      err.code = 'auth/argument-error';
      verifySpy.mockRejectedValueOnce(err);

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer jwt-from-wrong-project');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });

    it('rejects expired token and returns 401', async () => {
      const err = new Error('Firebase ID token has expired.');
      err.code = 'auth/id-token-expired';
      verifySpy.mockRejectedValueOnce(err);

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer expired-jwt-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });

    it('rejects malformed token and returns 401', async () => {
      const err = new Error('Decoding Firebase ID token failed.');
      err.code = 'auth/argument-error';
      verifySpy.mockRejectedValueOnce(err);

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer not-a-valid-jwt');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });

    it('rejects token with invalid signature and returns 401', async () => {
      const err = new Error('Firebase ID token has invalid signature.');
      err.code = 'auth/invalid-id-token';
      verifySpy.mockRejectedValueOnce(err);

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer tampered-jwt');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired authentication token');
    });

    it('rejects request with missing Bearer token with 401', async () => {
      const res = await request(app).get('/api/user/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Authentication required');
    });
  });

  describe('4. RBAC & Institutional Domain Enforcement', () => {
    let verifySpy;
    let docSpy;

    beforeEach(() => {
      verifySpy = vi.spyOn(adminAuth, 'verifyIdToken');
      docSpy = vi.spyOn(adminDb, 'collection').mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ exists: false }),
        }),
      } as any);
    });

    afterEach(() => {
      verifySpy.mockRestore();
      docSpy.mockRestore();
    });

    it('blocks unverified email address with 403', async () => {
      verifySpy.mockResolvedValueOnce({
        uid: 'unverified-uid',
        email: 'student@vitbhopal.ac.in',
        email_verified: false,
      });

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer valid-jwt-unverified-email');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Email verification required');
    });

    it('blocks non-institutional domain with 403', async () => {
      verifySpy.mockResolvedValueOnce({
        uid: 'external-uid',
        email: 'outsider@gmail.com',
        email_verified: true,
      });

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer outsider-jwt');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('@vitbhopal.ac.in');
    });

    it('allows student to access student endpoints but forbids admin endpoints', async () => {
      verifySpy.mockResolvedValueOnce({
        uid: 'verified-student-uid',
        email: 'student.2024@vitbhopal.ac.in',
        email_verified: true,
      });

      // Student profile: Allowed (200)
      const profileRes = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer valid-student-jwt');

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.user.role).toBe('student');

      // Admin system status: Forbidden (403)
      verifySpy.mockResolvedValueOnce({
        uid: 'verified-student-uid',
        email: 'student.2024@vitbhopal.ac.in',
        email_verified: true,
      });

      const adminRes = await request(app)
        .get('/api/admin/system-status')
        .set('Authorization', 'Bearer valid-student-jwt');

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.error).toContain('requires admin privileges');
    });

    it('allows admin to access admin-only endpoints', async () => {
      verifySpy.mockResolvedValueOnce({
        uid: 'verified-admin-uid',
        email: 'admin.estate@vitbhopal.ac.in',
        email_verified: true,
        role: 'admin',
      });

      const adminRes = await request(app)
        .get('/api/admin/system-status')
        .set('Authorization', 'Bearer valid-admin-jwt');

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.adminUid).toBe('verified-admin-uid');
      expect(adminRes.body).toHaveProperty('systemMetrics');
    });
  });
});
