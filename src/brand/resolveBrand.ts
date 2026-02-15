/**
 * Brand Resolution (Runtime)
 * ==========================
 *
 * Brand is determined at runtime using domain detection.
 * This allows a single frontend build to serve multiple brands
 * based on the domain it's accessed from.
 *
 * Priority:
 *   1. Runtime domain detection (e.g., law.litsuite.app -> 'law')
 *   2. VITE_BRAND environment variable (local dev fallback)
 *   3. Default 'lit'
 *
 * @see client/.env for VITE_BRAND configuration
 */

import { getBrandFromDomain } from "../config/brands";

/**
 * Get the configured brand at runtime
 * Uses domain detection first, then VITE_BRAND env var, then defaults to 'lit'
 * @returns The brand ID (e.g., "ttv", "lit", "law", "deb", "signphony", "mat")
 */
export function resolveBrand(): string {
  // 1. Runtime domain detection (works in production with any domain)
  //    Skip on localhost — there's no meaningful domain to detect
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      const domainBrand = getBrandFromDomain();
      if (domainBrand) {
        return String(domainBrand).trim().toLowerCase();
      }
    }
  }

  // 2. Build-time env var fallback (local dev with VITE_BRAND=xxx)
  const envBrand = import.meta.env.VITE_BRAND;
  if (envBrand) {
    return String(envBrand).trim().toLowerCase();
  }

  // 3. Default fallback
  return 'lit';
}
