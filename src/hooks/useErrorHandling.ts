/**
 * Error Handling Hooks
 * 
 * React hooks for error handling in components:
 * - useErrorHandler: Report and handle errors
 * - useAsyncError: Handle async operation errors
 * - useNetworkStatus: Track network connectivity
 * - useSafeState: State that doesn't update unmounted components
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { ErrorLogger, logError } from '../services/errorLogging';
import {
  NetworkStatus,
  parseNetworkError,
  NetworkError,
} from '../services/networkErrorHandling';

// ============================================================================
// useErrorHandler
// ============================================================================

interface ErrorHandlerOptions {
  componentName?: string;
  showAlert?: boolean;
  alertTitle?: string;
  onError?: (error: Error) => void;
}

interface ErrorHandlerResult {
  error: Error | null;
  handleError: (error: Error) => void;
  clearError: () => void;
  isError: boolean;
}

/**
 * Hook for handling errors in components
 */
export function useErrorHandler(
  options: ErrorHandlerOptions = {}
): ErrorHandlerResult {
  const [error, setError] = useState<Error | null>(null);
  const {
    componentName = 'Unknown',
    showAlert = false,
    alertTitle = 'Error',
    onError,
  } = options;

  const handleError = useCallback(
    (err: Error) => {
      setError(err);

      // Log the error
      ErrorLogger.logComponentError(componentName, err);

      // Call custom handler
      onError?.(err);

      // Show alert if configured
      if (showAlert) {
        Alert.alert(alertTitle, err.message, [{ text: 'OK' }]);
      }
    },
    [componentName, showAlert, alertTitle, onError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    isError: error !== null,
  };
}

// ============================================================================
// useAsyncError
// ============================================================================

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

interface AsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
  defaultData?: T;
}

interface AsyncResult<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsyncError<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: AsyncOptions<T> = {}
): AsyncResult<T> {
  const { onSuccess, onError, immediate = false, defaultData = null } = options;
  const isMounted = useRef(true);

  const [state, setState] = useState<AsyncState<T>>({
    data: defaultData as T | null,
    error: null,
    isLoading: immediate,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      if (!isMounted.current) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await asyncFn(...args);

        if (isMounted.current) {
          setState({ data: result, error: null, isLoading: false });
          onSuccess?.(result);
        }

        return result;
      } catch (error) {
        const err = error as Error;

        if (isMounted.current) {
          setState((prev) => ({
            ...prev,
            error: err,
            isLoading: false,
          }));
          onError?.(err);
          logError(err, { context: 'useAsyncError' });
        }

        return null;
      }
    },
    [asyncFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: defaultData as T | null,
      error: null,
      isLoading: false,
    });
  }, [defaultData]);

  // Execute immediately if configured
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}

// ============================================================================
// useNetworkStatus
// ============================================================================

interface NetworkStatusResult {
  isConnected: boolean;
  connectionType: string;
  lastError: NetworkError | null;
  checkConnection: () => Promise<boolean>;
}

/**
 * Hook for tracking network connectivity
 */
export function useNetworkStatus(): NetworkStatusResult {
  const [isConnected, setIsConnected] = useState(NetworkStatus.getIsConnected());
  const [connectionType, setConnectionType] = useState(
    NetworkStatus.getConnectionType()
  );
  const [lastError, setLastError] = useState<NetworkError | null>(null);

  useEffect(() => {
    const unsubscribe = NetworkStatus.addListener((connected) => {
      setIsConnected(connected);
      setConnectionType(NetworkStatus.getConnectionType());

      if (!connected) {
        setLastError(parseNetworkError(new Error('Network disconnected')));
      } else {
        setLastError(null);
      }
    });

    return unsubscribe;
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const connected = NetworkStatus.getIsConnected();
    setIsConnected(connected);
    return connected;
  }, []);

  return {
    isConnected,
    connectionType,
    lastError,
    checkConnection,
  };
}

// ============================================================================
// useSafeState
// ============================================================================

/**
 * useState that doesn't update if component is unmounted
 * Prevents "Can't perform state update on unmounted component" warnings
 */
export function useSafeState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMounted.current) {
      setState(value);
    }
  }, []);

  return [state, safeSetState];
}

// ============================================================================
// useRetry
// ============================================================================

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

interface RetryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
  retry: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for operations that can be retried
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
): RetryResult<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async (): Promise<void> => {
    if (!isMounted.current) return;

    setIsLoading(true);
    setError(null);

    let currentRetry = 0;
    let lastError: Error | null = null;

    while (currentRetry <= maxRetries) {
      try {
        const result = await asyncFn();

        if (isMounted.current) {
          setData(result);
          setIsLoading(false);
          setRetryCount(currentRetry);
        }

        return;
      } catch (err) {
        lastError = err as Error;
        currentRetry++;

        if (currentRetry <= maxRetries) {
          const waitTime = backoff
            ? delay * Math.pow(2, currentRetry - 1)
            : delay;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          
          if (isMounted.current) {
            setRetryCount(currentRetry);
          }
        }
      }
    }

    if (isMounted.current) {
      setError(lastError);
      setIsLoading(false);
      logError(lastError!, { context: 'useRetry', retries: currentRetry });
    }
  }, [asyncFn, maxRetries, delay, backoff]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setRetryCount(0);
  }, []);

  return {
    data,
    error,
    isLoading,
    retryCount,
    retry: execute,
    reset,
  };
}

// ============================================================================
// useErrorBoundary (for functional components)
// ============================================================================

/**
 * Hook to trigger error boundary from functional components
 */
export function useErrorBoundary(): (error: Error) => void {
  const [, setError] = useState<Error | null>(null);

  return useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

export default {
  useErrorHandler,
  useAsyncError,
  useNetworkStatus,
  useSafeState,
  useRetry,
  useErrorBoundary,
};
