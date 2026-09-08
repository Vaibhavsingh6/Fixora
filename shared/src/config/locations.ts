/**
 * Configurable Campus Location Structure
 * Modifiable without code refactors.
 */

export const LOCATION_TYPES = [
  'Academic Block',
  'Hostel Block',
  'Common Area',
  'Other',
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export const ACADEMIC_BLOCKS = [
  'Block A (Main Academic Wing)',
  'Block B (Engineering Labs)',
  'Block C (Science Complex)',
  'Block D (Lecture Halls)',
] as const;

export type AcademicBlock = (typeof ACADEMIC_BLOCKS)[number];

export const HOSTEL_BLOCKS = [
  'Block 1 (Student Residence)',
  'Block 2 (Student Residence)',
  'Block 3 (Student Residence)',
  'Block 4 (Student Residence)',
] as const;

export type HostelBlock = (typeof HOSTEL_BLOCKS)[number];
