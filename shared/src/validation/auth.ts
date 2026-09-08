import { z } from 'zod';
import type { UserRole } from '../types/user.js';

export const USER_ROLES: [UserRole, ...UserRole[]] = ['student', 'admin'];

export const ALLOWED_INSTITUTION_DOMAIN = 'vitbhopal.ac.in';
export const INSTITUTION_RESTRICTED_MESSAGE =
  'Fixora is restricted to verified VIT Bhopal email accounts (@vitbhopal.ac.in).';

/**
 * Validates whether an email address strictly ends with @vitbhopal.ac.in
 * Performs a normalized, exact domain comparison without vulnerable substring matching.
 */
export function isAllowedInstitutionalEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) return false;
  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  if (!localPart || domain.includes('@')) return false;
  return domain === ALLOWED_INSTITUTION_DOMAIN;
}

/**
 * Validates Login credentials
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .refine((val) => isAllowedInstitutionalEmail(val), {
      message: INSTITUTION_RESTRICTED_MESSAGE,
    }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validates Registration payload
 */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .refine((val) => isAllowedInstitutionalEmail(val), {
      message: INSTITUTION_RESTRICTED_MESSAGE,
    }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  role: z.enum(USER_ROLES).default('student'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validates Firestore User document structure
 */
export const userProfileSchema = z.object({
  uid: z.string().min(1, 'UID is required').max(128),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(100),
  role: z.enum(USER_ROLES),
  createdAt: z.union([z.number(), z.string()]),
  updatedAt: z.union([z.number(), z.string()]).optional(),
});

/**
 * Helper to test if an arbitrary string is a valid UserRole
 */
export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && (role === 'student' || role === 'admin');
}

/**
 * Helper to check role-based authorization clearance
 */
export function isAuthorizedRole(
  userRole: UserRole | undefined | null,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
