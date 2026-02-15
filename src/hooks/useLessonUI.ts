/**
 * useLessonUI adapter hooks - Semantic wrappers over useUiStore
 *
 * Shadow migration version: Returns full store state for compatibility.
 *
 * In production, these would use Zustand selectors with memoization
 * to only expose relevant properties and prevent unnecessary re-renders.
 * That optimization is marked as future work.
 */

import { useUiStore } from '../stores/useUiStore';

/**
 * useLessonModals - Modal state and controls (semantic wrapper over useUiStore)
 *
 * Note: Currently returns full store state for simplicity.
 * Selector optimization with proper memoization is marked as future work.
 */
export const useLessonModals = () => {
  return useUiStore();
};

/**
 * useLessonUIFlags - UI flag state and controls (semantic wrapper over useUiStore)
 *
 * Note: Currently returns full store state for simplicity.
 * Selector optimization with proper memoization is marked as future work.
 */
export const useLessonUIFlags = () => {
  return useUiStore();
};

/**
 * useLessonPreferences - User preferences with persistence (semantic wrapper over useUiStore)
 *
 * Note: Currently returns full store state for simplicity.
 * Selector optimization with proper memoization is marked as future work.
 */
export const useLessonPreferences = () => {
  return useUiStore();
};
