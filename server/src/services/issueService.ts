import crypto from 'crypto';
import type {
  Issue,
  IssueUpdate,
  IssueStatus,
  IssueCategory,
  IssueSeverity,
  IssueDepartment,
  CreateIssueInput,
} from '@fixora/shared';
import { adminDb, isFirestoreConfigured } from '../config/firebaseAdmin.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedUser } from '../middleware/auth.js';
import { getResponsiblePersonById } from './responsiblePeopleService.js';

// In-memory store used in test mode and as offline fallback
const memoryIssues = new Map<string, Issue>();
const memoryUpdates = new Map<string, IssueUpdate[]>();

export function clearMemoryStore(): void {
  memoryIssues.clear();
  memoryUpdates.clear();
}

/**
 * Generate collision-safe ticket ID (e.g. FIX-K7P92M)
 */
export function generateTicketId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(6);
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return `FIX-${id}`;
}

export interface IssueFilters {
  status?: IssueStatus;
  department?: IssueDepartment;
  severity?: IssueSeverity;
  search?: string;
}

/**
 * Create a new issue reported by an authenticated student
 */
export async function createIssue(
  input: CreateIssueInput,
  user: AuthenticatedUser
): Promise<Issue> {
  const now = Date.now();
  const issueId = crypto.randomUUID();
  const ticketId = generateTicketId();

  const issue: Issue = {
    id: issueId,
    ticketId,
    reporterId: user.uid,
    reporterName: user.email.split('@')[0] || 'Student',
    reporterEmail: user.email,
    title: input.title,
    description: input.description,
    improvedDescription: input.improvedDescription,
    category: input.category,
    aiSuggestedSeverity: input.aiSuggestedSeverity,
    severity: input.severity,
    aiSuggestedDepartment: input.aiSuggestedDepartment,
    department: input.department,
    locationType: input.locationType,
    buildingOrBlock:
      input.buildingOrBlock ||
      (input.locationType === 'Academic Area' || input.locationType === 'Academic Block'
        ? input.academicBlock
        : input.locationType === 'Hostel' || input.locationType === 'Hostel Block'
        ? input.hostelBlock
        : undefined),
    specificArea: input.specificArea,
    floor: input.floor,
    academicBlock:
      input.academicBlock ||
      (input.locationType === 'Academic Area' || input.locationType === 'Academic Block'
        ? input.buildingOrBlock
        : undefined),
    hostelBlock:
      input.hostelBlock ||
      (input.locationType === 'Hostel' || input.locationType === 'Hostel Block'
        ? input.buildingOrBlock
        : undefined),
    specificLocation: input.specificLocation,
    status: 'Submitted',
    hasImage: input.hasImage ?? false,
    imageStoragePath: input.imageStoragePath,
    imageContentType: input.imageContentType,
    visualObservations: input.visualObservations ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const initialUpdate: IssueUpdate = {
    id: crypto.randomUUID(),
    issueId,
    status: 'Submitted',
    note: 'Issue reported and submitted for campus facility review.',
    updatedBy: user.uid,
    updatedByName: issue.reporterName,
    updatedByRole: user.role,
    createdAt: now,
  };

  // Persist to memory store
  memoryIssues.set(issueId, issue);
  memoryUpdates.set(issueId, [initialUpdate]);

  // Persist to Firestore if available in non-test environments
  if (process.env.NODE_ENV !== 'test' && isFirestoreConfigured) {
    try {
      const issueRef = adminDb.collection('issues').doc(issueId);
      await issueRef.set(issue);

      const updateRef = adminDb.collection('issue_updates').doc(initialUpdate.id);
      await updateRef.set(initialUpdate);
    } catch (err) {
      console.warn('Notice: Firestore issue write deferred to local store:', (err as Error).message);
    }
  }

  return issue;
}

/**
 * Query issues based on user role and query filters
 */
export async function getIssues(
  user: AuthenticatedUser,
  filters: IssueFilters = {}
): Promise<Issue[]> {
  let issues: Issue[] = [];

  if (process.env.NODE_ENV !== 'test' && isFirestoreConfigured) {
    try {
      let query: FirebaseFirestore.Query = adminDb.collection('issues');

      if (user.role === 'student') {
        query = query.where('reporterId', '==', user.uid);
      } else if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.get();
      if (!snapshot.empty) {
        issues = snapshot.docs.map((doc) => doc.data() as Issue);
      } else if (memoryIssues.size > 0) {
        issues = Array.from(memoryIssues.values());
      }
    } catch {
      issues = Array.from(memoryIssues.values());
    }
  } else {
    issues = Array.from(memoryIssues.values());
  }

  // Filter based on user role if loaded from fallback
  if (user.role === 'student') {
    issues = issues.filter((i) => i.reporterId === user.uid);
  }

  // Apply filters for admin
  if (filters.status) {
    issues = issues.filter((i) => i.status === filters.status);
  }
  if (filters.department) {
    issues = issues.filter((i) => i.department === filters.department);
  }
  if (filters.severity) {
    issues = issues.filter((i) => i.severity === filters.severity);
  }
  if (filters.search) {
    const term = filters.search.toLowerCase();
    issues = issues.filter(
      (i) =>
        i.ticketId.toLowerCase().includes(term) ||
        i.title.toLowerCase().includes(term) ||
        i.locationType.toLowerCase().includes(term) ||
        (i.buildingOrBlock && i.buildingOrBlock.toLowerCase().includes(term)) ||
        (i.specificArea && i.specificArea.toLowerCase().includes(term)) ||
        (i.floor && i.floor.toLowerCase().includes(term)) ||
        (i.academicBlock && i.academicBlock.toLowerCase().includes(term)) ||
        (i.hostelBlock && i.hostelBlock.toLowerCase().includes(term)) ||
        i.specificLocation.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term)
    );
  }

  // Sort by createdAt descending
  return issues.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

/**
 * Retrieve an issue and its full updates timeline
 */
export async function getIssueById(
  id: string,
  user: AuthenticatedUser
): Promise<{ issue: Issue; updates: IssueUpdate[] }> {
  let issue: Issue | undefined = memoryIssues.get(id);
  let updates: IssueUpdate[] = memoryUpdates.get(id) || [];

  if (process.env.NODE_ENV !== 'test' && isFirestoreConfigured) {
    try {
      const doc = await adminDb.collection('issues').doc(id).get();
      if (doc.exists) {
        issue = doc.data() as Issue;

        const updatesSnapshot = await adminDb
          .collection('issue_updates')
          .where('issueId', '==', id)
          .get();

        if (!updatesSnapshot.empty) {
          updates = updatesSnapshot.docs.map((d) => d.data() as IssueUpdate);
        }
      }
    } catch {
      // Memory store fallback
    }
  }

  if (!issue) {
    throw new AppError(`Issue with ID '${id}' not found`, 404);
  }

  // RBAC Enforcement: Students can only view their own issues
  if (user.role === 'student' && issue.reporterId !== user.uid) {
    throw new AppError('Access forbidden: You are not authorized to view this issue', 403);
  }

  // Sort updates by createdAt ascending
  updates.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

  return { issue, updates };
}

/**
 * Update issue status (Admin only)
 */
export async function updateIssueStatus(
  id: string,
  status: IssueStatus,
  note: string,
  resolutionNote: string | undefined,
  adminUser: AuthenticatedUser
): Promise<{ issue: Issue; update: IssueUpdate }> {
  const { issue } = await getIssueById(id, adminUser);
  const now = Date.now();

  issue.status = status;
  issue.updatedAt = now;
  if (status === 'Resolved') {
    issue.resolutionNote = resolutionNote || note;
  }

  const newUpdate: IssueUpdate = {
    id: crypto.randomUUID(),
    issueId: id,
    status,
    note: note || (status === 'Resolved' && resolutionNote ? resolutionNote : `Status changed to ${status}`),
    updatedBy: adminUser.uid,
    updatedByName: adminUser.email.split('@')[0] || 'Administrator',
    updatedByRole: 'admin',
    createdAt: now,
  };

  // Update memory store
  memoryIssues.set(id, issue);
  const existingUpdates = memoryUpdates.get(id) || [];
  existingUpdates.push(newUpdate);
  memoryUpdates.set(id, existingUpdates);

  // Update Firestore
  if (process.env.NODE_ENV !== 'test' && isFirestoreConfigured) {
    try {
      await adminDb.collection('issues').doc(id).update({
        status,
        updatedAt: now,
        ...(status === 'Resolved' ? { resolutionNote: issue.resolutionNote } : {}),
      });
      await adminDb.collection('issue_updates').doc(newUpdate.id).set(newUpdate);
    } catch (err) {
      console.warn('Notice: Firestore status update deferred to local store:', (err as Error).message);
    }
  }

  return { issue, update: newUpdate };
}

/**
 * Override issue category, severity, or department (Admin only)
 */
export async function overrideIssueDetails(
  id: string,
  overrides: {
    category?: IssueCategory;
    severity?: IssueSeverity;
    department?: IssueDepartment;
    note?: string;
  },
  adminUser: AuthenticatedUser
): Promise<{ issue: Issue; update: IssueUpdate }> {
  const { issue } = await getIssueById(id, adminUser);
  const now = Date.now();

  const changes: string[] = [];
  if (overrides.category && overrides.category !== issue.category) {
    changes.push(`Category: ${issue.category} -> ${overrides.category}`);
    issue.category = overrides.category;
  }
  if (overrides.severity && overrides.severity !== issue.severity) {
    changes.push(`Severity: ${issue.severity} -> ${overrides.severity}`);
    issue.severity = overrides.severity;
  }
  if (overrides.department && overrides.department !== issue.department) {
    changes.push(`Department: ${issue.department} -> ${overrides.department}`);
    issue.department = overrides.department;
  }

  issue.updatedAt = now;

  const note = overrides.note
    ? `${changes.join(', ')}. Note: ${overrides.note}`
    : changes.join(', ');

  const newUpdate: IssueUpdate = {
    id: crypto.randomUUID(),
    issueId: id,
    status: issue.status,
    note: `Details overridden by admin: ${note}`,
    updatedBy: adminUser.uid,
    updatedByName: adminUser.email.split('@')[0] || 'Administrator',
    updatedByRole: 'admin',
    createdAt: now,
  };

  memoryIssues.set(id, issue);
  const existingUpdates = memoryUpdates.get(id) || [];
  existingUpdates.push(newUpdate);
  memoryUpdates.set(id, existingUpdates);

  if (process.env.NODE_ENV !== 'test' && isFirestoreConfigured) {
    try {
      await adminDb.collection('issues').doc(id).update({
        category: issue.category,
        severity: issue.severity,
        department: issue.department,
        updatedAt: now,
      });
      await adminDb.collection('issue_updates').doc(newUpdate.id).set(newUpdate);
    } catch (err) {
      console.warn('Notice: Firestore details update deferred to local store:', (err as Error).message);
    }
  }

  return { issue, update: newUpdate };
}

/**
 * Assign a responsible facility technician to an issue (Admin only)
 */
export async function assignTechnician(
  id: string,
  personId: string,
  adminUser: AuthenticatedUser
): Promise<{ issue: Issue; update: IssueUpdate }> {
  const { issue } = await getIssueById(id, adminUser);
  const person = await getResponsiblePersonById(personId);

  if (!person) {
    throw new AppError(`Responsible person with ID '${personId}' not found`, 404);
  }

  const now = Date.now();
  issue.assignedToId = person.id;
  issue.assignedToName = person.name;
  issue.assignedAt = now;
  issue.assignedBy = adminUser.uid;
  issue.updatedAt = now;

  // If issue was in 'Submitted' state, advance to 'Assigned'
  if (issue.status === 'Submitted') {
    issue.status = 'Assigned';
  }

  const newUpdate: IssueUpdate = {
    id: crypto.randomUUID(),
    issueId: id,
    status: issue.status,
    note: `Assigned to ${person.name} (${person.department} - ${person.phone})`,
    updatedBy: adminUser.uid,
    updatedByName: adminUser.email.split('@')[0] || 'Administrator',
    updatedByRole: 'admin',
    createdAt: now,
  };

  memoryIssues.set(id, issue);
  const existingUpdates = memoryUpdates.get(id) || [];
  existingUpdates.push(newUpdate);
  memoryUpdates.set(id, existingUpdates);

  if (process.env.NODE_ENV !== 'test' && isFirestoreConfigured) {
    try {
      await adminDb.collection('issues').doc(id).update({
        assignedToId: issue.assignedToId,
        assignedToName: issue.assignedToName,
        assignedAt: issue.assignedAt,
        assignedBy: issue.assignedBy,
        status: issue.status,
        updatedAt: now,
      });
      await adminDb.collection('issue_updates').doc(newUpdate.id).set(newUpdate);
    } catch (err) {
      console.warn('Notice: Firestore assignment update deferred to local store:', (err as Error).message);
    }
  }

  return { issue, update: newUpdate };
}
