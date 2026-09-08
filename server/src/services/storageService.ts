import { admin, isFirestoreConfigured } from '../config/firebaseAdmin.js';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface StoredImageResult {
  storagePath: string;
  contentType: AllowedImageMimeType;
}

export interface RetrievedImage {
  buffer: Buffer;
  contentType: string;
}

// In-memory fallback registry for offline development, local test execution, or missing cloud credentials
const memoryImageStore = new Map<string, RetrievedImage>();

export function clearMemoryImageStore(): void {
  memoryImageStore.clear();
}

/**
 * Validates image buffer size and MIME type
 */
export function validateImage(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType)) {
    return {
      valid: false,
      error: `Unsupported image format (${mimeType}). Only JPEG, PNG, and WebP are allowed.`,
    };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image file exceeds the 5 MB maximum size limit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  return { valid: true };
}

/**
 * Derives safe file extension from verified MIME type
 */
function getExtensionFromMime(mimeType: AllowedImageMimeType): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
  }
}

/**
 * Securely saves an issue photograph to Firebase Storage (with in-memory fallback for testing)
 * Path convention: issues/{userId}/{issueId}/photo.{ext}
 */
export async function saveIssueImage(
  userId: string,
  issueId: string,
  buffer: Buffer,
  mimeType: AllowedImageMimeType
): Promise<StoredImageResult> {
  const validation = validateImage(buffer, mimeType);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image');
  }

  const ext = getExtensionFromMime(mimeType);
  // Never trust user-provided filename; construct sanitized predictable path
  const storagePath = `issues/${userId}/${issueId}/photo.${ext}`;

  // Always keep in memory store for zero-latency test/offline execution
  memoryImageStore.set(storagePath, { buffer, contentType: mimeType });

  // If live Firebase Admin app is available, persist to Cloud Storage bucket
  if (isFirestoreConfigured && admin.apps.length > 0) {
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            uploadedBy: userId,
            issueId,
            createdAt: Date.now().toString(),
          },
        },
      });
    } catch (err) {
      console.warn('Firebase Storage upload deferred/skipped in current environment:', (err as Error).message);
    }
  }

  return { storagePath, contentType: mimeType };
}

/**
 * Retrieves an issue photograph buffer and content type
 */
export async function getIssueImage(storagePath: string): Promise<RetrievedImage | null> {
  // Check in-memory store first
  const memoryResult = memoryImageStore.get(storagePath);
  if (memoryResult) {
    return memoryResult;
  }

  // Attempt retrieval from live bucket if configured
  if (isFirestoreConfigured && admin.apps.length > 0) {
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      const [exists] = await file.exists();
      if (exists) {
        const [buffer] = await file.download();
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || 'image/jpeg';
        return { buffer, contentType };
      }
    } catch (err) {
      console.warn('Firebase Storage download failed/skipped:', (err as Error).message);
    }
  }

  return null;
}

/**
 * Cleans up an image from storage (e.g. on cancelled or failed workflows)
 */
export async function deleteIssueImage(storagePath: string): Promise<boolean> {
  const existedInMemory = memoryImageStore.delete(storagePath);

  if (isFirestoreConfigured && admin.apps.length > 0) {
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      await file.delete({ ignoreNotFound: true });
      return true;
    } catch {
      return existedInMemory;
    }
  }

  return existedInMemory;
}
