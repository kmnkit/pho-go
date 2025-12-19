import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  UserProgress, 
  StudySession, 
  EnhancedUserProgress,
  EnhancedStudySession,
  WordLearningMetrics,
  CategoryAnalytics,
  LearningDataPoint,
  LearningStyle,
  SpacedRepetitionData,
  Achievement,
  PersonalizationSettings,
  MetricType,
  CategoryId,
  DifficultyLevel
} from '@/types';

/**
 * Actions available on the user progress store
 */
interface UserProgressActions {
  /** Add a word to the learned words list */
  readonly addLearnedWord: (wordId: string) => Promise<void>;
  /** Remove a word from the learned words list */
  readonly removeLearnedWord: (wordId: string) => Promise<void>;
  /** Add experience points and potentially level up */
  readonly addExperiencePoints: (points: number) => Promise<void>;
  /** Update the study streak based on current date */
  readonly updateStreak: () => void;
  /** Add a completed study session */
  readonly addStudySession: (session: Omit<StudySession, 'date'>) => Promise<void>;
  /** Reset all progress to initial state */
  readonly resetProgress: () => void;
  /** Check if a specific word has been learned */
  readonly isWordLearned: (wordId: string) => boolean;
  /** Get statistics for display */
  readonly getStats: () => UserProgressStats;
  /** Get progress towards next level */
  readonly getLevelProgress: () => LevelProgress;
  /** Sync data with backend */
  readonly syncWithBackend: () => Promise<void>;
  /** Set sync status */
  readonly setSyncStatus: (status: SyncStatus) => void;
  
  // ============================================================================
  // Enhanced Analytics Actions
  // ============================================================================
  
  /** Record word interaction with detailed metrics */
  readonly recordWordInteraction: (wordId: string, correct: boolean, responseTime: number) => void;
  /** Update word learning metrics */
  readonly updateWordMetrics: (wordId: string, metrics: Partial<WordLearningMetrics>) => void;
  /** Get word learning metrics */
  readonly getWordMetrics: (wordId: string) => WordLearningMetrics | undefined;
  /** Record learning data point for analytics */
  readonly recordLearningData: (metricType: MetricType, value: number, metadata?: Record<string, unknown>) => void;
  /** Get category analytics */
  readonly getCategoryAnalytics: (categoryId: CategoryId) => CategoryAnalytics | undefined;
  /** Update category performance */
  readonly updateCategoryAnalytics: (categoryId: CategoryId, analytics: Partial<CategoryAnalytics>) => void;
  /** Detect and update learning style */
  readonly updateLearningStyle: (style: LearningStyle) => void;
  /** Update spaced repetition data */
  readonly updateSpacedRepetition: (wordId: string, data: SpacedRepetitionData) => void;
  /** Check achievement progress */
  readonly checkAchievements: () => void;
  /** Unlock achievement */
  readonly unlockAchievement: (achievementId: string) => void;
  /** Update personalization settings */
  readonly updatePersonalization: (settings: Partial<PersonalizationSettings>) => void;
  /** Get recommended words for review */
  readonly getRecommendedWords: () => string[];
  /** Calculate forgetting curve retention */
  readonly calculateRetention: (wordId: string) => number;
  /** Get learning pattern insights */
  readonly getLearningInsights: () => LearningInsights;
}

/**
 * Sync status for backend integration
 */
type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Learning insights for user feedback
 */
interface LearningInsights {
  readonly strongCategories: CategoryId[];
  readonly weakCategories: CategoryId[];
  readonly optimalStudyTime: string;
  readonly recommendedSessionLength: number;
  readonly learningTrends: LearningTrend[];
  readonly nextMilestone: string;
}

/**
 * Learning trend data
 */
interface LearningTrend {
  readonly metric: MetricType;
  readonly trend: 'improving' | 'declining' | 'stable';
  readonly changePercentage: number;
  readonly period: 'week' | 'month';
}

/**
 * Complete user progress store state including actions
 */
interface UserProgressState extends EnhancedUserProgress {
  // Make state properties mutable for Zustand
  learned_words: string[];
  study_sessions: StudySession[];
  word_metrics: WordLearningMetrics[];
  category_analytics: CategoryAnalytics[];
  learning_data: LearningDataPoint[];
  learning_style?: LearningStyle;
  spaced_repetition: SpacedRepetitionData[];
  achievements: Achievement[];
  personalization: PersonalizationSettings;
  // Sync status
  syncStatus: SyncStatus;
  lastSyncTime: string;
  // Actions
  actions: UserProgressActions;
}

/**
 * User progress statistics
 */
interface UserProgressStats {
  readonly totalWordsLearned: number;
  readonly totalXpEarned: number;
  readonly totalSessionsCompleted: number;
  readonly averageSessionDuration: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
}

/**
 * Level progression information
 */
interface LevelProgress {
  readonly currentLevel: number;
  readonly currentXp: number;
  readonly xpInCurrentLevel: number;
  readonly xpRequiredForNextLevel: number;
  readonly progressPercentage: number;
}

/** Experience points required per level */
const POINTS_PER_LEVEL = 100 as const;

/** Maximum study sessions to keep in memory for performance */
const MAX_STUDY_SESSIONS = 1000 as const;

/** Maximum learning data points to keep for analytics */
const MAX_LEARNING_DATA_POINTS = 10000 as const;

/** Forgetting curve constants */
const FORGETTING_CURVE = {
  INITIAL_STRENGTH: 1.0,
  DECAY_RATE: 0.1,
  MINIMUM_RETENTION: 0.1,
} as const;

/** Spaced repetition algorithm constants */
const SPACED_REPETITION = {
  INITIAL_INTERVAL: 1, // days
  EASE_FACTOR: 2.5,
  MINIMUM_EASE: 1.3,
  MAXIMUM_EASE: 4.0,
  QUALITY_THRESHOLD: 3,
} as const;

/** Default personalization settings */
const defaultPersonalizationSettings: PersonalizationSettings = {
  preferred_difficulty: 'beginner',
  preferred_session_length: 15,
  daily_study_goal: 30,
  reminder_enabled: false,
  adaptive_features_enabled: true,
  theme_preferences: {
    color_scheme: 'auto',
    font_size: 'medium',
    animations_enabled: true,
    sounds_enabled: true,
  },
} as const;

/** Default user progress data with proper typing */
const defaultUserProgress: Omit<EnhancedUserProgress, 'learned_words' | 'study_sessions' | 'word_metrics' | 'category_analytics' | 'learning_data' | 'spaced_repetition' | 'achievements'> & {
  learned_words: string[];
  study_sessions: StudySession[];
  word_metrics: WordLearningMetrics[];
  category_analytics: CategoryAnalytics[];
  learning_data: LearningDataPoint[];
  spaced_repetition: SpacedRepetitionData[];
  achievements: Achievement[];
  syncStatus: SyncStatus;
  lastSyncTime: string;
} = {
  user_id: 'default_user',
  learned_words: [],
  current_level: 1,
  experience_points: 0,
  streak_days: 0,
  last_study_date: '',
  study_sessions: [],
  word_metrics: [],
  category_analytics: [],
  learning_data: [],
  spaced_repetition: [],
  achievements: [],
  personalization: defaultPersonalizationSettings,
  syncStatus: 'idle',
  lastSyncTime: '',
} as const;

/**
 * Calculate current level from experience points
 */
const calculateLevel = (xp: number): number => {
  return Math.floor(xp / POINTS_PER_LEVEL) + 1;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

/**
 * API call helper with error handling
 */
const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * User progress store with persistence and backend sync
 */
export const useUserProgressStore = create<UserProgressState>()(
  persist(
    (set, get) => ({
      ...defaultUserProgress,

      actions: {
        // Add word to learned words list (with backend sync)
        addLearnedWord: async (wordId: string): Promise<void> => {
          const { learned_words, syncStatus } = get();
          
          if (!learned_words.includes(wordId)) {
            // Update local state immediately
            set({
              learned_words: [...learned_words, wordId],
            });

            // Sync with backend if online
            if (syncStatus !== 'offline') {
              try {
                await apiCall('/api/progress/words', {
                  method: 'PATCH',
                  body: JSON.stringify({ wordId, action: 'add' }),
                });
              } catch (error) {
                console.warn('Failed to sync word addition to backend:', error);
              }
            }
          }
        },

        // Remove word from learned words list (with backend sync)
        removeLearnedWord: async (wordId: string): Promise<void> => {
          // Update local state immediately
          set({
            learned_words: get().learned_words.filter((id) => id !== wordId),
          });

          // Sync with backend if online
          const { syncStatus } = get();
          if (syncStatus !== 'offline') {
            try {
              await apiCall('/api/progress/words', {
                method: 'PATCH',
                body: JSON.stringify({ wordId, action: 'remove' }),
              });
            } catch (error) {
              console.warn('Failed to sync word removal to backend:', error);
            }
          }
        },

        // Add experience points with level calculation (with backend sync)
        addExperiencePoints: async (points: number): Promise<void> => {
          if (points <= 0) return;
          
          const { experience_points } = get();
          const newXP = experience_points + points;
          const newLevel = calculateLevel(newXP);

          // Update local state immediately
          set({
            experience_points: newXP,
            current_level: newLevel,
          });

          // Sync with backend if online
          const { syncStatus } = get();
          if (syncStatus !== 'offline') {
            try {
              await apiCall('/api/progress/xp', {
                method: 'PATCH',
                body: JSON.stringify({ points }),
              });
            } catch (error) {
              console.warn('Failed to sync XP to backend:', error);
            }
          }
        },

        // Update study streak with proper date handling
        updateStreak: (): void => {
          const { last_study_date, streak_days } = get();
          const today = getTodayDateString();

          if (last_study_date === today) {
            // Already studied today
            return;
          }

          const yesterday = getYesterdayDateString();

          if (last_study_date === yesterday) {
            // Continuing streak from yesterday
            set({
              streak_days: streak_days + 1,
              last_study_date: today,
            });
          } else {
            // Streak broken or starting new streak
            set({
              streak_days: 1,
              last_study_date: today,
            });
          }
        },

        // Add study session with automatic date setting (with backend sync)
        addStudySession: async (sessionData: Omit<StudySession, 'date'>): Promise<void> => {
          const session: StudySession = {
            ...sessionData,
            date: new Date().toISOString(),
          };
          
          const { study_sessions } = get();
          const updatedSessions = [...study_sessions, session];
          
          // Keep only latest sessions for performance
          const limitedSessions = updatedSessions.slice(-MAX_STUDY_SESSIONS);
          
          // Update local state immediately
          set({
            study_sessions: limitedSessions,
          });

          // Record analytics data from session
          get().actions.recordLearningData('session_duration', session.duration_minutes, {
            activity_type: session.activity_type,
            words_practiced: session.words_practiced,
            xp_earned: session.xp_earned,
          });

          if (session.quiz_score !== undefined) {
            get().actions.recordLearningData('accuracy_rate', session.quiz_score / 100, {
              activity_type: session.activity_type,
            });
          }

          // Sync with backend if online
          const { syncStatus } = get();
          if (syncStatus !== 'offline') {
            try {
              await apiCall('/api/sessions', {
                method: 'POST',
                body: JSON.stringify(sessionData),
              });
            } catch (error) {
              console.warn('Failed to sync session to backend:', error);
            }
          }
        },

        // Reset all progress to default state
        resetProgress: (): void => {
          set({
            ...defaultUserProgress,
            syncStatus: get().syncStatus, // Preserve sync status
          });
        },

        // Check if word is in learned list
        isWordLearned: (wordId: string): boolean => {
          return get().learned_words.includes(wordId);
        },

        // Get comprehensive statistics
        getStats: (): UserProgressStats => {
          const state = get();
          const sessions = state.study_sessions;
          
          const totalDuration = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
          const averageDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;
          
          // Calculate longest streak from session history
          let longestStreak = 0;
          let currentCalculatedStreak = 0;
          const sessionDates = sessions.map(s => s.date.split('T')[0]).sort();
          
          for (let i = 0; i < sessionDates.length; i++) {
            if (i === 0 || sessionDates[i] === sessionDates[i - 1]) {
              // Same day or first day
              continue;
            }
            
            const prevDate = new Date(sessionDates[i - 1]);
            const currDate = new Date(sessionDates[i]);
            const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
              currentCalculatedStreak++;
              longestStreak = Math.max(longestStreak, currentCalculatedStreak);
            } else {
              currentCalculatedStreak = 1;
            }
          }
          
          return {
            totalWordsLearned: state.learned_words.length,
            totalXpEarned: state.experience_points,
            totalSessionsCompleted: sessions.length,
            averageSessionDuration: Math.round(averageDuration * 100) / 100,
            currentStreak: state.streak_days,
            longestStreak: Math.max(longestStreak, state.streak_days),
          };
        },

        // Get level progress information
        getLevelProgress: (): LevelProgress => {
          const { current_level, experience_points } = get();
          const xpInCurrentLevel = experience_points % POINTS_PER_LEVEL;
          const progressPercentage = (xpInCurrentLevel / POINTS_PER_LEVEL) * 100;
          
          return {
            currentLevel: current_level,
            currentXp: experience_points,
            xpInCurrentLevel,
            xpRequiredForNextLevel: POINTS_PER_LEVEL,
            progressPercentage: Math.round(progressPercentage * 100) / 100,
          };
        },

        // Sync data with backend
        syncWithBackend: async (): Promise<void> => {
          const state = get();
          
          set({ syncStatus: 'syncing' });

          try {
            // First, upload local data
            await apiCall('/api/progress/sync', {
              method: 'POST',
              body: JSON.stringify({
                progress: {
                  learned_words: state.learned_words,
                  current_level: state.current_level,
                  experience_points: state.experience_points,
                  streak_days: state.streak_days,
                  last_study_date: state.last_study_date,
                },
                sessions: state.study_sessions,
              }),
            });

            // Then fetch latest server data
            const serverData = await apiCall('/api/progress/sync', {
              method: 'GET',
            });

            // Merge server data with local state
            set({
              learned_words: serverData.progress.learnedWords || [],
              current_level: serverData.progress.currentLevel || 1,
              experience_points: serverData.progress.experiencePoints || 0,
              streak_days: serverData.progress.streakDays || 0,
              last_study_date: serverData.progress.lastStudyDate || '',
              study_sessions: serverData.sessions || [],
              syncStatus: 'idle',
              lastSyncTime: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Backend sync failed:', error);
            set({ syncStatus: 'error' });
            throw error;
          }
        },

        // Set sync status
        setSyncStatus: (status: SyncStatus): void => {
          set({ syncStatus: status });
        },

        // ============================================================================
        // Enhanced Analytics Actions Implementation
        // ============================================================================

        // Record word interaction with detailed metrics
        recordWordInteraction: (wordId: string, correct: boolean, responseTime: number): void => {
          const state = get();
          const existingMetrics = state.word_metrics.find(m => m.word_id === wordId);
          const now = new Date().toISOString();
          
          if (existingMetrics) {
            const updatedMetrics: WordLearningMetrics = {
              ...existingMetrics,
              encounter_count: existingMetrics.encounter_count + 1,
              correct_count: existingMetrics.correct_count + (correct ? 1 : 0),
              incorrect_count: existingMetrics.incorrect_count + (correct ? 0 : 1),
              avg_response_time: (existingMetrics.avg_response_time * existingMetrics.encounter_count + responseTime) / (existingMetrics.encounter_count + 1),
              last_seen: now,
              confidence_score: Math.min(1, (existingMetrics.correct_count + (correct ? 1 : 0)) / (existingMetrics.encounter_count + 1)),
            };
            
            set({
              word_metrics: state.word_metrics.map(m => m.word_id === wordId ? updatedMetrics : m)
            });
          } else {
            const newMetrics: WordLearningMetrics = {
              word_id: wordId,
              encounter_count: 1,
              correct_count: correct ? 1 : 0,
              incorrect_count: correct ? 0 : 1,
              avg_response_time: responseTime,
              first_seen: now,
              last_seen: now,
              confidence_score: correct ? 1 : 0,
              retention_estimate: 1,
              next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };
            
            set({
              word_metrics: [...state.word_metrics, newMetrics]
            });
          }
          
          // Record learning data point
          get().actions.recordLearningData('accuracy_rate', correct ? 1 : 0, { word_id: wordId });
          get().actions.recordLearningData('response_time', responseTime, { word_id: wordId });
        },

        // Update word learning metrics
        updateWordMetrics: (wordId: string, metrics: Partial<WordLearningMetrics>): void => {
          set({
            word_metrics: get().word_metrics.map(m => 
              m.word_id === wordId ? { ...m, ...metrics } : m
            )
          });
        },

        // Get word learning metrics
        getWordMetrics: (wordId: string): WordLearningMetrics | undefined => {
          return get().word_metrics.find(m => m.word_id === wordId);
        },

        // Record learning data point for analytics
        recordLearningData: (metricType: MetricType, value: number, metadata?: Record<string, unknown>): void => {
          const state = get();
          const dataPoint: LearningDataPoint = {
            timestamp: new Date().toISOString(),
            metric_type: metricType,
            value,
            metadata,
          };
          
          const updatedData = [...state.learning_data, dataPoint];
          
          // Keep only the most recent data points for performance
          const limitedData = updatedData.slice(-MAX_LEARNING_DATA_POINTS);
          
          set({ learning_data: limitedData });
        },

        // Get category analytics
        getCategoryAnalytics: (categoryId: CategoryId): CategoryAnalytics | undefined => {
          return get().category_analytics.find(c => c.category_id === categoryId);
        },

        // Update category performance
        updateCategoryAnalytics: (categoryId: CategoryId, analytics: Partial<CategoryAnalytics>): void => {
          const state = get();
          const existingAnalytics = state.category_analytics.find(c => c.category_id === categoryId);
          
          if (existingAnalytics) {
            set({
              category_analytics: state.category_analytics.map(c => 
                c.category_id === categoryId ? { ...c, ...analytics } : c
              )
            });
          } else {
            const newAnalytics: CategoryAnalytics = {
              category_id: categoryId,
              total_words: 0,
              words_learned: 0,
              words_in_progress: 0,
              average_accuracy: 0,
              time_spent_minutes: 0,
              preferred_mode: 'flashcard',
              last_activity: new Date().toISOString(),
              ...analytics,
            };
            
            set({
              category_analytics: [...state.category_analytics, newAnalytics]
            });
          }
        },

        // Detect and update learning style
        updateLearningStyle: (style: LearningStyle): void => {
          set({ learning_style: style });
        },

        // Update spaced repetition data
        updateSpacedRepetition: (wordId: string, data: SpacedRepetitionData): void => {
          const state = get();
          const existingData = state.spaced_repetition.find(s => s.word_id === wordId);
          
          if (existingData) {
            set({
              spaced_repetition: state.spaced_repetition.map(s => 
                s.word_id === wordId ? data : s
              )
            });
          } else {
            set({
              spaced_repetition: [...state.spaced_repetition, data]
            });
          }
        },

        // Check achievement progress
        checkAchievements: (): void => {
          // This will be implemented with achievement system
          // For now, just placeholder
        },

        // Unlock achievement
        unlockAchievement: (achievementId: string): void => {
          const state = get();
          const achievement = state.achievements.find(a => a.id === achievementId);
          
          if (achievement && !achievement.unlocked) {
            const unlockedAchievement: Achievement = {
              ...achievement,
              unlocked: true,
              unlock_date: new Date().toISOString(),
              progress: 1,
            };
            
            set({
              achievements: state.achievements.map(a => 
                a.id === achievementId ? unlockedAchievement : a
              )
            });
            
            // Award XP
            get().actions.addExperiencePoints(achievement.xp_reward);
          }
        },

        // Update personalization settings
        updatePersonalization: (settings: Partial<PersonalizationSettings>): void => {
          set({
            personalization: {
              ...get().personalization,
              ...settings,
            }
          });
        },

        // Get recommended words for review
        getRecommendedWords: (): string[] => {
          const state = get();
          const now = new Date();
          
          // Get words that need review based on spaced repetition
          const wordsForReview = state.spaced_repetition
            .filter(s => new Date(s.next_review) <= now)
            .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime())
            .slice(0, 20) // Limit to 20 words
            .map(s => s.word_id);
          
          return wordsForReview;
        },

        // Calculate forgetting curve retention
        calculateRetention: (wordId: string): number => {
          const metrics = get().actions.getWordMetrics(wordId);
          if (!metrics) return FORGETTING_CURVE.MINIMUM_RETENTION;
          
          const daysSinceLastSeen = (Date.now() - new Date(metrics.last_seen).getTime()) / (1000 * 60 * 60 * 24);
          const retention = FORGETTING_CURVE.INITIAL_STRENGTH * Math.exp(-FORGETTING_CURVE.DECAY_RATE * daysSinceLastSeen);
          
          return Math.max(retention, FORGETTING_CURVE.MINIMUM_RETENTION);
        },

        // Get learning pattern insights
        getLearningInsights: (): LearningInsights => {
          const state = get();
          
          // Calculate strong/weak categories based on analytics
          const categoryPerformance = state.category_analytics
            .map(c => ({ category: c.category_id, accuracy: c.average_accuracy }))
            .sort((a, b) => b.accuracy - a.accuracy);
          
          const strongCategories = categoryPerformance.slice(0, 2).map(c => c.category);
          const weakCategories = categoryPerformance.slice(-2).map(c => c.category);
          
          // Analyze optimal study time from session data
          const sessionsByHour = state.study_sessions.reduce((acc, session) => {
            const hour = new Date(session.date).getHours();
            if (!acc[hour]) acc[hour] = [];
            acc[hour].push(session.quiz_score || 0);
            return acc;
          }, {} as Record<number, number[]>);
          
          let optimalHour = 14; // Default to 2 PM
          let bestAverage = 0;
          
          Object.entries(sessionsByHour).forEach(([hour, scores]) => {
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            if (average > bestAverage) {
              bestAverage = average;
              optimalHour = parseInt(hour);
            }
          });
          
          return {
            strongCategories,
            weakCategories,
            optimalStudyTime: `${optimalHour}:00`,
            recommendedSessionLength: state.personalization.preferred_session_length,
            learningTrends: [],
            nextMilestone: `Level ${state.current_level + 1}`,
          };
        },
      },
    }),
    {
      name: 'user-progress-storage',
      // Partial persistence to avoid storing actions
      partialize: (state) => ({
        user_id: state.user_id,
        learned_words: state.learned_words,
        current_level: state.current_level,
        experience_points: state.experience_points,
        streak_days: state.streak_days,
        last_study_date: state.last_study_date,
        study_sessions: state.study_sessions,
        word_metrics: state.word_metrics,
        category_analytics: state.category_analytics,
        learning_data: state.learning_data,
        learning_style: state.learning_style,
        spaced_repetition: state.spaced_repetition,
        achievements: state.achievements,
        personalization: state.personalization,
        syncStatus: state.syncStatus,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// ============================================================================
// Selector Hooks for Better Performance
// ============================================================================

/**
 * Hook to get user progress data only
 */
export const useUserProgress = () => {
  return useUserProgressStore((state) => ({
    user_id: state.user_id,
    learned_words: state.learned_words,
    current_level: state.current_level,
    experience_points: state.experience_points,
    streak_days: state.streak_days,
    last_study_date: state.last_study_date,
    study_sessions: state.study_sessions,
    syncStatus: state.syncStatus,
    lastSyncTime: state.lastSyncTime,
  }));
};

/**
 * Hook to get user progress actions only
 */
export const useUserProgressActions = () => {
  return useUserProgressStore((state) => state.actions);
};

/**
 * Hook to get specific progress statistics
 */
export const useUserProgressStats = () => {
  return useUserProgressStore((state) => state.actions.getStats());
};

/**
 * Hook to get level progress information
 */
export const useLevelProgress = () => {
  return useUserProgressStore((state) => state.actions.getLevelProgress());
};

/**
 * Hook to check if a word is learned
 */
export const useIsWordLearned = (wordId: string) => {
  return useUserProgressStore((state) => state.actions.isWordLearned(wordId));
};

/**
 * Hook to get sync status
 */
export const useSyncStatus = () => {
  return useUserProgressStore((state) => ({
    syncStatus: state.syncStatus,
    lastSyncTime: state.lastSyncTime,
  }));
};