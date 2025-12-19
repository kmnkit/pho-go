/**
 * Forgetting Curve Analysis Engine
 * Implements scientifically-based spaced repetition using forgetting curve models
 */

import type {
  WordLearningMetrics,
  SpacedRepetitionData,
  LearningDataPoint,
  StudySession,
  DifficultyLevel,
} from '@/types';

// ============================================================================
// Core Types for Forgetting Curve Analysis
// ============================================================================

export interface ForgettingCurveModel {
  readonly word_id: string;
  readonly initial_strength: number; // 0-1
  readonly decay_rate: number; // How fast the word is forgotten
  readonly stability_factor: number; // How stable the memory is
  readonly retrieval_strength: number; // Current retrieval strength
  readonly optimal_interval: number; // Days until next review
  readonly confidence_level: number; // 0-1, confidence in the model
}

export interface ReviewPrediction {
  readonly word_id: string;
  readonly success_probability: number; // 0-1
  readonly recommended_delay: number; // Days
  readonly difficulty_adjustment: number; // -1 to 1
  readonly review_priority: 'urgent' | 'due' | 'optional' | 'too_early';
  readonly reasoning: string[];
}

export interface SpacedRepetitionSchedule {
  readonly word_id: string;
  readonly next_review_date: string; // ISO string
  readonly interval_days: number;
  readonly ease_factor: number; // SuperMemo-style ease factor
  readonly repetition_number: number;
  readonly last_quality: number; // 0-5 quality rating
}

export interface ForgettingCurveInsights {
  readonly total_words: number;
  readonly words_due: number;
  readonly words_overdue: number;
  readonly optimal_daily_reviews: number;
  readonly average_retention: number;
  readonly memory_stability_trend: 'improving' | 'declining' | 'stable';
  readonly most_forgettable_words: WordForgettingProfile[];
  readonly strongest_memories: WordForgettingProfile[];
}

export interface WordForgettingProfile {
  readonly word_id: string;
  readonly word_text: string;
  readonly forgetting_rate: number; // 0-1, higher = more forgettable
  readonly memory_strength: number; // 0-1
  readonly review_efficiency: number; // XP per review hour
  readonly last_seen: string;
  readonly total_reviews: number;
}

export interface MemoryConsolidation {
  readonly consolidation_score: number; // 0-1
  readonly interference_risk: number; // 0-1
  readonly retrieval_practice_needed: boolean;
  readonly consolidation_activities: ConsolidationActivity[];
}

export interface ConsolidationActivity {
  readonly activity_type: 'review' | 'test' | 'context' | 'elaboration';
  readonly priority: number; // 0-1
  readonly estimated_benefit: number; // 0-1
  readonly time_required: number; // Minutes
}

// ============================================================================
// Forgetting Curve Analysis Engine
// ============================================================================

export class ForgettingCurveEngine {
  private readonly defaultDecayRate = 0.1;
  private readonly targetRetention = 0.85; // 85% retention target
  private readonly minInterval = 1; // Minimum 1 day between reviews
  private readonly maxInterval = 365; // Maximum 1 year between reviews

  /**
   * Calculate forgetting curve model for a word
   */
  public calculateForgettingCurve(
    wordMetrics: WordLearningMetrics,
    reviewHistory: LearningDataPoint[]
  ): ForgettingCurveModel {
    const reviews = reviewHistory
      .filter(dp => dp.metadata?.word_id === wordMetrics.word_id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (reviews.length === 0) {
      // New word - use default parameters
      return {
        word_id: wordMetrics.word_id,
        initial_strength: 0.3,
        decay_rate: this.defaultDecayRate,
        stability_factor: 0.5,
        retrieval_strength: 0.3,
        optimal_interval: 1,
        confidence_level: 0.2,
      };
    }

    // Calculate parameters based on review history
    const initialStrength = this.calculateInitialStrength(reviews);
    const decayRate = this.calculateDecayRate(reviews);
    const stabilityFactor = this.calculateStabilityFactor(wordMetrics, reviews);
    const retrievalStrength = this.calculateCurrentRetrievalStrength(
      wordMetrics,
      reviews,
      decayRate
    );
    const optimalInterval = this.calculateOptimalInterval(
      retrievalStrength,
      stabilityFactor,
      decayRate
    );
    const confidenceLevel = this.calculateModelConfidence(reviews);

    return {
      word_id: wordMetrics.word_id,
      initial_strength: initialStrength,
      decay_rate: decayRate,
      stability_factor: stabilityFactor,
      retrieval_strength: retrievalStrength,
      optimal_interval: optimalInterval,
      confidence_level: confidenceLevel,
    };
  }

  /**
   * Predict review success probability
   */
  public predictReviewSuccess(
    model: ForgettingCurveModel,
    daysSinceLastReview: number
  ): ReviewPrediction {
    // Calculate current retention based on forgetting curve
    const timeDecay = Math.exp(-model.decay_rate * daysSinceLastReview);
    const currentRetention = model.retrieval_strength * timeDecay;
    
    // Adjust for stability
    const stabilityBonus = model.stability_factor * 0.2;
    const successProbability = Math.min(0.95, currentRetention + stabilityBonus);
    
    // Calculate recommended delay
    const recommendedDelay = this.calculateRecommendedDelay(
      model,
      successProbability,
      daysSinceLastReview
    );
    
    // Determine priority
    const priority = this.determinePriority(successProbability, daysSinceLastReview, model.optimal_interval);
    
    // Calculate difficulty adjustment
    const difficultyAdjustment = this.calculateDifficultyAdjustment(successProbability);
    
    // Generate reasoning
    const reasoning = this.generatePredictionReasoning(
      successProbability,
      daysSinceLastReview,
      model
    );

    return {
      word_id: model.word_id,
      success_probability: Math.round(successProbability * 10000) / 10000,
      recommended_delay: recommendedDelay,
      difficulty_adjustment: difficultyAdjustment,
      review_priority: priority,
      reasoning,
    };
  }

  /**
   * Generate spaced repetition schedule
   */
  public generateSpacedRepetitionSchedule(
    wordMetrics: WordLearningMetrics,
    lastReviewDate: string,
    lastQuality: number // 0-5 quality rating
  ): SpacedRepetitionSchedule {
    const spacedRepData = wordMetrics.spaced_repetition_data;
    
    if (!spacedRepData) {
      // First review
      return {
        word_id: wordMetrics.word_id,
        next_review_date: this.addDays(lastReviewDate, 1),
        interval_days: 1,
        ease_factor: 2.5,
        repetition_number: 1,
        last_quality: lastQuality,
      };
    }

    // SuperMemo SM-2 algorithm with modifications
    let easeFactor = spacedRepData.ease_factor;
    let interval = spacedRepData.next_interval;

    let repetitionNumber = spacedRepData.repetition_number;
    
    if (lastQuality >= 3) {
      // Successful recall
      if (repetitionNumber === 1) {
        interval = 6;
      } else if (repetitionNumber === 2) {
        interval = Math.round(interval * easeFactor);
      } else {
        interval = Math.round(interval * easeFactor);
      }

      // Update ease factor
      easeFactor = easeFactor + (0.1 - (5 - lastQuality) * (0.08 + (5 - lastQuality) * 0.02));
    } else {
      // Failed recall - reset interval
      interval = 1;
      repetitionNumber = 0;
    }

    // Clamp values
    easeFactor = Math.max(1.3, easeFactor);
    interval = Math.max(this.minInterval, Math.min(this.maxInterval, interval));

    return {
      word_id: wordMetrics.word_id,
      next_review_date: this.addDays(lastReviewDate, interval),
      interval_days: interval,
      ease_factor: Math.round(easeFactor * 100) / 100,
      repetition_number: repetitionNumber + 1,
      last_quality: lastQuality,
    };
  }

  /**
   * Analyze memory consolidation for a word
   */
  public analyzeMemoryConsolidation(
    wordMetrics: WordLearningMetrics,
    recentSessions: StudySession[]
  ): MemoryConsolidation {
    const consolidationScore = this.calculateConsolidationScore(wordMetrics, recentSessions);
    const interferenceRisk = this.calculateInterferenceRisk(wordMetrics, recentSessions);
    const retrievalPracticeNeeded = consolidationScore < 0.7 || interferenceRisk > 0.6;
    
    const activities = this.generateConsolidationActivities(
      consolidationScore,
      interferenceRisk,
      wordMetrics
    );

    return {
      consolidation_score: consolidationScore,
      interference_risk: interferenceRisk,
      retrieval_practice_needed: retrievalPracticeNeeded,
      consolidation_activities: activities,
    };
  }

  /**
   * Get comprehensive forgetting curve insights
   */
  public getForgettingCurveInsights(
    allWordMetrics: WordLearningMetrics[],
    allReviewData: LearningDataPoint[]
  ): ForgettingCurveInsights {
    const models = allWordMetrics.map(metrics => 
      this.calculateForgettingCurve(metrics, allReviewData)
    );

    const now = new Date();
    const wordsDue = models.filter(model => {
      const daysSinceReview = this.getDaysSince(model.word_id, allReviewData);
      return daysSinceReview >= model.optimal_interval;
    }).length;

    const wordsOverdue = models.filter(model => {
      const daysSinceReview = this.getDaysSince(model.word_id, allReviewData);
      return daysSinceReview > model.optimal_interval * 1.5;
    }).length;

    const optimalDailyReviews = Math.round(models.length / 30); // Rough estimate
    
    const averageRetention = models.reduce((sum, model) => 
      sum + model.retrieval_strength, 0
    ) / models.length;

    const memoryTrend = this.calculateMemoryStabilityTrend(models, allReviewData);
    
    const forgettableWords = this.getMostForgettableWords(allWordMetrics, models);
    const strongestMemories = this.getStrongestMemories(allWordMetrics, models);

    return {
      total_words: allWordMetrics.length,
      words_due: wordsDue,
      words_overdue: wordsOverdue,
      optimal_daily_reviews: optimalDailyReviews,
      average_retention: Math.round(averageRetention * 10000) / 100,
      memory_stability_trend: memoryTrend,
      most_forgettable_words: forgettableWords,
      strongest_memories: strongestMemories,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateInitialStrength(reviews: LearningDataPoint[]): number {
    const firstReview = reviews[0];
    if (firstReview.metric_type === 'accuracy_rate') {
      return Math.max(0.1, Math.min(0.9, firstReview.value));
    }
    return 0.3; // Default
  }

  private calculateDecayRate(reviews: LearningDataPoint[]): number {
    if (reviews.length < 3) return this.defaultDecayRate;

    // Calculate decay based on performance over time
    const accuracyReviews = reviews.filter(r => r.metric_type === 'accuracy_rate');
    if (accuracyReviews.length < 2) return this.defaultDecayRate;

    const firstAccuracy = accuracyReviews[0].value;
    const lastAccuracy = accuracyReviews[accuracyReviews.length - 1].value;
    const timeSpan = this.getDaysBetween(
      accuracyReviews[0].timestamp,
      accuracyReviews[accuracyReviews.length - 1].timestamp
    );

    if (timeSpan === 0) return this.defaultDecayRate;

    // Higher decay rate for words that show performance decline
    const performanceChange = (lastAccuracy - firstAccuracy) / timeSpan;
    const baseDecayRate = this.defaultDecayRate;
    
    return Math.max(0.01, Math.min(0.5, baseDecayRate - performanceChange * 0.1));
  }

  private calculateStabilityFactor(
    wordMetrics: WordLearningMetrics,
    reviews: LearningDataPoint[]
  ): number {
    const encounterCount = wordMetrics.encounter_count;
    const correctCount = wordMetrics.correct_count;
    const accuracy = encounterCount > 0 ? correctCount / encounterCount : 0;
    
    // Stability increases with successful reviews and decreases with failures
    const baseStability = Math.min(0.9, accuracy * 0.8);
    
    // Bonus for consistent performance
    const consistencyBonus = this.calculateConsistencyBonus(reviews);
    
    return Math.max(0.1, baseStability + consistencyBonus);
  }

  private calculateConsistencyBonus(reviews: LearningDataPoint[]): number {
    const accuracyReviews = reviews
      .filter(r => r.metric_type === 'accuracy_rate')
      .map(r => r.value);
    
    if (accuracyReviews.length < 3) return 0;
    
    const mean = accuracyReviews.reduce((sum, val) => sum + val, 0) / accuracyReviews.length;
    const variance = accuracyReviews.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accuracyReviews.length;
    
    // Lower variance = higher consistency = higher bonus
    return Math.max(0, 0.2 - variance);
  }

  private calculateCurrentRetrievalStrength(
    wordMetrics: WordLearningMetrics,
    reviews: LearningDataPoint[],
    decayRate: number
  ): number {
    const lastReview = reviews[reviews.length - 1];
    if (!lastReview) return 0.3;
    
    const daysSinceLastReview = this.getDaysSince(lastReview.timestamp);
    const lastPerformance = lastReview.metric_type === 'accuracy_rate' ? lastReview.value : 0.5;
    
    // Apply forgetting curve
    const timeDecay = Math.exp(-decayRate * daysSinceLastReview);
    
    return Math.max(0.05, lastPerformance * timeDecay);
  }

  private calculateOptimalInterval(
    retrievalStrength: number,
    stabilityFactor: number,
    decayRate: number
  ): number {
    // Calculate interval where retention would drop to target level
    const targetRetention = this.targetRetention;
    const adjustedRetention = Math.max(0.1, retrievalStrength * stabilityFactor);
    
    if (adjustedRetention <= targetRetention) {
      return this.minInterval;
    }
    
    const interval = Math.log(targetRetention / adjustedRetention) / (-decayRate);
    return Math.max(this.minInterval, Math.min(this.maxInterval, Math.round(interval)));
  }

  private calculateModelConfidence(reviews: LearningDataPoint[]): number {
    // Confidence increases with more data points
    const dataPoints = reviews.length;
    const baseConfidence = Math.min(0.9, dataPoints / 20);
    
    // Bonus for recent data
    const recentReviews = reviews.filter(r => 
      this.getDaysSince(r.timestamp) < 30
    ).length;
    const recencyBonus = Math.min(0.1, recentReviews / 10);
    
    return Math.max(0.1, baseConfidence + recencyBonus);
  }

  private calculateRecommendedDelay(
    model: ForgettingCurveModel,
    successProbability: number,
    daysSinceLastReview: number
  ): number {
    if (successProbability > 0.9) {
      // Too easy - increase interval
      return Math.min(this.maxInterval, model.optimal_interval * 1.5);
    } else if (successProbability < 0.7) {
      // Too hard - review now
      return 0;
    } else {
      // Just right - use optimal interval
      return Math.max(0, model.optimal_interval - daysSinceLastReview);
    }
  }

  private determinePriority(
    successProbability: number,
    daysSinceLastReview: number,
    optimalInterval: number
  ): 'urgent' | 'due' | 'optional' | 'too_early' {
    if (successProbability < 0.5) return 'urgent';
    if (daysSinceLastReview >= optimalInterval) return 'due';
    if (daysSinceLastReview >= optimalInterval * 0.8) return 'optional';
    return 'too_early';
  }

  private calculateDifficultyAdjustment(successProbability: number): number {
    // Adjust difficulty based on predicted success
    if (successProbability > 0.9) return 0.3; // Make it harder
    if (successProbability < 0.6) return -0.3; // Make it easier
    return 0; // Keep same difficulty
  }

  private generatePredictionReasoning(
    successProbability: number,
    daysSinceLastReview: number,
    model: ForgettingCurveModel
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`${Math.round(successProbability * 100)}% predicted success probability`);
    reasoning.push(`${daysSinceLastReview} days since last review`);
    
    if (model.confidence_level > 0.7) {
      reasoning.push('High confidence prediction based on review history');
    } else {
      reasoning.push('Moderate confidence - limited review history');
    }
    
    if (model.stability_factor > 0.8) {
      reasoning.push('Strong memory stability detected');
    } else if (model.stability_factor < 0.4) {
      reasoning.push('Memory appears unstable - frequent review needed');
    }
    
    return reasoning;
  }

  private calculateConsolidationScore(
    wordMetrics: WordLearningMetrics,
    recentSessions: StudySession[]
  ): number {
    const accuracy = wordMetrics.encounter_count > 0 
      ? wordMetrics.correct_count / wordMetrics.encounter_count 
      : 0;
    
    const daysSinceLastSeen = this.getDaysSince(wordMetrics.last_seen);
    const sessionCount = recentSessions.length;
    
    // Higher score = better consolidation
    let score = accuracy * 0.6;
    score += Math.min(0.3, sessionCount / 10) * 0.3;
    score += Math.max(0, 0.1 - daysSinceLastSeen / 100) * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateInterferenceRisk(
    wordMetrics: WordLearningMetrics,
    recentSessions: StudySession[]
  ): number {
    // Higher risk if learning many similar words recently
    const recentWordCount = recentSessions.reduce(
      (sum, session) => sum + session.words_practiced, 
      0
    );
    
    const baseRisk = Math.min(0.8, recentWordCount / 50);
    
    // Lower confidence words have higher interference risk
    const confidenceRisk = 1 - wordMetrics.confidence_score;
    
    return Math.max(0, Math.min(1, (baseRisk + confidenceRisk) / 2));
  }

  private generateConsolidationActivities(
    consolidationScore: number,
    interferenceRisk: number,
    wordMetrics: WordLearningMetrics
  ): ConsolidationActivity[] {
    const activities: ConsolidationActivity[] = [];
    
    if (consolidationScore < 0.5) {
      activities.push({
        activity_type: 'review',
        priority: 0.9,
        estimated_benefit: 0.8,
        time_required: 3,
      });
    }
    
    if (interferenceRisk > 0.6) {
      activities.push({
        activity_type: 'context',
        priority: 0.7,
        estimated_benefit: 0.6,
        time_required: 5,
      });
    }
    
    if (wordMetrics.confidence_score < 0.6) {
      activities.push({
        activity_type: 'test',
        priority: 0.8,
        estimated_benefit: 0.7,
        time_required: 2,
      });
    }
    
    return activities.sort((a, b) => b.priority - a.priority);
  }

  private calculateMemoryStabilityTrend(
    models: ForgettingCurveModel[],
    allReviewData: LearningDataPoint[]
  ): 'improving' | 'declining' | 'stable' {
    // Simplified trend calculation
    const avgStability = models.reduce((sum, model) => sum + model.stability_factor, 0) / models.length;
    const avgRetrieval = models.reduce((sum, model) => sum + model.retrieval_strength, 0) / models.length;
    
    const overallStrength = (avgStability + avgRetrieval) / 2;
    
    if (overallStrength > 0.7) return 'improving';
    if (overallStrength < 0.4) return 'declining';
    return 'stable';
  }

  private getMostForgettableWords(
    allWordMetrics: WordLearningMetrics[],
    models: ForgettingCurveModel[]
  ): WordForgettingProfile[] {
    return models
      .sort((a, b) => b.decay_rate - a.decay_rate)
      .slice(0, 10)
      .map(model => {
        const metrics = allWordMetrics.find(m => m.word_id === model.word_id)!;
        return {
          word_id: model.word_id,
          word_text: metrics.word_id, // Would need actual word text lookup
          forgetting_rate: model.decay_rate,
          memory_strength: model.retrieval_strength,
          review_efficiency: 0.5, // Simplified calculation
          last_seen: metrics.last_seen,
          total_reviews: metrics.encounter_count,
        };
      });
  }

  private getStrongestMemories(
    allWordMetrics: WordLearningMetrics[],
    models: ForgettingCurveModel[]
  ): WordForgettingProfile[] {
    return models
      .sort((a, b) => (b.retrieval_strength * b.stability_factor) - (a.retrieval_strength * a.stability_factor))
      .slice(0, 10)
      .map(model => {
        const metrics = allWordMetrics.find(m => m.word_id === model.word_id)!;
        return {
          word_id: model.word_id,
          word_text: metrics.word_id, // Would need actual word text lookup
          forgetting_rate: model.decay_rate,
          memory_strength: model.retrieval_strength,
          review_efficiency: 0.8, // Simplified calculation
          last_seen: metrics.last_seen,
          total_reviews: metrics.encounter_count,
        };
      });
  }

  private getDaysSince(timestamp: string): number;
  private getDaysSince(wordId: string, reviewData: LearningDataPoint[]): number;
  private getDaysSince(
    timestampOrWordId: string, 
    reviewData?: LearningDataPoint[]
  ): number {
    if (reviewData) {
      // Find last review for word
      const wordReviews = reviewData.filter(dp => dp.metadata?.word_id === timestampOrWordId);
      if (wordReviews.length === 0) return 999; // Very old
      
      const lastReview = wordReviews[wordReviews.length - 1];
      return this.getDaysBetween(lastReview.timestamp, new Date().toISOString());
    } else {
      // Direct timestamp
      return this.getDaysBetween(timestampOrWordId, new Date().toISOString());
    }
  }

  private getDaysBetween(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private addDays(date: string, days: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  }
}

/**
 * Factory function to create forgetting curve engine
 */
export function createForgettingCurveEngine(): ForgettingCurveEngine {
  return new ForgettingCurveEngine();
}