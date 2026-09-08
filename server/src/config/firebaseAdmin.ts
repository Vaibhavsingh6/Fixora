import admin from 'firebase-admin';

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
        projectId: process.env.FIREBASE_PROJECT_ID || 'fixora-campus',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }

    admin.initializeApp({
      ...(credential ? { credential } : {}),
      projectId: process.env.FIREBASE_PROJECT_ID || 'fixora-campus',
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

export { admin };
