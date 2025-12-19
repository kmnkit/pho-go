/**
 * Temporal Analytics Hook
 * Provides temporal pattern analysis and learning rhythm insights
 */

import { useCallback, useMemo } from 'react';
import { useUserProgressStore } from '@/stores/userProgressStore';
import {
  createTemporalPatternEngine,
  type TemporalPattern,
  type LearningRhythm,
  type LearningMomentum,
  type TemporalPatternType,
} from '@/lib/analytics/temporalPatternEngine';
import type { LearningDataPoint, StudySession, MetricType } from '@/types';

/**
 * Temporal insights summary for user display
 */
export interface TemporalInsights {
  readonly patterns: TemporalPattern[];
  readonly rhythm: LearningRhythm;
  readonly momentum: LearningMomentum;
  readonly recommendations: TemporalRecommendation[];
  readonly nextOptimalSession: OptimalSessionPrediction;
}

/**
 * Recommendation based on temporal analysis
 */
export interface TemporalRecommendation {
  readonly type: 'timing' | 'duration' | 'frequency' | 'break';
  readonly priority: 'high' | 'medium' | 'low';
  readonly title: string;
  readonly description: string;
  readonly actionable_steps: string[];
  readonly expected_benefit: string;
}

/**
 * Optimal session prediction
 */
export interface OptimalSessionPrediction {
  readonly recommended_time: string; // ISO timestamp
  readonly confidence: number; // 0-1
  readonly duration_minutes: number;
  readonly reasoning: string[];
  readonly performance_boost_estimate: number; // Percentage improvement expected
}

/**
 * Pattern filter options
 */
export interface PatternFilterOptions {
  readonly pattern_types?: TemporalPatternType[];
  readonly min_confidence?: number;
  readonly time_range_days?: number;
}

/**
 * Hook for temporal analytics and pattern analysis
 */
export function useTemporalAnalytics() {
  const store = useUserProgressStore();
  const actions = useUserProgressStore((state) => state.actions);

  const { learning_data, study_sessions } = store;

  // Create temporal pattern engine instance
  const patternEngine = useMemo(() => createTemporalPatternEngine(), []);

  /**
   * Analyze all temporal patterns in learning data
   */
  const analyzeTemporalPatterns = useCallback(
    (options?: PatternFilterOptions): TemporalPattern[] => {
      let patterns = patternEngine.analyzeTemporalPatterns(learning_data, study_sessions);

      // Apply filters if provided
      if (options) {
        if (options.pattern_types) {
          patterns = patterns.filter(p => options.pattern_types!.includes(p.pattern_type));
        }
        if (options.min_confidence !== undefined) {
          patterns = patterns.filter(p => p.confidence >= options.min_confidence!);
        }
        if (options.time_range_days) {
          const cutoffDate = new Date(Date.now() - options.time_range_days * 24 * 60 * 60 * 1000);
          patterns = patterns.filter(p => new Date(p.start_time) >= cutoffDate);
        }
      }

      return patterns.sort((a, b) => b.confidence - a.confidence);
    },
    [patternEngine, learning_data, study_sessions]
  );

  /**
   * Get learning rhythm analysis
   */
  const getLearningRhythm = useCallback((): LearningRhythm => {
    return patternEngine.analyzeLearningRhythm(learning_data);
  }, [patternEngine, learning_data]);

  /**
   * Get learning momentum analysis
   */
  const getLearningMomentum = useCallback((): LearningMomentum => {
    return patternEngine.analyzeLearningMomentum(learning_data, study_sessions);
  }, [patternEngine, learning_data, study_sessions]);

  /**
   * Get comprehensive temporal insights
   */
  const getTemporalInsights = useCallback((): TemporalInsights => {
    const patterns = analyzeTemporalPatterns({ min_confidence: 0.6 });
    const rhythm = getLearningRhythm();
    const momentum = getLearningMomentum();
    
    const recommendations = generateTemporalRecommendations(patterns, rhythm, momentum);
    const nextOptimalSession = predictOptimalSession(rhythm, momentum, study_sessions);

    return {
      patterns,
      rhythm,
      momentum,
      recommendations,
      nextOptimalSession,
    };
  }, [analyzeTemporalPatterns, getLearningRhythm, getLearningMomentum, study_sessions]);

  /**
   * Get patterns by specific type
   */
  const getPatternsByType = useCallback(
    (patternType: TemporalPatternType): TemporalPattern[] => {
      return analyzeTemporalPatterns({ pattern_types: [patternType] });
    },
    [analyzeTemporalPatterns]
  );

  /**
   * Get performance predictions for specific times
   */
  const getPredictedPerformance = useCallback(
    (targetTime: string): number => {
      const rhythm = getLearningRhythm();
      const targetHour = new Date(targetTime).getHours();
      
      if (rhythm.optimal_hours.includes(targetHour)) {
        return rhythm.peak_performance_window.performance_multiplier;
      }
      
      // Calculate based on distance from optimal hours
      const distances = rhythm.optimal_hours.map(hour => {
        const distance = Math.min(
          Math.abs(hour - targetHour),
          24 - Math.abs(hour - targetHour) // Wrap around distance
        );
        return distance;
      });
      
      const minDistance = Math.min(...distances);
      const performanceDecay = Math.exp(-minDistance / 4); // Exponential decay
      
      return rhythm.peak_performance_window.performance_multiplier * performanceDecay;
    },
    [getLearningRhythm]
  );

  /**
   * Check if current time is optimal for learning
   */
  const isCurrentTimeOptimal = useCallback((): {
    isOptimal: boolean;
    confidence: number;
    reason: string;
  } => {
    const rhythm = getLearningRhythm();
    const now = new Date();
    const currentHour = now.getHours();
    
    const isInOptimalHours = rhythm.optimal_hours.includes(currentHour);
    const isInPeakWindow = currentHour >= rhythm.peak_performance_window.start_hour && 
                          currentHour <= rhythm.peak_performance_window.end_hour;
    
    if (isInOptimalHours && isInPeakWindow) {
      return {
        isOptimal: true,
        confidence: rhythm.rhythm_strength * 0.9,
        reason: `Peak performance time - historically your best hour for learning`,
      };
    } else if (isInOptimalHours) {
      return {
        isOptimal: true,
        confidence: rhythm.rhythm_strength * 0.7,
        reason: `Good time for learning based on your patterns`,
      };
    } else if (rhythm.energy_decline_pattern.decline_hours.includes(currentHour)) {
      return {
        isOptimal: false,
        confidence: rhythm.rhythm_strength * 0.8,
        reason: `Low energy period - consider waiting for a better time`,
      };
    } else {
      return {
        isOptimal: false,
        confidence: rhythm.rhythm_strength * 0.6,
        reason: `Moderate time - not your strongest learning period`,
      };
    }
  }, [getLearningRhythm]);

  /**
   * Get streak analysis and predictions
   */
  const getStreakAnalysis = useCallback((): {
    currentStreak: number;
    streakRisk: 'low' | 'medium' | 'high';
    daysUntilBreak: number;
    strengthening: boolean;
  } => {
    const momentum = getLearningMomentum();
    const patterns = analyzeTemporalPatterns({ pattern_types: ['consistency_pattern'] });
    
    const hasConsistencyPattern = patterns.some(p => p.confidence > 0.7);
    const streakStrength = momentum.current_streak_strength;
    
    let streakRisk: 'low' | 'medium' | 'high' = 'medium';
    if (streakStrength > 0.8 && hasConsistencyPattern) streakRisk = 'low';
    if (streakStrength < 0.4 || momentum.momentum_direction === 'declining') streakRisk = 'high';
    
    return {
      currentStreak: Math.round(streakStrength * 14), // Approximate days
      streakRisk,
      daysUntilBreak: momentum.predicted_continuation,
      strengthening: momentum.momentum_direction === 'building',
    };
  }, [getLearningMomentum, analyzeTemporalPatterns]);

  /**
   * Export temporal analytics data
   */
  const exportTemporalData = useCallback(
    (format: 'json' | 'csv' = 'json'): string => {
      const insights = getTemporalInsights();
      
      if (format === 'json') {
        return JSON.stringify(insights, null, 2);
      } else {
        // Convert to CSV format
        const csvData = [
          ['Pattern Type', 'Confidence', 'Description', 'Frequency'],
          ...insights.patterns.map(p => [
            p.pattern_type,
            p.confidence.toFixed(2),
            p.description,
            p.frequency.toFixed(2),
          ]),
        ];
        
        return csvData.map(row => row.join(',')).join('\n');
      }
    },
    [getTemporalInsights]
  );

  // Memoized computed values
  const computedAnalytics = useMemo(() => {
    const insights = getTemporalInsights();
    const streakAnalysis = getStreakAnalysis();
    const currentTimeAnalysis = isCurrentTimeOptimal();
    
    return {
      insights,
      streakAnalysis,
      currentTimeAnalysis,
      hasEnoughData: learning_data.length >= 50,
      analysisQuality: learning_data.length >= 200 ? 'high' : 
                      learning_data.length >= 100 ? 'medium' : 'low',
    };
  }, [getTemporalInsights, getStreakAnalysis, isCurrentTimeOptimal, learning_data.length]);

  return {
    // Core analysis functions
    analyzeTemporalPatterns,
    getLearningRhythm,
    getLearningMomentum,
    getTemporalInsights,
    
    // Specific pattern queries
    getPatternsByType,
    getPredictedPerformance,
    isCurrentTimeOptimal,
    getStreakAnalysis,
    
    // Data export
    exportTemporalData,
    
    // Computed properties
    computedAnalytics,
    
    // Raw data access (for advanced use cases)
    rawLearningData: learning_data,
    rawStudySessions: study_sessions,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate actionable recommendations based on temporal analysis
 */
function generateTemporalRecommendations(
  patterns: TemporalPattern[],
  rhythm: LearningRhythm,
  momentum: LearningMomentum
): TemporalRecommendation[] {
  const recommendations: TemporalRecommendation[] = [];

  // Timing recommendations based on rhythm
  if (rhythm.optimal_hours.length > 0) {
    const optimalTimeRanges = formatOptimalHours(rhythm.optimal_hours);
    recommendations.push({
      type: 'timing',
      priority: 'high',
      title: 'Optimize Your Study Schedule',
      description: `Your peak learning hours are ${optimalTimeRanges}`,
      actionable_steps: [
        `Schedule main study sessions during ${optimalTimeRanges}`,
        'Use other times for lighter review or passive learning',
        'Set reminders for your peak performance windows',
      ],
      expected_benefit: `Up to ${Math.round((rhythm.peak_performance_window.performance_multiplier - 1) * 100)}% performance improvement`,
    });
  }

  // Duration recommendations based on patterns
  const microSessionPattern = patterns.find(p => p.pattern_type === 'micro_sessions');
  const bingePattern = patterns.find(p => p.pattern_type === 'binge_learning');

  if (microSessionPattern && microSessionPattern.confidence > 0.7) {
    recommendations.push({
      type: 'duration',
      priority: 'medium',
      title: 'Embrace Short Learning Bursts',
      description: 'Your data shows excellent results with micro-sessions',
      actionable_steps: [
        'Schedule 3-5 minute learning breaks throughout the day',
        'Use micro-sessions for vocabulary review',
        'Try the Pomodoro Technique with 10-15 minute learning blocks',
      ],
      expected_benefit: 'Better retention and reduced mental fatigue',
    });
  } else if (bingePattern && bingePattern.confidence > 0.7) {
    recommendations.push({
      type: 'duration',
      priority: 'medium',
      title: 'Maximize Deep Learning Sessions',
      description: 'You perform well in extended study sessions',
      actionable_steps: [
        'Block out 45-60 minute focused study periods',
        'Include short breaks every 20-25 minutes within sessions',
        'Plan challenging topics for your longer sessions',
      ],
      expected_benefit: 'Deeper understanding and improved mastery',
    });
  }

  // Momentum-based recommendations
  if (momentum.momentum_direction === 'declining' && momentum.plateau_risk > 0.7) {
    recommendations.push({
      type: 'break',
      priority: 'high',
      title: 'Take a Strategic Break',
      description: 'Your learning momentum indicates potential burnout',
      actionable_steps: [
        'Take a 1-2 day break from intensive studying',
        'Try passive learning (watching videos, listening to audio)',
        'Return with a modified routine to re-energize learning',
      ],
      expected_benefit: 'Prevent burnout and restore learning motivation',
    });
  } else if (momentum.momentum_direction === 'building') {
    recommendations.push({
      type: 'frequency',
      priority: 'high',
      title: 'Maintain Your Learning Momentum',
      description: 'You\'re in a strong learning phase - keep it going!',
      actionable_steps: [
        'Maintain your current study frequency',
        'Gradually increase complexity of learning material',
        'Consider adding a new learning challenge',
      ],
      expected_benefit: 'Maximize learning gains during peak momentum',
    });
  }

  // Consistency pattern recommendations
  const consistencyPattern = patterns.find(p => p.pattern_type === 'consistency_pattern');
  if (!consistencyPattern || consistencyPattern.confidence < 0.6) {
    recommendations.push({
      type: 'frequency',
      priority: 'high',
      title: 'Build Learning Consistency',
      description: 'Regular practice will significantly improve your results',
      actionable_steps: [
        'Set a daily learning goal (even just 5 minutes)',
        'Use habit stacking - link learning to existing routines',
        'Track daily practice to build visual streak motivation',
      ],
      expected_benefit: 'Improved retention and faster skill development',
    });
  }

  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}

/**
 * Predict optimal session timing based on patterns
 */
function predictOptimalSession(
  rhythm: LearningRhythm,
  momentum: LearningMomentum,
  studySessions: StudySession[]
): OptimalSessionPrediction {
  const now = new Date();
  
  // Find next optimal hour
  let nextOptimalHour = rhythm.optimal_hours.find(hour => hour > now.getHours());
  if (!nextOptimalHour) {
    // If no more optimal hours today, get first optimal hour tomorrow
    nextOptimalHour = Math.min(...rhythm.optimal_hours);
  }

  const nextOptimalTime = new Date(now);
  if (nextOptimalHour <= now.getHours()) {
    // Tomorrow
    nextOptimalTime.setDate(nextOptimalTime.getDate() + 1);
  }
  nextOptimalTime.setHours(nextOptimalHour, 0, 0, 0);

  // Calculate confidence based on rhythm strength and momentum
  const baseConfidence = rhythm.rhythm_strength * 0.8;
  const momentumBonus = momentum.momentum_direction === 'building' ? 0.2 : 
                       momentum.momentum_direction === 'declining' ? -0.1 : 0;
  const confidence = Math.max(0.3, Math.min(0.95, baseConfidence + momentumBonus));

  // Recommend session duration based on patterns
  const recentSessions = studySessions.slice(-10);
  const avgDuration = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / recentSessions.length
    : 15;

  const recommendedDuration = Math.max(10, Math.min(60, Math.round(avgDuration)));

  // Generate reasoning
  const reasoning: string[] = [];
  reasoning.push(`${nextOptimalHour}:00 aligns with your peak performance window`);
  
  if (momentum.momentum_direction === 'building') {
    reasoning.push('Your learning momentum is strong - good time to practice');
  }
  
  if (rhythm.rhythm_strength > 0.7) {
    reasoning.push('Strong consistency in your learning rhythm patterns');
  }

  const performanceBoost = (rhythm.peak_performance_window.performance_multiplier - 1) * 100;

  return {
    recommended_time: nextOptimalTime.toISOString(),
    confidence,
    duration_minutes: recommendedDuration,
    reasoning,
    performance_boost_estimate: Math.round(performanceBoost),
  };
}

/**
 * Format optimal hours into readable time ranges
 */
function formatOptimalHours(hours: number[]): string {
  if (hours.length === 0) return 'none detected';
  
  // Sort hours and group consecutive ones
  const sortedHours = [...hours].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sortedHours[0];
  let rangeEnd = sortedHours[0];

  for (let i = 1; i < sortedHours.length; i++) {
    if (sortedHours[i] === rangeEnd + 1) {
      rangeEnd = sortedHours[i];
    } else {
      ranges.push(formatTimeRange(rangeStart, rangeEnd));
      rangeStart = sortedHours[i];
      rangeEnd = sortedHours[i];
    }
  }
  
  ranges.push(formatTimeRange(rangeStart, rangeEnd));
  
  return ranges.join(', ');
}

/**
 * Format time range for display
 */
function formatTimeRange(start: number, end: number): string {
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  if (start === end) {
    return formatHour(start);
  } else {
    return `${formatHour(start)}-${formatHour(end + 1)}`;
  }
}