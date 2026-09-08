/**
 * Resolves the API base URL from Vite environment variables.
 * In local development (with Vite proxy) or unified Vercel deployments,
 * VITE_API_BASE_URL can remain empty/unset, allowing relative paths (e.g. '/api/issues').
 * In decoupled deployments, VITE_API_BASE_URL (e.g. 'https://fixora-backend.vercel.app')
 * will be prepended to all API requests.
 */
/**
 * Helper to build API URL given a base URL and path
 */
export function buildApiUrl(baseUrl: string | undefined, path: string): string {
  const cleanBase = typeof baseUrl === 'string' ? baseUrl.trim().replace(/\/+$/, '') : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
  typeof rawBaseUrl === 'string' ? rawBaseUrl.trim().replace(/\/+$/, '') : '';

export function apiUrl(path: string): string {
  return buildApiUrl(API_BASE_URL, path);
}
