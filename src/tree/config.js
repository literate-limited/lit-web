/**
 * Knowledge Tree Configuration
 *
 * Shared configuration for all knowledge tree components.
 * This ensures consistency between /tree and /forest views.
 */

// The canonical knowledge tree key used across the application
// This should match the tree stored in the database
export const DEFAULT_TREE_KEY = import.meta.env.VITE_KNOWLEDGE_TREE_KEY || "lit-tree";

// Legacy tree key for backwards compatibility
// The 3D tree view previously used a different key
export const LEGACY_TREE_KEY = "litflame-knowledge-tree";

// Default subtree/app to show when viewing the tree
export const DEFAULT_SUBTREE_APP = "app:literate";

// API base URL
export const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get the tree key to use, with fallback logic
 * @param {string|null} explicitKey - Explicitly provided key (e.g., from URL params)
 * @returns {string} The tree key to use
 */
export function getTreeKey(explicitKey = null) {
  if (explicitKey) return explicitKey;
  return DEFAULT_TREE_KEY;
}
