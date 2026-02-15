/**
 * Level Types Schema
 *
 * Central TypeScript definitions for all quiz/level types in the LIT platform.
 * This serves as the single source of truth for level structures.
 */

// ============================================================================
// Core Level Types
// ============================================================================

export type LevelType =
  | 'mcq'                    // Multiple Choice Question
  | 'fill'                   // Fill in the Blank
  | 'fill-in-the-blank'      // Alternative name for fill
  | 'info'                   // Information/Lesson content
  | 'lesson'                 // Alternative name for info
  | 'audio'                  // Audio listening exercise
  | 'reading'                // Reading comprehension
  | 'speaking'               // Speaking/pronunciation
  | 'writing'                // Written response
  | 'vocalizing'             // Advanced speech exercise
  | 'listening'              // Listening (CEFR placement)
  | 'video'                  // Video content
  | 'gaussian-elimination'   // Math: Gaussian elimination
  | 'sl-imitation'           // Sign Language imitation
  | 'question';              // Generic question type

export type DifficultyLevel =
  | 'Y1' | 'Y2' | 'Y3' | 'Y4' | 'Y5' | 'Y6'  // Years 1-6
  | 'Y7' | 'Y8' | 'Y9' | 'Y10'                // Years 7-10
  | 'Y11' | 'Y12'                             // Years 11-12
  | 'beginner' | 'intermediate' | 'advanced'  // General levels
  | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';  // CEFR levels

export type QuestionType = 'mcq' | 'fill';

// ============================================================================
// Level Interfaces
// ============================================================================

/**
 * Base level interface - all levels extend this
 */
export interface BaseLevel {
  _id: string;
  id?: string;                    // Alternative ID format
  type: LevelType;
  title?: string;
  level?: number;                 // Order/sequence number
  difficulty?: DifficultyLevel;
  language?: string;
  topic?: string;
  brand_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * MCQ Level - Multiple Choice Question
 */
export interface MCQLevel extends BaseLevel {
  type: 'mcq';
  question_type?: 'mcq';
  content: string;                // The question text
  question?: string;              // Alternative question field
  options: string[];              // Array of answer choices
  correctAnswer: number;          // Index of correct answer (0-based)
  mcqs?: Array<{                 // Alternative MCQ structure
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  explanation?: string;           // Explanation for the correct answer
}

/**
 * Fill in the Blank Level
 */
export interface FillLevel extends BaseLevel {
  type: 'fill' | 'fill-in-the-blank';
  question_type?: 'fill';
  content: string;                // The question with blank
  question?: string;
  correctAnswer: string;          // The correct answer to fill in
  caseSensitive?: boolean;
  acceptableAnswers?: string[];   // Alternative acceptable answers
  hint?: string;
}

/**
 * Info/Lesson Level - Informational content
 */
export interface InfoLevel extends BaseLevel {
  type: 'info' | 'lesson';
  content: string;                // HTML or markdown content
  title: string;
  duration?: number;              // Expected reading time in seconds
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
  }[];
}

/**
 * Audio Level - Listening exercise
 */
export interface AudioLevel extends BaseLevel {
  type: 'audio' | 'listening';
  audioUrl?: string;
  audioFile?: string;
  sounds?: string[];              // Multiple audio files
  content?: string;               // Optional accompanying text
  prompt?: string;
  question?: string;
  options?: string[];             // For audio + MCQ combination
  correctAnswer?: number | string;
  transcript?: string;
  autoPlay?: boolean;
}

/**
 * Reading Level - Reading comprehension
 */
export interface ReadingLevel extends BaseLevel {
  type: 'reading';
  content: string;                // The text to read
  text?: string;                  // Alternative text field
  pages?: string[];               // Paginated content
  questions?: Array<MCQLevel | FillLevel>;  // Follow-up questions
  duration?: number;
}

/**
 * Speaking Level - Pronunciation/speaking exercise
 */
export interface SpeakingLevel extends BaseLevel {
  type: 'speaking' | 'vocalizing';
  prompt: string;                 // What to say
  targetText: string;             // Expected text
  audioExample?: string;          // Example pronunciation
  phonetics?: string;             // IPA pronunciation guide
  evaluationCriteria?: {
    pronunciation: boolean;
    fluency: boolean;
    accuracy: boolean;
  };
}

/**
 * Writing Level - Written response
 */
export interface WritingLevel extends BaseLevel {
  type: 'writing';
  prompt: string;                 // Writing prompt
  minWords?: number;
  maxWords?: number;
  suggestedStructure?: string[];
  rubric?: {
    grammar: number;
    vocabulary: number;
    coherence: number;
    taskAchievement: number;
  };
}

/**
 * Video Level - Video content
 */
export interface VideoLevel extends BaseLevel {
  type: 'video';
  videoUrl: string;
  videoFile?: string;
  thumbnail?: string;
  duration?: number;
  subtitles?: string;
  autoPlay?: boolean;
}

/**
 * Generic Question Level - Used in UnitPlayer
 */
export interface QuestionLevel extends BaseLevel {
  type: 'question';
  question_type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: number | string;
}

/**
 * Union type of all level types
 */
export type Level =
  | MCQLevel
  | FillLevel
  | InfoLevel
  | AudioLevel
  | ReadingLevel
  | SpeakingLevel
  | WritingLevel
  | VideoLevel
  | QuestionLevel
  | BaseLevel;

// ============================================================================
// Lesson/Unit Interfaces
// ============================================================================

export interface Lesson {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  language?: string;
  levels: Level[];
  totalLevels?: number;
  estimatedTime?: number;         // In minutes
  thumbnail?: string;
  brand_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Unit {
  id: string;
  name: string;
  topic: string;
  difficulty: DifficultyLevel;
  levels: Level[];
  description?: string;
  order?: number;
}

// ============================================================================
// Placement Test Interfaces
// ============================================================================

export interface PlacementQuestion {
  id: string;
  type: 'listening' | 'reading' | 'grammar' | 'vocabulary';
  levelBand: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  prompt: string;
  options: string[];
  correctAnswer: number;
  audioUrl?: string;
}

export interface PlacementResult {
  recommendedLevel?: string;
  recommendedBand?: string;
  scorePercent: number;
  totalCorrect: number;
  totalQuestions: number;
  justification?: string;
  levelBreakdown?: Record<string, {
    correct: number;
    total: number;
  }>;
}

// ============================================================================
// Progress & Results Interfaces
// ============================================================================

export interface LevelResult {
  levelId: string;
  correct: boolean;
  answeredWith?: string;
  litAwarded: number;             // Points/currency awarded
  timestamp: number;
  timeSpent?: number;             // Seconds spent on level
}

export interface LevelProgress {
  levelId: string;
  completed: boolean;
  correct?: boolean;
  attempts?: number;
  lastAttemptAt?: string;
}

export interface LessonProgress {
  lessonId: string;
  levelProgress: Record<string, LevelProgress>;
  completedAt?: string;
  accuracy?: number;
  totalLit?: number;
  skipped?: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isMCQLevel(level: Level): level is MCQLevel {
  return level.type === 'mcq';
}

export function isFillLevel(level: Level): level is FillLevel {
  return level.type === 'fill' || level.type === 'fill-in-the-blank';
}

export function isInfoLevel(level: Level): level is InfoLevel {
  return level.type === 'info' || level.type === 'lesson';
}

export function isAudioLevel(level: Level): level is AudioLevel {
  return level.type === 'audio' || level.type === 'listening';
}

export function isReadingLevel(level: Level): level is ReadingLevel {
  return level.type === 'reading';
}

export function isSpeakingLevel(level: Level): level is SpeakingLevel {
  return level.type === 'speaking' || level.type === 'vocalizing';
}

export function isWritingLevel(level: Level): level is WritingLevel {
  return level.type === 'writing';
}

export function isVideoLevel(level: Level): level is VideoLevel {
  return level.type === 'video';
}

export function isQuestionLevel(level: Level): level is QuestionLevel {
  return level.type === 'question';
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract correct answer type based on level type
 */
export type CorrectAnswerType<T extends Level> =
  T extends MCQLevel ? number :
  T extends FillLevel ? string :
  T extends QuestionLevel ? (number | string) :
  string | number | undefined;

/**
 * Level type metadata for UI rendering
 */
export interface LevelTypeMetadata {
  type: LevelType;
  displayName: string;
  icon: string;
  color: string;
  description: string;
  requiresUserInput: boolean;
  autoAdvance: boolean;
}

export const LEVEL_TYPE_METADATA: Record<string, LevelTypeMetadata> = {
  mcq: {
    type: 'mcq',
    displayName: 'Multiple Choice',
    icon: '☑️',
    color: '#3b82f6',
    description: 'Select the correct answer',
    requiresUserInput: true,
    autoAdvance: false,
  },
  fill: {
    type: 'fill',
    displayName: 'Fill in the Blank',
    icon: '✏️',
    color: '#8b5cf6',
    description: 'Type the missing word',
    requiresUserInput: true,
    autoAdvance: false,
  },
  info: {
    type: 'info',
    displayName: 'Lesson',
    icon: '📖',
    color: '#10b981',
    description: 'Learn new content',
    requiresUserInput: false,
    autoAdvance: true,
  },
  audio: {
    type: 'audio',
    displayName: 'Listen',
    icon: '🎧',
    color: '#f59e0b',
    description: 'Listen and respond',
    requiresUserInput: true,
    autoAdvance: false,
  },
  reading: {
    type: 'reading',
    displayName: 'Reading',
    icon: '📚',
    color: '#06b6d4',
    description: 'Read and comprehend',
    requiresUserInput: false,
    autoAdvance: false,
  },
  speaking: {
    type: 'speaking',
    displayName: 'Speaking',
    icon: '🗣️',
    color: '#ec4899',
    description: 'Practice pronunciation',
    requiresUserInput: true,
    autoAdvance: false,
  },
  writing: {
    type: 'writing',
    displayName: 'Writing',
    icon: '✍️',
    color: '#6366f1',
    description: 'Write a response',
    requiresUserInput: true,
    autoAdvance: false,
  },
  video: {
    type: 'video',
    displayName: 'Video',
    icon: '🎬',
    color: '#ef4444',
    description: 'Watch and learn',
    requiresUserInput: false,
    autoAdvance: true,
  },
};
