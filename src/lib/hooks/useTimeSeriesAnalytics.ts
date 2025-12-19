/**
 * Time Series Analytics Hook
 * Provides real-time collection and analysis of learning data over time
 */

import { useCallback, useMemo, useRef } from 'react';
import { useUserProgressStore } from '@/stores/userProgressStore';
import {
  aggregateDataByPeriod,
  analyzeLearningPatterns,
  calculateMetricCorrelations,
  type AggregationPeriod,
  type TimeSeriesAggregate,
  type LearningPattern,
  type MetricCorrelation,
  type TimeRange,
  type DataAnomaly,
} from '@/lib/analytics/timeSeriesAnalytics';
import type { LearningDataPoint, MetricType } from '@/types';

/**
 * Analytics collection configuration
 */
export interface AnalyticsConfig {
  /** Enable automatic data collection */
  enabled: boolean;
  /** Sampling rate (0-1, 1 = collect all data) */
  samplingRate: number;
  /** Batch size for processing */
  batchSize: number;
  /** Maximum data points to keep in memory */
  maxDataPoints: number;
}

/**
 * Real-time analytics insights
 */
export interface RealTimeInsights {
  /** Current session performance trend */
  sessionTrend: 'improving' | 'declining' | 'stable';
  /** Detected patterns in current session */
  currentPatterns: string[];
  /** Performance compared to historical average */
  performanceVsAverage: number; // -1 to 1
  /** Recommended actions */
  recommendations: string[];
}

/**
 * Data collection statistics
 */
export interface CollectionStats {
  /** Total data points collected */
  totalDataPoints: number;
  /** Data points by metric type */
  metricCounts: Record<MetricType, number>;
  /** Collection rate (points per hour) */
  collectionRate: number;
  /** Last collection timestamp */
  lastCollection: string;
  /** Data quality score (0-1) */
  dataQuality: number;
}

/**
 * Default analytics configuration
 */
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  samplingRate: 1.0,
  batchSize: 50,
  maxDataPoints: 10000,
};

/**
 * Hook for time-series analytics management
 */
export function useTimeSeriesAnalytics(config: Partial<AnalyticsConfig> = {}) {
  const store = useUserProgressStore();
  const actions = useUserProgressStore((state) => state.actions);
  
  const { learning_data } = store;
  
  // Merge config with defaults
  const analyticsConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  // Session tracking for real-time insights
  const sessionDataRef = useRef<LearningDataPoint[]>([]);
  const sessionStartRef = useRef<number>(Date.now());

  /**
   * Collect a data point with automatic sampling
   */
  const collectDataPoint = useCallback(
    (metricType: MetricType, value: number, metadata?: Record<string, unknown>) => {
      if (!analyticsConfig.enabled) return;
      
      // Apply sampling rate
      if (Math.random() > analyticsConfig.samplingRate) return;
      
      // Record the data point
      actions.recordLearningData(metricType, value, metadata);
      
      // Add to session tracking
      const dataPoint: LearningDataPoint = {
        timestamp: new Date().toISOString(),
        metric_type: metricType,
        value,
        metadata,
      };
      
      sessionDataRef.current.push(dataPoint);
      
      // Limit session data
      if (sessionDataRef.current.length > analyticsConfig.batchSize) {
        sessionDataRef.current = sessionDataRef.current.slice(-analyticsConfig.batchSize);
      }
    },
    [actions, analyticsConfig]
  );

  /**
   * Start a new analytics session
   */
  const startSession = useCallback(() => {
    sessionDataRef.current = [];
    sessionStartRef.current = Date.now();
  }, []);

  /**
   * End current analytics session and process data
   */
  const endSession = useCallback(() => {
    const sessionData = sessionDataRef.current;
    const sessionDuration = Date.now() - sessionStartRef.current;
    
    // Process session data for insights
    const insights = processSessionInsights(sessionData, sessionDuration);
    
    // Reset session
    sessionDataRef.current = [];
    
    return insights;
  }, []);

  /**
   * Get aggregated data for a specific metric and period
   */
  const getAggregatedData = useCallback(
    (metricType: MetricType, period: AggregationPeriod, timeRange?: TimeRange): TimeSeriesAggregate[] => {
      let data = learning_data;
      
      // Apply time range filter if provided
      if (timeRange) {
        data = data.filter(point => {
          const timestamp = new Date(point.timestamp);
          return timestamp >= new Date(timeRange.start) && timestamp <= new Date(timeRange.end);
        });
      }
      
      return aggregateDataByPeriod(data, metricType, period);
    },
    [learning_data]
  );

  /**
   * Analyze learning patterns
   */
  const getLearningPatterns = useCallback(
    (timeRange?: TimeRange): LearningPattern[] => {
      return analyzeLearningPatterns(learning_data, timeRange);
    },
    [learning_data]
  );

  /**
   * Get metric correlations
   */
  const getMetricCorrelations = useCallback((): MetricCorrelation[] => {
    return calculateMetricCorrelations(learning_data);
  }, [learning_data]);

  /**
   * Get real-time session insights
   */
  const getSessionInsights = useCallback((): RealTimeInsights => {
    const sessionData = sessionDataRef.current;
    const sessionDuration = Date.now() - sessionStartRef.current;
    
    return processSessionInsights(sessionData, sessionDuration);
  }, []);

  /**
   * Get data collection statistics
   */
  const getCollectionStats = useCallback((): CollectionStats => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentData = learning_data.filter(point => 
      new Date(point.timestamp) > oneDayAgo
    );
    
    const metricCounts = learning_data.reduce((acc, point) => {
      acc[point.metric_type] = (acc[point.metric_type] || 0) + 1;
      return acc;
    }, {} as Record<MetricType, number>);
    
    const collectionRate = recentData.length / 24; // Points per hour
    const lastCollection = learning_data.length > 0 
      ? learning_data[learning_data.length - 1].timestamp 
      : '';
    
    // Calculate data quality based on completeness and consistency
    const dataQuality = calculateDataQuality(learning_data);
    
    return {
      totalDataPoints: learning_data.length,
      metricCounts,
      collectionRate: Math.round(collectionRate * 100) / 100,
      lastCollection,
      dataQuality,
    };
  }, [learning_data]);

  /**
   * Export analytics data for external analysis
   */
  const exportData = useCallback(
    (format: 'json' | 'csv' = 'json', timeRange?: TimeRange) => {
      let data = learning_data;
      
      if (timeRange) {
        data = data.filter(point => {
          const timestamp = new Date(point.timestamp);
          return timestamp >= new Date(timeRange.start) && timestamp <= new Date(timeRange.end);
        });
      }
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        return convertToCSV(data);
      }
    },
    [learning_data]
  );

  /**
   * Get anomaly detection results
   */
  const getAnomalies = useCallback(
    (metricType?: MetricType, timeRange?: TimeRange): DataAnomaly[] => {
      const patterns = getLearningPatterns(timeRange);
      
      if (metricType) {
        const pattern = patterns.find(p => p.metric_type === metricType);
        return pattern?.anomalies || [];
      }
      
      return patterns.flatMap(pattern => pattern.anomalies);
    },
    [getLearningPatterns]
  );

  /**
   * Clear old data points to manage memory
   */
  const cleanupOldData = useCallback(
    (daysToKeep: number = 90) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // This would need to be implemented in the store
      // For now, it's just a placeholder
      console.log(`Would cleanup data older than ${cutoffDate.toISOString()}`);
    },
    []
  );

  // Memoized computed values
  const computedAnalytics = useMemo(() => {
    const stats = getCollectionStats();
    const patterns = getLearningPatterns();
    const correlations = getMetricCorrelations();
    
    return {
      stats,
      patterns,
      correlations,
      hasEnoughData: learning_data.length >= 50,
      dataQualityStatus: stats.dataQuality >= 0.8 ? 'good' : 
                        stats.dataQuality >= 0.6 ? 'fair' : 'poor',
    };
  }, [getCollectionStats, getLearningPatterns, getMetricCorrelations, learning_data.length]);

  return {
    // Configuration
    config: analyticsConfig,
    
    // Data collection
    collectDataPoint,
    startSession,
    endSession,
    
    // Data retrieval
    getAggregatedData,
    getLearningPatterns,
    getMetricCorrelations,
    getSessionInsights,
    getCollectionStats,
    getAnomalies,
    
    // Data management
    exportData,
    cleanupOldData,
    
    // Computed values
    totalDataPoints: learning_data.length,
    computedAnalytics,
    
    // Raw data access
    rawData: learning_data,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Process session insights from current session data
 */
function processSessionInsights(
  sessionData: LearningDataPoint[], 
  sessionDuration: number
): RealTimeInsights {
  if (sessionData.length === 0) {
    return {
      sessionTrend: 'stable',
      currentPatterns: [],
      performanceVsAverage: 0,
      recommendations: ['Start practicing to see insights'],
    };
  }
  
  // Analyze session trend
  const accuracyData = sessionData
    .filter(point => point.metric_type === 'accuracy_rate')
    .map(point => point.value);
  
  const sessionTrend = calculateSessionTrend(accuracyData);
  
  // Detect current patterns
  const patterns = detectSessionPatterns(sessionData, sessionDuration);
  
  // Compare to average (simplified)
  const avgAccuracy = accuracyData.length > 0 
    ? accuracyData.reduce((sum, val) => sum + val, 0) / accuracyData.length
    : 0.5;
  
  const performanceVsAverage = (avgAccuracy - 0.7) / 0.3; // Assume 70% historical average
  
  // Generate recommendations
  const recommendations = generateSessionRecommendations(
    sessionTrend, 
    patterns, 
    performanceVsAverage
  );
  
  return {
    sessionTrend,
    currentPatterns: patterns,
    performanceVsAverage: Math.max(-1, Math.min(1, performanceVsAverage)),
    recommendations,
  };
}

/**
 * Calculate session trend from accuracy data
 */
function calculateSessionTrend(accuracyData: number[]): 'improving' | 'declining' | 'stable' {
  if (accuracyData.length < 3) return 'stable';
  
  const firstHalf = accuracyData.slice(0, Math.floor(accuracyData.length / 2));
  const secondHalf = accuracyData.slice(Math.floor(accuracyData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 0.05) return 'improving';
  if (diff < -0.05) return 'declining';
  return 'stable';
}

/**
 * Detect patterns in current session
 */
function detectSessionPatterns(
  sessionData: LearningDataPoint[], 
  sessionDuration: number
): string[] {
  const patterns: string[] = [];
  
  // Check for rapid improvement
  const accuracyData = sessionData
    .filter(point => point.metric_type === 'accuracy_rate')
    .map(point => point.value);
  
  if (accuracyData.length >= 5) {
    const improvement = accuracyData[accuracyData.length - 1] - accuracyData[0];
    if (improvement > 0.2) {
      patterns.push('Rapid improvement detected');
    }
  }
  
  // Check for consistency
  const responseTimeData = sessionData
    .filter(point => point.metric_type === 'response_time')
    .map(point => point.value);
  
  if (responseTimeData.length >= 3) {
    const avgResponseTime = responseTimeData.reduce((sum, val) => sum + val, 0) / responseTimeData.length;
    const variance = responseTimeData.reduce((sum, val) => sum + Math.pow(val - avgResponseTime, 2), 0) / responseTimeData.length;
    
    if (variance < avgResponseTime * 0.1) {
      patterns.push('Consistent response timing');
    }
  }
  
  // Check for session length
  const minutes = sessionDuration / (1000 * 60);
  if (minutes > 20) {
    patterns.push('Extended focused session');
  } else if (minutes < 5) {
    patterns.push('Quick practice session');
  }
  
  return patterns;
}

/**
 * Generate session recommendations
 */
function generateSessionRecommendations(
  trend: 'improving' | 'declining' | 'stable',
  patterns: string[],
  performanceVsAverage: number
): string[] {
  const recommendations: string[] = [];
  
  if (trend === 'improving') {
    recommendations.push('Great progress! Keep up the momentum');
  } else if (trend === 'declining') {
    recommendations.push('Consider taking a short break');
  }
  
  if (performanceVsAverage > 0.5) {
    recommendations.push('Excellent performance today!');
  } else if (performanceVsAverage < -0.5) {
    recommendations.push('Try reviewing easier words first');
  }
  
  if (patterns.includes('Extended focused session') && trend === 'declining') {
    recommendations.push('You may be getting tired - consider shorter sessions');
  }
  
  if (patterns.includes('Consistent response timing')) {
    recommendations.push('Good focus and rhythm!');
  }
  
  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

/**
 * Calculate data quality score
 */
function calculateDataQuality(data: LearningDataPoint[]): number {
  if (data.length === 0) return 0;
  
  let qualityScore = 1.0;
  
  // Check for data completeness
  const metricTypes = new Set(data.map(d => d.metric_type));
  const expectedMetrics = ['accuracy_rate', 'response_time', 'session_duration'];
  const completeness = metricTypes.size / expectedMetrics.length;
  qualityScore *= completeness;
  
  // Check for data freshness (data from last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentData = data.filter(point => new Date(point.timestamp) > sevenDaysAgo);
  const freshness = Math.min(1, recentData.length / 50); // Expect at least 50 recent points
  qualityScore *= freshness;
  
  // Check for data consistency (no extreme outliers)
  const values = data.map(d => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const outliers = values.filter(val => Math.abs(val - mean) > mean * 2).length;
  const consistency = 1 - (outliers / values.length);
  qualityScore *= consistency;
  
  return Math.max(0, Math.min(1, qualityScore));
}

/**
 * Convert data points to CSV format
 */
function convertToCSV(data: LearningDataPoint[]): string {
  if (data.length === 0) return '';
  
  const headers = ['timestamp', 'metric_type', 'value', 'metadata'];
  const csvRows = [headers.join(',')];
  
  data.forEach(point => {
    const row = [
      point.timestamp,
      point.metric_type,
      point.value.toString(),
      JSON.stringify(point.metadata || {}),
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}