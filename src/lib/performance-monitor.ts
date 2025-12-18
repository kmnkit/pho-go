/**
 * Advanced Performance Monitoring for Vietnamese Learning App
 * Monitors Core Web Vitals, audio loading, gesture responsiveness, and battery usage
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import type { Metric } from 'web-vitals';
import {
  getMemoryInfo,
  getBatteryManager,
  type LayoutShift,
  type LongTaskTiming,
} from '@/types/browser-apis';

/**
 * Custom performance metrics specific to the learning app
 */
export interface CustomMetrics {
  audioLoadTime: number;
  gestureResponseTime: number;
  flashcardFlipDuration: number;
  offlineCapability: boolean;
  batteryLevel?: number;
  memoryUsage: number;
}

/**
 * Performance budget thresholds
 */
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals targets (optimized for mobile)
  LCP: 2500, // 2.5s - mobile 3G target
  INP: 200,  // 200ms - smooth interactions (replaces FID)
  CLS: 0.1,  // 0.1 - stable layout
  FCP: 1800, // 1.8s - fast first paint
  TTFB: 800, // 800ms - server response
  
  // Audio-specific budgets
  audioLoadTime: 3000, // 3s initial load
  audioSubsequentLoad: 500, // 500ms cached audio
  
  // Gesture performance budgets
  gestureResponseTime: 100, // 100ms gesture response
  
  // Memory and battery budgets
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB total memory
  maxBatteryDrain: 5, // 5% per 30min session
} as const;

/**
 * Performance monitoring state
 */
interface PerformanceState {
  metrics: Map<string, Metric>;
  customMetrics: Map<string, number>;
  violations: string[];
  isMonitoring: boolean;
  startTime: number;
}

/**
 * Global performance state
 */
const performanceState: PerformanceState = {
  metrics: new Map(),
  customMetrics: new Map(),
  violations: [],
  isMonitoring: false,
  startTime: 0,
};

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): void {
  if (performanceState.isMonitoring) {
    return;
  }

  performanceState.isMonitoring = true;
  performanceState.startTime = performance.now();

  console.log('🚀 Performance monitoring initialized');

  // Core Web Vitals monitoring (FID replaced by INP in web-vitals v5)
  onCLS(onVitalMetric);
  onFCP(onVitalMetric);
  onLCP(onVitalMetric);
  onTTFB(onVitalMetric);
  onINP(onVitalMetric); // INP replaces FID as the interactivity metric

  // Custom monitoring setup
  setupCustomMetricsMonitoring();
  setupMemoryMonitoring();
  setupBatteryMonitoring();
  
  // Performance budget checking
  startPerformanceBudgetMonitoring();
}

/**
 * Handle Core Web Vitals metrics
 */
function onVitalMetric(metric: Metric): void {
  performanceState.metrics.set(metric.name, metric);
  
  // Check against performance budgets
  const budget = PERFORMANCE_BUDGETS[metric.name as keyof typeof PERFORMANCE_BUDGETS];
  if (budget && metric.value > budget) {
    const violation = `${metric.name} exceeded budget: ${metric.value} > ${budget}`;
    performanceState.violations.push(violation);
    console.warn('⚠️ Performance budget violation:', violation);
  }

  // Send to analytics
  reportPerformanceMetric(metric);
}

/**
 * Track audio loading performance
 */
export function trackAudioLoadTime(url: string, startTime: number, endTime: number): void {
  const loadTime = endTime - startTime;
  performanceState.customMetrics.set('audioLoadTime', loadTime);

  const isSubsequent = performanceState.customMetrics.has('firstAudioLoad');
  const budget = isSubsequent ? PERFORMANCE_BUDGETS.audioSubsequentLoad : PERFORMANCE_BUDGETS.audioLoadTime;

  if (loadTime > budget) {
    const violation = `Audio load time exceeded budget: ${loadTime}ms > ${budget}ms for ${url}`;
    performanceState.violations.push(violation);
    console.warn('🎵 Audio performance issue:', violation);
  }

  if (!isSubsequent) {
    performanceState.customMetrics.set('firstAudioLoad', loadTime);
  }

  console.log(`🎵 Audio loaded in ${loadTime}ms:`, url);
}

/**
 * Track gesture response time
 */
export function trackGestureResponseTime(startTime: number, endTime: number, accuracy: number): void {
  const responseTime = endTime - startTime;
  performanceState.customMetrics.set('gestureResponseTime', responseTime);

  if (responseTime > PERFORMANCE_BUDGETS.gestureResponseTime) {
    const violation = `Gesture response time exceeded budget: ${responseTime}ms > ${PERFORMANCE_BUDGETS.gestureResponseTime}ms`;
    performanceState.violations.push(violation);
    console.warn('👆 Gesture performance issue:', violation);
  }

  // Track accuracy degradation
  if (accuracy < 0.95) {
    console.warn(`👆 Gesture accuracy below target: ${(accuracy * 100).toFixed(1)}%`);
  }

  console.log(`👆 Gesture responded in ${responseTime}ms with ${(accuracy * 100).toFixed(1)}% accuracy`);
}

/**
 * Track flashcard animation performance
 */
export function trackFlashcardAnimation(duration: number): void {
  performanceState.customMetrics.set('flashcardFlipDuration', duration);
  
  // 60fps target = 16.67ms per frame
  const targetFrameTime = 16.67;
  const frames = duration / targetFrameTime;
  
  if (frames > 18) { // Allow slight buffer
    console.warn(`🃏 Flashcard animation dropped frames: ${frames.toFixed(1)} frames`);
  }
}

/**
 * Type guard for LongTaskTiming
 */
function isLongTaskTiming(entry: PerformanceEntry): entry is LongTaskTiming {
  return entry.entryType === 'longtask';
}

/**
 * Type guard for LayoutShift
 */
function isLayoutShift(entry: PerformanceEntry): entry is LayoutShift {
  return entry.entryType === 'layout-shift';
}

/**
 * Setup custom metrics monitoring
 */
function setupCustomMetricsMonitoring(): void {
  // Monitor long tasks (>50ms)
  if ('PerformanceObserver' in window) {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (isLongTaskTiming(entry) && entry.duration > 50) {
          console.warn('⏱️ Long task detected:', {
            duration: entry.duration,
            name: entry.name,
            startTime: entry.startTime,
          });
          performanceState.violations.push(`Long task: ${entry.duration}ms`);
        }
      }
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      console.warn('Long task monitoring not supported');
    }

    // Monitor layout shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!isLayoutShift(entry)) continue;
        if (entry.hadRecentInput) continue;

        if (entry.value > 0.001) {
          console.warn('📏 Layout shift detected:', {
            value: entry.value,
            sources: entry.sources?.map((s) => s.node) ?? [],
          });
        }
      }
    });

    try {
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch {
      console.warn('Layout shift monitoring not supported');
    }
  }
}

/**
 * Setup memory usage monitoring
 */
function setupMemoryMonitoring(): void {
  const memory = getMemoryInfo();
  if (!memory) return;

  const checkMemory = (): void => {
    const currentMemory = getMemoryInfo();
    if (!currentMemory) return;

    const usedMB = currentMemory.usedJSHeapSize / (1024 * 1024);

    performanceState.customMetrics.set('memoryUsage', currentMemory.usedJSHeapSize);

    if (currentMemory.usedJSHeapSize > PERFORMANCE_BUDGETS.maxMemoryUsage) {
      const violation = `Memory usage exceeded budget: ${usedMB.toFixed(1)}MB`;
      performanceState.violations.push(violation);
      console.warn('🧠 Memory usage high:', {
        used: `${usedMB.toFixed(1)}MB`,
        limit: `${currentMemory.jsHeapSizeLimit / (1024 * 1024)}MB`,
        total: `${currentMemory.totalJSHeapSize / (1024 * 1024)}MB`,
      });
    }
  };

  // Check memory every 30 seconds
  setInterval(checkMemory, 30000);
  checkMemory(); // Initial check
}

/**
 * Setup battery monitoring for mobile devices
 */
function setupBatteryMonitoring(): void {
  void getBatteryManager().then((battery) => {
    if (!battery) {
      console.log('🔋 Battery monitoring not supported');
      return;
    }

    const initialLevel = battery.level;
    let sessionStartLevel = initialLevel;

    const checkBatteryDrain = (): void => {
      const currentLevel = battery.level;
      const drain = (sessionStartLevel - currentLevel) * 100;
      const sessionTime = (performance.now() - performanceState.startTime) / (1000 * 60); // minutes

      if (sessionTime > 30 && drain > PERFORMANCE_BUDGETS.maxBatteryDrain) {
        const violation = `Battery drain exceeded budget: ${drain.toFixed(1)}% in ${sessionTime.toFixed(1)} minutes`;
        performanceState.violations.push(violation);
        console.warn('🔋 High battery usage:', violation);
      }

      console.log(`🔋 Battery: ${(currentLevel * 100).toFixed(0)}% (${drain.toFixed(1)}% drained)`);
    };

    battery.addEventListener('levelchange', checkBatteryDrain);

    // Reset session start level on charging
    battery.addEventListener('chargingchange', () => {
      if (battery.charging) {
        sessionStartLevel = battery.level;
      }
    });

    // Check every 5 minutes
    setInterval(checkBatteryDrain, 5 * 60 * 1000);
  });
}

/**
 * Start performance budget monitoring
 */
function startPerformanceBudgetMonitoring(): void {
  // Report performance summary every 60 seconds
  setInterval(() => {
    const summary = getPerformanceSummary();
    console.log('📊 Performance Summary:', summary);
    
    // Send to analytics if there are violations
    if (performanceState.violations.length > 0) {
      reportPerformanceViolations(performanceState.violations);
      performanceState.violations = []; // Clear violations
    }
  }, 60000);
}

/**
 * Get current performance summary
 */
export function getPerformanceSummary(): {
  coreVitals: Record<string, number>;
  customMetrics: Record<string, number>;
  violations: string[];
  sessionDuration: number;
  budgetStatus: 'passing' | 'warning' | 'failing';
} {
  const coreVitals: Record<string, number> = {};
  performanceState.metrics.forEach((metric, name) => {
    coreVitals[name] = metric.value;
  });

  const customMetrics: Record<string, number> = {};
  performanceState.customMetrics.forEach((value, name) => {
    customMetrics[name] = value;
  });

  const sessionDuration = (performance.now() - performanceState.startTime) / 1000;
  
  // Determine budget status
  let budgetStatus: 'passing' | 'warning' | 'failing' = 'passing';
  if (performanceState.violations.length > 5) {
    budgetStatus = 'failing';
  } else if (performanceState.violations.length > 0) {
    budgetStatus = 'warning';
  }

  return {
    coreVitals,
    customMetrics,
    violations: [...performanceState.violations],
    sessionDuration,
    budgetStatus,
  };
}

/**
 * Report performance metric to analytics
 */
function reportPerformanceMetric(metric: Metric): void {
  // Send to existing analytics system
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'performance_metric', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      event_category: 'Performance',
    });
  }
}

/**
 * Report performance violations
 */
function reportPerformanceViolations(violations: string[]): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'performance_violation', {
      violations: violations.length,
      details: violations.join('; '),
      event_category: 'Performance',
    });
  }
}

/**
 * Export monitoring utilities
 */
export const PerformanceMonitor = {
  init: initializePerformanceMonitoring,
  trackAudioLoad: trackAudioLoadTime,
  trackGesture: trackGestureResponseTime,
  trackAnimation: trackFlashcardAnimation,
  getSummary: getPerformanceSummary,
} as const;