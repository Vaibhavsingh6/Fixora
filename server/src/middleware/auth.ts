import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@fixora/shared';
import { isAllowedInstitutionalEmail, INSTITUTION_RESTRICTED_MESSAGE } from '@fixora/shared';
import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
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

    // Secure testing and local development fixture support
    if (
      (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') &&
      (token.startsWith('test-token:') || token.startsWith('demo-token:'))
    ) {
      const parts = token.split(':');
      decodedUid = parts[1] || 'demo-user';
      tokenRole = parts[2] === 'admin' ? 'admin' : 'student';
      decodedEmail = parts[3] || `${decodedUid}@vitbhopal.ac.in`;
      emailVerified = parts[4] !== undefined ? parts[4] === 'true' : true;
    } else {
      const decoded = await adminAuth.verifyIdToken(token);
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
