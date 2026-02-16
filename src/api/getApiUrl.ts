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
  if (buildTimeUrl && buildTimeUrl.trim()) {
    const clean = buildTimeUrl.replace(/\/$/, '').trim();
    // Ensure /api suffix exists
    if (clean.endsWith('/api')) {
      return clean;
    }
    // If missing /api suffix, append it
    return `${clean}/api`;
  }

  // Runtime fallback
  if (typeof window === 'undefined') {
    // Server-side rendering or Node.js context
    return 'http://localhost:3000/api';
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) {
    // Development: use configured port
    const devPort = import.meta.env.VITE_API_PORT || '3000';
    return `${protocol}//${hostname}:${devPort}/api`;
  }

  // Production: assume backend on same origin
  const origin = window.location.origin;
  return `${origin}/api`;
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
    return buildTimeSsoUrl.replace(/\/$/, '').trim();
  }

  // Default: use getApiUrl() + /sso
  const apiUrl = getApiUrl();
  // Remove trailing /api to avoid duplication
  const baseUrl = apiUrl.replace(/\/api$/, '');
  return `${baseUrl}/api/sso`;
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
