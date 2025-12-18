import { useState, useEffect, useCallback } from 'react';
import { getNetworkConnection } from '@/types/browser-apis';

/**
 * Offline state and network information
 */
export interface OfflineState {
  readonly isOnline: boolean;
  readonly isOffline: boolean;
  readonly connectionType: string | null;
  readonly downlink: number | null;
  readonly rtt: number | null;
}

/**
 * Offline capabilities manager
 */
export interface OfflineControls {
  readonly preloadCriticalAssets: () => Promise<void>;
  readonly syncWhenOnline: () => Promise<void>;
  readonly clearOfflineCache: () => Promise<void>;
  readonly getOfflineCapabilities: () => Promise<OfflineCapabilityStatus>;
}

/**
 * Offline capability status
 */
export interface OfflineCapabilityStatus {
  readonly audioCache: number; // Number of cached audio files
  readonly dataCache: number; // Number of cached data files
  readonly estimatedOfflineTime: number; // Minutes of offline learning possible
  readonly lastSync: Date | null;
}

/**
 * Return type of useOffline hook
 */
export interface UseOfflineReturn extends OfflineState, OfflineControls {}

/**
 * Custom hook for offline functionality and network awareness
 * Supports PWA offline learning sessions for Japanese commuters
 * @returns Offline state and controls
 */
export const useOffline = (): UseOfflineReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [downlink, setDownlink] = useState<number | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);

  // Update network information
  const updateNetworkInfo = useCallback(() => {
    setIsOnline(navigator.onLine);

    // Get connection information if available
    const connection = getNetworkConnection();

    if (connection) {
      setConnectionType(connection.effectiveType || connection.type || null);
      setDownlink(connection.downlink ?? null);
      setRtt(connection.rtt ?? null);
    }
  }, []);

  // Sync data when coming back online
  const syncWhenOnline = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      console.log('Cannot sync while offline');
      return;
    }

    try {
      // TODO: Implement server sync functionality
      // For now, just update the last sync timestamp
      localStorage.setItem('lastSync', new Date().toISOString());

      console.log('Data sync placeholder executed successfully');
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  }, [isOnline]);

  // Listen for online/offline events
  useEffect(() => {
    updateNetworkInfo();

    const handleOnline = (): void => {
      updateNetworkInfo();
      // Trigger sync when coming back online
      void syncWhenOnline();
    };

    const handleOffline = (): void => {
      updateNetworkInfo();
    };

    const handleConnectionChange = (): void => {
      updateNetworkInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = getNetworkConnection();

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkInfo, syncWhenOnline]);

  // Preload critical assets for offline use
  const preloadCriticalAssets = useCallback(async (): Promise<void> => {
    if (!('caches' in window)) {
      console.warn('Cache API not supported');
      return;
    }

    try {
      const cache = await caches.open('audio-cache');
      
      // Preload alphabet audio files (critical for basic learning)
      const alphabetPromises = 'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => 
        cache.add(`/audio/alphabet/${letter}.mp3`).catch(() => {
          // Silently fail for missing files
        })
      );

      // Preload current session data
      const dataPromises = [
        cache.add('/data/alphabet.json').catch(() => {}),
        cache.add('/data/categories.json').catch(() => {}),
        cache.add('/data/tones.json').catch(() => {}),
      ];

      await Promise.allSettled([...alphabetPromises, ...dataPromises]);
      
      console.log('Critical assets preloaded for offline use');
    } catch (error) {
      console.error('Failed to preload critical assets:', error);
    }
  }, []);

  // Clear offline cache
  const clearOfflineCache = useCallback(async (): Promise<void> => {
    if (!('caches' in window)) {
      console.warn('Cache API not supported');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('Offline cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  // Get current offline capabilities
  const getOfflineCapabilities = useCallback(async (): Promise<OfflineCapabilityStatus> => {
    if (!('caches' in window)) {
      return {
        audioCache: 0,
        dataCache: 0,
        estimatedOfflineTime: 0,
        lastSync: null,
      };
    }

    try {
      const audioCache = await caches.open('audio-cache');
      const dataCache = await caches.open('data-cache');
      
      const audioKeys = await audioCache.keys();
      const dataKeys = await dataCache.keys();
      
      // Estimate offline learning time
      // Assume 29 alphabet files + basic vocabulary = ~60 minutes of learning
      const alphabetFiles = audioKeys.filter(req => req.url.includes('/alphabet/')).length;
      const estimatedMinutes = Math.min(alphabetFiles * 2, 60); // 2 minutes per letter, max 60 min
      
      // Get last sync timestamp
      const lastSyncStr = localStorage.getItem('lastSync');
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

      return {
        audioCache: audioKeys.length,
        dataCache: dataKeys.length,
        estimatedOfflineTime: estimatedMinutes,
        lastSync,
      };
    } catch (error) {
      console.error('Failed to get offline capabilities:', error);
      return {
        audioCache: 0,
        dataCache: 0,
        estimatedOfflineTime: 0,
        lastSync: null,
      };
    }
  }, []);

  return {
    // State
    isOnline,
    isOffline: !isOnline,
    connectionType,
    downlink,
    rtt,
    // Controls
    preloadCriticalAssets,
    syncWhenOnline,
    clearOfflineCache,
    getOfflineCapabilities,
  } as const;
};