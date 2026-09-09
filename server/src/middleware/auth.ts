import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@fixora/shared';
import { isAllowedInstitutionalEmail, INSTITUTION_RESTRICTED_MESSAGE } from '@fixora/shared';
import { adminAuth, adminDb, firebaseProjectId } from '../config/firebaseAdmin.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

/**
 * Authoritative whitelist of predefined PromptWars demo identities.
 * SECURITY: Identities and roles are defined strictly on the server.
 * Client-supplied role claims are completely ignored to prevent privilege escalation.
 */
export const PREDEFINED_DEMO_IDENTITIES: Record<string, AuthenticatedUser> = {
  'demo-admin-999': {
    uid: 'demo-admin-999',
    email: 'admin@vitbhopal.ac.in',
    role: 'admin',
    emailVerified: true,
  },
  'demo-student-101': {
    uid: 'demo-student-101',
    email: 'student@vitbhopal.ac.in',
    role: 'student',
    emailVerified: true,
  },
  // Backwards-compatible alias for existing test fixtures:
  'demo-user': {
    uid: 'demo-student-101',
    email: 'student@vitbhopal.ac.in',
    role: 'student',
    emailVerified: true,
  },
};

/**
 * Checks if controlled DEMO_MODE is active.
 * In production, DEMO_MODE must be explicitly set to 'true'.
 * In test or development environments, fixtures are permitted for automated testing/local dev.
 */
export function isDemoModeActive(): boolean {
  if (process.env.DEMO_MODE === 'true' || process.env.ENABLE_DEMO_MODE === 'true') {
    return true;
  }
  return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Express middleware requiring verified Firebase Authentication ID Token
 * Returns 401 Unauthorized if missing or invalid
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication required. Missing Bearer token.', 401));
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    next(new AppError('Authentication required. Empty token.', 401));
    return;
  }

  try {
    let decodedUid: string;
    let decodedEmail: string;
    let tokenRole: UserRole | undefined;
    let emailVerified = false;

    // Demo/test fixture tokens handling: Strictly controlled by DEMO_MODE
    const isFixtureToken = token.startsWith('test-token:') || token.startsWith('demo-token:');

    if (isFixtureToken) {
      if (!isDemoModeActive()) {
        console.warn('[Auth] Token verification failed: Demo tokens are disabled in production.');
        next(new AppError('Invalid or expired authentication token', 401));
        return;
      }

      // 1. In automated unit test runs, support dynamic test-token fixtures
      if (process.env.NODE_ENV === 'test' && token.startsWith('test-token:')) {
        const parts = token.split(':');
        decodedUid = parts[1] || 'test-user';
        tokenRole = parts[2] === 'admin' ? 'admin' : 'student';
        decodedEmail = parts[3] || `${decodedUid}@vitbhopal.ac.in`;
        emailVerified = parts[4] !== undefined ? parts[4] === 'true' : true;
      } else {
        // 2. Production & Controlled Demo Mode: Strictly validate against predefined accounts
        if (!token.startsWith('demo-token:')) {
          console.warn('[Auth] Token verification failed: Test fixture token rejected outside test runner.');
          next(new AppError('Invalid or expired authentication token', 401));
          return;
        }

        const parts = token.split(':');
        const requestedUid = parts[1] || '';
        const predefinedIdentity = PREDEFINED_DEMO_IDENTITIES[requestedUid];

        if (!predefinedIdentity) {
          console.warn('[Auth] Token verification failed: Unrecognized demo account identity.');
          next(new AppError('Invalid or expired authentication token', 401));
          return;
        }

        // Authoritatively assign identity (NEVER trust client-supplied roles or emails)
        decodedUid = predefinedIdentity.uid;
        decodedEmail = predefinedIdentity.email;
        tokenRole = predefinedIdentity.role;
        emailVerified = predefinedIdentity.emailVerified;
      }
    } else {
      let decoded;
      try {
        decoded = await adminAuth.verifyIdToken(token);
      } catch (verifyErr: any) {
        const code = verifyErr?.code || 'unknown';
        const message = verifyErr?.message || '';

        // Preserve diagnostic categorization for server logs without exposing sensitive details or full tokens
        if (code === 'auth/id-token-expired') {
          console.warn('[Auth] Token verification failed: Expired ID token.');
        } else if (code === 'auth/id-token-revoked') {
          console.warn('[Auth] Token verification failed: Revoked ID token.');
        } else if (
          message.includes('aud') ||
          message.includes('audience') ||
          code === 'auth/project-id-mismatch'
        ) {
          console.warn(
            `[Auth] Token verification failed: Audience/Project ID mismatch (configured project: "${firebaseProjectId}").`
          );
        } else if (
          code === 'auth/argument-error' ||
          message.includes('Decoding') ||
          message.includes('malformed')
        ) {
          console.warn('[Auth] Token verification failed: Malformed or unparseable ID token.');
        } else if (code === 'auth/invalid-id-token' || message.includes('signature')) {
          console.warn('[Auth] Token verification failed: Invalid token signature.');
        } else {
          console.warn(`[Auth] Token verification failed: [${code}] ${message}`);
        }

        next(new AppError('Invalid or expired authentication token', 401));
        return;
      }

      decodedUid = decoded.uid;
      decodedEmail = decoded.email || '';
      tokenRole = decoded.role === 'admin' ? 'admin' : undefined;
      emailVerified = decoded.email_verified === true;
    }

    // 1. Enforce verified email address
    if (!emailVerified) {
      next(
        new AppError(
          'Email verification required. Please verify your @vitbhopal.ac.in institutional email address before accessing Fixora.',
          403
        )
      );
      return;
    }

    // 2. Enforce exact VIT Bhopal institutional domain (@vitbhopal.ac.in)
    if (!isAllowedInstitutionalEmail(decodedEmail)) {
      next(new AppError(INSTITUTION_RESTRICTED_MESSAGE, 403));
      return;
    }

    // Determine role from trusted source: Token claim or Firestore document
    let resolvedRole: UserRole = tokenRole || 'student';

    if (!tokenRole) {
      try {
        const userDoc = await adminDb.collection('users').doc(decodedUid).get();
        if (userDoc.exists) {
          const docData = userDoc.data();
          if (docData?.role === 'admin') {
            resolvedRole = 'admin';
          }
        }
      } catch {
        // Default safely to student
        resolvedRole = 'student';
      }
    }

    // Attach verified user to request object (Do NOT trust req.body)
    req.user = {
      uid: decodedUid,
      email: decodedEmail,
      role: resolvedRole,
      emailVerified,
    };

    next();
  } catch (error) {
    console.warn('[Auth] Unexpected error in requireAuth:', (error as Error).message);
    next(new AppError('Invalid or expired authentication token', 401));
  }
}

/**
 * Express middleware requiring specific role clearance
 * Returns 403 Forbidden if user lacks required role
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          `Access forbidden: requires ${allowedRoles.join(' or ')} privileges. Your role is ${req.user.role}.`,
          403
        )
      );
      return;
    }

    next();
  };
}
