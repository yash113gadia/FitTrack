/**
 * Performance Optimization Utilities for Whole Fit
 * 
 * Helper functions and hooks to measure and improve app performance.
 */

import React, { 
  useCallback, 
  useMemo, 
  useEffect, 
  useRef, 
  useState,
  lazy,
  Suspense,
  ComponentType,
  memo
} from 'react';
import { 
  InteractionManager, 
  ActivityIndicator, 
  View,
  Image as RNImage,
  Platform 
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { colors } from '../constants/theme';

// ============================================
// DEFERRED EXECUTION
// ============================================

/**
 * Hook to defer expensive work until after interactions complete
 * Useful for non-critical initialization
 */
export function useDeferred<T>(
  factory: () => T | Promise<T>,
  deps: React.DependencyList = []
): { value: T | null; isLoading: boolean } {
  const [value, setValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    InteractionManager.runAfterInteractions(async () => {
      if (cancelled) return;
      
      try {
        const result = await factory();
        if (!cancelled) {
          setValue(result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Deferred execution failed:', error);
        if (!cancelled) setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { value, isLoading };
}

/**
 * Run a function after interactions complete
 */
export function runAfterInteractions(callback: () => void): () => void {
  const handle = InteractionManager.runAfterInteractions(callback);
  return () => handle.cancel();
}

// ============================================
// MEMOIZATION HELPERS
// ============================================

/**
 * Deep comparison memo wrapper
 * Use sparingly - only when props are complex objects
 */
export function deepMemo<P extends object>(
  Component: ComponentType<P>,
  displayName?: string
): React.MemoExoticComponent<ComponentType<P>> {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
  
  MemoizedComponent.displayName = displayName || `DeepMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Hook for stable callback references
 * Prevents unnecessary re-renders when passing callbacks to children
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Hook for expensive computations with automatic cache invalidation
 */
export function useComputedValue<T>(
  compute: () => T,
  deps: React.DependencyList,
  debugLabel?: string
): T {
  const startTime = __DEV__ && debugLabel && global.performance ? global.performance.now() : 0;
  
  const value = useMemo(() => {
    const result = compute();
    
    if (__DEV__ && debugLabel && global.performance) {
      const duration = global.performance.now() - startTime;
      if (duration > 16) { // Longer than a frame
        console.warn(`[Performance] ${debugLabel} took ${duration.toFixed(2)}ms`);
      }
    }
    
    return result;
  }, deps);

  return value;
}

// ============================================
// LAZY LOADING
// ============================================

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC<{ size?: 'small' | 'large' }> = ({ size = 'large' }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size={size} color={colors.primary[500]} />
  </View>
);

/**
 * Create a lazy-loaded component with loading fallback
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <LoadingFallback />
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Hook for lazy-loading data
 */
export function useLazyData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { data, isLoading, error, refetch: fetch };
}

// ============================================
// IMAGE OPTIMIZATION
// ============================================

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_IMAGE_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg',
};

/**
 * Compress and resize an image for upload
 */
export async function optimizeImage(
  uri: string,
  options: ImageOptimizationOptions = {}
): Promise<{ uri: string; width: number; height: number; size: number }> {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  
  // Get original image info
  const originalInfo = await FileSystem.getInfoAsync(uri);
  
  // Manipulate image
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: opts.maxWidth,
          height: opts.maxHeight,
        },
      },
    ],
    {
      compress: opts.quality,
      format: opts.format === 'png' 
        ? ImageManipulator.SaveFormat.PNG 
        : ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Get compressed file info
  const compressedInfo = await FileSystem.getInfoAsync(result.uri);
  
  if (__DEV__) {
    const originalSize = (originalInfo as any).size || 0;
    const compressedSize = (compressedInfo as any).size || 0;
    const savings = originalSize > 0 
      ? ((1 - compressedSize / originalSize) * 100).toFixed(1) 
      : 0;
    console.log(`[Image] Compressed: ${savings}% savings (${originalSize} → ${compressedSize} bytes)`);
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size: (compressedInfo as any).size || 0,
  };
}

/**
 * Generate a thumbnail for list displays
 */
export async function generateThumbnail(
  uri: string,
  size: number = 150
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: size, height: size } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

// Image cache management
const IMAGE_CACHE_DIR = `${(FileSystem as any).cacheDirectory}images/`;

/**
 * Initialize image cache directory
 */
export async function initImageCache(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
  }
}

/**
 * Get cached image or download and cache
 */
export async function getCachedImage(url: string): Promise<string> {
  const filename = url.split('/').pop() || 'image';
  const cacheKey = `${IMAGE_CACHE_DIR}${filename}`;
  
  const cacheInfo = await FileSystem.getInfoAsync(cacheKey);
  if (cacheInfo.exists) {
    return cacheKey;
  }

  // Download and cache
  await FileSystem.downloadAsync(url, cacheKey);
  return cacheKey;
}

/**
 * Clear image cache
 */
export async function clearImageCache(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (dirInfo.exists) {
    await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
    await initImageCache();
  }
}

/**
 * Get image cache size
 */
export async function getImageCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (!dirInfo.exists) return 0;
    
    // Note: This is a simplified version. For accurate size,
    // you'd need to iterate through all files
    return (dirInfo as any).size || 0;
  } catch {
    return 0;
  }
}

// ============================================
// LIST OPTIMIZATION
// ============================================

/**
 * FlatList optimization props
 */
export const flatListOptimizations = {
  removeClippedSubviews: Platform.OS === 'android',
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  windowSize: 21, // Renders 10 screens worth of content
  initialNumToRender: 10,
  getItemLayout: undefined as any, // Override per list for fixed-height items
};

/**
 * Create getItemLayout for fixed-height items
 */
export function createGetItemLayout(itemHeight: number, headerHeight: number = 0) {
  return (_data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index + headerHeight,
    index,
  });
}

/**
 * Generate stable keys for list items
 */
export function createKeyExtractor<T extends { id: number | string }>(
  prefix: string = 'item'
): (item: T, index: number) => string {
  return (item, index) => `${prefix}-${item.id ?? index}`;
}

// ============================================
// REQUEST CANCELLATION
// ============================================

/**
 * Hook for managing cancellable async operations
 */
export function useCancellableRequest<T>(): {
  execute: (promise: Promise<T>) => Promise<T | null>;
  cancel: () => void;
} {
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const execute = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    // Cancel any pending request
    cancel();
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const result = await promise;
      if (signal.aborted) return null;
      return result;
    } catch (error) {
      if (signal.aborted) return null;
      throw error;
    }
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return { execute, cancel };
}

// ============================================
// CLEANUP UTILITIES
// ============================================

/**
 * Hook for cleanup on unmount
 */
export function useCleanup(cleanup: () => void): void {
  useEffect(() => {
    return cleanup;
  }, []);
}

/**
 * Hook for managing multiple cleanup functions
 */
export function useCleanupManager(): {
  addCleanup: (cleanup: () => void) => void;
} {
  const cleanupsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      cleanupsRef.current.forEach(cleanup => cleanup());
      cleanupsRef.current = [];
    };
  }, []);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupsRef.current.push(cleanup);
  }, []);

  return { addCleanup };
}

// ============================================
// PERFORMANCE PROFILING (DEV ONLY)
// ============================================

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceProfiler {
  private metrics: PerformanceMetric[] = [];
  private activeMarks: Map<string, number> = new Map();

  mark(name: string): void {
    if (!__DEV__ || !global.performance) return;
    this.activeMarks.set(name, global.performance.now());
  }

  measure(name: string): number {
    if (!__DEV__ || !global.performance) return 0;
    
    const startTime = this.activeMarks.get(name);
    if (startTime === undefined) {
      console.warn(`[Profiler] No mark found for: ${name}`);
      return 0;
    }

    const duration = global.performance.now() - startTime;
    this.activeMarks.delete(name);

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    if (duration > 16) {
      console.warn(`[Performance] ${name}: ${duration.toFixed(2)}ms (exceeds frame budget)`);
    } else {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getAverageTime(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }

  printSummary(): void {
    if (!__DEV__) return;
    
    console.log('=== Performance Summary ===');
    const grouped = this.metrics.reduce((acc, m) => {
      if (!acc[m.name]) acc[m.name] = [];
      acc[m.name].push(m.duration);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(grouped).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms, count=${durations.length}`);
    });
    console.log('===========================');
  }
}

export const profiler = new PerformanceProfiler();

/**
 * HOC for profiling component render time
 */
export function withRenderProfiling<P extends object>(
  Component: ComponentType<P>,
  componentName: string
): ComponentType<P> {
  if (!__DEV__) return Component;

  return function ProfiledComponent(props: P) {
    useEffect(() => {
      profiler.measure(`${componentName}:mount`);
    }, []);

    profiler.mark(`${componentName}:render`);
    
    useEffect(() => {
      profiler.measure(`${componentName}:render`);
    });

    profiler.mark(`${componentName}:mount`);
    
    return <Component {...props} />;
  };
}

/**
 * Hook for profiling specific operations
 */
export function useProfiler(operationName: string): {
  start: () => void;
  end: () => number;
} {
  const start = useCallback(() => {
    profiler.mark(operationName);
  }, [operationName]);

  const end = useCallback(() => {
    return profiler.measure(operationName);
  }, [operationName]);

  return { start, end };
}

// ============================================
// MEMORY MONITORING (DEV ONLY)
// ============================================

/**
 * Hook for monitoring memory usage in development
 */
export function useMemoryMonitor(componentName: string): void {
  useEffect(() => {
    if (!__DEV__) return;

    // Log on mount
    console.log(`[Memory] ${componentName} mounted`);

    return () => {
      console.log(`[Memory] ${componentName} unmounted`);
      // In a real implementation, you could use performance.measureUserAgentSpecificMemory()
      // or native modules for detailed memory info
    };
  }, [componentName]);
}

// ============================================
// EXPORTS
// ============================================

export const performanceUtils = {
  // Deferred execution
  useDeferred,
  runAfterInteractions,
  
  // Memoization
  deepMemo,
  useStableCallback,
  useComputedValue,
  
  // Lazy loading
  lazyLoad,
  useLazyData,
  
  // Image optimization
  optimizeImage,
  generateThumbnail,
  initImageCache,
  getCachedImage,
  clearImageCache,
  getImageCacheSize,
  
  // List optimization
  flatListOptimizations,
  createGetItemLayout,
  createKeyExtractor,
  
  // Cancellation
  useCancellableRequest,
  
  // Cleanup
  useCleanup,
  useCleanupManager,
  
  // Profiling
  profiler,
  withRenderProfiling,
  useProfiler,
  useMemoryMonitor,
};

export default performanceUtils;
