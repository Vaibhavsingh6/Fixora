import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { clearMemoryStore } from '../src/services/issueService.js';

describe('Fixora Phase 2 Core Issue Reporting & Management Workflow', () => {
  const app = createApp();

  const student1Token = 'Bearer test-token:student-uid-1:student';
  const student2Token = 'Bearer test-token:student-uid-2:student';
  const adminToken = 'Bearer test-token:admin-uid-1:admin';

  beforeEach(() => {
    clearMemoryStore();
  });

  const validIssuePayload = {
    title: 'Ceiling fan making vibrating sound',
    description: 'The ceiling fan in lecture hall 201 shakes violently when switched to speed 4 or 5.',
    category: 'Electrical',
    aiSuggestedSeverity: 'Medium',
    severity: 'Medium',
    aiSuggestedDepartment: 'Electrical',
    department: 'Electrical',
    locationType: 'Academic Block',
    academicBlock: 'Ramanujan Block',
    specificLocation: 'Lecture Hall 201, 2nd Floor',
  };

  describe('1. Issue Reporting (POST /api/issues)', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/issues').send(validIssuePayload);
      expect(res.status).toBe(401);
    });

    it('creates an issue with collision-safe FIX-XXXXXX ticket ID and initial status "Submitted"', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.issue).toBeDefined();

      const issue = res.body.issue;
      expect(issue.ticketId).toMatch(/^FIX-[2-9A-Z]{6}$/);
      expect(issue.status).toBe('Submitted');
      expect(issue.reporterId).toBe('student-uid-1');
      expect(issue.category).toBe('Electrical');
      expect(issue.department).toBe('Electrical');
    });

    it('rejects invalid issue payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send({
          title: 'Hi', // min 3
          description: 'Short', // min 10
          locationType: 'Invalid Location',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Issue Querying & RBAC Isolation (GET /api/issues)', () => {
    it('isolates student issues so students only see their own tickets', async () => {
      // Student 1 reports an issue
      await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      // Student 2 reports another issue
      await request(app)
        .post('/api/issues')
        .set('Authorization', student2Token)
        .send({
          ...validIssuePayload,
          title: 'Water tap leaking in washroom',
          category: 'Plumbing',
          department: 'Plumbing',
        });

      // Student 1 fetches issues
      const resStudent1 = await request(app)
        .get('/api/issues')
        .set('Authorization', student1Token);

      expect(resStudent1.status).toBe(200);
      expect(resStudent1.body.issues).toHaveLength(1);
      expect(resStudent1.body.issues[0].reporterId).toBe('student-uid-1');

      // Student 2 fetches issues
      const resStudent2 = await request(app)
        .get('/api/issues')
        .set('Authorization', student2Token);

      expect(resStudent2.status).toBe(200);
      expect(resStudent2.body.issues).toHaveLength(1);
      expect(resStudent2.body.issues[0].reporterId).toBe('student-uid-2');

      // Admin fetches issues -> sees both tickets
      const resAdmin = await request(app)
        .get('/api/issues')
        .set('Authorization', adminToken);

      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.issues.length).toBeGreaterThanOrEqual(2);
    });

    it('allows admin to filter issues by department and status', async () => {
      await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload); // Electrical

      await request(app)
        .post('/api/issues')
        .set('Authorization', student2Token)
        .send({
          ...validIssuePayload,
          title: 'Water pipe burst',
          category: 'Plumbing',
          department: 'Plumbing',
        });

      // Admin filter by department=Plumbing
      const res = await request(app)
        .get('/api/issues?department=Plumbing')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.issues).toHaveLength(1);
      expect(res.body.issues[0].department).toBe('Plumbing');
    });
  });

  describe('3. Issue Details & Timeline History (GET /api/issues/:id)', () => {
    it('prevents a student from accessing another student ticket with 403 Forbidden', async () => {
      // Student 1 creates issue
      const createdRes = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      const issueId = createdRes.body.issue.id;

      // Student 2 attempts to read student 1's issue
      const unauthorizedRes = await request(app)
        .get(`/api/issues/${issueId}`)
        .set('Authorization', student2Token);

      expect(unauthorizedRes.status).toBe(403);
      expect(unauthorizedRes.body.success).toBe(false);
      expect(unauthorizedRes.body.error).toContain('not authorized');
    });

    it('allows the reporter to view their own issue with initial timeline update', async () => {
      const createdRes = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      const issueId = createdRes.body.issue.id;

      const res = await request(app)
        .get(`/api/issues/${issueId}`)
        .set('Authorization', student1Token);

      expect(res.status).toBe(200);
      expect(res.body.issue.id).toBe(issueId);
      expect(res.body.updates).toHaveLength(1);
      expect(res.body.updates[0].status).toBe('Submitted');
    });
  });

  describe('4. Status Updates & Admin Overrides', () => {
    it('forbids a student from changing issue status or overriding details (403)', async () => {
      const createdRes = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      const issueId = createdRes.body.issue.id;

      // Student attempts status change
      const statusRes = await request(app)
        .patch(`/api/issues/${issueId}/status`)
        .set('Authorization', student1Token)
        .send({ status: 'Resolved', note: 'I fixed it myself' });

      expect(statusRes.status).toBe(403);

      // Student attempts detail override
      const overrideRes = await request(app)
        .patch(`/api/issues/${issueId}/override`)
        .set('Authorization', student1Token)
        .send({ severity: 'Critical' });

      expect(overrideRes.status).toBe(403);
    });

    it('allows admin to update status, record resolution note, and append to timeline', async () => {
      const createdRes = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      const issueId = createdRes.body.issue.id;

      // Admin updates status to In Progress
      const update1 = await request(app)
        .patch(`/api/issues/${issueId}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'In Progress',
          note: 'Technician dispatched to inspect the fan regulator and bearings.',
        });

      expect(update1.status).toBe(200);
      expect(update1.body.issue.status).toBe('In Progress');

      // Admin updates status to Resolved
      const update2 = await request(app)
        .patch(`/api/issues/${issueId}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'Resolved',
          note: 'Fan capacitor and mounting bolts replaced. Tested working at all speeds.',
          resolutionNote: 'Completed repair work on mounting bolts and capacitor.',
        });

      expect(update2.status).toBe(200);
      expect(update2.body.issue.status).toBe('Resolved');
      expect(update2.body.issue.resolutionNote).toContain('Completed repair work');

      // Verify full timeline contains all 3 events
      const detailRes = await request(app)
        .get(`/api/issues/${issueId}`)
        .set('Authorization', adminToken);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.updates).toHaveLength(3);
      expect(detailRes.body.updates[1].status).toBe('In Progress');
      expect(detailRes.body.updates[2].status).toBe('Resolved');
    });

    it('allows admin to override department and severity with audit note', async () => {
      const createdRes = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      const issueId = createdRes.body.issue.id;

      const overrideRes = await request(app)
        .patch(`/api/issues/${issueId}/override`)
        .set('Authorization', adminToken)
        .send({
          severity: 'High',
          note: 'Risk of fan detachment in occupied lecture hall',
        });

      expect(overrideRes.status).toBe(200);
      expect(overrideRes.body.issue.severity).toBe('High');

      const detailRes = await request(app)
        .get(`/api/issues/${issueId}`)
        .set('Authorization', adminToken);

      expect(detailRes.body.updates).toHaveLength(2);
      expect(detailRes.body.updates[1].note).toContain('Details overridden by admin');
    });

    it('allows admin to assign a technician and advances status to Assigned', async () => {
      const createdRes = await request(app)
        .post('/api/issues')
        .set('Authorization', student1Token)
        .send(validIssuePayload);

      const issueId = createdRes.body.issue.id;

      const assignRes = await request(app)
        .patch(`/api/issues/${issueId}/assign`)
        .set('Authorization', adminToken)
        .send({ personId: 'staff-elec-1' });

      expect(assignRes.status).toBe(200);
      expect(assignRes.body.issue.status).toBe('Assigned');
      expect(assignRes.body.issue.assignedToName).toContain('Rajesh Kumar');
    });
  });

  describe('5. Responsible People Directory (GET /api/responsible-people)', () => {
    it('returns campus facility staff directory for authenticated users', async () => {
      const res = await request(app)
        .get('/api/responsible-people')
        .set('Authorization', student1Token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.people)).toBe(true);
      expect(res.body.people.length).toBeGreaterThan(0);
      expect(res.body.people[0]).toHaveProperty('department');
      expect(res.body.people[0]).toHaveProperty('phone');
    });
  });
});
