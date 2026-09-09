import admin from 'firebase-admin';

/**
 * Resolves the authoritative Firebase Project ID.
 * Priority:
 * 1. process.env.FIREBASE_PROJECT_ID (authoritative server configuration)
 * 2. process.env.VITE_FIREBASE_PROJECT_ID (unified deployment platforms like Vercel)
 *
 * In production, if neither is provided, it throws a fatal configuration error rather than
 * silently falling back to an unaligned default project.
 */
export function resolveFirebaseProjectId(): string {
  const authoritativeId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (authoritativeId && authoritativeId.trim()) {
    const cleanId = authoritativeId.trim();

    // Check for client-server consistency if both are configured
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.VITE_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PROJECT_ID.trim() !== process.env.VITE_FIREBASE_PROJECT_ID.trim()
    ) {
      console.warn(
        `[Firebase] Warning: FIREBASE_PROJECT_ID ("${process.env.FIREBASE_PROJECT_ID.trim()}") does not match VITE_FIREBASE_PROJECT_ID ("${process.env.VITE_FIREBASE_PROJECT_ID.trim()}"). Ensure client and server point to the exact same Firebase project.`
      );
    }

    return cleanId;
  }

  // In production, missing project ID is a critical misconfiguration
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: Missing FIREBASE_PROJECT_ID in production environment. Firebase Admin cannot verify client ID tokens without an authoritative project ID.'
    );
  }

  // Safe fallback strictly in local development or automated test environments
  return 'fixora-test';
}

const resolvedProjectId = resolveFirebaseProjectId();

// Initialize Firebase Admin SDK singleton
if (admin.apps.length === 0) {
  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(parsed);
      } catch (parseErr) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', (parseErr as Error).message);
      }
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credential = admin.credential.cert({
        projectId: resolvedProjectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }

    admin.initializeApp({
      ...(credential ? { credential } : {}),
      projectId: resolvedProjectId,
    });
  } catch (err) {
    console.warn('Firebase Admin initialization notice:', (err as Error).message);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Settings can only be applied once
}

export const isFirestoreConfigured = Boolean(
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
  process.env.FIRESTORE_EMULATOR_HOST
);

export { admin, resolvedProjectId as firebaseProjectId };
