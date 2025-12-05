/**
 * Global Error Handler Setup
 * 
 * Configures global error handling for:
 * - Uncaught JavaScript errors
 * - Unhandled promise rejections
 * - React Native error handling
 */

import { Alert, Platform } from 'react-native';
import { ErrorLogger } from './errorLogging';

// ============================================================================
// TYPES
// ============================================================================

type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;

interface ErrorHandlerConfig {
  showAlertOnFatal: boolean;
  enableRestartOnFatal: boolean;
  customHandler?: GlobalErrorHandler;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  showAlertOnFatal: true,
  enableRestartOnFatal: !__DEV__,
};

// ============================================================================
// ERROR HANDLER SETUP
// ============================================================================

let isSetup = false;
let config: ErrorHandlerConfig = DEFAULT_CONFIG;
let originalHandler: GlobalErrorHandler | null = null;

/**
 * Set up global error handling
 */
export function setupGlobalErrorHandler(
  customConfig?: Partial<ErrorHandlerConfig>
): void {
  if (isSetup) {
    ErrorLogger.logWarning('Global error handler already set up');
    return;
  }

  config = { ...DEFAULT_CONFIG, ...customConfig };

  // Store original handler
  // @ts-ignore - ErrorUtils is a React Native global
  if (global.ErrorUtils) {
    // @ts-ignore
    originalHandler = global.ErrorUtils.getGlobalHandler();
  }

  // Set up global handler
  // @ts-ignore
  if (global.ErrorUtils) {
    // @ts-ignore
    global.ErrorUtils.setGlobalHandler(handleGlobalError);
  }

  // Handle unhandled promise rejections
  setupPromiseRejectionHandler();

  isSetup = true;
  ErrorLogger.logInfo('Global error handler initialized');
}

/**
 * Main error handler function
 */
function handleGlobalError(error: Error, isFatal?: boolean): void {
  try {
    // Log the error
    if (isFatal) {
      ErrorLogger.logFatal(error, { source: 'global_handler', isFatal });
    } else {
      ErrorLogger.logError(error, { source: 'global_handler', isFatal });
    }

    // Call custom handler if provided
    config.customHandler?.(error, isFatal);

    // Show alert for fatal errors
    if (isFatal && config.showAlertOnFatal) {
      showFatalErrorAlert(error);
    }

    // Call original handler in development for stack traces
    if (__DEV__ && originalHandler) {
      originalHandler(error, isFatal);
    }
  } catch (handlerError) {
    // If our handler fails, try to log it and call original
    console.error('Error in global error handler:', handlerError);
    originalHandler?.(error, isFatal);
  }
}

/**
 * Show alert for fatal errors
 */
function showFatalErrorAlert(error: Error): void {
  const title = 'Unexpected Error';
  const message = __DEV__
    ? `${error.name}: ${error.message}\n\nThe app encountered an error. Please restart.`
    : 'The app encountered an error and needs to restart. We apologize for the inconvenience.';

  Alert.alert(
    title,
    message,
    [
      {
        text: 'Restart',
        onPress: () => {
          // In production, you would use:
          // RNRestart.Restart() or Updates.reloadAsync()
          if (__DEV__) {
            console.log('Would restart app in production');
          }
        },
      },
      ...(config.enableRestartOnFatal
        ? []
        : [
            {
              text: 'Dismiss',
              style: 'cancel' as const,
            },
          ]),
    ],
    { cancelable: false }
  );
}

/**
 * Handle unhandled promise rejections
 */
function setupPromiseRejectionHandler(): void {
  // React Native's default rejection tracking
  const rejectionTracking = require('promise/setimmediate/rejection-tracking');

  rejectionTracking.enable({
    allRejections: true,
    onUnhandled: (id: number, error: Error) => {
      ErrorLogger.logError(error, {
        source: 'unhandled_promise_rejection',
        rejectionId: id,
      });

      // Show warning in development
      if (__DEV__) {
        console.warn(
          `Unhandled Promise Rejection (id: ${id}):`,
          error.message || error
        );
      }
    },
    onHandled: (id: number) => {
      // Promise was eventually handled
      ErrorLogger.logInfo('Previously unhandled promise was handled', {
        rejectionId: id,
      });
    },
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          ErrorLogger.logError(error, { context, function: fn.name });
          throw error;
        }) as ReturnType<T>;
      }

      return result;
    } catch (error) {
      ErrorLogger.logError(error as Error, { context, function: fn.name });
      throw error;
    }
  }) as T;
}

/**
 * Safe wrapper for async operations
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options?: {
    context?: string;
    fallback?: T;
    rethrow?: boolean;
  }
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    ErrorLogger.logError(error as Error, {
      context: options?.context || 'safeAsync',
    });

    if (options?.rethrow) {
      throw error;
    }

    return options?.fallback;
  }
}

/**
 * Wrap a callback to catch and log errors
 */
export function safeCallback<T extends (...args: any[]) => void>(
  callback: T,
  context?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      callback(...args);
    } catch (error) {
      ErrorLogger.logError(error as Error, { context, callback: callback.name });
    }
  }) as T;
}

/**
 * Create a monitored async function
 */
export function createMonitoredAsync<T>(
  name: string,
  fn: () => Promise<T>
): () => Promise<T> {
  return async (): Promise<T> => {
    const startTime = Date.now();
    ErrorLogger.addBreadcrumb('async_operation', `Starting ${name}`);

    try {
      const result = await fn();
      
      const duration = Date.now() - startTime;
      ErrorLogger.addBreadcrumb('async_operation', `Completed ${name}`, {
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      ErrorLogger.logError(error as Error, {
        operation: name,
        duration,
      });
      throw error;
    }
  };
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Restore original error handler
 */
export function restoreOriginalHandler(): void {
  if (originalHandler) {
    // @ts-ignore
    global.ErrorUtils?.setGlobalHandler(originalHandler);
    isSetup = false;
    ErrorLogger.logInfo('Original error handler restored');
  }
}

export default {
  setupGlobalErrorHandler,
  withErrorHandling,
  safeAsync,
  safeCallback,
  createMonitoredAsync,
  restoreOriginalHandler,
};
