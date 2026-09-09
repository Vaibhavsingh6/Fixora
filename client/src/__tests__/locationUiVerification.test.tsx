import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { IssueHeader } from '../components/issue/IssueHeader';
import {
  LOCATION_TYPES,
  ACADEMIC_BUILDINGS,
  HOSTEL_BLOCKS,
  getSpecificAreasForLocation,
  type Issue,
} from '@fixora/shared';

describe('Manual UI Verification: Campus Location System', () => {
  describe('1. Location Dropdown Configurations', () => {
    it('provides all 9 approved location types', () => {
      expect(LOCATION_TYPES).toEqual([
        'Academic Area',
        'Hostel',
        'Food & Dining',
        'Sports & Recreation',
        'Library / Study',
        'Administration',
        'Common / Outdoor',
        'Health & Safety',
        'Other',
      ]);
    });

    it('provides approved Academic buildings without non-existent blocks', () => {
      expect(ACADEMIC_BUILDINGS).toEqual([
        'Academic Block 1 (AB1)',
        'Academic Block 2 (AB2)',
        'Lab Complex',
        'Architecture Block',
        'Other Academic Location',
      ]);
      expect(ACADEMIC_BUILDINGS).not.toContain('AB3');
      expect(ACADEMIC_BUILDINGS).not.toContain('AB4');
      expect(ACADEMIC_BUILDINGS).not.toContain('AB5');
      expect(ACADEMIC_BUILDINGS).not.toContain('Academic Block 3');
    });

    it('provides strictly the 10 approved Hostel residential blocks', () => {
      expect(HOSTEL_BLOCKS).toEqual([
        'Block 1',
        'Block 2',
        'Block 3',
        'Block 4',
        'Block 5',
        'Block 6',
        'Block 7A',
        'Block 7B',
        'Block 8A',
        'Block 8B',
      ]);
      expect(HOSTEL_BLOCKS).not.toContain('Block 7');
      expect(HOSTEL_BLOCKS).not.toContain('Block 8');
      expect(HOSTEL_BLOCKS).not.toContain('Block 9');
      expect(HOSTEL_BLOCKS).not.toContain('Hostel Block 7');
      expect(HOSTEL_BLOCKS).not.toContain('Hostel Block 8');
      expect(HOSTEL_BLOCKS).not.toContain('Hostel Block 9');
    });

    it('provides dynamic specific areas based on selected building', () => {
      // AB1 and AB2 standard areas
      const ab1Areas = getSpecificAreasForLocation('Academic Area', 'Academic Block 1 (AB1)');
      expect(ab1Areas).toContain('Classroom');
      expect(ab1Areas).toContain('Laboratory');
      expect(ab1Areas).toContain('Faculty Area');
      expect(ab1Areas).toContain('Washroom');

      // Lab Complex specialized areas
      const labAreas = getSpecificAreasForLocation('Academic Area', 'Lab Complex');
      expect(labAreas).toContain('Computer Lab');
      expect(labAreas).toContain('Other Lab Area');

      // Architecture Block specialized areas
      const archAreas = getSpecificAreasForLocation('Academic Area', 'Architecture Block');
      expect(archAreas).toContain('Studio');
      expect(archAreas).toContain('Classroom');

      // Hostel specialized areas
      const hostelAreas = getSpecificAreasForLocation('Hostel', 'Block 7A');
      expect(hostelAreas).toContain('Room');
      expect(hostelAreas).toContain('Bathroom');
      expect(hostelAreas).toContain('Water Cooler Area');
      expect(hostelAreas).toContain('Laundry');
      expect(hostelAreas).toContain('Mess / Dining');
    });
  });

  describe('2. Issue Detail & Admin Preview Rendering for Academic Buildings', () => {
    const createMockIssue = (overrides: Partial<Issue>): Issue => ({
      id: 'issue-preview-test',
      ticketId: 'FIX-884129',
      reporterId: 'student-uid-1',
      reporterName: 'Alex Student',
      reporterEmail: 'student@vitbhopal.ac.in',
      title: 'Facility Issue',
      description: 'Issue description details.',
      category: 'Electrical',
      aiSuggestedSeverity: 'Medium',
      severity: 'Medium',
      aiSuggestedDepartment: 'Electrical',
      department: 'Electrical',
      locationType: 'Academic Area',
      specificLocation: 'Details',
      status: 'Submitted',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });

    it('correctly displays Academic Block 1 (AB1) in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Academic Area',
        buildingOrBlock: 'Academic Block 1 (AB1)',
        specificArea: 'Classroom',
        floor: '2nd Floor',
        specificLocation: 'Room AB1-204',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Location:');
      expect(html).toContain('Academic Area → Academic Block 1 (AB1) → Classroom → 2nd Floor (Room AB1-204)');
    });

    it('correctly displays Academic Block 2 (AB2) in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Academic Area',
        buildingOrBlock: 'Academic Block 2 (AB2)',
        specificArea: 'Laboratory',
        floor: 'Ground Floor',
        specificLocation: 'Lab AB2-005',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Academic Area → Academic Block 2 (AB2) → Laboratory → Ground Floor (Lab AB2-005)');
    });

    it('correctly displays Lab Complex in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Academic Area',
        buildingOrBlock: 'Lab Complex',
        specificArea: 'Computer Lab',
        floor: '1st Floor',
        specificLocation: 'Lab 102',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Academic Area → Lab Complex → Computer Lab → 1st Floor (Lab 102)');
    });

    it('correctly displays Architecture Block in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Academic Area',
        buildingOrBlock: 'Architecture Block',
        specificArea: 'Studio',
        floor: '3rd Floor',
        specificLocation: 'Studio A3',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Academic Area → Architecture Block → Studio → 3rd Floor (Studio A3)');
    });
  });

  describe('3. Issue Detail & Admin Preview Rendering for Hostel Blocks', () => {
    const createMockIssue = (overrides: Partial<Issue>): Issue => ({
      id: 'issue-preview-test',
      ticketId: 'FIX-884129',
      reporterId: 'student-uid-1',
      reporterName: 'Alex Student',
      reporterEmail: 'student@vitbhopal.ac.in',
      title: 'Facility Issue',
      description: 'Issue description details.',
      category: 'Plumbing',
      aiSuggestedSeverity: 'Medium',
      severity: 'Medium',
      aiSuggestedDepartment: 'Plumbing',
      department: 'Plumbing',
      locationType: 'Hostel',
      specificLocation: 'Details',
      status: 'Submitted',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });

    it('correctly displays Block 7A in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Hostel',
        buildingOrBlock: 'Block 7A',
        specificArea: 'Room',
        floor: '4th Floor',
        specificLocation: 'Room 412',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Hostel → Block 7A → Room → 4th Floor (Room 412)');
    });

    it('correctly displays Block 7B in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Hostel',
        buildingOrBlock: 'Block 7B',
        specificArea: 'Bathroom',
        floor: '2nd Floor',
        specificLocation: 'Wing B Washroom',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Hostel → Block 7B → Bathroom → 2nd Floor (Wing B Washroom)');
    });

    it('correctly displays Block 8A in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Hostel',
        buildingOrBlock: 'Block 8A',
        specificArea: 'Laundry',
        floor: 'Ground Floor',
        specificLocation: 'Washing Area',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Hostel → Block 8A → Laundry → Ground Floor (Washing Area)');
    });

    it('correctly displays Block 8B in IssueHeader', () => {
      const issue = createMockIssue({
        locationType: 'Hostel',
        buildingOrBlock: 'Block 8B',
        specificArea: 'Bathroom',
        floor: '3rd Floor',
        specificLocation: 'Near Room 312',
      });

      const html = ReactDOMServer.renderToString(<IssueHeader issue={issue} />);
      expect(html).toContain('Hostel → Block 8B → Bathroom → 3rd Floor (Near Room 312)');
    });
  });
});