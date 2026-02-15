/**
 * useLessonStore - Zustand store for lesson game state
 *
 * Replaces LevelContextProvider lesson/game logic
 * Manages:
 * - Lesson metadata (currentLesson, levels, levelIndex)
 * - Game state (currentQuestion, inputValue, selectedAnswer, etc.)
 * - Answer checking and progression
 * - Results tracking (lessonResults, litThisLesson, bonus)
 * - Reading mode state (readingText, readingPageIndex)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

interface Lesson {
  _id: string;
  title?: string;
  levels: Level[];
  [key: string]: any;
}

interface Level {
  _id: string;
  type: string;
  [key: string]: any;
}

interface LessonResult {
  levelId: string;
  correct: boolean;
  answeredWith?: string;
  litAwarded: number;
  timestamp: number;
}

interface LessonStoreState {
  // Lesson state
  currentLesson: Lesson | null;
  levelIndex: number;
  levels: Level[];
  currentLevel?: Level | null;

  // Game state
  currentQuestion: string | null;
  currentOptions: any[] | null;
  inputValue: string;
  selectedAnswer: number | null;
  currentLevelType: string | null;
  currentSound: any;
  currentVideo: any;
  currentImage: any;
  levelSecondsLeft: number;

  // Results tracking
  lessonResults: LessonResult[];
  litThisLesson: number;
  lessonBonusLit: number;
  lessonAccuracy: number;
  isGameCompleted: boolean;

  // Reading mode
  readingText: string;
  readingPageIndex: number;

  // Actions - Lesson
  startLesson: (lesson: Lesson | null, resumeIndex?: number) => void;
  exitLesson: () => void;
  setLevelIndex: (index: number) => void;
  updateUserLevel: (index: number) => void;

  // Actions - Game State
  setCurrentQuestion: (question: string | null) => void;
  setCurrentOptions: (options: any[] | null) => void;
  setInputValue: (value: string) => void;
  setSelectedAnswer: (index: number | null) => void;
  setCurrentLevelType: (type: string | null) => void;
  setCurrentSound: (sound: any) => void;
  setCurrentVideo: (video: any) => void;
  setCurrentImage: (image: any) => void;
  setLevelSecondsLeft: (seconds: number) => void;

  // Actions - Input handling
  handleButtonClick: (char: string) => void;
  handleKeyPress: (key: string, currentValue: string) => string;
  handleClueClick: (correctAnswer?: string) => void;

  // Actions - Answer & Progression
  handleCheckAnswer: (answer?: string | number | null) => void;

  // Actions - Reading
  setReadingText: (text: string) => void;
  setReadingPageIndex: (index: number) => void;
  nextReadingPage: (totalPages: number) => void;
  prevReadingPage: () => void;
  goToReadingPage: (pageIndex: number, totalPages: number) => void;

  // Actions - Results
  setLitThisLesson: (lit: number) => void;
  calculateBonusLit: (accuracy: number) => void;
  setIsGameCompleted: (completed: boolean) => void;

  // Actions - Reset
  resetGame: () => void;
}

const initialState = {
  currentLesson: null,
  levelIndex: 0,
  levels: [],
  currentQuestion: null,
  currentOptions: null,
  inputValue: '',
  selectedAnswer: null,
  currentLevelType: null,
  currentSound: null,
  currentVideo: null,
  currentImage: null,
  levelSecondsLeft: 0,
  lessonResults: [],
  litThisLesson: 0,
  lessonBonusLit: 0,
  lessonAccuracy: 0,
  isGameCompleted: false,
  readingText: '',
  readingPageIndex: 0,
};

export const useLessonStore = create<LessonStoreState>()(
  devtools(
    immer((set, get) => ({
    ...initialState,

    get currentLevel() {
      return get().levels?.[get().levelIndex] || null;
    },

    startLesson: (lesson, resumeIndex = 0) => {
      if (!lesson || !lesson._id || !Array.isArray(lesson.levels)) {
        set((state) => {
          state.currentLesson = null;
          state.levelIndex = 0;
        });
        return;
      }

      const clampedIndex = Math.max(0, Math.min(resumeIndex, lesson.levels.length - 1));

      set((state) => {
        state.currentLesson = lesson;
        state.levels = lesson.levels;
        state.levelIndex = clampedIndex;
        state.lessonResults = [];
        state.litThisLesson = 0;
        state.lessonBonusLit = 0;
        state.lessonAccuracy = 0;
        state.isGameCompleted = false;
        state.inputValue = '';
      });
    },

    exitLesson: () => {
      set(() => ({
        ...initialState,
      }));
    },

    setLevelIndex: (index) => {
      set((state) => {
        state.levelIndex = Math.max(0, Math.min(index, (state.levels?.length || 1) - 1));
      });
    },

    updateUserLevel: (index) => {
      set((state) => {
        state.levelIndex = index;
      });
    },

    setCurrentQuestion: (question) => {
      set((state) => {
        state.currentQuestion = question;
      });
    },

    setCurrentOptions: (options) => {
      set((state) => {
        state.currentOptions = options;
      });
    },

    setInputValue: (value) => {
      set((state) => {
        state.inputValue = value;
      });
    },

    setSelectedAnswer: (index) => {
      set((state) => {
        state.selectedAnswer = index;
      });
    },

    setCurrentLevelType: (type) => {
      set((state) => {
        state.currentLevelType = type;
      });
    },

    setCurrentSound: (sound) => {
      set((state) => {
        state.currentSound = sound;
      });
    },

    setCurrentVideo: (video) => {
      set((state) => {
        state.currentVideo = video;
      });
    },

    setCurrentImage: (image) => {
      set((state) => {
        state.currentImage = image;
      });
    },

    setLevelSecondsLeft: (seconds) => {
      set((state) => {
        state.levelSecondsLeft = seconds;
      });
    },

    handleButtonClick: (char) => {
      set((state) => {
        if (char === 'Delete') {
          state.inputValue = state.inputValue.slice(0, -1);
        } else if (char === 'Space') {
          state.inputValue += ' ';
        } else {
          state.inputValue += char;
        }
      });
    },

    handleKeyPress: (key, currentValue) => {
      if (key === 'Delete') {
        return currentValue.slice(0, -1);
      }
      if (key === 'Space') {
        return currentValue + ' ';
      }
      if (key === 'Submit') {
        return currentValue;
      }
      return currentValue + key;
    },

    handleClueClick: (correctAnswer) => {
      set((state) => {
        if (state.currentLevelType === 'fill-in-the-blank' && correctAnswer) {
          // Reveal one more character of the answer
          if (state.inputValue.length < correctAnswer.length) {
            state.inputValue += correctAnswer[state.inputValue.length];
          }
        }
      });
    },

    handleCheckAnswer: (answer) => {
      const state = get();
      const currentLevel = state.levels[state.levelIndex];
      const litAwarded = Math.max(0, state.levelSecondsLeft);

      // Auto-complete info/audio levels
      if (state.currentLevelType === 'info' || state.currentLevelType === 'audio') {
        set((draft) => {
          draft.lessonResults.push({
            levelId: currentLevel?._id || '',
            correct: true,
            litAwarded: litAwarded,
            timestamp: Date.now(),
          });
          draft.litThisLesson += litAwarded;
          draft.levelIndex += 1;
        });
        return;
      }

      // Extract correct answer based on level type
      let correctAnswerValue: any = null;

      if (state.currentLevelType === 'mcq') {
        // For MCQ, correctAnswer is in mcqs array
        correctAnswerValue = currentLevel?.mcqs?.[0]?.correctAnswer;
      } else {
        // For fill-in-the-blank and others, correctAnswer is at level top
        correctAnswerValue = currentLevel?.correctAnswer;
      }

      // Check if answer is correct
      let isCorrect = false;

      if (state.currentLevelType === 'mcq') {
        // For MCQ: answer should match the correct answer index
        isCorrect = answer === correctAnswerValue;
      } else {
        // For fill-in-the-blank: answer should match correct answer string
        isCorrect = answer === correctAnswerValue;
      }

      const resultLit = isCorrect ? litAwarded : 0;

      set((draft) => {
        draft.lessonResults.push({
          levelId: currentLevel?._id || '',
          correct: isCorrect,
          answeredWith: String(answer),
          litAwarded: resultLit,
          timestamp: Date.now(),
        });

        if (isCorrect) {
          draft.litThisLesson += resultLit;
          draft.levelIndex += 1;
        }
        draft.inputValue = '';
      });
    },

    setReadingText: (text) => {
      set((state) => {
        state.readingText = text;
      });
    },

    setReadingPageIndex: (index) => {
      set((state) => {
        state.readingPageIndex = index;
      });
    },

    nextReadingPage: (totalPages) => {
      set((state) => {
        if (state.readingPageIndex < totalPages - 1) {
          state.readingPageIndex += 1;
        }
      });
    },

    prevReadingPage: () => {
      set((state) => {
        if (state.readingPageIndex > 0) {
          state.readingPageIndex -= 1;
        }
      });
    },

    goToReadingPage: (pageIndex, totalPages) => {
      set((state) => {
        state.readingPageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
      });
    },

    setLitThisLesson: (lit) => {
      set((state) => {
        state.litThisLesson = lit;
      });
    },

    calculateBonusLit: (accuracy) => {
      set((state) => {
        // Bonus scales with accuracy: 90% = 50% bonus, 100% = 100% bonus
        const bonusMultiplier = Math.max(0, (accuracy - 0.75) * 4);
        state.lessonBonusLit = Math.floor(state.litThisLesson * bonusMultiplier);
        state.lessonAccuracy = accuracy;
      });
    },

    setIsGameCompleted: (completed) => {
      set((state) => {
        state.isGameCompleted = completed;
      });
    },

    resetGame: () => {
      set((state) => {
        state.levelIndex = 0;
        state.lessonResults = [];
        state.litThisLesson = 0;
        state.lessonBonusLit = 0;
        state.lessonAccuracy = 0;
        state.isGameCompleted = false;
        state.inputValue = '';
        state.selectedAnswer = null;
      });
    },
    })),
    { name: 'LessonStore' }
  )
);
