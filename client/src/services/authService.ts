import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { apiUrl } from '../config/api';
import type { UserProfile, UserRole } from '@fixora/shared';

/**
 * Maps raw Firebase authentication error codes to clear, accessible user messages
 */
export function formatAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string };

  switch (err.code) {
    case 'auth/invalid-email':
      return 'The email address format is invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact your campus administrator.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error: Unable to contact authentication server. Check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again in a few minutes.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in the Firebase Console.';
    default:
      return err.message || 'Authentication failed. Please check your details.';
  }
}

/**
 * Fetches the user profile document from Firestore (Trusted Source)
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const role: UserRole = data.role === 'admin' ? 'admin' : 'student';
      return {
        uid: data.uid || uid,
        name: data.name || 'Campus Member',
        email: data.email || '',
        role,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
      };
    }
  } catch (err) {
    console.error('Failed to retrieve Firestore profile:', err);
  }

  return null;
}

/**
 * Creates user profile document in Firestore
 * SECURITY: All public client creations are strictly assigned role: 'student'.
 */
export async function createUserProfile(profile: {
  uid: string;
  name: string;
  email: string;
}): Promise<UserProfile> {
  const userProfile: UserProfile = {
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    role: 'student', // Strictly defaulted to student
    createdAt: Date.now(),
  };

  if (!isFirebaseConfigured) {
    return userProfile;
  }

  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, {
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    role: 'student',
    createdAt: serverTimestamp(),
  });

  return userProfile;
}

/**
 * Requests administrative privilege promotion via server-side verification
 * Passes the authenticated user's Firebase ID token to the Express API.
 * The server verifies the token and validates the secret server-side.
 */
export async function claimAdminRole(adminSecret: string): Promise<boolean> {
  const currentUser = auth.currentUser;
  let token: string;
  if (currentUser) {
    token = await currentUser.getIdToken();
  } else if (!import.meta.env.PROD) {
    const demoSession = typeof window !== 'undefined' ? sessionStorage.getItem('fixora_demo_session') : null;
    if (demoSession) {
      const parsed = JSON.parse(demoSession);
      token = `demo-token:${parsed.uid || 'demo-user'}:${parsed.role || 'student'}`;
    } else {
      throw new Error('You must be authenticated to request administrative clearance.');
    }
  } else {
    throw new Error('You must be authenticated to request administrative clearance.');
  }

  const res = await fetch(apiUrl('/api/auth/claim-admin'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ adminSecret }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Administrative verification failed.');
  }

  return true;
}

/**
 * Sends a Firebase email verification link to the institutional email address
 */
export async function sendInstitutionalEmailVerification(user: FirebaseUser): Promise<void> {
  if (user) {
    await sendEmailVerification(user);
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  firebaseSignOut,
  updateProfile,
};
export type { FirebaseUser };
