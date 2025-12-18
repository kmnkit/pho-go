/**
 * TypeScript type definitions for experimental and non-standard browser APIs
 * These extend the DOM type definitions to include newer or vendor-specific APIs
 */

/**
 * Network Information API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
 */
export interface NetworkInformation extends EventTarget {
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  readonly effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  readonly downlink?: number;
  readonly downlinkMax?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  onchange: ((this: NetworkInformation, ev: Event) => unknown) | null;
}

/**
 * Navigator with Network Information API support
 */
export interface NavigatorWithConnection extends Navigator {
  readonly connection?: NetworkInformation;
  readonly mozConnection?: NetworkInformation;
  readonly webkitConnection?: NetworkInformation;
}

/**
 * Battery Manager API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API
 */
export interface BatteryManager extends EventTarget {
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
  readonly level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => unknown) | null;
}

/**
 * Navigator with Battery API support
 */
export interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

/**
 * Memory Info (Chrome-specific)
 * @see https://developer.chrome.com/docs/devtools/memory-problems/
 */
export interface MemoryInfo {
  readonly jsHeapSizeLimit: number;
  readonly totalJSHeapSize: number;
  readonly usedJSHeapSize: number;
}

/**
 * Performance with Memory extension (Chrome-specific)
 */
export interface PerformanceWithMemory extends Performance {
  readonly memory?: MemoryInfo;
}

/**
 * Layout Shift Entry
 * @see https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift
 */
export interface LayoutShift extends PerformanceEntry {
  readonly value: number;
  readonly hadRecentInput: boolean;
  readonly lastInputTime: number;
  readonly sources?: ReadonlyArray<LayoutShiftAttribution>;
}

/**
 * Layout Shift Attribution
 */
export interface LayoutShiftAttribution {
  readonly node?: Node;
  readonly previousRect: DOMRectReadOnly;
  readonly currentRect: DOMRectReadOnly;
}

/**
 * Long Task Entry
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming
 */
export interface LongTaskTiming extends PerformanceEntry {
  readonly attribution: ReadonlyArray<TaskAttributionTiming>;
}

/**
 * Task Attribution Timing
 */
export interface TaskAttributionTiming extends PerformanceEntry {
  readonly containerType: string;
  readonly containerSrc: string;
  readonly containerId: string;
  readonly containerName: string;
}

/**
 * Type guards for browser API support detection
 */
export const BrowserSupport = {
  /**
   * Check if Network Information API is supported
   */
  hasNetworkInformation: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as NavigatorWithConnection;
    return !!(nav.connection || nav.mozConnection || nav.webkitConnection);
  },

  /**
   * Check if Battery API is supported
   */
  hasBatteryAPI: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return 'getBattery' in navigator;
  },

  /**
   * Check if Memory API is supported
   */
  hasMemoryAPI: (): boolean => {
    if (typeof performance === 'undefined') return false;
    return 'memory' in performance;
  },

  /**
   * Check if Cache API is supported
   */
  hasCacheAPI: (): boolean => {
    return typeof caches !== 'undefined';
  },
} as const;

/**
 * Safely get network connection information
 */
export function getNetworkConnection(): NetworkInformation | null {
  if (!BrowserSupport.hasNetworkInformation()) return null;
  const nav = navigator as NavigatorWithConnection;
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

/**
 * Safely get battery manager
 */
export async function getBatteryManager(): Promise<BatteryManager | null> {
  if (!BrowserSupport.hasBatteryAPI()) return null;
  const nav = navigator as NavigatorWithBattery;
  try {
    return await nav.getBattery?.() ?? null;
  } catch {
    return null;
  }
}

/**
 * Safely get memory info
 */
export function getMemoryInfo(): MemoryInfo | null {
  if (!BrowserSupport.hasMemoryAPI()) return null;
  return (performance as PerformanceWithMemory).memory ?? null;
}
