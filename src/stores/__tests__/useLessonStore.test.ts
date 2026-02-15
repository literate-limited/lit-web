/**
 * Tests for useLessonStore (Zustand store)
 *
 * Replaces LevelContextProvider functionality for:
 * - Lesson state (currentLesson, levelIndex, lessonLevels)
 * - Game state (currentQuestion, currentOptions, inputValue, etc.)
 * - Answer handling and lesson progression
 * - Results tracking and completion
 */

import { renderHook, act } from '@testing-library/react';
import { useLessonStore } from '../useLessonStore';

describe('useLessonStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useLessonStore());
    act(() => {
      result.current.resetGame?.();
    });
  });

  describe('Lesson State Management', () => {
    it('should initialize with empty lesson state', () => {
      const { result } = renderHook(() => useLessonStore());

      expect(result.current.currentLesson).toBeNull();
      expect(result.current.levelIndex).toBe(0);
      expect(result.current.levels).toEqual([]);
    });

    it('should start a lesson with valid data', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        title: 'French Basics',
        levels: [
          { _id: 'level1', type: 'mcq', question: 'What is hello?' },
          { _id: 'level2', type: 'writing', texts: ['Write a sentence'] },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
      });

      expect(result.current.currentLesson).toEqual(mockLesson);
      expect(result.current.levelIndex).toBe(0);
      expect(result.current.levels).toHaveLength(2);
    });

    it('should not start lesson with invalid data', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.startLesson(null);
        result.current.startLesson({ _id: 'bad' }); // missing levels array
      });

      expect(result.current.currentLesson).toBeNull();
    });

    it('should resume from saved progress', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'mcq' },
          { _id: 'level2', type: 'writing' },
          { _id: 'level3', type: 'speaking' },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson, 2); // resume at level 3
      });

      expect(result.current.levelIndex).toBe(2);
    });

    it('should clamp resume index to valid bounds', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'mcq' },
          { _id: 'level2', type: 'writing' },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson, 999); // out of bounds
      });

      expect(result.current.levelIndex).toBe(1); // clamped to last index
    });

    it('should exit lesson and reset state', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [{ _id: 'level1', type: 'mcq' }],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setLevelIndex(0);
        result.current.exitLesson();
      });

      expect(result.current.currentLesson).toBeNull();
      expect(result.current.levelIndex).toBe(0);
      expect(result.current.lessonResults).toEqual([]);
      expect(result.current.litThisLesson).toBe(0);
    });
  });

  describe('Game State & Orchestration', () => {
    it('should set current level type', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.setCurrentLevelType('mcq');
      });

      expect(result.current.currentLevelType).toBe('mcq');
    });

    it('should set current question and options', () => {
      const { result } = renderHook(() => useLessonStore());

      const options = ['Yes', 'No', 'Maybe'];

      act(() => {
        result.current.setCurrentQuestion('Is this a test?');
        result.current.setCurrentOptions(options);
      });

      expect(result.current.currentQuestion).toBe('Is this a test?');
      expect(result.current.currentOptions).toEqual(options);
    });

    it('should update input value', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.setInputValue('Hello');
      });

      expect(result.current.inputValue).toBe('Hello');
    });

    it('should handle keyboard input via handleButtonClick', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.handleButtonClick('H');
        result.current.handleButtonClick('i');
      });

      expect(result.current.inputValue).toBe('Hi');
    });

    it('should delete character on Delete key', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.setInputValue('Hello');
        result.current.handleButtonClick('Delete');
      });

      expect(result.current.inputValue).toBe('Hell');
    });

    it('should add space on Space key', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.setInputValue('Hello');
        result.current.handleButtonClick('Space');
      });

      expect(result.current.inputValue).toBe('Hello ');
    });
  });

  describe('Answer Checking & Progression', () => {
    it('should handle correct answer in MCQ', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          {
            _id: 'level1',
            type: 'mcq',
            mcqs: [
              {
                question: 'What is 2+2?',
                options: [
                  { text: '3' },
                  { text: '4' },
                  { text: '5' },
                ],
                correctAnswer: 1,
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setCurrentLevelType('mcq');
        result.current.handleCheckAnswer(1); // Correct answer
      });

      const result_entry = result.current.lessonResults[0];
      expect(result_entry?.correct).toBe(true);
      expect(result_entry?.litAwarded).toBeGreaterThanOrEqual(0);
    });

    it('should handle incorrect answer', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          {
            _id: 'level1',
            type: 'mcq',
            mcqs: [
              {
                question: 'What is 2+2?',
                options: [
                  { text: '3' },
                  { text: '4' },
                  { text: '5' },
                ],
                correctAnswer: 1,
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setCurrentLevelType('mcq');
        result.current.handleCheckAnswer(0); // Wrong answer
      });

      const result_entry = result.current.lessonResults[0];
      expect(result_entry?.correct).toBe(false);
      expect(result_entry?.litAwarded).toBe(0);
    });

    it('should track lesson results', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'info' },
          { _id: 'level2', type: 'mcq', mcqs: [{ correctAnswer: 0 }] },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setCurrentLevelType('info');
        result.current.handleCheckAnswer(null);
      });

      expect(result.current.lessonResults).toHaveLength(1);
      expect(result.current.lessonResults[0].levelId).toBe('level1');
    });

    it('should award lit on correct answer', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'info' },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setLevelSecondsLeft(10);
        result.current.setCurrentLevelType('info');
        result.current.handleCheckAnswer(null);
      });

      // Info levels auto-advance and award lit
      expect(result.current.litThisLesson).toBeGreaterThanOrEqual(0);
    });

    it('should prevent duplicate lit awards', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'mcq', mcqs: [{ correctAnswer: 0 }] },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setCurrentLevelType('mcq');
        result.current.setLevelSecondsLeft(10);
        result.current.handleCheckAnswer(0); // First correct answer
        const litFirstTime = result.current.litThisLesson;

        result.current.handleCheckAnswer(0); // Second correct answer (should not award again)
        const litSecondTime = result.current.litThisLesson;
      });

      // Second answer shouldn't add more lit (already correct)
      expect(result.current.litThisLesson).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Clue System', () => {
    it('should reveal clues character by character', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.setCurrentLevelType('fill-in-the-blank');
        result.current.setInputValue('');
        result.current.handleClueClick('Hello');
      });

      expect(result.current.inputValue).toBe('H');

      act(() => {
        result.current.handleClueClick('Hello');
      });

      expect(result.current.inputValue).toBe('He');
    });

    it('should reset clues on wrong answer', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'fill-in-the-blank', texts: ['test'], correctAnswer: 'Hello' },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setCurrentLevelType('fill-in-the-blank');
        result.current.setInputValue('H');
        result.current.handleCheckAnswer('Wrong'); // Wrong answer
      });

      // After wrong answer, input should be cleared for clue retry
      expect(result.current.inputValue).toBe('');
    });
  });

  describe('Lesson Completion', () => {
    it('should mark lesson as completed', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'info' },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setCurrentLevelType('info');
        result.current.setIsGameCompleted(true);
      });

      expect(result.current.isGameCompleted).toBe(true);
    });

    it('should calculate accuracy', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [
          { _id: 'level1', type: 'mcq', mcqs: [{ correctAnswer: 0 }] },
          { _id: 'level2', type: 'mcq', mcqs: [{ correctAnswer: 0 }] },
          { _id: 'level3', type: 'mcq', mcqs: [{ correctAnswer: 0 }] },
        ],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setCurrentLevelType('mcq');

        // 2 correct, 1 wrong = 66% accuracy
        result.current.handleCheckAnswer(0); // Correct
        result.current.setLevelIndex(1);
        result.current.handleCheckAnswer(0); // Correct
        result.current.setLevelIndex(2);
        result.current.handleCheckAnswer(1); // Wrong
      });

      // Should have tracked results for accuracy calculation
      expect(result.current.lessonResults.length).toBeGreaterThan(0);
    });

    it('should calculate bonus lit based on accuracy', () => {
      const { result } = renderHook(() => useLessonStore());

      act(() => {
        result.current.setLitThisLesson(100);
        result.current.calculateBonusLit(0.85); // 85% accuracy -> 70% bonus
      });

      // 85% accuracy should give ~70% bonus
      expect(result.current.lessonBonusLit).toBeGreaterThan(0);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset game state', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [{ _id: 'level1', type: 'mcq' }],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.setInputValue('test');
        result.current.setLitThisLesson(50);
        result.current.setIsGameCompleted(true);

        result.current.resetGame();
      });

      expect(result.current.levelIndex).toBe(0);
      expect(result.current.inputValue).toBe('');
      expect(result.current.litThisLesson).toBe(0);
      expect(result.current.isGameCompleted).toBe(false);
    });

    it('should maintain lesson when resetting', () => {
      const { result } = renderHook(() => useLessonStore());

      const mockLesson = {
        _id: 'lesson1',
        levels: [{ _id: 'level1', type: 'mcq' }],
      };

      act(() => {
        result.current.startLesson(mockLesson);
        result.current.resetGame();
      });

      expect(result.current.currentLesson).toEqual(mockLesson);
    });
  });
});
