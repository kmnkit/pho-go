import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, StudySession } from '@/types';

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
}

/**
 * Sync status for backend integration
 */
type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Complete user progress store state including actions
 */
interface UserProgressState extends UserProgress {
  // Make state properties mutable for Zustand
  learned_words: string[];
  study_sessions: StudySession[];
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

/** Default user progress data with proper typing */
const defaultUserProgress: Omit<UserProgress, 'learned_words' | 'study_sessions'> & {
  learned_words: string[];
  study_sessions: StudySession[];
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