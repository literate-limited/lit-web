/**
 * Tests for useLesson adapter hooks
 *
 * Semantic wrapper hooks over useLessonStore that:
 * - Provide clear, focused API for components
 * - Select only relevant state slices
 * - Prevent unnecessary re-renders via Zustand selectors
 */

import { renderHook, act } from '@testing-library/react';
import {
  useLesson,
  useLessonGame,
  useLessonReading,
  useLessonResults,
  useLessonKeyboard,
} from '../useLesson';

describe('Lesson Adapter Hooks', () => {
  describe('useLessonGame()', () => {
    it('should provide core gameplay state and actions', () => {
      const { result } = renderHook(() => useLessonGame());

      // State properties
      expect(result.current).toHaveProperty('currentQuestion');
      expect(result.current).toHaveProperty('currentOptions');
      expect(result.current).toHaveProperty('inputValue');
      expect(result.current).toHaveProperty('handleButtonClick');
      expect(result.current).toHaveProperty('handleCheckAnswer');

      // Verify types
      expect(typeof result.current.handleButtonClick).toBe('function');
      expect(typeof result.current.handleCheckAnswer).toBe('function');
    });

    it('should allow starting a lesson', () => {
      const { result } = renderHook(() => useLessonGame());

      const mockLesson = {
        _id: 'lesson1',
        title: 'Test Lesson',
        levels: [
          { _id: 'level1', type: 'mcq', question: 'Test?' },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
      });

      expect(result.current.currentLesson).toEqual(mockLesson);
      expect(result.current.levelIndex).toBe(0);
    });

    it('should provide level progression', () => {
      const { result } = renderHook(() => useLessonGame());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'mcq' },
          { _id: 'level2', type: 'mcq' },
          { _id: 'level3', type: 'mcq' },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
      });

      expect(result.current.levels).toHaveLength(3);
      const currentLevel = result.current.levels?.[result.current.levelIndex];
      expect(currentLevel?._id).toBe('level1');

      act(() => {
        result.current.updateUserLevel(1);
      });

      expect(result.current.levelIndex).toBe(1);
    });

    it('should handle input and keyboard interaction', () => {
      const { result } = renderHook(() => useLessonGame());

      act(() => {
        result.current.handleButtonClick('H');
        result.current.handleButtonClick('i');
      });

      expect(result.current.inputValue).toBe('Hi');
    });

    it('should track selected answer', () => {
      const { result } = renderHook(() => useLessonGame());

      act(() => {
        result.current.setSelectedAnswer(2);
      });

      expect(result.current.selectedAnswer).toBe(2);
    });

    it('should provide game completion state', () => {
      const { result } = renderHook(() => useLessonGame());

      act(() => {
        result.current.setIsGameCompleted(true);
      });

      expect(result.current.isGameCompleted).toBe(true);
    });
  });

  describe('useLessonReading()', () => {
    it('should provide reading-specific state', () => {
      const { result } = renderHook(() => useLessonReading());

      expect(result.current).toHaveProperty('readingText');
      expect(result.current).toHaveProperty('readingPageIndex');
      expect(result.current).toHaveProperty('nextReadingPage');
      expect(result.current).toHaveProperty('prevReadingPage');
      expect(result.current).toHaveProperty('goToReadingPage');
    });

    it('should manage reading text', () => {
      const { result } = renderHook(() => useLessonReading());

      const text = 'This is a reading passage.\n\nSecond paragraph.';

      act(() => {
        result.current.setReadingText(text);
      });

      expect(result.current.readingText).toBe(text);
    });

    it('should navigate reading pages forward', () => {
      const { result } = renderHook(() => useLessonReading());

      act(() => {
        result.current.nextReadingPage(5); // Total 5 pages
      });

      expect(result.current.readingPageIndex).toBe(1);

      act(() => {
        result.current.nextReadingPage(5);
      });

      expect(result.current.readingPageIndex).toBe(2);
    });

    it('should navigate reading pages backward', () => {
      const { result } = renderHook(() => useLessonReading());

      act(() => {
        result.current.setReadingPageIndex(2);
        result.current.prevReadingPage();
      });

      expect(result.current.readingPageIndex).toBe(1);

      act(() => {
        result.current.prevReadingPage();
      });

      expect(result.current.readingPageIndex).toBe(0);
    });

    it('should jump to specific page', () => {
      const { result } = renderHook(() => useLessonReading());

      act(() => {
        result.current.goToReadingPage(3, 5);
      });

      expect(result.current.readingPageIndex).toBe(3);

      // Should clamp to bounds
      act(() => {
        result.current.goToReadingPage(999, 5);
      });

      expect(result.current.readingPageIndex).toBe(4); // Last page
    });

    it('should clamp page bounds', () => {
      const { result } = renderHook(() => useLessonReading());

      act(() => {
        result.current.goToReadingPage(-1, 5); // Negative
      });

      expect(result.current.readingPageIndex).toBe(0);

      act(() => {
        result.current.nextReadingPage(1); // Already at last
      });

      expect(result.current.readingPageIndex).toBe(0); // Stays at 0
    });
  });

  describe('useLessonResults()', () => {
    it('should provide lesson results state', () => {
      const { result } = renderHook(() => useLessonResults());

      expect(result.current).toHaveProperty('lessonResults');
      expect(result.current).toHaveProperty('litThisLesson');
      expect(result.current).toHaveProperty('lessonBonusLit');
      expect(result.current).toHaveProperty('lessonAccuracy');
    });

    it('should track correct answers in results', () => {
      const { result: gameResult } = renderHook(() => useLessonGame());
      const { result: resultsResult } = renderHook(() => useLessonResults());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'info' },
        ],
      };

      act(() => {
        gameResult.current.startLesson(mockLesson);
        gameResult.current.setCurrentLevelType('info');
        gameResult.current.handleCheckAnswer(null);
      });

      expect(resultsResult.current.lessonResults.length).toBeGreaterThan(0);
      expect(resultsResult.current.lessonResults[0].correct).toBe(true);
    });

    it('should accumulate lit earned', () => {
      const { result: gameResult } = renderHook(() => useLessonGame());
      const { result: resultsResult } = renderHook(() => useLessonResults());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'info' },
        ],
      };

      act(() => {
        gameResult.current.startLesson(mockLesson);
        gameResult.current.setLevelSecondsLeft(10);
        gameResult.current.setCurrentLevelType('info');
        gameResult.current.handleCheckAnswer(null);
      });

      expect(resultsResult.current.litThisLesson).toBeGreaterThanOrEqual(0);
    });

    it('should calculate bonus lit', () => {
      const { result } = renderHook(() => useLessonResults());

      act(() => {
        result.current.setLitThisLesson(100);
        result.current.calculateBonusLit(0.9); // 90% accuracy
      });

      // 90% should give significant bonus
      expect(result.current.lessonBonusLit).toBeGreaterThan(50);
    });
  });

  describe('useLessonKeyboard()', () => {
    it('should provide keyboard interaction state', () => {
      const { result } = renderHook(() => useLessonKeyboard());

      expect(result.current).toHaveProperty('inputValue');
      expect(result.current).toHaveProperty('handleButtonClick');
      expect(result.current).toHaveProperty('handleKeyPress');
      expect(result.current).toHaveProperty('handleClueClick');
    });

    it('should handle keyboard input via handleKeyPress', () => {
      const { result } = renderHook(() => useLessonKeyboard());

      let currentValue = '';

      act(() => {
        currentValue = result.current.handleKeyPress('H', currentValue);
        currentValue = result.current.handleKeyPress('i', currentValue);
      });

      expect(currentValue).toBe('Hi');
    });

    it('should handle special keys (Delete, Space)', () => {
      const { result } = renderHook(() => useLessonKeyboard());

      let currentValue = 'Hello';

      act(() => {
        currentValue = result.current.handleKeyPress('Delete', currentValue);
      });

      expect(currentValue).toBe('Hell');

      act(() => {
        currentValue = result.current.handleKeyPress('Space', currentValue);
      });

      expect(currentValue).toBe('Hell ');
    });

    it('should handle Submit key', () => {
      const { result } = renderHook(() => useLessonKeyboard());

      const currentValue = 'test answer';

      let submitted = false;
      act(() => {
        const returnValue = result.current.handleKeyPress('Submit', currentValue);
        submitted = returnValue === currentValue;
      });

      expect(submitted).toBe(true);
    });

    it('should accumulate input via handleButtonClick', () => {
      const { result } = renderHook(() => useLessonKeyboard());

      act(() => {
        result.current.handleButtonClick('A');
        result.current.handleButtonClick('B');
        result.current.handleButtonClick('C');
      });

      expect(result.current.inputValue).toBe('ABC');
    });
  });

  describe('useLesson() - Main hook', () => {
    it('should provide comprehensive lesson state', () => {
      const { result } = renderHook(() => useLesson());

      // Should have both game and reading state
      expect(result.current).toHaveProperty('currentLesson');
      expect(result.current).toHaveProperty('currentQuestion');
      expect(result.current).toHaveProperty('readingText');
      expect(result.current).toHaveProperty('handleCheckAnswer');
    });

    it('should integrate game and reading states', () => {
      const { result } = renderHook(() => useLesson());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'reading', texts: ['Read this text'] },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
      });

      expect(result.current.currentLesson).toEqual(mockLesson);
      expect(result.current.levels).toHaveLength(1);
    });
  });

});
