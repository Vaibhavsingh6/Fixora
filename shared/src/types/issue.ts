import type {
  LocationType,
  AcademicBlock,
  HostelBlock,
  AnyLocationType,
} from '../config/locations.js';

export const ISSUE_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Civil/Maintenance',
  'Cleanliness/Housekeeping',
  'IT/Wi-Fi',
  'Hostel Maintenance',
  'Security',
  'Other',
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const ISSUE_DEPARTMENTS = [
  'Electrical',
  'Plumbing',
  'Civil/Maintenance',
  'Cleanliness/Housekeeping',
  'IT/Wi-Fi',
  'Hostel Maintenance',
  'Security',
  'Other',
] as const;

export type IssueDepartment = (typeof ISSUE_DEPARTMENTS)[number];

export const ISSUE_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Reopened',
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

/**
 * AI Triage Output from Gemini 3.8 Flash
 */
export interface AiAnalysisResult {
  category: IssueCategory;
  suggestedSeverity: IssueSeverity;
  suggestedDepartment: IssueDepartment;
  improvedDescription: string;
  visualObservations: string[];
  missingInformation: string[];
}

/**
 * Complete Firestore Issue Document Model
 */
export interface Issue {
  id: string;
  ticketId: string; // e.g. "FIX-104823"
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  title: string;
  description: string;
  improvedDescription?: string;
  category: IssueCategory;
  aiSuggestedSeverity: IssueSeverity;
  severity: IssueSeverity;
  aiSuggestedDepartment: IssueDepartment;
  department: IssueDepartment;
  locationType: LocationType | AnyLocationType | string;
  buildingOrBlock?: string;
  specificArea?: string;
  floor?: string;
  academicBlock?: AcademicBlock | string;
  hostelBlock?: HostelBlock | string;
  specificLocation: string;
  status: IssueStatus;
  resolutionNote?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: number | string;
  assignedBy?: string;
  hasImage?: boolean;
  imageStoragePath?: string;
  imageContentType?: string;
  visualObservations?: string[];
  createdAt: number | string;
  updatedAt: number | string;
}

/**
 * Issue Lifecycle / Status Update Record
 */
export interface IssueUpdate {
  id: string;
  issueId: string;
  status: IssueStatus;
  note: string;
  updatedBy: string;
  updatedByName: string;
  updatedByRole: 'student' | 'admin';
  createdAt: number | string;
}

/**
 * Facility Staff / Technician Member
 */
export interface ResponsiblePerson {
  id: string;
  name: string;
  department: IssueDepartment;
  email: string;
  phone: string;
  active: boolean;
}
