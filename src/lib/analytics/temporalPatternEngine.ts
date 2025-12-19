/**
 * Temporal Learning Pattern Analysis Engine
 * Advanced analysis of learning patterns over time with statistical modeling
 */

import type {
  LearningDataPoint,
  MetricType,
  CategoryId,
  StudySession,
  LearningStyle,
  DifficultyLevel,
} from '@/types';

// ============================================================================
// Core Types for Temporal Analysis
// ============================================================================

export interface TemporalPattern {
  readonly pattern_id: string;
  readonly pattern_type: TemporalPatternType;
  readonly description: string;
  readonly confidence: number; // 0-1
  readonly start_time: string;
  readonly end_time: string;
  readonly frequency: number; // occurrences per day
  readonly significance_score: number; // statistical significance
  readonly metadata: Record<string, unknown>;
}

export type TemporalPatternType =
  | 'daily_rhythm'       // Consistent daily learning patterns
  | 'weekly_cycle'       // Weekly learning cycles
  | 'binge_learning'     // Intensive learning sessions
  | 'micro_sessions'     // Short frequent sessions
  | 'consistency_pattern' // Long-term consistency patterns
  | 'seasonal_drift'     // Changes in learning patterns over months
  | 'performance_wave'   // Performance oscillation patterns
  | 'plateau_breakthrough' // Learning plateau followed by breakthrough;

export interface LearningRhythm {
  readonly optimal_hours: number[]; // Hours of day (0-23)
  readonly peak_performance_window: TimeWindow;
  readonly energy_decline_pattern: EnergyPattern;
  readonly consistency_score: number; // 0-1
  readonly rhythm_strength: number; // 0-1
}

export interface TimeWindow {
  readonly start_hour: number;
  readonly end_hour: number;
  readonly performance_multiplier: number; // Relative performance during this window
}

export interface EnergyPattern {
  readonly peak_hours: number[];
  readonly decline_hours: number[];
  readonly recovery_hours: number[];
  readonly fatigue_threshold: number; // Minutes before fatigue sets in
}

export interface LearningCycle {
  readonly cycle_type: 'daily' | 'weekly' | 'monthly';
  readonly cycle_length: number; // In days
  readonly phases: CyclePhase[];
  readonly predictability: number; // 0-1
}

export interface CyclePhase {
  readonly phase_name: string;
  readonly duration_days: number;
  readonly characteristics: string[];
  readonly performance_trend: 'increasing' | 'decreasing' | 'stable';
}

export interface LearningMomentum {
  readonly current_streak_strength: number; // 0-1
  readonly momentum_direction: 'building' | 'maintaining' | 'declining';
  readonly predicted_continuation: number; // Days likely to continue current pattern
  readonly breakthrough_probability: number; // 0-1
  readonly plateau_risk: number; // 0-1
}

export interface PerformanceWave {
  readonly wave_id: string;
  readonly amplitude: number; // Performance variation range
  readonly period: number; // Days per complete cycle
  readonly phase_offset: number; // Current position in cycle (0-1)
  readonly trend: 'improving' | 'declining' | 'stable';
  readonly next_peak: string; // Predicted date
  readonly next_trough: string; // Predicted date
}

// ============================================================================
// Temporal Pattern Analysis Engine
// ============================================================================

export class TemporalPatternEngine {
  private readonly analysisWindow: number = 90; // Days to analyze
  private readonly minDataPoints: number = 50; // Minimum data points for analysis
  private readonly confidenceThreshold: number = 0.7;

  /**
   * Analyze all temporal patterns in learning data
   */
  public analyzeTemporalPatterns(
    learningData: LearningDataPoint[],
    studySessions: StudySession[]
  ): TemporalPattern[] {
    if (learningData.length < this.minDataPoints) {
      return [];
    }

    const patterns: TemporalPattern[] = [];

    // Analyze daily rhythms
    patterns.push(...this.analyzeDailyRhythms(learningData));

    // Analyze weekly cycles  
    patterns.push(...this.analyzeWeeklyCycles(learningData));

    // Analyze learning session patterns
    patterns.push(...this.analyzeSessionPatterns(studySessions));

    // Analyze performance waves
    patterns.push(...this.analyzePerformanceWaves(learningData));

    // Analyze consistency patterns
    patterns.push(...this.analyzeConsistencyPatterns(learningData));

    return patterns.filter(pattern => pattern.confidence >= this.confidenceThreshold);
  }

  /**
   * Detect daily learning rhythms
   */
  public analyzeDailyRhythms(learningData: LearningDataPoint[]): TemporalPattern[] {
    const hourlyPerformance = this.groupByHour(learningData);
    
    if (Object.keys(hourlyPerformance).length < 8) {
      return [];
    }

    const patterns: TemporalPattern[] = [];

    // Find peak performance hours
    const sortedHours = Object.entries(hourlyPerformance)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgPerformance: this.calculateAveragePerformance(data),
        dataPoints: data.length,
      }))
      .filter(entry => entry.dataPoints >= 5) // Minimum data points per hour
      .sort((a, b) => b.avgPerformance - a.avgPerformance);

    if (sortedHours.length >= 3) {
      const topHours = sortedHours.slice(0, 3);
      const confidenceScore = this.calculateRhythmConfidence(hourlyPerformance);

      if (confidenceScore >= 0.6) {
        patterns.push({
          pattern_id: `daily_rhythm_${Date.now()}`,
          pattern_type: 'daily_rhythm',
          description: `Peak performance hours: ${topHours.map(h => h.hour + ':00').join(', ')}`,
          confidence: confidenceScore,
          start_time: this.getEarliestTimestamp(learningData),
          end_time: this.getLatestTimestamp(learningData),
          frequency: this.calculateDailyFrequency(learningData),
          significance_score: confidenceScore,
          metadata: {
            peak_hours: topHours.map(h => h.hour),
            performance_scores: topHours.map(h => h.avgPerformance),
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze weekly learning cycles
   */
  public analyzeWeeklyCycles(learningData: LearningDataPoint[]): TemporalPattern[] {
    const weeklyData = this.groupByDayOfWeek(learningData);
    const patterns: TemporalPattern[] = [];

    if (Object.keys(weeklyData).length >= 5) {
      const dayPerformance = Object.entries(weeklyData).map(([day, data]) => ({
        day: parseInt(day),
        dayName: this.getDayName(parseInt(day)),
        avgPerformance: this.calculateAveragePerformance(data),
        sessionCount: data.length,
      }));

      const variance = this.calculateVariance(dayPerformance.map(d => d.avgPerformance));
      
      if (variance > 0.1) { // Significant variation across days
        const bestDay = dayPerformance.reduce((best, current) => 
          current.avgPerformance > best.avgPerformance ? current : best
        );
        
        const worstDay = dayPerformance.reduce((worst, current) => 
          current.avgPerformance < worst.avgPerformance ? current : worst
        );

        patterns.push({
          pattern_id: `weekly_cycle_${Date.now()}`,
          pattern_type: 'weekly_cycle',
          description: `Best day: ${bestDay.dayName}, Challenging day: ${worstDay.dayName}`,
          confidence: Math.min(0.9, variance * 2),
          start_time: this.getEarliestTimestamp(learningData),
          end_time: this.getLatestTimestamp(learningData),
          frequency: this.calculateWeeklyFrequency(learningData),
          significance_score: variance,
          metadata: {
            day_performance: dayPerformance,
            performance_variance: variance,
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze session pattern types
   */
  public analyzeSessionPatterns(studySessions: StudySession[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    if (studySessions.length < 20) return patterns;

    // Analyze session durations
    const durations = studySessions.map(s => s.duration_minutes);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    // Classify session patterns
    const microSessions = studySessions.filter(s => s.duration_minutes <= 5);
    const bingeSessions = studySessions.filter(s => s.duration_minutes >= 30);
    
    // Micro sessions pattern
    if (microSessions.length / studySessions.length > 0.4) {
      patterns.push({
        pattern_id: `micro_sessions_${Date.now()}`,
        pattern_type: 'micro_sessions',
        description: `${Math.round((microSessions.length / studySessions.length) * 100)}% micro sessions (≤5 min)`,
        confidence: 0.8,
        start_time: studySessions[0].date,
        end_time: studySessions[studySessions.length - 1].date,
        frequency: microSessions.length / this.getDaySpan(studySessions),
        significance_score: microSessions.length / studySessions.length,
        metadata: {
          micro_session_count: microSessions.length,
          avg_micro_duration: microSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / microSessions.length,
        },
      });
    }

    // Binge learning pattern
    if (bingeSessions.length / studySessions.length > 0.15) {
      patterns.push({
        pattern_id: `binge_learning_${Date.now()}`,
        pattern_type: 'binge_learning',
        description: `${Math.round((bingeSessions.length / studySessions.length) * 100)}% extended sessions (≥30 min)`,
        confidence: 0.8,
        start_time: studySessions[0].date,
        end_time: studySessions[studySessions.length - 1].date,
        frequency: bingeSessions.length / this.getDaySpan(studySessions),
        significance_score: bingeSessions.length / studySessions.length,
        metadata: {
          binge_session_count: bingeSessions.length,
          avg_binge_duration: bingeSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / bingeSessions.length,
        },
      });
    }

    return patterns;
  }

  /**
   * Analyze performance wave patterns
   */
  public analyzePerformanceWaves(learningData: LearningDataPoint[]): TemporalPattern[] {
    const accuracyData = learningData
      .filter(d => d.metric_type === 'accuracy_rate')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (accuracyData.length < 30) return [];

    const patterns: TemporalPattern[] = [];
    
    // Smooth data using moving average
    const smoothedData = this.applyMovingAverage(accuracyData.map(d => d.value), 7);
    
    // Detect cycles using FFT-like analysis (simplified)
    const cycles = this.detectPerformanceCycles(smoothedData, accuracyData);
    
    cycles.forEach(cycle => {
      if (cycle.confidence > 0.6) {
        patterns.push({
          pattern_id: `performance_wave_${Date.now()}_${cycle.period}`,
          pattern_type: 'performance_wave',
          description: `Performance oscillates with ${cycle.period}-day period`,
          confidence: cycle.confidence,
          start_time: accuracyData[0].timestamp,
          end_time: accuracyData[accuracyData.length - 1].timestamp,
          frequency: 1 / cycle.period,
          significance_score: cycle.amplitude,
          metadata: {
            period_days: cycle.period,
            amplitude: cycle.amplitude,
            next_peak_estimate: cycle.nextPeak,
          },
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze learning consistency patterns
   */
  public analyzeConsistencyPatterns(learningData: LearningDataPoint[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Group by day and calculate daily engagement
    const dailyData = this.groupByDay(learningData);
    const dailyEngagement = Object.entries(dailyData).map(([date, data]) => ({
      date,
      dataPoints: data.length,
      avgPerformance: this.calculateAveragePerformance(data),
    }));

    // Calculate consistency metrics
    const engagementVariance = this.calculateVariance(dailyEngagement.map(d => d.dataPoints));
    const performanceVariance = this.calculateVariance(dailyEngagement.map(d => d.avgPerformance));
    
    // High consistency pattern
    if (engagementVariance < 5 && dailyEngagement.length >= 14) {
      patterns.push({
        pattern_id: `consistency_${Date.now()}`,
        pattern_type: 'consistency_pattern',
        description: 'Highly consistent daily learning engagement',
        confidence: 0.9,
        start_time: this.getEarliestTimestamp(learningData),
        end_time: this.getLatestTimestamp(learningData),
        frequency: dailyEngagement.length / this.getDaySpanFromData(learningData),
        significance_score: 1 - (engagementVariance / 20), // Normalized consistency score
        metadata: {
          engagement_variance: engagementVariance,
          performance_variance: performanceVariance,
          avg_daily_sessions: dailyEngagement.reduce((sum, d) => sum + d.dataPoints, 0) / dailyEngagement.length,
        },
      });
    }

    return patterns;
  }

  // ============================================================================
  // Learning Rhythm Analysis
  // ============================================================================

  /**
   * Analyze detailed learning rhythm patterns
   */
  public analyzeLearningRhythm(learningData: LearningDataPoint[]): LearningRhythm {
    const hourlyData = this.groupByHour(learningData);
    
    // Calculate optimal hours
    const hourlyStats = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      avgPerformance: this.calculateAveragePerformance(data),
      dataCount: data.length,
    })).filter(stat => stat.dataCount >= 3);

    const sortedByPerformance = hourlyStats.sort((a, b) => b.avgPerformance - a.avgPerformance);
    const optimalHours = sortedByPerformance.slice(0, 4).map(stat => stat.hour);

    // Identify peak performance window
    const peakWindow = this.identifyPeakWindow(hourlyStats);
    
    // Analyze energy patterns
    const energyPattern = this.analyzeEnergyPattern(hourlyStats);
    
    // Calculate rhythm strength
    const rhythmStrength = this.calculateRhythmStrength(hourlyStats);
    
    // Calculate consistency score
    const consistencyScore = this.calculateTimeConsistency(learningData);

    return {
      optimal_hours: optimalHours,
      peak_performance_window: peakWindow,
      energy_decline_pattern: energyPattern,
      consistency_score: consistencyScore,
      rhythm_strength: rhythmStrength,
    };
  }

  /**
   * Detect learning momentum and predict future patterns
   */
  public analyzeLearningMomentum(
    learningData: LearningDataPoint[],
    studySessions: StudySession[]
  ): LearningMomentum {
    const recentData = this.getRecentData(learningData, 14); // Last 2 weeks
    const recentSessions = this.getRecentSessions(studySessions, 14);
    
    // Calculate current streak strength
    const streakStrength = this.calculateStreakStrength(recentSessions);
    
    // Determine momentum direction
    const momentumDirection = this.calculateMomentumDirection(recentData);
    
    // Predict continuation probability
    const continuationDays = this.predictContinuation(recentData, recentSessions);
    
    // Calculate breakthrough probability
    const breakthroughProb = this.calculateBreakthroughProbability(learningData);
    
    // Calculate plateau risk
    const plateauRisk = this.calculatePlateauRisk(learningData);

    return {
      current_streak_strength: streakStrength,
      momentum_direction: momentumDirection,
      predicted_continuation: continuationDays,
      breakthrough_probability: breakthroughProb,
      plateau_risk: plateauRisk,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private groupByHour(data: LearningDataPoint[]): Record<number, LearningDataPoint[]> {
    return data.reduce((acc, point) => {
      const hour = new Date(point.timestamp).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(point);
      return acc;
    }, {} as Record<number, LearningDataPoint[]>);
  }

  private groupByDayOfWeek(data: LearningDataPoint[]): Record<number, LearningDataPoint[]> {
    return data.reduce((acc, point) => {
      const day = new Date(point.timestamp).getDay();
      if (!acc[day]) acc[day] = [];
      acc[day].push(point);
      return acc;
    }, {} as Record<number, LearningDataPoint[]>);
  }

  private groupByDay(data: LearningDataPoint[]): Record<string, LearningDataPoint[]> {
    return data.reduce((acc, point) => {
      const day = point.timestamp.split('T')[0];
      if (!acc[day]) acc[day] = [];
      acc[day].push(point);
      return acc;
    }, {} as Record<string, LearningDataPoint[]>);
  }

  private calculateAveragePerformance(data: LearningDataPoint[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((total, point) => {
      if (point.metric_type === 'accuracy_rate') return total + point.value;
      if (point.metric_type === 'response_time') return total + (1 / Math.max(point.value, 1)); // Inverse for time
      return total + point.value;
    }, 0);
    return sum / data.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private calculateRhythmConfidence(hourlyData: Record<number, LearningDataPoint[]>): number {
    const hours = Object.keys(hourlyData).map(h => parseInt(h));
    const performances = hours.map(h => this.calculateAveragePerformance(hourlyData[h]));
    const variance = this.calculateVariance(performances);
    return Math.min(0.9, variance * 2); // Higher variance = higher confidence in rhythm pattern
  }

  private getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  private calculateDailyFrequency(data: LearningDataPoint[]): number {
    const daySpan = this.getDaySpanFromData(data);
    return data.length / daySpan;
  }

  private calculateWeeklyFrequency(data: LearningDataPoint[]): number {
    const weekSpan = this.getDaySpanFromData(data) / 7;
    return data.length / weekSpan;
  }

  private getEarliestTimestamp(data: LearningDataPoint[]): string {
    return data.reduce((earliest, point) => 
      point.timestamp < earliest ? point.timestamp : earliest, 
      data[0]?.timestamp || new Date().toISOString()
    );
  }

  private getLatestTimestamp(data: LearningDataPoint[]): string {
    return data.reduce((latest, point) => 
      point.timestamp > latest ? point.timestamp : latest, 
      data[0]?.timestamp || new Date().toISOString()
    );
  }

  private getDaySpan(sessions: StudySession[]): number {
    if (sessions.length === 0) return 1;
    const earliest = new Date(sessions[0].date);
    const latest = new Date(sessions[sessions.length - 1].date);
    return Math.max(1, Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private getDaySpanFromData(data: LearningDataPoint[]): number {
    if (data.length === 0) return 1;
    const earliest = new Date(this.getEarliestTimestamp(data));
    const latest = new Date(this.getLatestTimestamp(data));
    return Math.max(1, Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private applyMovingAverage(values: number[], windowSize: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1);
      const window = values.slice(start, end);
      result.push(window.reduce((sum, val) => sum + val, 0) / window.length);
    }
    return result;
  }

  private detectPerformanceCycles(smoothedData: number[], rawData: LearningDataPoint[]): Array<{
    period: number;
    amplitude: number;
    confidence: number;
    nextPeak: string;
  }> {
    // Simplified cycle detection - in production would use proper spectral analysis
    const cycles: Array<{
      period: number;
      amplitude: number;
      confidence: number;
      nextPeak: string;
    }> = [];

    for (let period = 5; period <= 30; period += 2) {
      const correlation = this.calculateAutoCorrelation(smoothedData, period);
      if (correlation > 0.5) {
        const amplitude = this.calculateVariance(smoothedData);
        cycles.push({
          period,
          amplitude,
          confidence: correlation,
          nextPeak: this.predictNextPeak(rawData, period),
        });
      }
    }

    return cycles.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  private calculateAutoCorrelation(data: number[], lag: number): number {
    if (lag >= data.length) return 0;
    
    const n = data.length - lag;
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    for (let i = 0; i < data.length; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }
    
    return denominator !== 0 ? numerator / denominator : 0;
  }

  private predictNextPeak(data: LearningDataPoint[], period: number): string {
    const now = new Date();
    const nextPeakDate = new Date(now.getTime() + period * 24 * 60 * 60 * 1000);
    return nextPeakDate.toISOString();
  }

  private identifyPeakWindow(hourlyStats: Array<{ hour: number; avgPerformance: number; dataCount: number }>): TimeWindow {
    if (hourlyStats.length === 0) {
      return { start_hour: 9, end_hour: 11, performance_multiplier: 1.0 };
    }

    const sortedStats = [...hourlyStats].sort((a, b) => b.avgPerformance - a.avgPerformance);
    const topPerformers = sortedStats.slice(0, Math.min(3, sortedStats.length));
    
    const hours = topPerformers.map(s => s.hour).sort((a, b) => a - b);
    const startHour = Math.min(...hours);
    const endHour = Math.max(...hours) + 1;
    
    const avgTopPerformance = topPerformers.reduce((sum, s) => sum + s.avgPerformance, 0) / topPerformers.length;
    const avgAllPerformance = hourlyStats.reduce((sum, s) => sum + s.avgPerformance, 0) / hourlyStats.length;
    const multiplier = avgAllPerformance > 0 ? avgTopPerformance / avgAllPerformance : 1.0;

    return {
      start_hour: startHour,
      end_hour: endHour,
      performance_multiplier: Math.min(2.0, multiplier),
    };
  }

  private analyzeEnergyPattern(hourlyStats: Array<{ hour: number; avgPerformance: number; dataCount: number }>): EnergyPattern {
    const sortedByPerformance = [...hourlyStats].sort((a, b) => b.avgPerformance - a.avgPerformance);
    
    const peakHours = sortedByPerformance.slice(0, Math.ceil(hourlyStats.length * 0.3)).map(s => s.hour);
    const declineHours = sortedByPerformance.slice(-Math.ceil(hourlyStats.length * 0.3)).map(s => s.hour);
    const recoveryHours = sortedByPerformance.slice(
      Math.ceil(hourlyStats.length * 0.3),
      Math.ceil(hourlyStats.length * 0.7)
    ).map(s => s.hour);

    return {
      peak_hours: peakHours,
      decline_hours: declineHours,
      recovery_hours: recoveryHours,
      fatigue_threshold: 45, // Default threshold in minutes
    };
  }

  private calculateRhythmStrength(hourlyStats: Array<{ hour: number; avgPerformance: number; dataCount: number }>): number {
    if (hourlyStats.length < 3) return 0;
    
    const performances = hourlyStats.map(s => s.avgPerformance);
    const variance = this.calculateVariance(performances);
    const mean = performances.reduce((sum, p) => sum + p, 0) / performances.length;
    
    // Higher variance relative to mean indicates stronger rhythm
    return Math.min(0.9, variance / Math.max(mean, 0.1));
  }

  private calculateTimeConsistency(data: LearningDataPoint[]): number {
    const dailyData = this.groupByDay(data);
    const dailyCounts = Object.values(dailyData).map(dayData => dayData.length);
    
    if (dailyCounts.length === 0) return 0;
    
    const variance = this.calculateVariance(dailyCounts);
    const mean = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
    
    // Lower variance relative to mean indicates higher consistency
    return Math.max(0, 1 - (variance / Math.max(mean, 1)));
  }

  private getRecentData(data: LearningDataPoint[], days: number): LearningDataPoint[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return data.filter(point => new Date(point.timestamp) >= cutoffDate);
  }

  private getRecentSessions(sessions: StudySession[], days: number): StudySession[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return sessions.filter(session => new Date(session.date) >= cutoffDate);
  }

  private calculateStreakStrength(recentSessions: StudySession[]): number {
    if (recentSessions.length === 0) return 0;
    
    // Group sessions by day
    const dailySessions = this.groupSessionsByDay(recentSessions);
    const daysWithSessions = Object.keys(dailySessions).length;
    const totalDays = 14; // Last 2 weeks
    
    return daysWithSessions / totalDays;
  }

  private groupSessionsByDay(sessions: StudySession[]): Record<string, StudySession[]> {
    return sessions.reduce((acc, session) => {
      const day = session.date.split('T')[0];
      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    }, {} as Record<string, StudySession[]>);
  }

  private calculateMomentumDirection(recentData: LearningDataPoint[]): 'building' | 'maintaining' | 'declining' {
    if (recentData.length < 10) return 'maintaining';
    
    const accuracyData = recentData
      .filter(d => d.metric_type === 'accuracy_rate')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (accuracyData.length < 5) return 'maintaining';
    
    const firstHalf = accuracyData.slice(0, Math.floor(accuracyData.length / 2));
    const secondHalf = accuracyData.slice(Math.floor(accuracyData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
    
    const difference = secondHalfAvg - firstHalfAvg;
    
    if (difference > 0.05) return 'building';
    if (difference < -0.05) return 'declining';
    return 'maintaining';
  }

  private predictContinuation(recentData: LearningDataPoint[], recentSessions: StudySession[]): number {
    const streakStrength = this.calculateStreakStrength(recentSessions);
    const momentumDirection = this.calculateMomentumDirection(recentData);
    
    let baseDays = 7;
    
    if (momentumDirection === 'building') baseDays *= 1.5;
    if (momentumDirection === 'declining') baseDays *= 0.7;
    
    return Math.round(baseDays * streakStrength);
  }

  private calculateBreakthroughProbability(learningData: LearningDataPoint[]): number {
    // Simplified calculation - in production would use more sophisticated modeling
    const recentData = this.getRecentData(learningData, 30);
    const accuracyData = recentData.filter(d => d.metric_type === 'accuracy_rate');
    
    if (accuracyData.length < 20) return 0.3; // Default moderate probability
    
    const recentAverage = accuracyData.slice(-10).reduce((sum, d) => sum + d.value, 0) / 10;
    const historicalAverage = accuracyData.reduce((sum, d) => sum + d.value, 0) / accuracyData.length;
    
    const improvement = recentAverage - historicalAverage;
    return Math.min(0.9, Math.max(0.1, 0.5 + improvement * 2));
  }

  private calculatePlateauRisk(learningData: LearningDataPoint[]): number {
    const recentData = this.getRecentData(learningData, 21); // Last 3 weeks
    const accuracyData = recentData.filter(d => d.metric_type === 'accuracy_rate');
    
    if (accuracyData.length < 15) return 0.3; // Default moderate risk
    
    // Check for lack of improvement
    const smoothedData = this.applyMovingAverage(accuracyData.map(d => d.value), 5);
    const variance = this.calculateVariance(smoothedData);
    
    // Low variance indicates potential plateau
    return Math.min(0.9, Math.max(0.1, 1 - variance * 10));
  }
}

/**
 * Factory function to create temporal pattern engine instance
 */
export function createTemporalPatternEngine(): TemporalPatternEngine {
  return new TemporalPatternEngine();
}