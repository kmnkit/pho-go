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
 * Enhanced study session with detailed analytics
 */
export interface EnhancedStudySession extends StudySession {
  /** Unique session ID */
  readonly session_id: string;
  /** Category focus during session */
  readonly focused_category?: CategoryId;
  /** Average response time per question */
  readonly avg_response_time: number;
  /** Accuracy rate for this session */
  readonly accuracy_rate: number;
  /** Difficulty level of words practiced */
  readonly difficulty_distribution: Record<DifficultyLevel, number>;
  /** User motivation score (1-5) */
  readonly motivation_score?: number;
  /** Time of day session started */
  readonly start_time: string;
  /** Device/platform used */
  readonly platform?: string;
  /** Session quality indicators */
  readonly quality_indicators: SessionQualityIndicators;
}

/**
 * Session quality indicators for analysis
 */
export interface SessionQualityIndicators {
  /** Whether user seemed rushed */
  readonly rushed: boolean;
  /** Whether user seemed focused */
  readonly focused: boolean;
  /** Number of mistakes that were repeated */
  readonly repeated_mistakes: number;
  /** Improvement during session */
  readonly improvement_trend: 'improving' | 'declining' | 'stable';
}

/**
 * Types of learning activities
 */
export type ActivityType = 'flashcard' | 'quiz' | 'learning' | 'review' | 'challenge' | 'free_practice';

/**
 * Expanded activity types for detailed tracking
 */
export type DetailedActivityType = ActivityType | 'alphabet' | 'tones' | 'pronunciation' | 'spaced_repetition';

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
 * Enhanced user progress with analytics data
 */
export interface EnhancedUserProgress extends UserProgress {
  /** Word-level learning metrics */
  readonly word_metrics: readonly WordLearningMetrics[];
  /** Category performance analytics */
  readonly category_analytics: readonly CategoryAnalytics[];
  /** Time-series learning data */
  readonly learning_data: readonly LearningDataPoint[];
  /** Detected learning style */
  readonly learning_style?: LearningStyle;
  /** Spaced repetition data for words */
  readonly spaced_repetition: readonly SpacedRepetitionData[];
  /** User achievements */
  readonly achievements: readonly Achievement[];
  /** Personalization settings */
  readonly personalization: PersonalizationSettings;
}

/**
 * User personalization preferences
 */
export interface PersonalizationSettings {
  /** Preferred difficulty level */
  readonly preferred_difficulty: DifficultyLevel;
  /** Preferred session length in minutes */
  readonly preferred_session_length: number;
  /** Daily study goal in minutes */
  readonly daily_study_goal: number;
  /** Reminder preferences */
  readonly reminder_enabled: boolean;
  /** Preferred reminder time */
  readonly reminder_time?: string;
  /** UI theme preferences */
  readonly theme_preferences: ThemePreferences;
  /** Adaptive features enabled */
  readonly adaptive_features_enabled: boolean;
}

/**
 * UI theme and adaptation preferences
 */
export interface ThemePreferences {
  /** Color scheme preference */
  readonly color_scheme: 'light' | 'dark' | 'auto';
  /** Font size preference */
  readonly font_size: 'small' | 'medium' | 'large';
  /** Animation preferences */
  readonly animations_enabled: boolean;
  /** Sound effects enabled */
  readonly sounds_enabled: boolean;
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
// Enhanced Learning Analytics Types
// ============================================================================

/**
 * Detailed word learning metrics for analytics
 */
export interface WordLearningMetrics {
  /** Word ID this metric refers to */
  readonly word_id: string;
  /** Number of times word was encountered */
  readonly encounter_count: number;
  /** Number of times answered correctly */
  readonly correct_count: number;
  /** Number of times answered incorrectly */
  readonly incorrect_count: number;
  /** Average response time in milliseconds */
  readonly avg_response_time: number;
  /** First encounter timestamp */
  readonly first_seen: string;
  /** Last encounter timestamp */
  readonly last_seen: string;
  /** Confidence level (0-1) based on recent performance */
  readonly confidence_score: number;
  /** Forgetting curve retention estimate (0-1) */
  readonly retention_estimate: number;
  /** Next optimal review date */
  readonly next_review_date: string;
  /** Spaced repetition data for this word */
  readonly spaced_repetition_data?: {
    readonly next_review_date: string;
    readonly ease_factor: number;
    readonly next_interval: number;
    readonly repetition_number: number;
  };
}

/**
 * Category-specific performance analytics
 */
export interface CategoryAnalytics {
  /** Category ID */
  readonly category_id: CategoryId;
  /** Total words in category */
  readonly total_words: number;
  /** Words marked as learned */
  readonly words_learned: number;
  /** Words currently being practiced */
  readonly words_in_progress: number;
  /** Average accuracy for this category */
  readonly average_accuracy: number;
  /** Total time spent on this category (minutes) */
  readonly time_spent_minutes: number;
  /** Preferred learning mode for this category */
  readonly preferred_mode: ActivityType;
  /** Last study session for this category */
  readonly last_activity: string;
}

/**
 * Time-series data point for learning patterns
 */
export interface LearningDataPoint {
  /** ISO timestamp */
  readonly timestamp: string;
  /** Type of metric being recorded */
  readonly metric_type: MetricType;
  /** Numerical value of the metric */
  readonly value: number;
  /** Optional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Types of metrics that can be tracked over time
 */
export type MetricType = 
  | 'accuracy_rate'
  | 'response_time'
  | 'session_duration'
  | 'words_per_minute'
  | 'retention_rate'
  | 'motivation_score'
  | 'difficulty_preference';

/**
 * Learning style detection results
 */
export interface LearningStyle {
  /** Primary learning style */
  readonly primary_style: LearningStyleType;
  /** Secondary learning style */
  readonly secondary_style?: LearningStyleType;
  /** Confidence score for detection (0-1) */
  readonly confidence: number;
  /** Behavioral indicators that led to this classification */
  readonly indicators: readonly string[];
  /** Last updated timestamp */
  readonly last_updated: string;
}

/**
 * Different types of learning styles
 */
export type LearningStyleType = 
  | 'visual'
  | 'auditory'
  | 'kinesthetic'
  | 'reading_writing'
  | 'multimodal';

/**
 * Spaced repetition algorithm data
 */
export interface SpacedRepetitionData {
  /** Word ID */
  readonly word_id: string;
  /** Current interval in days */
  readonly interval: number;
  /** Repetition number */
  readonly repetition: number;
  /** Ease factor for the word */
  readonly ease_factor: number;
  /** Next review date */
  readonly next_review: string;
  /** Quality of last recall (0-5) */
  readonly last_quality: number;
}

/**
 * Achievement data structure
 */
export interface Achievement {
  /** Unique achievement ID */
  readonly id: string;
  /** Achievement name */
  readonly name: string;
  /** Achievement description */
  readonly description: string;
  /** Achievement category */
  readonly category: AchievementCategory;
  /** Rarity level */
  readonly rarity: AchievementRarity;
  /** Icon or emoji */
  readonly icon: string;
  /** XP reward for unlocking */
  readonly xp_reward: number;
  /** Unlock criteria */
  readonly criteria: AchievementCriteria;
  /** Whether it's unlocked */
  readonly unlocked: boolean;
  /** Unlock date if unlocked */
  readonly unlock_date?: string;
  /** Progress towards unlocking (0-1) */
  readonly progress: number;
}

/**
 * Achievement categories
 */
export type AchievementCategory = 
  | 'learning'
  | 'streak'
  | 'accuracy'
  | 'speed'
  | 'completion'
  | 'exploration';

/**
 * Achievement rarity levels
 */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Achievement unlock criteria
 */
export interface AchievementCriteria {
  /** Type of criteria */
  readonly type: CriteriaType;
  /** Target value to reach */
  readonly target: number;
  /** Optional category filter */
  readonly category?: CategoryId;
  /** Optional time constraint */
  readonly time_window?: number;
}

/**
 * Types of achievement criteria
 */
export type CriteriaType = 
  | 'words_learned'
  | 'streak_days'
  | 'accuracy_rate'
  | 'session_count'
  | 'total_xp'
  | 'category_completion'
  | 'speed_achievement';

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
