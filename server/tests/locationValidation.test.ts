import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { clearMemoryStore } from '../src/services/issueService.js';
import {
  createIssueSchema,
  analyzeIssueSchema,
  formatStructuredLocation,
  getLocationHierarchy,
  ACADEMIC_BUILDINGS,
  HOSTEL_BLOCKS,
  LOCATION_TYPES,
  getSpecificAreasForLocation,
  isForbiddenLocationBlock,
  type Issue,
} from '@fixora/shared';

describe('VIT Bhopal Campus Location Structure - SOURCE OF TRUTH & Access Control', () => {
  const app = createApp();
  const studentToken = 'Bearer test-token:student-loc-uid:student';
  const adminToken = 'Bearer test-token:admin-loc-uid:admin';

  beforeEach(() => {
    clearMemoryStore();
  });

  const baseIssuePayload = {
    title: 'Faulty ceiling light tube',
    description: 'The tube light is constantly blinking and creating buzzing noise.',
    category: 'Electrical' as const,
    aiSuggestedSeverity: 'Medium' as const,
    severity: 'Medium' as const,
    aiSuggestedDepartment: 'Electrical' as const,
    department: 'Electrical' as const,
    specificLocation: 'Room 204',
  };

  describe('1. Confirmed Academic Block Acceptance', () => {
    it('1. Academic Block 1 (AB1) is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'Academic Block 1 (AB1)',
        specificArea: 'Classroom',
        floor: '2nd Floor',
        specificLocation: 'Room AB1-204',
      });
      expect(parsed.success).toBe(true);
    });

    it('2. Academic Block 2 (AB2) is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'Academic Block 2 (AB2)',
        specificArea: 'Laboratory',
        floor: 'Ground Floor',
        specificLocation: 'Lab AB2-005',
      });
      expect(parsed.success).toBe(true);
    });

    it('3. Lab Complex is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'Lab Complex',
        specificArea: 'Computer Lab',
        floor: '1st Floor',
        specificLocation: 'Lab 102',
      });
      expect(parsed.success).toBe(true);
    });

    it('4. Architecture Block is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'Architecture Block',
        specificArea: 'Studio',
        floor: '3rd Floor',
        specificLocation: 'Studio A3',
      });
      expect(parsed.success).toBe(true);
    });

    it('4b. Other Academic Location is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'Other Academic Location',
        specificArea: 'Common Area',
        floor: 'Ground Floor',
        specificLocation: 'East Corridor',
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('2. Confirmed Residential Hostel Blocks Acceptance', () => {
    it('5. Block 7A is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Hostel',
        buildingOrBlock: 'Block 7A',
        specificArea: 'Room',
        floor: '4th Floor',
        specificLocation: 'Room 412',
      });
      expect(parsed.success).toBe(true);
    });

    it('6. Block 7B is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Hostel',
        buildingOrBlock: 'Block 7B',
        specificArea: 'Bathroom',
        floor: '2nd Floor',
        specificLocation: 'Floor 2 Wing B Washroom',
      });
      expect(parsed.success).toBe(true);
    });

    it('7. Block 8A is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Hostel',
        buildingOrBlock: 'Block 8A',
        specificArea: 'Laundry',
        floor: 'Ground Floor',
        specificLocation: 'Washing Machine Area',
      });
      expect(parsed.success).toBe(true);
    });

    it('8. Block 8B is accepted', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Hostel',
        buildingOrBlock: 'Block 8B',
        specificArea: 'Room',
        floor: '3rd Floor',
        specificLocation: 'Near Room 312',
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts all standard hostel blocks (Block 1 through Block 6)', () => {
      ['Block 1', 'Block 2', 'Block 3', 'Block 4', 'Block 5', 'Block 6'].forEach((block) => {
        const parsed = createIssueSchema.safeParse({
          ...baseIssuePayload,
          locationType: 'Hostel',
          buildingOrBlock: block,
          specificArea: 'Room',
          floor: '1st Floor',
          specificLocation: 'Room 101',
        });
        expect(parsed.success).toBe(true);
      });
    });
  });

  describe('3. Strict Rejection of Non-Existent or Invalid Blocks', () => {
    it('9. AB3 is rejected', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'AB3',
      });
      expect(parsed.success).toBe(false);
      expect(isForbiddenLocationBlock('AB3')).toBe(true);
    });

    it('10. AB4 is rejected', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'AB4',
      });
      expect(parsed.success).toBe(false);
      expect(isForbiddenLocationBlock('AB4')).toBe(true);
    });

    it('11. AB5 is rejected', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Academic Area',
        buildingOrBlock: 'AB5',
      });
      expect(parsed.success).toBe(false);
      expect(isForbiddenLocationBlock('AB5')).toBe(true);
    });

    it('Academic Block 3, 4, and 5 full strings are rejected', () => {
      ['Academic Block 3', 'Academic Block 4', 'Academic Block 5'].forEach((invalid) => {
        const parsed = createIssueSchema.safeParse({
          ...baseIssuePayload,
          locationType: 'Academic Area',
          buildingOrBlock: invalid,
        });
        expect(parsed.success).toBe(false);
        expect(isForbiddenLocationBlock(invalid)).toBe(true);
      });
    });

    it('12. Hostel Block 7 is rejected (must be 7A or 7B)', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Hostel',
        buildingOrBlock: 'Hostel Block 7',
      });
      expect(parsed.success).toBe(false);
      expect(isForbiddenLocationBlock('Hostel Block 7')).toBe(true);
    });

    it('13. Hostel Block 8 is rejected (must be 8A or 8B)', () => {
      const parsed = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Hostel',
        buildingOrBlock: 'Hostel Block 8',
      });
      expect(parsed.success).toBe(false);
      expect(isForbiddenLocationBlock('Hostel Block 8')).toBe(true);
    });

    it('Block 7 without suffix and Block 8 without suffix are rejected', () => {
      expect(isForbiddenLocationBlock('Block 7')).toBe(true);
      expect(isForbiddenLocationBlock('Block 8')).toBe(true);
      expect(isForbiddenLocationBlock('Block 9')).toBe(true);
      expect(isForbiddenLocationBlock('Hostel Block 9')).toBe(true);

      const parsed9 = createIssueSchema.safeParse({
        ...baseIssuePayload,
        locationType: 'Hostel',
        buildingOrBlock: 'Block 9',
      });
      expect(parsed9.success).toBe(false);
    });

    it('analyzeIssueSchema also strictly rejects invalid blocks', () => {
      const parsed = analyzeIssueSchema.safeParse({
        title: 'Sparks in switchboard',
        description: 'Dangerous sparks flying out of power socket',
        locationType: 'Academic Area',
        buildingOrBlock: 'AB3',
        specificLocation: 'Room 301',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('4. End-to-End API Integration Workflow', () => {
    it('14. Student can submit an issue with structured location', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', studentToken)
        .send({
          ...baseIssuePayload,
          locationType: 'Hostel',
          buildingOrBlock: 'Block 8B',
          specificArea: 'Bathroom',
          floor: '3rd Floor',
          specificLocation: 'Near Room 312',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const created = res.body.issue;
      expect(created.locationType).toBe('Hostel');
      expect(created.buildingOrBlock).toBe('Block 8B');
      expect(created.specificArea).toBe('Bathroom');
      expect(created.floor).toBe('3rd Floor');
      expect(created.specificLocation).toBe('Near Room 312');
      expect(created.hostelBlock).toBe('Block 8B');
    });

    it('15. Admin can view structured location', async () => {
      const createRes = await request(app)
        .post('/api/issues')
        .set('Authorization', studentToken)
        .send({
          ...baseIssuePayload,
          locationType: 'Academic Area',
          buildingOrBlock: 'Academic Block 1 (AB1)',
          specificArea: 'Classroom',
          floor: '2nd Floor',
          specificLocation: 'Room AB1-204',
        });

      expect(createRes.status).toBe(201);
      const issueId = createRes.body.issue.id;

      const fetchRes = await request(app)
        .get('/api/issues/' + issueId)
        .set('Authorization', adminToken);

      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.success).toBe(true);
      const fetchedIssue: Issue = fetchRes.body.issue;
      expect(fetchedIssue.locationType).toBe('Academic Area');
      expect(fetchedIssue.buildingOrBlock).toBe('Academic Block 1 (AB1)');
      expect(fetchedIssue.specificArea).toBe('Classroom');
      expect(fetchedIssue.floor).toBe('2nd Floor');
      expect(fetchedIssue.specificLocation).toBe('Room AB1-204');

      const breadcrumb = formatStructuredLocation(fetchedIssue);
      expect(breadcrumb).toBe('Academic Area → Academic Block 1 (AB1) → Classroom → 2nd Floor (Room AB1-204)');
    });

    it('16. Existing issues without the new fields continue to work', async () => {
      const legacyRes = await request(app)
        .post('/api/issues')
        .set('Authorization', studentToken)
        .send({
          ...baseIssuePayload,
          locationType: 'Academic Block',
          academicBlock: 'Ramanujan Block',
          specificLocation: 'Lecture Hall 201, 2nd Floor',
        });

      expect(legacyRes.status).toBe(201);
      expect(legacyRes.body.success).toBe(true);
      const legacyIssue = legacyRes.body.issue;

      const fetchRes = await request(app)
        .get('/api/issues/' + legacyIssue.id)
        .set('Authorization', adminToken);

      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.issue.locationType).toBe('Academic Block');
      expect(fetchRes.body.issue.academicBlock).toBe('Ramanujan Block');

      const formatted = formatStructuredLocation(legacyIssue);
      expect(formatted).toContain('Academic Block');
      expect(formatted).toContain('Ramanujan Block');
      expect(formatted).toContain('Lecture Hall 201, 2nd Floor');
    });

    it('admin can filter issues by structured location terms', async () => {
      await request(app)
        .post('/api/issues')
        .set('Authorization', studentToken)
        .send({
          ...baseIssuePayload,
          title: 'Projector HDMI disconnected',
          locationType: 'Academic Area',
          buildingOrBlock: 'Academic Block 1 (AB1)',
          specificArea: 'Classroom',
          floor: '2nd Floor',
          specificLocation: 'AB1-204',
        });

      await request(app)
        .post('/api/issues')
        .set('Authorization', studentToken)
        .send({
          ...baseIssuePayload,
          title: 'Water cooler leaking water',
          locationType: 'Hostel',
          buildingOrBlock: 'Block 7B',
          specificArea: 'Water Cooler Area',
          floor: '1st Floor',
          specificLocation: 'Near Staircase A',
        });

      const ab1Res = await request(app)
        .get('/api/issues?search=AB1')
        .set('Authorization', adminToken);

      expect(ab1Res.status).toBe(200);
      expect(ab1Res.body.issues.length).toBe(1);
      expect(ab1Res.body.issues[0].title).toBe('Projector HDMI disconnected');

      const block7BRes = await request(app)
        .get('/api/issues?search=Block%207B')
        .set('Authorization', adminToken);

      expect(block7BRes.status).toBe(200);
      expect(block7BRes.body.issues.length).toBe(1);
      expect(block7BRes.body.issues[0].title).toBe('Water cooler leaking water');
    });
  });

  describe('5. UI Helper Utilities & Hierarchy Formatting', () => {
    it('formats full hierarchical breadcrumb accurately', () => {
      const formatted = formatStructuredLocation({
        locationType: 'Hostel',
        buildingOrBlock: 'Block 8B',
        specificArea: 'Bathroom',
        floor: '3rd Floor',
        specificLocation: 'Near Room 312',
      });
      expect(formatted).toBe('Hostel → Block 8B → Bathroom → 3rd Floor (Near Room 312)');
    });

    it('returns separated hierarchy and additional details via getLocationHierarchy', () => {
      const hierarchy = getLocationHierarchy({
        locationType: 'Academic Area',
        buildingOrBlock: 'Academic Block 1 (AB1)',
        specificArea: 'Classroom',
        floor: '2nd Floor',
        specificLocation: 'Room AB1-204',
      });

      expect(hierarchy.breadcrumb).toBe('Academic Area → Academic Block 1 (AB1) → Classroom → 2nd Floor');
      expect(hierarchy.additionalDetails).toBe('Room AB1-204');
    });

    it('provides specialized specific areas per building type', () => {
      const labAreas = getSpecificAreasForLocation('Academic Area', 'Lab Complex');
      expect(labAreas).toContain('Computer Lab');
      expect(labAreas).toContain('Other Lab Area');

      const archAreas = getSpecificAreasForLocation('Academic Area', 'Architecture Block');
      expect(archAreas).toContain('Studio');

      const hostelAreas = getSpecificAreasForLocation('Hostel');
      expect(hostelAreas).toContain('Water Cooler Area');
      expect(hostelAreas).toContain('Mess / Dining');
    });
  });
});