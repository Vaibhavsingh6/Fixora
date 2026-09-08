/**
 * Fixora Core User Roles
 * STRICT: Only 'student' and 'admin' are permitted per Phase 1 specification.
 */
export type UserRole = 'student' | 'admin';

/**
 * Fixora User Profile Document Representation
 */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: number | string; // Unix timestamp or ISO string
  updatedAt?: number | string;
}

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Health Check API Payload
 */
export interface HealthStatus {
  status: 'ok';
  service: string;
  version?: string;
  timestamp: string;
  uptime: number;
  uptimeSeconds?: number;
}
