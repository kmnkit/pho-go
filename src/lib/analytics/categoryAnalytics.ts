/**
 * Category Analytics Module
 * Handles performance analysis and metrics calculation for learning categories
 */

import type { 
  CategoryAnalytics, 
  CategoryId, 
  StudySession, 
  WordLearningMetrics,
  ActivityType,
  Word 
} from '@/types';

/**
 * Calculate comprehensive category analytics from user data
 */
export function calculateCategoryAnalytics(
  categoryId: CategoryId,
  categoryWords: Word[],
  learnedWords: string[],
  wordMetrics: WordLearningMetrics[],
  studySessions: StudySession[]
): CategoryAnalytics {
  const categoryWordIds = categoryWords.map(w => w.id);
  const categoryMetrics = wordMetrics.filter(m => categoryWordIds.includes(m.word_id));
  const categorySessions = studySessions.filter(session => 
    // Check if session involved words from this category
    session.activity_type === 'flashcard' || 
    session.activity_type === 'quiz' ||
    session.activity_type === 'learning'
  );

  // Calculate basic counts
  const totalWords = categoryWords.length;
  const wordsLearned = categoryWordIds.filter(id => learnedWords.includes(id)).length;
  const wordsWithMetrics = categoryMetrics.length;
  const wordsInProgress = Math.max(0, wordsWithMetrics - wordsLearned);

  // Calculate average accuracy for this category
  let totalAccuracySum = 0;
  let totalEncounters = 0;
  
  categoryMetrics.forEach(metric => {
    if (metric.encounter_count > 0) {
      const accuracy = metric.correct_count / metric.encounter_count;
      totalAccuracySum += accuracy * metric.encounter_count;
      totalEncounters += metric.encounter_count;
    }
  });

  const averageAccuracy = totalEncounters > 0 ? totalAccuracySum / totalEncounters : 0;

  // Calculate total time spent on this category
  const timeSpentMinutes = categorySessions.reduce(
    (total, session) => total + session.duration_minutes, 
    0
  );

  // Determine preferred learning mode
  const activityCounts: Record<ActivityType, number> = {
    'flashcard': 0,
    'quiz': 0,
    'learning': 0,
    'review': 0,
    'challenge': 0,
    'free_practice': 0,
  };

  categorySessions.forEach(session => {
    activityCounts[session.activity_type]++;
  });

  const preferredMode = Object.entries(activityCounts).reduce((a, b) => 
    activityCounts[a[0] as ActivityType] > activityCounts[b[0] as ActivityType] ? a : b
  )[0] as ActivityType;

  // Find last activity
  const lastActivity = categorySessions.length > 0
    ? categorySessions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        .date
    : new Date().toISOString();

  return {
    category_id: categoryId,
    total_words: totalWords,
    words_learned: wordsLearned,
    words_in_progress: wordsInProgress,
    average_accuracy: Math.round(averageAccuracy * 10000) / 100, // Round to 2 decimal places
    time_spent_minutes: timeSpentMinutes,
    preferred_mode: preferredMode,
    last_activity: lastActivity,
  };
}

/**
 * Get category performance trends over time
 */
export function getCategoryTrends(
  categoryId: CategoryId,
  studySessions: StudySession[],
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): CategoryPerformanceTrend[] {
  const now = new Date();
  const timeframeMs = {
    'week': 7 * 24 * 60 * 60 * 1000,
    'month': 30 * 24 * 60 * 60 * 1000,
    'quarter': 90 * 24 * 60 * 60 * 1000,
  }[timeframe];

  const cutoffDate = new Date(now.getTime() - timeframeMs);
  
  // Filter sessions for this category and timeframe
  const recentSessions = studySessions
    .filter(session => new Date(session.date) > cutoffDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group sessions by day
  const sessionsByDay = recentSessions.reduce((acc, session) => {
    const day = session.date.split('T')[0];
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(session);
    return acc;
  }, {} as Record<string, StudySession[]>);

  // Calculate daily performance metrics
  const trends: CategoryPerformanceTrend[] = Object.entries(sessionsByDay).map(([date, sessions]) => {
    const totalSessions = sessions.length;
    const totalWords = sessions.reduce((sum, s) => sum + s.words_practiced, 0);
    const totalXp = sessions.reduce((sum, s) => sum + s.xp_earned, 0);
    const avgScore = sessions.reduce((sum, s) => sum + (s.quiz_score || 0), 0) / totalSessions;
    const totalTime = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    return {
      date,
      sessions: totalSessions,
      words_practiced: totalWords,
      xp_earned: totalXp,
      average_score: Math.round(avgScore * 100) / 100,
      time_spent: totalTime,
      efficiency: totalWords > 0 ? totalXp / totalWords : 0,
    };
  });

  return trends;
}

/**
 * Calculate category difficulty progression
 */
export function getCategoryDifficultyProgression(
  categoryWords: Word[],
  wordMetrics: WordLearningMetrics[]
): CategoryDifficultyProgression {
  const difficultyGroups = {
    'beginner': categoryWords.filter(w => w.difficulty === 'beginner'),
    'intermediate': categoryWords.filter(w => w.difficulty === 'intermediate'),
    'advanced': categoryWords.filter(w => w.difficulty === 'advanced'),
  };

  const progression = Object.entries(difficultyGroups).map(([difficulty, words]) => {
    const wordIds = words.map(w => w.id);
    const metrics = wordMetrics.filter(m => wordIds.includes(m.word_id));
    
    const totalWords = words.length;
    const masteredWords = metrics.filter(m => m.confidence_score > 0.8).length;
    const averageAccuracy = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.confidence_score, 0) / metrics.length
      : 0;

    return {
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
      total_words: totalWords,
      mastered_words: masteredWords,
      mastery_percentage: totalWords > 0 ? (masteredWords / totalWords) * 100 : 0,
      average_accuracy: Math.round(averageAccuracy * 10000) / 100,
    };
  });

  return {
    levels: progression,
    overall_progression: progression.reduce((sum, level) => sum + level.mastery_percentage, 0) / 3,
  };
}

/**
 * Get weak points analysis for a category
 */
export function getCategoryWeakPoints(
  categoryWords: Word[],
  wordMetrics: WordLearningMetrics[]
): CategoryWeakPoint[] {
  const categoryWordIds = categoryWords.map(w => w.id);
  const categoryMetrics = wordMetrics.filter(m => categoryWordIds.includes(m.word_id));

  const weakWords = categoryMetrics
    .filter(metric => {
      const accuracy = metric.encounter_count > 0 ? metric.correct_count / metric.encounter_count : 0;
      const needsReview = metric.confidence_score < 0.5 || accuracy < 0.6;
      const hasEnoughData = metric.encounter_count >= 3;
      return needsReview && hasEnoughData;
    })
    .sort((a, b) => a.confidence_score - b.confidence_score)
    .slice(0, 10); // Top 10 weak points

  return weakWords.map(metric => {
    const word = categoryWords.find(w => w.id === metric.word_id);
    const accuracy = metric.encounter_count > 0 ? metric.correct_count / metric.encounter_count : 0;
    
    return {
      word_id: metric.word_id,
      word_text: word?.vietnamese || 'Unknown',
      difficulty: word?.difficulty || 'beginner',
      accuracy_rate: Math.round(accuracy * 10000) / 100,
      confidence_score: Math.round(metric.confidence_score * 10000) / 100,
      encounters: metric.encounter_count,
      last_seen: metric.last_seen,
      issue_type: accuracy < 0.4 ? 'low_accuracy' : 'needs_practice',
    };
  });
}

// ============================================================================
// Type Definitions for Category Analytics
// ============================================================================

export interface CategoryPerformanceTrend {
  readonly date: string;
  readonly sessions: number;
  readonly words_practiced: number;
  readonly xp_earned: number;
  readonly average_score: number;
  readonly time_spent: number;
  readonly efficiency: number;
}

export interface CategoryDifficultyProgression {
  readonly levels: CategoryDifficultyLevel[];
  readonly overall_progression: number;
}

export interface CategoryDifficultyLevel {
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
  readonly total_words: number;
  readonly mastered_words: number;
  readonly mastery_percentage: number;
  readonly average_accuracy: number;
}

export interface CategoryWeakPoint {
  readonly word_id: string;
  readonly word_text: string;
  readonly difficulty: string;
  readonly accuracy_rate: number;
  readonly confidence_score: number;
  readonly encounters: number;
  readonly last_seen: string;
  readonly issue_type: 'low_accuracy' | 'needs_practice' | 'forgetting';
}