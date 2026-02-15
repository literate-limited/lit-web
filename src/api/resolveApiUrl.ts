/**
 * API URL Resolution (Runtime)
 * ============================
 *
 * Determines the backend API URL at runtime without build-time env vars.
 * This enables the same frontend build to connect to different backends.
 *
 * Architectural Rule:
 * The frontend should never be tightly coupled to a specific backend URL.
 * Instead, it should detect the backend based on the deployment context.
 *
 * @see https://github.com/lit-suite/lit/blob/dev/DEPLOYMENT_GUIDE.md
 */

/**
 * Resolve the API base URL at runtime
 *
 * Strategy:
 * - In development (localhost): Use hardcoded localhost:3000
 * - In production: Use same origin as frontend (assumes backend on same domain)
 * - Fallback: Use same origin
 *
 * @returns The API base URL (e.g., "http://localhost:3000/api/v2")
 */
export function resolveApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window === "undefined") {
    // Server-side rendering or Node.js context
    return "http://localhost:1212/api/v2";
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocalhost) {
    const devPort = import.meta.env.VITE_API_PORT || "1212";
    return `${protocol}//${hostname}:${devPort}/api/v2`;
  }

  // Production: assume backend is on same origin
  const origin = window.location.origin;
  return `${origin}/api/v2`;
}

/**
 * Resolve the Socket.IO URL at runtime
 *
 * Strategy:
 * - In development: Use same as API URL (localhost:3000)
 * - In production: Use same origin as frontend
 *
 * @returns The Socket.IO URL (e.g., "http://localhost:3000")
 */
export function resolveSocketUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost:1212";
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocalhost) {
    const devPort = import.meta.env.VITE_API_PORT || "1212";
    return `${window.location.protocol}//${hostname}:${devPort}`;
  }

  return window.location.origin;
}
