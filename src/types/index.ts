/**
 * Represents a Vietnamese word with its Japanese translation and learning metadata
 */
export interface Word {
  /** Unique identifier for the word */
  readonly id: string;
  /** Vietnamese word text */
  readonly vietnamese: string;
  /** Japanese translation */
  readonly japanese: string;
  /** Katakana pronunciation guide */
  readonly pronunciation: string;
  /** Audio file URL for pronunciation */
  readonly audio_url: string;
  /** Category this word belongs to */
  readonly category: CategoryId;
  /** Learning difficulty level */
  readonly difficulty: DifficultyLevel;
  /** Optional example sentence with translation */
  readonly example_sentence?: ExampleSentence;
}

/**
 * Example sentence with Vietnamese text and Japanese translation
 */
export interface ExampleSentence {
  readonly vietnamese: string;
  readonly japanese: string;
}

/**
 * Valid difficulty levels for words
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Valid category IDs - must match data file names
 */
export type CategoryId = 'greetings' | 'numbers' | 'daily' | 'food' | 'business';

/**
 * Learning category for organizing words
 */
export interface Category {
  /** Unique identifier matching CategoryId type */
  readonly id: CategoryId;
  /** Japanese display name */
  readonly name: string;
  /** Vietnamese display name */
  readonly name_vietnamese: string;
  /** Category description */
  readonly description: string;
  /** Emoji icon for display */
  readonly icon: string;
  /** Hex color code for theming */
  readonly color: string;
  /** Total number of words in this category */
  readonly wordCount: number;
  /** Learning difficulty level */
  readonly difficulty: DifficultyLevel;
  /** Display order in lists */
  readonly order: number;
}

/**
 * Vietnamese alphabet letter with pronunciation
 */
export interface Alphabet {
  /** The Vietnamese letter */
  readonly letter: string;
  /** Pronunciation guide */
  readonly pronunciation: string;
  /** Audio file URL for pronunciation */
  readonly audio_url: string;
  /** Example words using this letter */
  readonly examples: readonly string[];
}

/**
 * Vietnamese tone with examples
 */
export interface Tone {
  /** Unique tone identifier */
  readonly id: ToneId;
  /** English/Japanese name */
  readonly name: string;
  /** Vietnamese name */
  readonly vietnamese_name: string;
  /** Tone mark symbol */
  readonly symbol: string;
  /** Description of tone usage */
  readonly description: string;
  /** Audio file URL for pronunciation */
  readonly audio_url: string;
  /** Visual pattern representation */
  readonly pattern: string;
  /** Example words demonstrating this tone */
  readonly examples: readonly ToneExample[];
}

/**
 * Example word for a tone
 */
export interface ToneExample {
  readonly word: string;
  readonly meaning: string;
}

/**
 * Valid Vietnamese tone IDs
 */
export type ToneId = 'ngang' | 'huyền' | 'sắc' | 'hỏi' | 'ngã' | 'nặng';

/**
 * Study session record
 */
export interface StudySession {
  /** ISO date string when session occurred */
  readonly date: string;
  /** Session duration in minutes */
  readonly duration_minutes: number;
  /** Total words practiced */
  readonly words_practiced: number;
  /** Quiz score percentage (0-100) if applicable */
  readonly quiz_score?: number;
  /** Type of learning activity */
  readonly activity_type: ActivityType;
  /** Experience points earned in session */
  readonly xp_earned: number;
  /** Number of new words learned */
  readonly words_learned: number;
}

/**
 * Types of learning activities
 */
export type ActivityType = 'flashcard' | 'quiz' | 'learning';

/**
 * User progress and learning state
 */
export interface UserProgress {
  /** Unique user identifier */
  readonly user_id: string;
  /** Array of learned word IDs */
  readonly learned_words: readonly string[];
  /** Current user level (1-based) */
  readonly current_level: number;
  /** Total experience points earned */
  readonly experience_points: number;
  /** Current consecutive study streak in days */
  readonly streak_days: number;
  /** Last study date in ISO format (YYYY-MM-DD) */
  readonly last_study_date: string;
  /** Historical study sessions */
  readonly study_sessions: readonly StudySession[];
}

/**
 * Quiz question with multiple choice answers
 */
export interface QuizQuestion {
  /** Unique question identifier */
  readonly id: string;
  /** Type of quiz question */
  readonly type: QuizType;
  /** Question text to display */
  readonly question: string;
  /** Available answer options */
  readonly options: readonly [string, string, string, string]; // Exactly 4 options
  /** The correct answer (must be one of the options) */
  readonly correct_answer: string;
  /** Associated word ID */
  readonly word_id: string;
  /** Audio URL for listening questions */
  readonly audio_url?: string;
}

/**
 * Types of quiz questions available
 */
export type QuizType = 'ja-to-vi' | 'vi-to-ja' | 'listening';

/**
 * Quiz completion results
 */
export interface QuizResult {
  /** Total number of questions attempted */
  readonly total_questions: number;
  /** Number of correct answers */
  readonly correct_answers: number;
  /** Word IDs that were answered incorrectly */
  readonly incorrect_word_ids: readonly string[];
  /** Score as percentage (0-100) */
  readonly score_percentage: number;
  /** Time taken to complete in seconds */
  readonly time_taken_seconds: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Base props for components that might need loading states
 */
export interface LoadingProps {
  readonly isLoading?: boolean;
  readonly error?: Error | null;
}

/**
 * Props for components that handle audio playback
 */
export interface AudioProps {
  readonly audioUrl: string;
  readonly onPlay?: () => void;
  readonly onError?: (error: Error) => void;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  readonly data: T;
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Represents a point in time for progress tracking
 */
export interface TimeStamp {
  readonly date: string; // ISO date string
  readonly timestamp: number; // Unix timestamp
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid CategoryId
 */
export const isCategoryId = (value: unknown): value is CategoryId => {
  return typeof value === 'string' && 
    ['greetings', 'numbers', 'daily', 'food', 'business'].includes(value);
};

/**
 * Type guard to check if a value is a valid QuizType
 */
export const isQuizType = (value: unknown): value is QuizType => {
  return typeof value === 'string' && 
    ['ja-to-vi', 'vi-to-ja', 'listening'].includes(value);
};

/**
 * Type guard to check if a value is a valid ActivityType
 */
export const isActivityType = (value: unknown): value is ActivityType => {
  return typeof value === 'string' && 
    ['flashcard', 'quiz', 'learning'].includes(value);
};

// ============================================================================
// Re-exports from other type modules
// ============================================================================

// Re-export Next.js specific types
export type {
  NextPageProps,
  FlashcardParams,
  QuizParams,
  AppRoute,
  KeyboardShortcut,
  ErrorPageProps,
  LayoutProps,
  PageMetadata,
  BasePageProps,
  GenerateMetadata,
} from './next';

export {
  isValidRoute,
  KEYBOARD_SHORTCUTS,
} from './next';

// Re-export data validation types
export type {
  RawCategoryData,
  RawWordData,
  RawAlphabetData,
  RawToneData,
  ValidationResult,
  ValidationError,
} from './data';

export {
  isValidCategoryId,
  isValidDifficultyLevel,
  isValidToneId,
  validateCategory,
  validateWord,
  validateAlphabet,
  validateTone,
  validateDataArray,
} from './data';
