/**
 * VIT Bhopal Campus Location Structure - SOURCE OF TRUTH
 * Confirmed official campus hierarchy for Fixora deployment.
 */

export const LOCATION_TYPES = [
  'Academic Area',
  'Hostel',
  'Food & Dining',
  'Sports & Recreation',
  'Library / Study',
  'Administration',
  'Common / Outdoor',
  'Health & Safety',
  'Other',
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

// Legacy location types retained strictly for backward compatibility with older tickets
export const LEGACY_LOCATION_TYPES = [
  'Academic Block',
  'Hostel Block',
  'Common Area',
] as const;

export type LegacyLocationType = (typeof LEGACY_LOCATION_TYPES)[number];

export const ALL_LOCATION_TYPES = [
  ...LOCATION_TYPES,
  ...LEGACY_LOCATION_TYPES,
] as const;

export type AnyLocationType = (typeof ALL_LOCATION_TYPES)[number];

/**
 * Approved Academic Area Buildings & Blocks
 */
export const ACADEMIC_BUILDINGS = [
  'Academic Block 1 (AB1)',
  'Academic Block 2 (AB2)',
  'Lab Complex',
  'Architecture Block',
  'Other Academic Location',
] as const;

export type AcademicBuilding = (typeof ACADEMIC_BUILDINGS)[number];

// Retain ACADEMIC_BLOCKS as alias for backward compatibility
export const ACADEMIC_BLOCKS = ACADEMIC_BUILDINGS;
export type AcademicBlock = (typeof ACADEMIC_BLOCKS)[number];

/**
 * Approved Residential Hostel Blocks (strictly these 10)
 */
export const HOSTEL_BLOCKS = [
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
] as const;

export type HostelBlock = (typeof HOSTEL_BLOCKS)[number];

/**
 * Specific Areas by Location Category & Building
 */
export const HOSTEL_SPECIFIC_AREAS = [
  'Room',
  'Bathroom',
  'Corridor',
  'Staircase',
  'Lift',
  'Common Room',
  'Mess / Dining',
  'Laundry',
  'Water Cooler Area',
  'Entrance',
  'Other',
] as const;

export const ACADEMIC_STANDARD_AREAS = [
  'Classroom',
  'Laboratory',
  'Faculty Area',
  'Corridor',
  'Staircase',
  'Lift',
  'Washroom',
  'Common Area',
  'Other',
] as const;

export const LAB_COMPLEX_AREAS = [
  'Laboratory',
  'Computer Lab',
  'Other Lab Area',
  'Corridor',
  'Staircase',
  'Lift',
  'Washroom',
  'Other',
] as const;

export const ARCHITECTURE_BLOCK_AREAS = [
  'Studio',
  'Classroom',
  'Faculty Area',
  'Corridor',
  'Staircase',
  'Washroom',
  'Other',
] as const;

export const FOOD_DINING_AREAS = [
  'Mess',
  'Food Court',
  'Canteen',
  'Café',
  'Other',
] as const;

export const SPORTS_RECREATION_AREAS = [
  'Sports Ground',
  'Basketball Court',
  'Volleyball Court',
  'Badminton Court',
  'Gym',
  'Indoor Sports',
  'Other',
] as const;

export const LIBRARY_STUDY_AREAS = [
  'Library',
  'Reading Area',
  'Study Area',
  'Discussion Area',
  'Other',
] as const;

export const ADMINISTRATION_AREAS = [
  'Administrative Office',
  'Admissions Office',
  'Accounts / Finance',
  'Academic Office',
  'Hostel Office',
  'Student Services',
  'Security Office',
  'Other',
] as const;

export const COMMON_OUTDOOR_AREAS = [
  'Main Gate',
  'Campus Road',
  'Parking',
  'Garden / Green Area',
  'Walkway',
  'Open Area',
  'Waste Disposal Area',
  'Water Facility',
  'Other',
] as const;

export const HEALTH_SAFETY_AREAS = [
  'Medical Centre',
  'Security Area',
  'Emergency Area',
  'Fire Safety Equipment',
  'Other',
] as const;

export const OTHER_AREAS = ['Other'] as const;

/**
 * Standard Campus Floors
 */
export const CAMPUS_FLOORS = [
  'Basement',
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  '5th Floor',
  '6th Floor',
  '7th Floor',
  '8th Floor',
  'Rooftop / Terrace',
  'Other',
] as const;

export type CampusFloor = (typeof CAMPUS_FLOORS)[number];

/**
 * Helper to retrieve specific area options based on location category and building
 */
export function getSpecificAreasForLocation(
  locationType: string,
  buildingOrBlock?: string
): readonly string[] {
  switch (locationType) {
    case 'Academic Area':
    case 'Academic Block':
      if (buildingOrBlock === 'Lab Complex') return LAB_COMPLEX_AREAS;
      if (buildingOrBlock === 'Architecture Block') return ARCHITECTURE_BLOCK_AREAS;
      return ACADEMIC_STANDARD_AREAS;
    case 'Hostel':
    case 'Hostel Block':
      return HOSTEL_SPECIFIC_AREAS;
    case 'Food & Dining':
      return FOOD_DINING_AREAS;
    case 'Sports & Recreation':
      return SPORTS_RECREATION_AREAS;
    case 'Library / Study':
      return LIBRARY_STUDY_AREAS;
    case 'Administration':
      return ADMINISTRATION_AREAS;
    case 'Common / Outdoor':
    case 'Common Area':
      return COMMON_OUTDOOR_AREAS;
    case 'Health & Safety':
      return HEALTH_SAFETY_AREAS;
    default:
      return OTHER_AREAS;
  }
}

/**
 * Normalized validation to reject non-existent or invalid campus blocks.
 * Explicitly forbids: AB3, AB4, AB5, Academic Block 3/4/5, Hostel Block 7/8/9, Block 7/8/9 (undivided)
 */
export function isForbiddenLocationBlock(val?: string | null): boolean {
  if (!val) return false;
  const normalized = val.trim().toLowerCase();

  // Academic Block invalid patterns
  if (
    normalized === 'ab3' ||
    normalized === 'ab4' ||
    normalized === 'ab5' ||
    normalized === 'academic block 3' ||
    normalized === 'academic block 4' ||
    normalized === 'academic block 5' ||
    normalized.startsWith('ab3') ||
    normalized.startsWith('ab4') ||
    normalized.startsWith('ab5') ||
    normalized.startsWith('academic block 3') ||
    normalized.startsWith('academic block 4') ||
    normalized.startsWith('academic block 5')
  ) {
    return true;
  }

  // Hostel Block invalid patterns
  // Note: Block 7A and 7B are valid, but "Hostel Block 7" or "Block 7" alone without A/B are invalid.
  // Block 8A and 8B are valid, but "Hostel Block 8" or "Block 8" alone without A/B are invalid.
  // Block 9 / Hostel Block 9 is completely invalid.
  if (
    normalized === 'hostel block 7' ||
    normalized === 'hostel block 8' ||
    normalized === 'hostel block 9' ||
    normalized === 'block 7' ||
    normalized === 'block 8' ||
    normalized === 'block 9' ||
    normalized === 'hostel 7' ||
    normalized === 'hostel 8' ||
    normalized === 'hostel 9'
  ) {
    return true;
  }

  return false;
}

/**
 * Formats a clean, structured location breadcrumb for UI headers, tables, and detail pages.
 * Example outputs:
 * "Academic Area → Academic Block 1 (AB1) → Classroom → 2nd Floor (Room AB1-204)"
 * "Hostel → Block 8B → Bathroom → 3rd Floor - Near Room 312"
 */
export function formatStructuredLocation(issue: {
  locationType: string;
  buildingOrBlock?: string;
  specificArea?: string;
  floor?: string;
  specificLocation?: string;
  academicBlock?: string;
  hostelBlock?: string;
}): string {
  const parts: string[] = [];

  if (issue.locationType) {
    parts.push(issue.locationType);
  }

  const block = issue.buildingOrBlock || issue.academicBlock || issue.hostelBlock;
  if (block) {
    parts.push(block);
  }

  if (issue.specificArea) {
    parts.push(issue.specificArea);
  }

  if (issue.floor) {
    parts.push(issue.floor);
  }

  const breadcrumb = parts.join(' → ');

  if (issue.specificLocation && issue.specificLocation.trim()) {
    if (parts.length > 1) {
      return `${breadcrumb} (${issue.specificLocation.trim()})`;
    }
    return `${issue.locationType} - ${issue.specificLocation.trim()}`;
  }

  return breadcrumb;
}

/**
 * Returns separated breadcrumb and additional details for rich card displays.
 */
export function getLocationHierarchy(issue: {
  locationType: string;
  buildingOrBlock?: string;
  specificArea?: string;
  floor?: string;
  specificLocation?: string;
  academicBlock?: string;
  hostelBlock?: string;
}): { breadcrumb: string; additionalDetails?: string } {
  const parts: string[] = [];

  if (issue.locationType) {
    parts.push(issue.locationType);
  }

  const block = issue.buildingOrBlock || issue.academicBlock || issue.hostelBlock;
  if (block) {
    parts.push(block);
  }

  if (issue.specificArea) {
    parts.push(issue.specificArea);
  }

  if (issue.floor) {
    parts.push(issue.floor);
  }

  return {
    breadcrumb: parts.join(' → '),
    additionalDetails: issue.specificLocation?.trim() || undefined,
  };
}
