/**
 * useLesson adapter hooks - Semantic wrappers over useLessonStore
 *
 * Shadow migration version: Returns full store state for compatibility.
 *
 * In production, these would use Zustand selectors with memoization
 * to only expose relevant properties and prevent unnecessary re-renders.
 * That optimization is marked as future work (see parity tests).
 */

import { useLessonStore } from '../stores/useLessonStore';

/**
 * useLessonGame - Core gameplay state and actions (semantic wrapper over useLessonStore)
 *
 * Note: Currently returns full store state for simplicity.
 * Selector optimization with proper memoization is marked as future work.
 */
export const useLessonGame = () => {
  return useLessonStore();
};

/**
 * useLessonReading - Reading mode state and actions (semantic wrapper over useLessonStore)
 *
 * Note: Currently returns full store state for simplicity.
 * Selector optimization with proper memoization is marked as future work.
 */
export const useLessonReading = () => {
  return useLessonStore();
};

/**
 * useLessonResults - Results tracking state (semantic wrapper over useLessonStore)
 *
 * Note: Currently returns full store state for simplicity.
 * Selector optimization with proper memoization is marked as future work.
 */
export const useLessonResults = () => {
  return useLessonStore();
};

/**
 * useLessonKeyboard - Keyboard input handling (semantic wrapper over useLessonStore)
 *
 * Note: Currently returns full store state for simplicity.
 * Selector optimization with proper memoization is marked as future work.
 */
export const useLessonKeyboard = () => {
  return useLessonStore();
};

/**
 * useLesson - Comprehensive lesson state (game + reading)
 */
export const useLesson = () => {
  return useLessonStore();
};
