import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { clearTriageCache } from '../src/services/geminiService.js';
import { clearMemoryImageStore } from '../src/services/storageService.js';

describe('Phase 4B: Final UI/UX Regression & Security Verification', () => {
  const app = createApp();
  const student1Token = 'Bearer test-token:student-uid-401:student';
  const student2Token = 'Bearer test-token:student-uid-402:student';
  const adminToken = 'Bearer test-token:admin-uid-499:admin';

  let testIssueId: string;
  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeAll(async () => {
    clearTriageCache();
    clearMemoryImageStore();

    // 1. Upload sample image as student 1
    const uploadRes = await request(app)
      .post('/api/upload-image')
      .set('Authorization', student1Token)
      .send({
        imageBase64: samplePngBase64,
        mimeType: 'image/png',
      });
    expect(uploadRes.status).toBe(200);
    const { storagePath, contentType } = uploadRes.body.data;

    // 2. Create ticket with photo and multimodal observations
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', student1Token)
      .send({
        title: 'Broken electrical socket in Lab 2',
        description: 'Socket is cracked and sparked when plugging in oscilloscope.',
        improvedDescription:
          'Severely cracked high-voltage power outlet in Lab 2 presenting visible spark and electrical shock hazard.',
        category: 'Electrical',
        aiSuggestedSeverity: 'High',
        severity: 'High',
        aiSuggestedDepartment: 'Electrical',
        department: 'Electrical',
        locationType: 'Academic Block',
        academicBlock: 'Aryabhata Block',
        specificLocation: 'Lab 2, 2nd Floor',
        hasImage: true,
        imageStoragePath: storagePath,
        imageContentType: contentType,
        visualObservations: [
          'Visible fissure along faceplate of duplex outlet',
          'Charring marks near grounding pin receptacle',
        ],
      });
    expect(issueRes.status).toBe(201);
    testIssueId = issueRes.body.issue.id;
  });

  beforeEach(() => {
    clearTriageCache();
  });

  describe('1. Image Endpoint Security (Lightbox Data Access)', () => {
    it('allows issue reporter to fetch photograph for lightbox viewing', async () => {
      const res = await request(app)
        .get(`/api/issues/${testIssueId}/image`)
        .set('Authorization', student1Token);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
    });

    it('allows administrator to fetch photograph for lightbox viewing', async () => {
      const res = await request(app)
        .get(`/api/issues/${testIssueId}/image`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
    });

    it('blocks unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get(`/api/issues/${testIssueId}/image`);
      expect(res.status).toBe(401);
    });

    it('blocks other students from accessing another student issue photo with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/issues/${testIssueId}/image`)
        .set('Authorization', student2Token);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Issue Data Integrity & AI Metadata Preservation', () => {
    it('preserves visual observations and improved description in issue details', async () => {
      const res = await request(app)
        .get(`/api/issues/${testIssueId}`)
        .set('Authorization', student1Token);

      expect(res.status).toBe(200);
      const issue = res.body.issue;
      expect(issue.hasImage).toBe(true);
      expect(issue.visualObservations).toHaveLength(2);
      expect(issue.visualObservations[0]).toBe('Visible fissure along faceplate of duplex outlet');
      expect(issue.improvedDescription).toContain('Severely cracked high-voltage power outlet');
    });

    it('supports status query filtering matching StatusFilterChips', async () => {
      const res = await request(app)
        .get('/api/issues?status=Submitted')
        .set('Authorization', student1Token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.issues)).toBe(true);
      for (const issue of res.body.issues) {
        expect(issue.status).toBe('Submitted');
      }
    });
  });

  describe('3. Admin Dispatch & Action Guarding', () => {
    it('blocks students from performing admin status updates with 403', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', student1Token)
        .send({
          status: 'In Progress',
          note: 'Student trying to self-assign',
        });

      expect(res.status).toBe(403);
    });

    it('allows admin to transition status with mandatory resolution note on Resolved', async () => {
      // 1. In Progress
      const updateRes = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'In Progress',
          note: 'Electrician dispatched to Lab 2',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.issue.status).toBe('In Progress');

      // 2. Invalid status update must fail schema validation with 400
      const failStatusRes = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'NonExistentStatus',
          note: 'Job done',
        });
      expect(failStatusRes.status).toBe(400);

      // 3. Resolved with resolution note succeeds
      const resolveRes = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'Resolved',
          note: 'Work completed',
          resolutionNote: 'Replaced cracked faceplate and tested outlet grounding. Safety verified.',
        });
      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.issue.status).toBe('Resolved');
      expect(resolveRes.body.issue.resolutionNote).toBe(
        'Replaced cracked faceplate and tested outlet grounding. Safety verified.'
      );
    });
  });
});
