import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { isAllowedInstitutionalEmail, ALLOWED_INSTITUTION_DOMAIN, INSTITUTION_RESTRICTED_MESSAGE } from '@fixora/shared';

const app = createApp();

describe('VIT Bhopal Email Domain Access Control (@vitbhopal.ac.in)', () => {
  describe('Domain Normalization & Validation Helper (isAllowedInstitutionalEmail)', () => {
    it('1. accepts valid student @vitbhopal.ac.in email', () => {
      expect(isAllowedInstitutionalEmail('student@vitbhopal.ac.in')).toBe(true);
      expect(isAllowedInstitutionalEmail('rahul.sharma2024@vitbhopal.ac.in')).toBe(true);
    });

    it('accepts valid admin @vitbhopal.ac.in email', () => {
      expect(isAllowedInstitutionalEmail('admin@vitbhopal.ac.in')).toBe(true);
      expect(isAllowedInstitutionalEmail('estate.officer@vitbhopal.ac.in')).toBe(true);
    });

    it('accepts uppercase/mixed-case institutional email after normalization', () => {
      expect(isAllowedInstitutionalEmail('STUDENT@VITBHOPAL.AC.IN')).toBe(true);
      expect(isAllowedInstitutionalEmail('  Admin@VitBhopal.ac.in  ')).toBe(true);
    });

    it('2. rejects standard consumer email (Gmail)', () => {
      expect(isAllowedInstitutionalEmail('student@gmail.com')).toBe(false);
      expect(isAllowedInstitutionalEmail('admin@gmail.com')).toBe(false);
    });

    it('3. rejects parent university domain (@vit.ac.in)', () => {
      expect(isAllowedInstitutionalEmail('student@vit.ac.in')).toBe(false);
    });

    it('4. rejects commercial .com lookalike (@vitbhopal.com)', () => {
      expect(isAllowedInstitutionalEmail('student@vitbhopal.com')).toBe(false);
    });

    it('5. rejects attacker domain with institutional substring prefix (@vitbhopal.ac.in.evil.com)', () => {
      expect(isAllowedInstitutionalEmail('student@vitbhopal.ac.in.evil.com')).toBe(false);
    });

    it('6. rejects unofficial subdomain (sub.vitbhopal.ac.in)', () => {
      expect(isAllowedInstitutionalEmail('student@sub.vitbhopal.ac.in')).toBe(false);
      expect(isAllowedInstitutionalEmail('student@cse.vitbhopal.ac.in')).toBe(false);
    });

    it('rejects malformed inputs, missing local part, or multiple @ symbols', () => {
      expect(isAllowedInstitutionalEmail('')).toBe(false);
      expect(isAllowedInstitutionalEmail(null)).toBe(false);
      expect(isAllowedInstitutionalEmail(undefined)).toBe(false);
      expect(isAllowedInstitutionalEmail('@vitbhopal.ac.in')).toBe(false);
      expect(isAllowedInstitutionalEmail('vitbhopal.ac.in')).toBe(false);
      expect(isAllowedInstitutionalEmail('student@vitbhopal.ac.in@evil.com')).toBe(false);
    });
  });

  describe('Backend Endpoint Enforcement (requireAuth)', () => {
    it('7. rejects unverified institutional email with 403 Forbidden', async () => {
      const unverifiedToken = 'Bearer test-token:user-unverified:student:user@vitbhopal.ac.in:false';
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', unverifiedToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Email verification required');
    });

    it('8. rejects valid Firebase token with non-institutional email (e.g. Gmail) with 403 Forbidden', async () => {
      const nonVitToken = 'Bearer test-token:user-gmail:student:student@gmail.com:true';
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', nonVitToken);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(INSTITUTION_RESTRICTED_MESSAGE);
    });

    it('rejects token with attacker lookalike domain (@vitbhopal.ac.in.evil.com)', async () => {
      const evilToken = 'Bearer test-token:user-evil:student:student@vitbhopal.ac.in.evil.com:true';
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', evilToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe(INSTITUTION_RESTRICTED_MESSAGE);
    });

    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/issues');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('9. accepts verified institutional Firebase user (@vitbhopal.ac.in)', async () => {
      const validToken = 'Bearer test-token:student-vit-1:student:student@vitbhopal.ac.in:true';
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', validToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('10. existing student RBAC still works: verified student cannot access admin routes', async () => {
      const validStudentToken = 'Bearer test-token:student-vit-2:student:student@vitbhopal.ac.in:true';
      const res = await request(app)
        .get('/api/admin/system-status')
        .set('Authorization', validStudentToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('admin privileges');
    });

    it('11. existing admin RBAC still works: admin with @vitbhopal.ac.in can access admin routes', async () => {
      const validAdminToken = 'Bearer test-token:admin-vit-1:admin:admin@vitbhopal.ac.in:true';
      const res = await request(app)
        .get('/api/admin/system-status')
        .set('Authorization', validAdminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('admin with non-institutional email is rejected before role check', async () => {
      const nonVitAdminToken = 'Bearer test-token:admin-hacker:admin:admin@gmail.com:true';
      const res = await request(app)
        .get('/api/admin/system-status')
        .set('Authorization', nonVitAdminToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe(INSTITUTION_RESTRICTED_MESSAGE);
    });

    it('12. student cannot become admin without valid server secret', async () => {
      const studentToken = 'Bearer test-token:student-vit-3:student:student@vitbhopal.ac.in:true';
      const res = await request(app)
        .post('/api/auth/claim-admin')
        .set('Authorization', studentToken)
        .send({ adminSecret: 'wrong-secret-guess' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('13. image upload endpoint enforces verified institutional domain', async () => {
      const gmailToken = 'Bearer test-token:uploader-gmail:student:uploader@gmail.com:true';
      const res = await request(app)
        .post('/api/upload-image')
        .set('Authorization', gmailToken)
        .send({
          base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          mimeType: 'image/png',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe(INSTITUTION_RESTRICTED_MESSAGE);
    });

    it('14. image triage endpoint enforces verified institutional domain', async () => {
      const unverifiedToken = 'Bearer test-token:unverified-triage:student:triage@vitbhopal.ac.in:false';
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', unverifiedToken)
        .send({
          title: 'Projector not displaying in AB-101',
          description: 'The projector turns on but displays no signal on screen.',
          location: 'Academic Block 1',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Email verification required');
    });

    it('15. logout/session behavior: token revocation or header removal denies access', async () => {
      const token = 'Bearer test-token:student-session:student:student@vitbhopal.ac.in:true';
      const res1 = await request(app).get('/api/issues').set('Authorization', token);
      expect(res1.status).toBe(200);

      const res2 = await request(app).get('/api/issues');
      expect(res2.status).toBe(401);
    });
  });
});
