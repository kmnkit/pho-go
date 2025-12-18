/**
 * Web Vitals Performance Monitoring
 *
 * このモジュールは Core Web Vitals とその他のパフォーマンスメトリクスを追跡します。
 *
 * 使用方法:
 * 1. layout.tsx または _app.tsx で reportWebVitals をエクスポート
 * 2. Google Analytics、Vercel Analytics などに送信
 */

import type { Metric } from 'web-vitals';

/**
 * Web Vitals メトリクスをコンソールに出力
 * 開発環境でのデバッグ用
 */
export function logWebVitals(metric: Metric): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vitals:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }
}

/**
 * Web Vitals メトリクスを Google Analytics に送信
 * GA4 の event として送信
 */
export function sendToGoogleAnalytics(metric: Metric): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const { name, value, id, rating } = metric;

  // メトリクス名に応じて値を調整
  const reportValue = name === 'CLS' ? value * 1000 : value;

  window.gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(reportValue),
    metric_rating: rating,
    non_interaction: true,
  });
}

/**
 * Web Vitals メトリクスを Vercel Analytics に送信
 */
export function sendToVercelAnalytics(metric: Metric): void {
  if (typeof window === 'undefined' || !window.va) {
    return;
  }

  window.va('event', {
    name: metric.name,
    data: {
      value: metric.value,
      rating: metric.rating,
    },
  });
}

/**
 * Web Vitals メトリクスをカスタムエンドポイントに送信
 * 独自の分析サービスに送信する場合に使用
 */
export async function sendToCustomEndpoint(metric: Metric): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

  if (!endpoint) {
    return;
  }

  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Beacon API を使用（ページ離脱時も確実に送信）
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      // フォールバック: fetch
      await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Failed to send web vitals:', error);
  }
}

/**
 * メインの Web Vitals レポート関数
 * layout.tsx で使用
 */
export function reportWebVitals(metric: Metric): void {
  // 開発環境ではコンソールに出力
  logWebVitals(metric);

  // 本番環境では分析サービスに送信
  if (process.env.NODE_ENV === 'production') {
    sendToGoogleAnalytics(metric);
    sendToVercelAnalytics(metric);
    // sendToCustomEndpoint(metric); // 必要に応じて有効化
  }
}

/**
 * パフォーマンスメトリクスの閾値
 * Web Vitals の評価基準
 */
export const VITALS_THRESHOLDS = {
  // Largest Contentful Paint (秒)
  LCP: {
    good: 2.5,
    needsImprovement: 4.0,
  },
  // First Input Delay (ミリ秒)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Cumulative Layout Shift (スコア)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (秒)
  FCP: {
    good: 1.8,
    needsImprovement: 3.0,
  },
  // Time to First Byte (ミリ秒)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint (ミリ秒)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
};

/**
 * メトリクスの評価を取得
 * @param name - メトリクス名
 * @param value - メトリクス値
 * @returns 'good' | 'needs-improvement' | 'poor'
 */
export function getMetricRating(
  name: keyof typeof VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITALS_THRESHOLDS[name];

  if (!threshold) {
    return 'good';
  }

  if (value <= threshold.good) {
    return 'good';
  } else if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * TypeScript 型拡張
 * window.gtag と window.va の型定義
 */
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    va?: (command: string, data: Record<string, unknown>) => void;
  }
}
