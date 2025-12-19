/**
 * Time Series Analytics Module
 * Handles collection, storage, and analysis of learning data over time
 */

import type { 
  LearningDataPoint, 
  MetricType, 
  CategoryId,
  StudySession 
} from '@/types';

/**
 * Time series data aggregation periods
 */
export type AggregationPeriod = 'hour' | 'day' | 'week' | 'month';

/**
 * Time series aggregate data point
 */
export interface TimeSeriesAggregate {
  readonly period: string; // ISO date string for the period
  readonly metric_type: MetricType;
  readonly count: number;
  readonly sum: number;
  readonly average: number;
  readonly min: number;
  readonly max: number;
  readonly std_deviation: number;
}

/**
 * Learning pattern over time
 */
export interface LearningPattern {
  readonly metric_type: MetricType;
  readonly trend: 'increasing' | 'decreasing' | 'stable';
  readonly trend_strength: number; // 0-1, higher means stronger trend
  readonly seasonal_patterns: SeasonalPattern[];
  readonly anomalies: DataAnomaly[];
  readonly correlation_score: number; // -1 to 1, correlation with success metrics
}

/**
 * Seasonal pattern in learning data
 */
export interface SeasonalPattern {
  readonly pattern_type: 'daily' | 'weekly' | 'monthly';
  readonly peak_periods: string[];
  readonly low_periods: string[];
  readonly confidence: number; // 0-1
}

/**
 * Data anomaly detection result
 */
export interface DataAnomaly {
  readonly timestamp: string;
  readonly value: number;
  readonly expected_value: number;
  readonly deviation: number;
  readonly severity: 'low' | 'medium' | 'high';
  readonly possible_causes: string[];
}

/**
 * Time range for analytics queries
 */
export interface TimeRange {
  readonly start: string; // ISO date string
  readonly end: string;   // ISO date string
}

/**
 * Metric correlation analysis
 */
export interface MetricCorrelation {
  readonly metric1: MetricType;
  readonly metric2: MetricType;
  readonly correlation: number; // -1 to 1
  readonly significance: number; // 0-1
  readonly sample_size: number;
}

// ============================================================================
// Time Series Data Processing Functions
// ============================================================================

/**
 * Aggregate learning data points by time period
 */
export function aggregateDataByPeriod(
  dataPoints: LearningDataPoint[],
  metricType: MetricType,
  period: AggregationPeriod
): TimeSeriesAggregate[] {
  if (dataPoints.length === 0) return [];

  // Filter by metric type
  const filteredPoints = dataPoints.filter(point => point.metric_type === metricType);
  if (filteredPoints.length === 0) return [];

  // Group by period
  const grouped = filteredPoints.reduce((acc, point) => {
    const periodKey = getPeriodKey(point.timestamp, period);
    if (!acc[periodKey]) {
      acc[periodKey] = [];
    }
    acc[periodKey].push(point.value);
    return acc;
  }, {} as Record<string, number[]>);

  // Calculate aggregates for each period
  return Object.entries(grouped)
    .map(([periodKey, values]) => {
      const sum = values.reduce((total, val) => total + val, 0);
      const average = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Calculate standard deviation
      const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
      const stdDeviation = Math.sqrt(variance);

      return {
        period: periodKey,
        metric_type: metricType,
        count: values.length,
        sum,
        average: Math.round(average * 10000) / 10000,
        min,
        max,
        std_deviation: Math.round(stdDeviation * 10000) / 10000,
      };
    })
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get period key for aggregation
 */
function getPeriodKey(timestamp: string, period: AggregationPeriod): string {
  const date = new Date(timestamp);
  
  switch (period) {
    case 'hour':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00:00Z`;
    case 'day':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    case 'week':
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      return `${startOfWeek.getFullYear()}-W${String(getWeekNumber(startOfWeek)).padStart(2, '0')}`;
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    default:
      return timestamp.split('T')[0];
  }
}

/**
 * Get week number of the year
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Analyze learning patterns over time
 */
export function analyzeLearningPatterns(
  dataPoints: LearningDataPoint[],
  timeRange?: TimeRange
): LearningPattern[] {
  const patterns: LearningPattern[] = [];
  
  // Filter by time range if provided
  const filteredData = timeRange 
    ? dataPoints.filter(point => {
        const timestamp = new Date(point.timestamp);
        return timestamp >= new Date(timeRange.start) && timestamp <= new Date(timeRange.end);
      })
    : dataPoints;

  // Analyze each metric type
  const metricTypes = [...new Set(filteredData.map(point => point.metric_type))];
  
  for (const metricType of metricTypes) {
    const metricData = filteredData.filter(point => point.metric_type === metricType);
    
    if (metricData.length < 10) continue; // Need minimum data for analysis
    
    const pattern = analyzeMetricPattern(metricData, metricType);
    patterns.push(pattern);
  }
  
  return patterns;
}

/**
 * Analyze pattern for a specific metric
 */
function analyzeMetricPattern(
  dataPoints: LearningDataPoint[],
  metricType: MetricType
): LearningPattern {
  // Sort by timestamp
  const sortedData = dataPoints.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Calculate trend
  const trend = calculateTrend(sortedData.map(d => d.value));
  
  // Detect seasonal patterns
  const seasonalPatterns = detectSeasonalPatterns(sortedData);
  
  // Detect anomalies
  const anomalies = detectAnomalies(sortedData);
  
  // Calculate correlation with success metrics
  const correlation = calculateSuccessCorrelation(sortedData, metricType);
  
  return {
    metric_type: metricType,
    trend: trend.direction,
    trend_strength: trend.strength,
    seasonal_patterns: seasonalPatterns,
    anomalies,
    correlation_score: correlation,
  };
}

/**
 * Calculate trend direction and strength
 */
function calculateTrend(values: number[]): { direction: 'increasing' | 'decreasing' | 'stable'; strength: number } {
  if (values.length < 2) return { direction: 'stable', strength: 0 };
  
  // Linear regression to find trend
  const n = values.length;
  const xSum = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ..., n-1
  const ySum = values.reduce((sum, val) => sum + val, 0);
  const xySum = values.reduce((sum, val, index) => sum + (val * index), 0);
  const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
  
  const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
  
  // Calculate correlation coefficient (R²)
  const yMean = ySum / n;
  const yVariance = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const correlation = Math.abs(slope) / Math.sqrt(yVariance / n);
  
  const direction = slope > 0.01 ? 'increasing' : 
                   slope < -0.01 ? 'decreasing' : 'stable';
  
  const strength = Math.min(1, Math.abs(correlation));
  
  return { direction, strength };
}

/**
 * Detect seasonal patterns in the data
 */
function detectSeasonalPatterns(dataPoints: LearningDataPoint[]): SeasonalPattern[] {
  const patterns: SeasonalPattern[] = [];
  
  // Daily patterns (hours of day)
  const hourlyData = groupByHour(dataPoints);
  if (Object.keys(hourlyData).length >= 8) { // Need data from multiple hours
    const dailyPattern = analyzeDailyPattern(hourlyData);
    if (dailyPattern) patterns.push(dailyPattern);
  }
  
  // Weekly patterns (days of week)
  const dailyData = groupByDayOfWeek(dataPoints);
  if (Object.keys(dailyData).length >= 5) { // Need data from multiple days
    const weeklyPattern = analyzeWeeklyPattern(dailyData);
    if (weeklyPattern) patterns.push(weeklyPattern);
  }
  
  return patterns;
}

/**
 * Group data points by hour of day
 */
function groupByHour(dataPoints: LearningDataPoint[]): Record<number, number[]> {
  return dataPoints.reduce((acc, point) => {
    const hour = new Date(point.timestamp).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(point.value);
    return acc;
  }, {} as Record<number, number[]>);
}

/**
 * Group data points by day of week
 */
function groupByDayOfWeek(dataPoints: LearningDataPoint[]): Record<number, number[]> {
  return dataPoints.reduce((acc, point) => {
    const dayOfWeek = new Date(point.timestamp).getDay();
    if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
    acc[dayOfWeek].push(point.value);
    return acc;
  }, {} as Record<number, number[]>);
}

/**
 * Analyze daily pattern (hourly performance)
 */
function analyzeDailyPattern(hourlyData: Record<number, number[]>): SeasonalPattern | null {
  const hourAverages = Object.entries(hourlyData).map(([hour, values]) => ({
    hour: parseInt(hour),
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length,
  }));
  
  // Find peak and low periods
  const sortedByAverage = [...hourAverages].sort((a, b) => b.average - a.average);
  const threshold = 0.8; // Top/bottom 80% percentile
  
  const peakCount = Math.max(1, Math.floor(hourAverages.length * (1 - threshold)));
  const lowCount = Math.max(1, Math.floor(hourAverages.length * threshold));
  
  const peakPeriods = sortedByAverage.slice(0, peakCount).map(h => `${h.hour}:00`);
  const lowPeriods = sortedByAverage.slice(-lowCount).map(h => `${h.hour}:00`);
  
  // Calculate confidence based on variance
  const allAverages = hourAverages.map(h => h.average);
  const mean = allAverages.reduce((sum, val) => sum + val, 0) / allAverages.length;
  const variance = allAverages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allAverages.length;
  const confidence = Math.min(1, variance > 0 ? 1 - (1 / (1 + variance)) : 0.5);
  
  return {
    pattern_type: 'daily',
    peak_periods: peakPeriods,
    low_periods: lowPeriods,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Analyze weekly pattern (daily performance)
 */
function analyzeWeeklyPattern(dailyData: Record<number, number[]>): SeasonalPattern | null {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const dayAverages = Object.entries(dailyData).map(([day, values]) => ({
    day: parseInt(day),
    dayName: dayNames[parseInt(day)],
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length,
  }));
  
  const sortedByAverage = [...dayAverages].sort((a, b) => b.average - a.average);
  
  const peakPeriods = sortedByAverage.slice(0, 2).map(d => d.dayName);
  const lowPeriods = sortedByAverage.slice(-2).map(d => d.dayName);
  
  const allAverages = dayAverages.map(d => d.average);
  const mean = allAverages.reduce((sum, val) => sum + val, 0) / allAverages.length;
  const variance = allAverages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allAverages.length;
  const confidence = Math.min(1, variance > 0 ? variance / mean : 0.3);
  
  return {
    pattern_type: 'weekly',
    peak_periods: peakPeriods,
    low_periods: lowPeriods,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Detect anomalies in the data
 */
function detectAnomalies(dataPoints: LearningDataPoint[]): DataAnomaly[] {
  if (dataPoints.length < 10) return [];
  
  const values = dataPoints.map(d => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  
  const anomalies: DataAnomaly[] = [];
  
  dataPoints.forEach((point) => {
    const deviation = Math.abs(point.value - mean);
    const zScore = stdDev > 0 ? deviation / stdDev : 0;
    
    if (zScore > 2) { // More than 2 standard deviations
      const severity = zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
      
      anomalies.push({
        timestamp: point.timestamp,
        value: point.value,
        expected_value: mean,
        deviation,
        severity,
        possible_causes: generateAnomalyCauses(point, mean),
      });
    }
  });
  
  return anomalies;
}

/**
 * Generate possible causes for anomalies
 */
function generateAnomalyCauses(point: LearningDataPoint, mean: number): string[] {
  const causes: string[] = [];
  const hour = new Date(point.timestamp).getHours();
  
  if (point.value > mean * 2) {
    causes.push('Exceptional performance session');
    if (hour >= 9 && hour <= 11) causes.push('Morning focus peak');
    if (point.metadata?.category_id) causes.push('Strong category performance');
  } else if (point.value < mean * 0.5) {
    causes.push('Below average performance');
    if (hour >= 22 || hour <= 6) causes.push('Late night/early morning fatigue');
    if (point.metadata?.rushed) causes.push('Rushed session');
  }
  
  return causes;
}

/**
 * Calculate correlation with success metrics
 */
function calculateSuccessCorrelation(
  dataPoints: LearningDataPoint[], 
  metricType: MetricType
): number {
  // This is a simplified correlation calculation
  // In a real implementation, we'd correlate with actual success metrics
  
  if (metricType === 'accuracy_rate') return 0.8; // High positive correlation
  if (metricType === 'response_time') return -0.3; // Slight negative correlation
  if (metricType === 'session_duration') return 0.4; // Moderate positive correlation
  
  return 0; // No correlation by default
}

/**
 * Calculate correlations between different metrics
 */
export function calculateMetricCorrelations(
  dataPoints: LearningDataPoint[]
): MetricCorrelation[] {
  const correlations: MetricCorrelation[] = [];
  const metricTypes = [...new Set(dataPoints.map(d => d.metric_type))];
  
  // Calculate correlations for each pair of metrics
  for (let i = 0; i < metricTypes.length; i++) {
    for (let j = i + 1; j < metricTypes.length; j++) {
      const metric1 = metricTypes[i];
      const metric2 = metricTypes[j];
      
      const data1 = dataPoints.filter(d => d.metric_type === metric1);
      const data2 = dataPoints.filter(d => d.metric_type === metric2);
      
      // Find overlapping time periods
      const correlation = calculatePearsonCorrelation(data1, data2);
      if (correlation !== null) {
        correlations.push({
          metric1,
          metric2,
          correlation: correlation.correlation,
          significance: correlation.significance,
          sample_size: correlation.sampleSize,
        });
      }
    }
  }
  
  return correlations;
}

/**
 * Calculate Pearson correlation between two metric time series
 */
function calculatePearsonCorrelation(
  data1: LearningDataPoint[], 
  data2: LearningDataPoint[]
): { correlation: number; significance: number; sampleSize: number } | null {
  
  if (data1.length < 5 || data2.length < 5) return null;
  
  // Group by hour for correlation (simplified)
  const hours1 = groupDataByHour(data1);
  const hours2 = groupDataByHour(data2);
  
  // Find common hours
  const commonHours = Object.keys(hours1).filter(hour => hours2[hour]);
  if (commonHours.length < 3) return null;
  
  const values1 = commonHours.map(hour => hours1[hour]);
  const values2 = commonHours.map(hour => hours2[hour]);
  
  const correlation = pearsonCorrelation(values1, values2);
  const significance = Math.min(1, commonHours.length / 30); // Rough significance estimate
  
  return {
    correlation: Math.round(correlation * 10000) / 10000,
    significance: Math.round(significance * 100) / 100,
    sampleSize: commonHours.length,
  };
}

/**
 * Group data by hour and average values
 */
function groupDataByHour(dataPoints: LearningDataPoint[]): Record<string, number> {
  const grouped = dataPoints.reduce((acc, point) => {
    const hour = point.timestamp.substring(0, 13); // YYYY-MM-DDTHH
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(point.value);
    return acc;
  }, {} as Record<string, number[]>);
  
  // Average values for each hour
  return Object.entries(grouped).reduce((acc, [hour, values]) => {
    acc[hour] = values.reduce((sum, val) => sum + val, 0) / values.length;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}