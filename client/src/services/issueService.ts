import { auth } from './firebase';
import { apiUrl } from '../config/api';
import type {
  Issue,
  IssueUpdate,
  ResponsiblePerson,
  AnalyzeIssueInput,
  AiAnalysisOutput,
  CreateIssueInput,
  IssueStatus,
  IssueDepartment,
  IssueSeverity,
  IssueCategory,
} from '@fixora/shared';

async function getAuthHeader(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // Controlled fallback for predefined PromptWars demo accounts and local test sessions
  const demoSession = typeof window !== 'undefined' ? sessionStorage.getItem('fixora_demo_session') : null;
  if (demoSession) {
    try {
      const parsed = JSON.parse(demoSession);
      const isPredefinedDemo =
        parsed.uid === 'demo-admin-999' ||
        parsed.uid === 'demo-student-101' ||
        parsed.uid === 'demo-user';

      if (isPredefinedDemo) {
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer demo-token:${parsed.uid}:${parsed.role || 'student'}`,
        };
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  throw new Error('Authentication required. Please sign in.');
}

/**
 * Call server-side Gemini 3.8 Flash triage API
 */
export async function analyzeIssueWithAI(input: AnalyzeIssueInput): Promise<AiAnalysisOutput> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl('/api/analyze-issue'), {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to analyze issue with AI.');
  }

  return data.data;
}

/**
 * Create and submit a new campus issue ticket
 */
export async function reportIssue(input: CreateIssueInput): Promise<Issue> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl('/api/issues'), {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to submit issue ticket.');
  }

  return data.issue;
}

/**
 * Fetch issues (filtered automatically by server based on user role)
 */
export async function fetchIssues(filters?: {
  status?: IssueStatus | '';
  department?: IssueDepartment | '';
  severity?: IssueSeverity | '';
  search?: string;
}): Promise<Issue[]> {
  const headers = await getAuthHeader();
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.department) params.append('department', filters.department);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.search) params.append('search', filters.search);

  const url = apiUrl(`/api/issues${params.toString() ? `?${params.toString()}` : ''}`);
  const res = await fetch(url, { headers });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch issues.');
  }

  return data.issues;
}

/**
 * Fetch a single issue and its lifecycle timeline
 */
export async function fetchIssueById(
  id: string
): Promise<{ issue: Issue; updates: IssueUpdate[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl(`/api/issues/${id}`), { headers });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch issue details.');
  }

  return {
    issue: data.issue,
    updates: data.updates || [],
  };
}

/**
 * Update issue status (Admin only)
 */
export async function updateIssueStatus(
  id: string,
  status: IssueStatus,
  note: string,
  resolutionNote?: string
): Promise<{ issue: Issue; update: IssueUpdate }> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl(`/api/issues/${id}/status`), {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status, note, resolutionNote }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update issue status.');
  }

  return { issue: data.issue, update: data.update };
}

/**
 * Override category, severity, or department (Admin only)
 */
export async function overrideIssueDetails(
  id: string,
  overrides: {
    category?: IssueCategory;
    severity?: IssueSeverity;
    department?: IssueDepartment;
    note?: string;
  }
): Promise<{ issue: Issue; update: IssueUpdate }> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl(`/api/issues/${id}/override`), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(overrides),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to override issue details.');
  }

  return { issue: data.issue, update: data.update };
}

/**
 * Assign a responsible technician (Admin only)
 */
export async function assignTechnician(
  id: string,
  personId: string
): Promise<{ issue: Issue; update: IssueUpdate }> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl(`/api/issues/${id}/assign`), {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ personId }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to assign technician.');
  }

  return { issue: data.issue, update: data.update };
}

/**
 * Fetch campus responsible people / technician directory
 */
export async function fetchResponsiblePeople(): Promise<ResponsiblePerson[]> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl('/api/responsible-people'), { headers });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch responsible people.');
  }

  return data.people || [];
}

/**
 * Upload an issue photograph to Firebase Storage via authenticated API
 */
export async function uploadIssueImage(file: File): Promise<{
  storagePath: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  base64Data: string;
}> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported image format (${file.type}). Only JPEG, PNG, and WebP are allowed.`);
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB limit.`);
  }

  // Convert to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const cleaned = res.replace(/^data:image\/[a-z0-9-+.]+;base64,/i, '');
      resolve(cleaned);
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const headers = await getAuthHeader();
  const res = await fetch(apiUrl('/api/upload-image'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      imageBase64: base64Data,
      mimeType: file.type,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload photo.');
  }

  return {
    storagePath: data.data.storagePath,
    contentType: data.data.contentType as 'image/jpeg' | 'image/png' | 'image/webp',
    base64Data,
  };
}

/**
 * Fetch issue image as Blob with authenticated token
 */
export async function fetchIssueImageBlob(issueId: string): Promise<Blob> {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl(`/api/issues/${issueId}/image`), { headers });
  if (!res.ok) {
    throw new Error(`Failed to load issue photo (${res.status})`);
  }
  return res.blob();
}

