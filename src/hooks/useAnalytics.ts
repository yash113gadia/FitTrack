/**
 * Analytics Hooks
 * 
 * React hooks for analytics tracking in components:
 * - useAnalytics: Access analytics methods
 * - useScreenTracking: Auto-track screen views
 * - usePerformanceTracking: Track component performance
 * - useEventTracking: Simplified event tracking
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Analytics } from '../services/analytics';

// ============================================================================
// useAnalytics
// ============================================================================

/**
 * Hook to access analytics methods with proper typing
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    (
      eventType: Parameters<typeof Analytics.trackEvent>[0],
      properties?: Record<string, any>,
      metrics?: Record<string, number>
    ) => {
      Analytics.trackEvent(eventType, properties, metrics);
    },
    []
  );

  const trackFeature = useCallback((featureName: string, details?: Record<string, any>) => {
    Analytics.trackFeatureUsed(featureName, details);
  }, []);

  const trackTiming = useCallback(
    (category: string, name: string, timeMs: number) => {
      Analytics.trackTiming(category, name, timeMs);
    },
    []
  );

  const startTiming = useCallback((category: string, name: string) => {
    return Analytics.startTiming(category, name);
  }, []);

  const setUserProperty = useCallback((property: string, value: any) => {
    Analytics.setUserProperty(property, value);
  }, []);

  return {
    trackEvent,
    trackFeature,
    trackTiming,
    startTiming,
    setUserProperty,
    getSession: () => Analytics.getSession(),
    getConsent: () => Analytics.getConsent(),
    updateConsent: Analytics.updateConsent.bind(Analytics),
  };
}

// ============================================================================
// useScreenTracking
// ============================================================================

interface ScreenTrackingOptions {
  /** Override the screen name (defaults to route name) */
  screenName?: string;
  /** Additional properties to track with screen view */
  properties?: Record<string, any>;
  /** Track render performance */
  trackRenderTime?: boolean;
}

/**
 * Hook to automatically track screen views
 * Should be used in screen components
 */
export function useScreenTracking(options: ScreenTrackingOptions = {}) {
  const route = useRoute();
  const renderStartTime = useRef(Date.now());
  const hasTrackedView = useRef(false);

  const screenName = options.screenName || route.name;

  useEffect(() => {
    if (!hasTrackedView.current) {
      // Track screen view
      Analytics.trackScreenView(screenName);
      hasTrackedView.current = true;

      // Track render time if enabled
      if (options.trackRenderTime) {
        const renderTime = Date.now() - renderStartTime.current;
        Analytics.trackScreenRender(screenName, renderTime);
      }
    }

    // Cleanup - track screen exit on unmount
    return () => {
      // The analytics service handles exit tracking internally
    };
  }, [screenName, options.trackRenderTime]);

  return {
    screenName,
    trackInteraction: (action: string, details?: Record<string, any>) => {
      Analytics.trackEvent('custom_event', {
        screen: screenName,
        action,
        ...details,
      });
    },
  };
}

// ============================================================================
// usePerformanceTracking
// ============================================================================

interface PerformanceTrackingOptions {
  /** Component/operation name */
  name: string;
  /** Category for grouping */
  category?: string;
  /** Track initial render time */
  trackMount?: boolean;
  /** Track re-render times */
  trackUpdates?: boolean;
}

/**
 * Hook to track component performance metrics
 */
export function usePerformanceTracking(options: PerformanceTrackingOptions) {
  const { name, category = 'component', trackMount = true, trackUpdates = false } = options;
  const mountTime = useRef(Date.now());
  const updateCount = useRef(0);
  const lastUpdateTime = useRef(Date.now());

  // Track mount time
  useEffect(() => {
    if (trackMount) {
      const mountDuration = Date.now() - mountTime.current;
      Analytics.trackTiming(category, `${name}_mount`, mountDuration);
    }
  }, [category, name, trackMount]);

  // Track updates
  useEffect(() => {
    if (trackUpdates && updateCount.current > 0) {
      const updateDuration = Date.now() - lastUpdateTime.current;
      Analytics.trackTiming(category, `${name}_update`, updateDuration);
    }
    updateCount.current++;
    lastUpdateTime.current = Date.now();
  });

  /**
   * Manually track an operation's timing
   */
  const trackOperation = useCallback(
    (operationName: string) => {
      const startTime = Date.now();
      return () => {
        const duration = Date.now() - startTime;
        Analytics.trackTiming(category, `${name}_${operationName}`, duration);
      };
    },
    [category, name]
  );

  /**
   * Track an async operation
   */
  const trackAsync = useCallback(
    async <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
      const startTime = Date.now();
      try {
        const result = await operation();
        const duration = Date.now() - startTime;
        Analytics.trackTiming(category, `${name}_${operationName}`, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        Analytics.trackTiming(category, `${name}_${operationName}_error`, duration);
        throw error;
      }
    },
    [category, name]
  );

  return {
    trackOperation,
    trackAsync,
    updateCount: updateCount.current,
  };
}

// ============================================================================
// useEventTracking
// ============================================================================

type EventHandler<T extends any[]> = (...args: T) => void;

interface EventTrackingOptions {
  /** Event type to track */
  eventType: Parameters<typeof Analytics.trackEvent>[0];
  /** Function to transform handler args to event properties */
  getProperties?: (...args: any[]) => Record<string, any>;
  /** Only track on specific conditions */
  condition?: (...args: any[]) => boolean;
}

/**
 * Hook to wrap event handlers with analytics tracking
 */
export function useEventTracking<T extends any[]>(
  handler: EventHandler<T>,
  options: EventTrackingOptions
): EventHandler<T> {
  const { eventType, getProperties, condition } = options;

  return useCallback(
    (...args: T) => {
      // Check condition
      if (condition && !condition(...args)) {
        handler(...args);
        return;
      }

      // Track event
      const properties = getProperties ? getProperties(...args) : undefined;
      Analytics.trackEvent(eventType, properties);

      // Call original handler
      handler(...args);
    },
    [handler, eventType, getProperties, condition]
  );
}

// ============================================================================
// useNavigationTracking
// ============================================================================

/**
 * Hook to set up navigation tracking at the app level
 * Should be used in the root navigation container
 */
export function useNavigationTracking() {
  const routeNameRef = useRef<string | undefined>(undefined);

  const onStateChange = useCallback(() => {
    // This would be called from the NavigationContainer
    // The actual implementation uses navigationRef
  }, []);

  return { onStateChange };
}

// ============================================================================
// useFoodLoggingAnalytics
// ============================================================================

/**
 * Specialized hook for food logging analytics
 */
export function useFoodLoggingAnalytics() {
  const trackManualEntry = useCallback((mealType: string) => {
    Analytics.trackFoodLogged('manual', mealType);
  }, []);

  const trackBarcodeEntry = useCallback((mealType: string, success: boolean) => {
    Analytics.trackFoodLogged('barcode', mealType);
    if (!success) {
      Analytics.trackEvent('barcode_scanned', { success: false });
    }
  }, []);

  const trackAIEntry = useCallback((mealType: string, confidence?: number) => {
    Analytics.trackFoodLogged('ai', mealType);
    Analytics.trackEvent('ai_scan_used', {
      confidenceLevel: confidence ? Math.round(confidence / 20) * 20 : undefined, // Bucket to 0, 20, 40, 60, 80, 100
    });
  }, []);

  const trackEdit = useCallback(() => {
    Analytics.trackEvent('food_edited');
  }, []);

  const trackDelete = useCallback(() => {
    Analytics.trackEvent('food_deleted');
  }, []);

  return {
    trackManualEntry,
    trackBarcodeEntry,
    trackAIEntry,
    trackEdit,
    trackDelete,
  };
}

// ============================================================================
// useGoalAnalytics
// ============================================================================

/**
 * Specialized hook for goal/streak analytics
 */
export function useGoalAnalytics() {
  const trackCalorieGoal = useCallback((percentAchieved: number) => {
    // Only track milestones: 50%, 75%, 100%, 110%+
    const milestone = percentAchieved >= 110
      ? 'exceeded'
      : percentAchieved >= 100
      ? 'achieved'
      : percentAchieved >= 75
      ? '75_percent'
      : percentAchieved >= 50
      ? '50_percent'
      : null;

    if (milestone) {
      Analytics.trackGoalAchieved('calories', percentAchieved);
    }
  }, []);

  const trackMacroGoal = useCallback((macroType: string, percentAchieved: number) => {
    if (percentAchieved >= 100) {
      Analytics.trackGoalAchieved(`macro_${macroType}`, percentAchieved);
    }
  }, []);

  const trackStreak = useCallback((currentStreak: number, previousStreak: number) => {
    // Track milestone achievements
    const milestones = [3, 7, 14, 30, 60, 90, 100, 180, 365];
    
    for (const milestone of milestones) {
      if (currentStreak >= milestone && previousStreak < milestone) {
        Analytics.trackStreakMilestone(milestone);
        break;
      }
    }
  }, []);

  const trackStreakLost = useCallback((previousStreak: number) => {
    Analytics.trackEvent('custom_event', {
      action: 'streak_lost',
      previousStreakDays: previousStreak,
    });
  }, []);

  return {
    trackCalorieGoal,
    trackMacroGoal,
    trackStreak,
    trackStreakLost,
  };
}

// ============================================================================
// useOnboardingAnalytics
// ============================================================================

/**
 * Specialized hook for onboarding analytics
 */
export function useOnboardingAnalytics() {
  const startTimeRef = useRef(Date.now());

  const trackStart = useCallback(() => {
    startTimeRef.current = Date.now();
    Analytics.trackEvent('onboarding_started');
  }, []);

  const trackStepComplete = useCallback((step: number, stepName: string) => {
    Analytics.trackEvent('onboarding_step_completed', {
      step,
      stepName,
    });
  }, []);

  const trackComplete = useCallback((settings: {
    goalType?: string;
    activityLevel?: string;
    unitSystem?: string;
  }) => {
    const duration = Date.now() - startTimeRef.current;

    Analytics.trackEvent('onboarding_completed', {
      ...settings,
      durationSeconds: Math.round(duration / 1000),
    });

    // Set user properties
    if (settings.goalType) {
      Analytics.setUserProperty('goalType', settings.goalType);
    }
    if (settings.activityLevel) {
      Analytics.setUserProperty('activityLevel', settings.activityLevel);
    }
  }, []);

  const trackSkip = useCallback((atStep: number) => {
    Analytics.trackEvent('onboarding_skipped', {
      skippedAtStep: atStep,
    });
  }, []);

  return {
    trackStart,
    trackStepComplete,
    trackComplete,
    trackSkip,
  };
}

export default {
  useAnalytics,
  useScreenTracking,
  usePerformanceTracking,
  useEventTracking,
  useFoodLoggingAnalytics,
  useGoalAnalytics,
  useOnboardingAnalytics,
};
