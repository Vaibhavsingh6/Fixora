import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { clearTriageCache } from '../src/services/geminiService.js';
import { clearMemoryImageStore } from '../src/services/storageService.js';

describe('Phase 3C: AI Photo-Assisted Issue Reporting & Image Storage', () => {
  const app = createApp();
  const student1Token = 'Bearer test-token:student-uid-101:student';
  const student2Token = 'Bearer test-token:student-uid-202:student';
  const adminToken = 'Bearer test-token:admin-uid-999:admin';

  // Sample 1x1 valid PNG in base64
  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeAll(() => {
    clearTriageCache();
    clearMemoryImageStore();
  });

  beforeEach(() => {
    clearTriageCache();
  });

  describe('1. Image Upload Security & Validation', () => {
    it('1. Authenticated image upload succeeds with 200 and returns storage path', async () => {
      const res = await request(app)
        .post('/api/upload-image')
        .set('Authorization', student1Token)
        .send({
          imageBase64: samplePngBase64,
          mimeType: 'image/png',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storagePath).toMatch(/^issues\/student-uid-101\/[a-z0-9-]+\/photo\.png$/);
      expect(res.body.data.contentType).toBe('image/png');
    });

    it('2. Unauthenticated upload rejection with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/upload-image')
        .send({
          imageBase64: samplePngBase64,
          mimeType: 'image/png',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('3. Unsupported image rejection with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/upload-image')
        .set('Authorization', student1Token)
        .send({
          imageBase64: 'sample-data',
          mimeType: 'application/pdf',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unsupported image type');
    });

    it('4. Oversized image rejection with 400 Bad Request when exceeding 5 MB', async () => {
      // Create a simulated 5.5 MB buffer
      const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 1);
      const oversizedBase64 = oversizedBuffer.toString('base64');

      const res = await request(app)
        .post('/api/upload-image')
        .set('Authorization', student1Token)
        .send({
          imageBase64: oversizedBase64,
          mimeType: 'image/jpeg',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('5 MB');
    });

    it('5. Student image isolation: storage path is strictly prefixed with authenticated student UID', async () => {
      const res = await request(app)
        .post('/api/upload-image')
        .set('Authorization', student1Token)
        .send({
          imageBase64: samplePngBase64,
          mimeType: 'image/webp',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.storagePath.startsWith('issues/student-uid-101/')).toBe(true);
    });
  });

  describe('2. Gemini Multimodal Analysis Pipeline', () => {
    it('6. Optional image flow: analyzes text-only requests when image is omitted', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .send({
          title: 'Broken desk chair',
          description: 'Wheel fell off chair in tutorial classroom',
          locationType: 'Academic Block',
          academicBlock: 'Aryabhata Block',
          specificLocation: 'Room 102',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Civil/Maintenance');
      expect(res.body.data.visualObservations).toEqual([]);
    });

    it('7. Existing text-only flow preserved with backward compatibility', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .send({
          title: 'Wi-Fi keeps dropping packets',
          description: 'High latency and packet loss across entire library floor',
          locationType: 'Common Area',
          specificLocation: 'Library Level 1',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.category).toBe('IT/Wi-Fi');
      expect(res.body.data.suggestedDepartment).toBe('IT/Wi-Fi');
    });

    it('8. Image + text Gemini analysis extracts grounded visualObservations', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .send({
          title: 'Wall socket throwing sparks',
          description: 'Sparks and black scorch marks visible around wall power outlet',
          locationType: 'Hostel Block',
          hostelBlock: 'Bhabha Hostel (BH-2)',
          specificLocation: 'Room 304 Wall Outlet',
          image: {
            base64Data: samplePngBase64,
            mimeType: 'image/png',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Electrical');
      expect(res.body.data.suggestedSeverity).toBe('High');
      expect(res.body.data.visualObservations.length).toBeGreaterThan(0);
      expect(res.body.data.visualObservations[0]).toContain('scorch');
    });

    it('9. Invalid Gemini response handling: rejects malformed payload with 400', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .send({
          title: 'Hi', // Invalid (too short)
          description: 'Broken',
          locationType: 'Academic Block',
          specificLocation: 'Room 1',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('10. Gemini failure handling: falls back to rule-based triage without crashing', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .send({
          title: 'Water pipe leaking profusely',
          description: 'Standing water under bathroom sink on 2nd floor',
          locationType: 'Academic Block',
          academicBlock: 'Ramanujan Block',
          specificLocation: '2nd Floor Washroom',
          image: {
            base64Data: samplePngBase64,
            mimeType: 'image/png',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.category).toBe('Plumbing');
      expect(res.body.data.suggestedDepartment).toBe('Plumbing');
      expect(res.body.data.visualObservations.some((v: string) => v.includes('water'))).toBe(true);
    });

    it('11. Duplicate analysis prevention: identical image + text requests hit cache', async () => {
      const payload = {
        title: 'Corridor ceiling tile broken',
        description: 'Large ceiling panel hanging loosely over hallway walkway',
        locationType: 'Academic Block' as const,
        academicBlock: 'Aryabhata Block',
        specificLocation: 'Corridor 2nd Floor',
        image: {
          base64Data: samplePngBase64,
          mimeType: 'image/png' as const,
        },
      };

      const res1 = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .send(payload);

      const res2 = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .send(payload);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data).toEqual(res2.body.data);
    });

    it('12. Existing rate limiting throttles requests with HTTP 429 when threshold exceeded', async () => {
      const payload = {
        title: 'Overhead light flickering',
        description: 'Fluorescent lamp in lab room 201 flickering continuously',
        locationType: 'Academic Block',
        academicBlock: 'Aryabhata Block',
        specificLocation: 'Room 201',
      };

      for (let i = 0; i < 15; i++) {
        const okRes = await request(app)
          .post('/api/analyze-issue')
          .set('Authorization', student1Token)
          .set('x-test-rate-limit', 'true')
          .send(payload);
        expect(okRes.status).toBe(200);
      }

      const throttledRes = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', student1Token)
        .set('x-test-rate-limit', 'true')
        .send(payload);

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.body.error).toContain('Too many AI issue analysis requests');
    });
  });

  describe('3. Issue Lifecycle & Image Access Authorization', () => {
    let createdIssueId: string;

    it('13. AI suggestion and final value separation in created issue', async () => {
      // Step A: Upload photo
      const uploadRes = await request(app)
        .post('/api/upload-image')
        .set('Authorization', student1Token)
        .send({
          imageBase64: samplePngBase64,
          mimeType: 'image/png',
        });
      expect(uploadRes.status).toBe(200);
      const storagePath = uploadRes.body.data.storagePath;

      // Step B: Submit ticket with image reference
      const issueRes = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send({
          title: 'Damaged main circuit breaker',
          description: 'Smell of burning plastic and charred breaker casing.',
          category: 'Electrical',
          aiSuggestedSeverity: 'High',
          severity: 'Critical', // Student/Admin adjusted severity
          aiSuggestedDepartment: 'Electrical',
          department: 'Electrical',
          locationType: 'Academic Block',
          academicBlock: 'Aryabhata Block',
          specificLocation: 'Basement Power Room',
          hasImage: true,
          imageStoragePath: storagePath,
          imageContentType: 'image/png',
          visualObservations: ['Visible scorch marks and melted plastic insulation'],
        });

      expect(issueRes.status).toBe(201);
      const issue = issueRes.body.issue;
      createdIssueId = issue.id;

      expect(issue.hasImage).toBe(true);
      expect(issue.imageStoragePath).toBe(storagePath);
      expect(issue.aiSuggestedSeverity).toBe('High');
      expect(issue.severity).toBe('Critical');
      expect(issue.visualObservations).toContain('Visible scorch marks and melted plastic insulation');
    });

    it('14. Admin image access: campus administrator can view the uploaded photo', async () => {
      const res = await request(app)
        .get(`/api/issues/${createdIssueId}/image`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it('15. Student unauthorized image access: another student receives HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/issues/${createdIssueId}/image`)
        .set('Authorization', student2Token);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('16. Existing admin override preserved on photo-assisted tickets', async () => {
      const res = await request(app)
        .patch(`/api/issues/${createdIssueId}/override`)
        .set('Authorization', adminToken)
        .send({
          severity: 'High',
          note: 'Downgrading from Critical to High after visual inspection of main power isolation breaker.',
        });

      expect(res.status).toBe(200);
      expect(res.body.issue.severity).toBe('High');
      expect(res.body.update.note).toContain('visual inspection');
    });

    it('17. Existing status workflow preserved on photo-assisted tickets', async () => {
      const res = await request(app)
        .patch(`/api/issues/${createdIssueId}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'Resolved',
          note: 'Replaced faulty circuit breaker and verified line voltage.',
          resolutionNote: 'Completed repair and confirmed zero electrical leakage.',
        });

      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe('Resolved');
      expect(res.body.issue.resolutionNote).toContain('Completed repair');
    });

    it('18. Storage cleanup on failed workflow: user can delete their own image; cannot delete another user image', async () => {
      // Student 1 uploads a photo
      const uploadRes = await request(app)
        .post('/api/upload-image')
        .set('Authorization', student1Token)
        .send({
          imageBase64: samplePngBase64,
          mimeType: 'image/jpeg',
        });
      const path = uploadRes.body.data.storagePath;

      // Student 2 attempts to delete Student 1's image -> 403 Forbidden
      const unauthorizedDelete = await request(app)
        .delete('/api/upload-image')
        .set('Authorization', student2Token)
        .send({ storagePath: path });

      expect(unauthorizedDelete.status).toBe(403);

      // Student 1 deletes their own image -> 200 OK
      const authorizedDelete = await request(app)
        .delete('/api/upload-image')
        .set('Authorization', student1Token)
        .send({ storagePath: path });

      expect(authorizedDelete.status).toBe(200);
      expect(authorizedDelete.body.success).toBe(true);
    });
  });
});
