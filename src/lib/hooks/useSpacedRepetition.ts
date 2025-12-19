/**
 * Spaced Repetition Hook
 * Provides intelligent spaced repetition scheduling and forgetting curve analysis
 */

import { useCallback, useMemo } from 'react';
import { useUserProgressStore } from '@/stores/userProgressStore';
import {
  createForgettingCurveEngine,
  type ForgettingCurveModel,
  type ReviewPrediction,
  type SpacedRepetitionSchedule,
  type ForgettingCurveInsights,
  type MemoryConsolidation,
  type WordForgettingProfile,
} from '@/lib/analytics/forgettingCurveEngine';
import type { 
  WordLearningMetrics, 
  LearningDataPoint, 
  StudySession,
  CategoryId 
} from '@/types';

/**
 * Review queue item with priority and context
 */
export interface ReviewQueueItem {
  readonly word_id: string;
  readonly word_text: string;
  readonly category_id: CategoryId;
  readonly priority: 'urgent' | 'due' | 'optional' | 'too_early';
  readonly success_probability: number;
  readonly days_overdue: number;
  readonly predicted_difficulty: 'easy' | 'medium' | 'hard';
  readonly review_context: ReviewContext;
}

export interface ReviewContext {
  readonly last_accuracy: number;
  readonly total_reviews: number;
  readonly average_response_time: number;
  readonly forgetting_curve_stage: 'acquisition' | 'consolidation' | 'maintenance';
}

/**
 * Daily review plan with optimized scheduling
 */
export interface DailyReviewPlan {
  readonly total_reviews: number;
  readonly urgent_reviews: number;
  readonly optional_reviews: number;
  readonly estimated_duration: number; // minutes
  readonly categories: CategoryReviewSummary[];
  readonly optimization_tips: string[];
}

export interface CategoryReviewSummary {
  readonly category_id: CategoryId;
  readonly word_count: number;
  readonly priority_distribution: Record<string, number>;
  readonly estimated_time: number;
}

/**
 * Retention analysis results
 */
export interface RetentionAnalysis {
  readonly overall_retention: number; // 0-1
  readonly category_retention: Record<CategoryId, number>;
  readonly retention_trend: 'improving' | 'declining' | 'stable';
  readonly weak_areas: WeakArea[];
  readonly improvement_suggestions: string[];
}

export interface WeakArea {
  readonly area_type: 'category' | 'difficulty' | 'word_type';
  readonly identifier: string;
  readonly retention_rate: number;
  readonly impact_score: number; // How much improving this would help overall
}

/**
 * Study session optimization
 */
export interface SessionOptimization {
  readonly optimal_session_length: number; // minutes
  readonly recommended_review_count: number;
  readonly difficulty_progression: 'easy_to_hard' | 'hard_to_easy' | 'mixed';
  readonly break_intervals: number[]; // minutes
  readonly focus_areas: string[];
}

/**
 * Hook for spaced repetition and forgetting curve analysis
 */
export function useSpacedRepetition() {
  const store = useUserProgressStore();
  const actions = useUserProgressStore((state) => state.actions);
  
  const { word_metrics, learning_data, study_sessions } = store;
  
  // Create forgetting curve engine
  const forgettingEngine = useMemo(() => createForgettingCurveEngine(), []);
  
  /**
   * Generate forgetting curve model for a word
   */
  const getForgettingCurveModel = useCallback(
    (wordId: string): ForgettingCurveModel | null => {
      const wordMetrics = word_metrics.find(m => m.word_id === wordId);
      if (!wordMetrics) return null;
      
      const wordReviews = learning_data.filter(ld => 
        ld.metadata?.word_id === wordId
      );
      
      return forgettingEngine.calculateForgettingCurve(wordMetrics, wordReviews);
    },
    [forgettingEngine, word_metrics, learning_data]
  );
  
  /**
   * Predict review success for a word
   */
  const predictReviewSuccess = useCallback(
    (wordId: string): ReviewPrediction | null => {
      const model = getForgettingCurveModel(wordId);
      if (!model) return null;
      
      const wordMetrics = word_metrics.find(m => m.word_id === wordId);
      if (!wordMetrics) return null;
      
      const daysSinceLastReview = Math.ceil(
        (Date.now() - new Date(wordMetrics.last_seen).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return forgettingEngine.predictReviewSuccess(model, daysSinceLastReview);
    },
    [getForgettingCurveModel, word_metrics, forgettingEngine]
  );
  
  /**
   * Generate spaced repetition schedule for a word
   */
  const generateSchedule = useCallback(
    (wordId: string, lastQuality: number): SpacedRepetitionSchedule | null => {
      const wordMetrics = word_metrics.find(m => m.word_id === wordId);
      if (!wordMetrics) return null;
      
      return forgettingEngine.generateSpacedRepetitionSchedule(
        wordMetrics,
        wordMetrics.last_seen,
        lastQuality
      );
    },
    [forgettingEngine, word_metrics]
  );
  
  /**
   * Update word schedule after review
   */
  const updateWordSchedule = useCallback(
    (wordId: string, quality: number, responseTime: number) => {
      const schedule = generateSchedule(wordId, quality);
      if (!schedule) return;
      
      // Update word metrics with new schedule
      actions.updateWordMetrics(wordId, {
        spaced_repetition_data: {
          next_review_date: schedule.next_review_date,
          ease_factor: schedule.ease_factor,
          next_interval: schedule.interval_days,
          repetition_number: schedule.repetition_number,
        },
        last_seen: new Date().toISOString(),
      });
      
      // Record the interaction
      actions.recordWordInteraction(wordId, quality >= 3, responseTime);
    },
    [generateSchedule, actions]
  );
  
  /**
   * Get today's review queue
   */
  const getReviewQueue = useCallback(
    (maxItems: number = 50): ReviewQueueItem[] => {
      const today = new Date();
      const queue: ReviewQueueItem[] = [];
      
      for (const wordMetrics of word_metrics) {
        const prediction = predictReviewSuccess(wordMetrics.word_id);
        if (!prediction) continue;
        
        // Skip if too early for review
        if (prediction.review_priority === 'too_early') continue;
        
        const nextReviewDate = wordMetrics.spaced_repetition_data?.next_review_date
          ? new Date(wordMetrics.spaced_repetition_data.next_review_date)
          : new Date(0);
        
        const daysSinceScheduled = Math.ceil(
          (today.getTime() - nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Only include due or overdue items
        if (daysSinceScheduled >= 0 || prediction.review_priority === 'urgent') {
          const accuracy = wordMetrics.encounter_count > 0 
            ? wordMetrics.correct_count / wordMetrics.encounter_count 
            : 0;
          
          queue.push({
            word_id: wordMetrics.word_id,
            word_text: wordMetrics.word_id, // Would need word lookup
            category_id: 'general' as CategoryId, // Would need category lookup
            priority: prediction.review_priority,
            success_probability: prediction.success_probability,
            days_overdue: Math.max(0, daysSinceScheduled),
            predicted_difficulty: prediction.success_probability > 0.8 ? 'easy' : 
                                 prediction.success_probability > 0.6 ? 'medium' : 'hard',
            review_context: {
              last_accuracy: accuracy,
              total_reviews: wordMetrics.encounter_count,
              average_response_time: wordMetrics.avg_response_time,
              forgetting_curve_stage: wordMetrics.confidence_score > 0.8 ? 'maintenance' :
                                     wordMetrics.confidence_score > 0.5 ? 'consolidation' : 'acquisition',
            },
          });
        }
      }
      
      // Sort by priority and overdue days
      return queue
        .sort((a, b) => {
          const priorityOrder = { 'urgent': 0, 'due': 1, 'optional': 2, 'too_early': 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          return b.days_overdue - a.days_overdue;
        })
        .slice(0, maxItems);
    },
    [word_metrics, predictReviewSuccess]
  );
  
  /**
   * Generate daily review plan
   */
  const getDailyReviewPlan = useCallback((): DailyReviewPlan => {
    const queue = getReviewQueue(100);
    const urgentReviews = queue.filter(item => item.priority === 'urgent').length;
    const dueReviews = queue.filter(item => item.priority === 'due').length;
    const optionalReviews = queue.filter(item => item.priority === 'optional').length;
    
    // Estimate 30 seconds per review on average
    const estimatedDuration = Math.round(queue.length * 0.5);
    
    // Group by category (simplified)
    const categoryGroups: Record<string, ReviewQueueItem[]> = {};
    queue.forEach(item => {
      const key = item.category_id;
      if (!categoryGroups[key]) categoryGroups[key] = [];
      categoryGroups[key].push(item);
    });
    
    const categories: CategoryReviewSummary[] = Object.entries(categoryGroups).map(([categoryId, items]) => ({
      category_id: categoryId as CategoryId,
      word_count: items.length,
      priority_distribution: {
        urgent: items.filter(i => i.priority === 'urgent').length,
        due: items.filter(i => i.priority === 'due').length,
        optional: items.filter(i => i.priority === 'optional').length,
      },
      estimated_time: Math.round(items.length * 0.5),
    }));
    
    const optimizationTips = generateOptimizationTips(queue, estimatedDuration);
    
    return {
      total_reviews: queue.length,
      urgent_reviews: urgentReviews,
      optional_reviews: optionalReviews,
      estimated_duration: estimatedDuration,
      categories,
      optimization_tips: optimizationTips,
    };
  }, [getReviewQueue]);
  
  /**
   * Analyze overall retention
   */
  const getRetentionAnalysis = useCallback((): RetentionAnalysis => {
    const allModels = word_metrics.map(metrics => 
      getForgettingCurveModel(metrics.word_id)
    ).filter(model => model !== null) as ForgettingCurveModel[];
    
    const overallRetention = allModels.length > 0
      ? allModels.reduce((sum, model) => sum + model.retrieval_strength, 0) / allModels.length
      : 0;
    
    // Simplified category retention (would need actual category data)
    const categoryRetention: Record<CategoryId, number> = {
      greetings: overallRetention * 0.9,
      numbers: overallRetention * 1.1,
      daily: overallRetention,
      food: overallRetention * 0.95,
      business: overallRetention * 0.85,
    };
    
    // Determine trend (simplified)
    const retentionTrend: 'improving' | 'declining' | 'stable' = 
      overallRetention > 0.7 ? 'improving' :
      overallRetention < 0.5 ? 'declining' : 'stable';
    
    const weakAreas = identifyWeakAreas(allModels, categoryRetention);
    const improvementSuggestions = generateImprovementSuggestions(weakAreas, overallRetention);
    
    return {
      overall_retention: Math.round(overallRetention * 10000) / 100,
      category_retention: categoryRetention,
      retention_trend: retentionTrend,
      weak_areas: weakAreas,
      improvement_suggestions: improvementSuggestions,
    };
  }, [word_metrics, getForgettingCurveModel]);
  
  /**
   * Get session optimization recommendations
   */
  const getSessionOptimization = useCallback((): SessionOptimization => {
    const queue = getReviewQueue(30);
    const urgentCount = queue.filter(item => item.priority === 'urgent').length;
    const totalCount = queue.length;
    
    // Optimize based on queue composition
    const optimalSessionLength = Math.min(25, Math.max(10, totalCount * 0.8));
    const recommendedReviewCount = Math.min(30, totalCount);
    
    // Difficulty progression strategy
    let difficultyProgression: 'easy_to_hard' | 'hard_to_easy' | 'mixed';
    if (urgentCount > totalCount * 0.3) {
      difficultyProgression = 'hard_to_easy'; // Start with urgent items
    } else if (urgentCount === 0) {
      difficultyProgression = 'easy_to_hard'; // Build confidence
    } else {
      difficultyProgression = 'mixed'; // Balanced approach
    }
    
    const breakIntervals = optimalSessionLength > 15 ? [10, 20] : [optimalSessionLength];
    const focusAreas = generateFocusAreas(queue);
    
    return {
      optimal_session_length: optimalSessionLength,
      recommended_review_count: recommendedReviewCount,
      difficulty_progression: difficultyProgression,
      break_intervals: breakIntervals,
      focus_areas: focusAreas,
    };
  }, [getReviewQueue]);
  
  /**
   * Get comprehensive forgetting curve insights
   */
  const getForgettingInsights = useCallback((): ForgettingCurveInsights => {
    return forgettingEngine.getForgettingCurveInsights(word_metrics, learning_data);
  }, [forgettingEngine, word_metrics, learning_data]);
  
  /**
   * Analyze memory consolidation for a word
   */
  const getMemoryConsolidation = useCallback(
    (wordId: string): MemoryConsolidation | null => {
      const wordMetrics = word_metrics.find(m => m.word_id === wordId);
      if (!wordMetrics) return null;
      
      const recentSessions = study_sessions.filter(session => 
        new Date(session.date) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      );
      
      return forgettingEngine.analyzeMemoryConsolidation(wordMetrics, recentSessions);
    },
    [forgettingEngine, word_metrics, study_sessions]
  );
  
  /**
   * Get words that need immediate attention
   */
  const getCriticalWords = useCallback((): string[] => {
    const insights = getForgettingInsights();
    return insights.most_forgettable_words
      .filter(word => word.forgetting_rate > 0.3)
      .slice(0, 5)
      .map(word => word.word_id);
  }, [getForgettingInsights]);
  
  return {
    // Core spaced repetition functions
    getForgettingCurveModel,
    predictReviewSuccess,
    generateSchedule,
    updateWordSchedule,
    
    // Review management
    getReviewQueue,
    getDailyReviewPlan,
    getSessionOptimization,
    
    // Analysis functions
    getRetentionAnalysis,
    getForgettingInsights,
    getMemoryConsolidation,
    getCriticalWords,
    
    // Quick access computed values
    totalWordsTracked: word_metrics.length,
    hasEnoughDataForAnalysis: word_metrics.length >= 10,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate optimization tips for daily review plan
 */
function generateOptimizationTips(
  queue: ReviewQueueItem[], 
  estimatedDuration: number
): string[] {
  const tips: string[] = [];
  
  const urgentCount = queue.filter(item => item.priority === 'urgent').length;
  const hardWords = queue.filter(item => item.predicted_difficulty === 'hard').length;
  
  if (urgentCount > 10) {
    tips.push('Consider breaking reviews into smaller sessions to avoid fatigue');
  }
  
  if (hardWords > queue.length * 0.4) {
    tips.push('Start with easier words to build confidence before tackling difficult ones');
  }
  
  if (estimatedDuration > 30) {
    tips.push('Take 5-minute breaks every 15 minutes to maintain focus');
  }
  
  if (queue.length < 10) {
    tips.push('Great job staying on top of reviews! Consider learning new words.');
  }
  
  return tips.slice(0, 3); // Limit to 3 tips
}

/**
 * Identify weak areas in learning
 */
function identifyWeakAreas(
  models: ForgettingCurveModel[],
  categoryRetention: Record<CategoryId, number>
): WeakArea[] {
  const weakAreas: WeakArea[] = [];
  
  // Find weak categories
  Object.entries(categoryRetention).forEach(([categoryId, retention]) => {
    if (retention < 0.6) {
      weakAreas.push({
        area_type: 'category',
        identifier: categoryId,
        retention_rate: retention,
        impact_score: 0.8,
      });
    }
  });
  
  // Find words with high decay rates
  const highDecayWords = models.filter(model => model.decay_rate > 0.2);
  if (highDecayWords.length > models.length * 0.3) {
    weakAreas.push({
      area_type: 'word_type',
      identifier: 'high_decay_words',
      retention_rate: 0.4,
      impact_score: 0.7,
    });
  }
  
  return weakAreas.sort((a, b) => b.impact_score - a.impact_score);
}

/**
 * Generate improvement suggestions
 */
function generateImprovementSuggestions(
  weakAreas: WeakArea[],
  overallRetention: number
): string[] {
  const suggestions: string[] = [];
  
  if (overallRetention < 0.5) {
    suggestions.push('Consider reducing daily learning load and focusing on review');
  }
  
  weakAreas.forEach(area => {
    if (area.area_type === 'category') {
      suggestions.push(`Focus more practice time on ${area.identifier} category`);
    } else if (area.area_type === 'word_type') {
      suggestions.push('Some words may need different learning strategies');
    }
  });
  
  if (suggestions.length === 0) {
    suggestions.push('Your retention is good! Consider learning new words or harder material');
  }
  
  return suggestions.slice(0, 3);
}

/**
 * Generate focus areas for session
 */
function generateFocusAreas(queue: ReviewQueueItem[]): string[] {
  const focusAreas: string[] = [];
  
  const urgentCount = queue.filter(item => item.priority === 'urgent').length;
  const acquisitionWords = queue.filter(item => 
    item.review_context.forgetting_curve_stage === 'acquisition'
  ).length;
  
  if (urgentCount > 0) {
    focusAreas.push('Critical word review');
  }
  
  if (acquisitionWords > queue.length * 0.3) {
    focusAreas.push('New word acquisition');
  } else {
    focusAreas.push('Memory consolidation');
  }
  
  const lowAccuracyWords = queue.filter(item => 
    item.review_context.last_accuracy < 0.6
  ).length;
  
  if (lowAccuracyWords > 0) {
    focusAreas.push('Accuracy improvement');
  }
  
  return focusAreas.slice(0, 3);
}