/**
 * Category Analytics Hook
 * Provides real-time category performance analytics and management
 */

import { useCallback, useMemo } from 'react';
import { useUserProgressStore } from '@/stores/userProgressStore';
import { 
  calculateCategoryAnalytics, 
  getCategoryTrends, 
  getCategoryDifficultyProgression,
  getCategoryWeakPoints,
  type CategoryPerformanceTrend,
  type CategoryDifficultyProgression,
  type CategoryWeakPoint,
} from '@/lib/analytics/categoryAnalytics';
import type { CategoryId, Word, CategoryAnalytics } from '@/types';

/**
 * Hook for managing category analytics
 */
export function useCategoryAnalytics(categoryId?: CategoryId) {
  const store = useUserProgressStore();
  const actions = useUserProgressStore((state) => state.actions);
  
  const {
    learned_words,
    word_metrics,
    study_sessions,
    category_analytics,
  } = store;

  /**
   * Update analytics for a specific category
   */
  const updateCategoryAnalytics = useCallback(
    (categoryId: CategoryId, categoryWords: Word[]) => {
      const analytics = calculateCategoryAnalytics(
        categoryId,
        categoryWords,
        learned_words,
        word_metrics,
        study_sessions
      );
      
      actions.updateCategoryAnalytics(categoryId, analytics);
      return analytics;
    },
    [learned_words, word_metrics, study_sessions, actions]
  );

  /**
   * Get analytics for a specific category
   */
  const getCategoryAnalytics = useCallback(
    (categoryId: CategoryId): CategoryAnalytics | undefined => {
      return actions.getCategoryAnalytics(categoryId);
    },
    [actions]
  );

  /**
   * Get all category analytics
   */
  const getAllCategoryAnalytics = useCallback((): CategoryAnalytics[] => {
    return category_analytics;
  }, [category_analytics]);

  /**
   * Get performance trends for a category
   */
  const getCategoryPerformanceTrends = useCallback(
    (categoryId: CategoryId, timeframe: 'week' | 'month' | 'quarter' = 'month'): CategoryPerformanceTrend[] => {
      return getCategoryTrends(categoryId, study_sessions, timeframe);
    },
    [study_sessions]
  );

  /**
   * Get difficulty progression for a category
   */
  const getCategoryDifficultyAnalysis = useCallback(
    (categoryWords: Word[]): CategoryDifficultyProgression => {
      return getCategoryDifficultyProgression(categoryWords, word_metrics);
    },
    [word_metrics]
  );

  /**
   * Get weak points analysis for a category
   */
  const getCategoryWeakPointAnalysis = useCallback(
    (categoryWords: Word[]): CategoryWeakPoint[] => {
      return getCategoryWeakPoints(categoryWords, word_metrics);
    },
    [word_metrics]
  );

  /**
   * Record category activity and update analytics
   */
  const recordCategoryActivity = useCallback(
    (categoryId: CategoryId, categoryWords: Word[], sessionData: {
      duration: number;
      wordsCount: number;
      accuracy?: number;
      activityType: string;
    }) => {
      // Update category analytics with new session data
      const currentAnalytics = getCategoryAnalytics(categoryId);
      
      const updatedAnalytics: Partial<CategoryAnalytics> = {
        time_spent_minutes: (currentAnalytics?.time_spent_minutes || 0) + sessionData.duration,
        last_activity: new Date().toISOString(),
      };

      // Update average accuracy if provided
      if (sessionData.accuracy !== undefined && currentAnalytics) {
        const totalSessions = study_sessions.filter(s => 
          // This is a simplification - in a real implementation, we'd need session-category mapping
          true
        ).length;
        
        const newAverageAccuracy = currentAnalytics.average_accuracy > 0
          ? ((currentAnalytics.average_accuracy * totalSessions) + sessionData.accuracy) / (totalSessions + 1)
          : sessionData.accuracy;
        
        (updatedAnalytics as any).average_accuracy = newAverageAccuracy;
      }

      actions.updateCategoryAnalytics(categoryId, updatedAnalytics);
      
      // Also record learning data for overall analytics
      if (sessionData.accuracy !== undefined) {
        actions.recordLearningData('accuracy_rate', sessionData.accuracy / 100, {
          category_id: categoryId,
          activity_type: sessionData.activityType,
        });
      }
      
      actions.recordLearningData('session_duration', sessionData.duration, {
        category_id: categoryId,
        words_count: sessionData.wordsCount,
      });
    },
    [actions, getCategoryAnalytics, study_sessions]
  );

  /**
   * Get category performance summary
   */
  const getCategoryPerformanceSummary = useCallback(
    (categoryId: CategoryId) => {
      const analytics = getCategoryAnalytics(categoryId);
      if (!analytics) {
        return null;
      }

      const completionRate = analytics.total_words > 0 
        ? (analytics.words_learned / analytics.total_words) * 100 
        : 0;

      const efficiency = analytics.time_spent_minutes > 0
        ? analytics.words_learned / analytics.time_spent_minutes
        : 0;

      const progressScore = (completionRate * 0.6) + (analytics.average_accuracy * 0.4);

      return {
        categoryId,
        completionRate: Math.round(completionRate * 100) / 100,
        accuracy: analytics.average_accuracy,
        timeSpent: analytics.time_spent_minutes,
        wordsLearned: analytics.words_learned,
        totalWords: analytics.total_words,
        efficiency: Math.round(efficiency * 100) / 100,
        progressScore: Math.round(progressScore * 100) / 100,
        preferredMode: analytics.preferred_mode,
        lastActivity: analytics.last_activity,
        status: progressScore >= 80 ? 'excellent' as const :
                progressScore >= 60 ? 'good' as const :
                progressScore >= 40 ? 'fair' as const : 'needs_work' as const,
      };
    },
    [getCategoryAnalytics]
  );

  /**
   * Get comparative analytics across all categories
   */
  const getComparativeAnalytics = useCallback(() => {
    const allAnalytics = getAllCategoryAnalytics();
    
    if (allAnalytics.length === 0) {
      return {
        bestPerforming: null,
        worstPerforming: null,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        overallCompletion: 0,
      };
    }

    const bestPerforming = allAnalytics.reduce((best, current) => 
      current.average_accuracy > best.average_accuracy ? current : best
    );

    const worstPerforming = allAnalytics.reduce((worst, current) => 
      current.average_accuracy < worst.average_accuracy ? current : worst
    );

    const averageAccuracy = allAnalytics.reduce((sum, analytics) => 
      sum + analytics.average_accuracy, 0
    ) / allAnalytics.length;

    const totalTimeSpent = allAnalytics.reduce((sum, analytics) => 
      sum + analytics.time_spent_minutes, 0
    );

    const overallCompletion = allAnalytics.reduce((sum, analytics) => {
      const completion = analytics.total_words > 0 
        ? (analytics.words_learned / analytics.total_words) * 100 
        : 0;
      return sum + completion;
    }, 0) / allAnalytics.length;

    return {
      bestPerforming: bestPerforming.category_id,
      worstPerforming: worstPerforming.category_id,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      totalTimeSpent,
      overallCompletion: Math.round(overallCompletion * 100) / 100,
    };
  }, [getAllCategoryAnalytics]);

  // Memoized values for the specific category if provided
  const categorySpecificData = useMemo(() => {
    if (!categoryId) return null;

    return {
      analytics: getCategoryAnalytics(categoryId),
      summary: getCategoryPerformanceSummary(categoryId),
    };
  }, [categoryId, getCategoryAnalytics, getCategoryPerformanceSummary]);

  return {
    // Category-specific data
    categoryAnalytics: categorySpecificData?.analytics,
    categorySummary: categorySpecificData?.summary,
    
    // Actions
    updateCategoryAnalytics,
    getCategoryAnalytics,
    getAllCategoryAnalytics,
    recordCategoryActivity,
    getCategoryPerformanceSummary,
    
    // Analysis functions
    getCategoryPerformanceTrends,
    getCategoryDifficultyAnalysis,
    getCategoryWeakPointAnalysis,
    getComparativeAnalytics,
    
    // Computed properties
    allCategoryAnalytics: category_analytics,
    comparativeAnalytics: getComparativeAnalytics(),
  };
}

/**
 * Hook for category performance monitoring
 */
export function useCategoryPerformanceMonitor() {
  const { 
    getAllCategoryAnalytics, 
    getComparativeAnalytics,
    getCategoryPerformanceSummary,
  } = useCategoryAnalytics();

  const performanceData = useMemo(() => {
    const allAnalytics = getAllCategoryAnalytics();
    const comparative = getComparativeAnalytics();
    
    const categoryPerformances = allAnalytics.map(analytics => ({
      category_id: analytics.category_id,
      analytics,
      performance: getCategoryPerformanceSummary(analytics.category_id),
    }));

    return {
      categories: categoryPerformances,
      summary: comparative,
      recommendations: generateRecommendations(categoryPerformances),
    };
  }, [getAllCategoryAnalytics, getComparativeAnalytics, getCategoryPerformanceSummary]);

  return performanceData;
}

/**
 * Performance data type for recommendations
 */
type PerformanceData = {
  category_id: CategoryId;
  analytics: CategoryAnalytics;
  performance: {
    categoryId: CategoryId;
    completionRate: number;
    accuracy: number;
    timeSpent: number;
    wordsLearned: number;
    totalWords: number;
    efficiency: number;
    progressScore: number;
    preferredMode: string;
    lastActivity: string;
    status: 'excellent' | 'good' | 'fair' | 'needs_work';
  } | null;
};

/**
 * Generate learning recommendations based on category performance
 */
function generateRecommendations(
  performances: PerformanceData[]
): string[] {
  const recommendations: string[] = [];
  
  performances.forEach(({ category_id, performance }) => {
    if (!performance) return;
    
    if (performance.accuracy < 50) {
      recommendations.push(`Focus on improving accuracy in ${category_id} category`);
    }
    
    if (performance.completionRate < 25) {
      recommendations.push(`Spend more time on ${category_id} to increase word coverage`);
    }
    
    if (performance.efficiency < 0.5) {
      recommendations.push(`Try shorter, more frequent sessions for ${category_id}`);
    }
    
    if (performance.status === 'excellent') {
      recommendations.push(`Great work on ${category_id}! Consider moving to more advanced words`);
    }
  });

  // General recommendations
  const validPerformances = performances.filter(p => p.performance !== null);
  if (validPerformances.length === 0) return recommendations;
  
  const overallAccuracy = validPerformances.reduce((sum, p) => 
    sum + (p.performance!.accuracy || 0), 0
  ) / validPerformances.length;
  
  if (overallAccuracy > 80) {
    recommendations.push('Your accuracy is excellent across categories!');
  } else if (overallAccuracy < 60) {
    recommendations.push('Consider reviewing fundamentals to improve overall accuracy');
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}