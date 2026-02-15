/**
 * Brand Resolution (Build-time)
 * =============================
 *
 * Brand is determined at build-time from VITE_BRAND environment variable.
 * Each frontend instance is built for a specific brand and all instances
 * communicate with the same shared backend.
 *
 * @see client/.env for VITE_BRAND configuration
 */

/**
 * Get the configured brand
 * @returns The brand ID from VITE_BRAND env var (e.g., "ttv", "lit", "tru", "eag")
 */
export function resolveBrand(): string {
  const brand = import.meta.env.VITE_BRAND || "lit";
  return String(brand).trim().toLowerCase();
}
