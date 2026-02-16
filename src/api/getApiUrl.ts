/**
 * Single Source of Truth for API URL Resolution
 * 
 * This module eliminates the triple-redundancy in API URL handling.
 * 
 * Build-time (preferred):
 * - Uses VITE_API_URL from Vercel env vars
 * - Must be set: https://api.litsuite.app/api (with /api suffix)
 * 
 * Runtime fallback:
 * - Development (localhost): http://localhost:3000/api
 * - Production: ${window.location.origin}/api
 * 
 * CRITICAL RULE: VITE_API_URL should ALWAYS include /api suffix
 */

export function getApiUrl(): string {
  // Build-time env var (preferred - set in Vercel)
  const buildTimeUrl = import.meta.env.VITE_API_URL;
  
  // DEBUG: Log env var values
  if (typeof window !== 'undefined') {
    console.log('[getApiUrl] VITE_API_URL:', buildTimeUrl);
  }
  
  if (buildTimeUrl && buildTimeUrl.trim()) {
    const clean = buildTimeUrl.replace(/\/$/, '').trim();
    // Ensure /api suffix exists
    if (clean.endsWith('/api')) {
      if (typeof window !== 'undefined') {
        console.log('[getApiUrl] Returning build-time URL:', clean);
      }
      return clean;
    }
    // If missing /api suffix, append it
    const result = `${clean}/api`;
    if (typeof window !== 'undefined') {
      console.log('[getApiUrl] Returning build-time URL (with /api):', result);
    }
    return result;
  }

  // Runtime fallback
  if (typeof window === 'undefined') {
    // Server-side rendering or Node.js context
    console.log('[getApiUrl] SSR context, using localhost');
    return 'http://localhost:3000/api';
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) {
    // Development: use configured port
    const devPort = import.meta.env.VITE_API_PORT || '3000';
    const url = `${protocol}//${hostname}:${devPort}/api`;
    console.log('[getApiUrl] Development localhost, returning:', url);
    return url;
  }

  // Production: assume backend on same origin
  const origin = window.location.origin;
  const url = `${origin}/api`;
  console.log('[getApiUrl] Production mode, origin:', origin, 'returning:', url);
  return url;
}

/**
 * Get SSO Base URL
 * 
 * Build-time (optional override):
 * - VITE_SSO_URL from Vercel env vars
 * 
 * Fallback:
 * - Uses getApiUrl() + /sso
 * 
 * Example: https://api.litsuite.app/api/sso
 */
export function getSSOUrl(): string {
  // Build-time SSO URL (optional override for explicit control)
  const buildTimeSsoUrl = import.meta.env.VITE_SSO_URL;
  if (buildTimeSsoUrl && buildTimeSsoUrl.trim()) {
    const url = buildTimeSsoUrl.replace(/\/$/, '').trim();
    if (typeof window !== 'undefined') {
      console.log('[getSSOUrl] Using build-time VITE_SSO_URL:', url);
    }
    return url;
  }

  // Default: use getApiUrl() + /sso
  const apiUrl = getApiUrl();
  // Remove trailing /api to avoid duplication
  const baseUrl = apiUrl.replace(/\/api$/, '');
  const ssoUrl = `${baseUrl}/api/sso`;
  if (typeof window !== 'undefined') {
    console.log('[getSSOUrl] Computed from getApiUrl:', apiUrl, '-> base:', baseUrl, '-> sso:', ssoUrl);
  }
  return ssoUrl;
}

/**
 * Get Socket.IO URL
 * 
 * Strategy:
 * - Development: same as API URL but without /api suffix
 * - Production: same as API URL but without /api suffix
 * 
 * Example: https://api.litsuite.app or http://localhost:3000
 */
export function getSocketUrl(): string {
  const apiUrl = getApiUrl();
  // Remove /api suffix to get base URL
  return apiUrl.replace(/\/api$/, '');
}
