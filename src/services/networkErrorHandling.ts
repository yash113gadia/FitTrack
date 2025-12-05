/**
 * Network Error Handling Utilities
 * 
 * Provides:
 * - Retry with exponential backoff
 * - User-friendly error messages
 * - Offline detection and handling
 * - Request queuing for offline sync
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorLogger } from './errorLogging';

// ============================================================================
// TYPES
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

export type NetworkErrorType =
  | 'NO_CONNECTION'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'CLIENT_ERROR'
  | 'UNKNOWN';

export interface NetworkError {
  type: NetworkErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  retryable: boolean;
  originalError?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

const QUEUE_STORAGE_KEY = '@fittrack_request_queue';
const TIMEOUT_MS = 30000;

// User-friendly error messages
const ERROR_MESSAGES: Record<NetworkErrorType, string> = {
  NO_CONNECTION: "You're offline. Please check your internet connection.",
  TIMEOUT: 'The request took too long. Please try again.',
  SERVER_ERROR: "Our servers are having issues. We're working on it!",
  CLIENT_ERROR: 'Something went wrong with your request.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

// ============================================================================
// NETWORK STATUS MANAGER
// ============================================================================

class NetworkStatusManager {
  private isConnected: boolean = true;
  private connectionType: string = 'unknown';
  private listeners: Set<(isConnected: boolean) => void> = new Set();
  private unsubscribe: (() => void) | null = null;

  async init(): Promise<void> {
    // Get initial state
    const state = await NetInfo.fetch();
    this.updateState(state);

    // Subscribe to changes
    this.unsubscribe = NetInfo.addEventListener((state) => {
      this.updateState(state);
    });
  }

  private updateState(state: NetInfoState): void {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;
    this.connectionType = state.type;

    // Notify listeners on change
    if (wasConnected !== this.isConnected) {
      ErrorLogger.addBreadcrumb(
        'network',
        `Network ${this.isConnected ? 'connected' : 'disconnected'}`,
        { type: this.connectionType }
      );

      this.listeners.forEach((listener) => listener(this.isConnected));

      // Process queue when back online
      if (this.isConnected) {
        RequestQueue.processQueue();
      }
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getConnectionType(): string {
    return this.connectionType;
  }

  addListener(listener: (isConnected: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  cleanup(): void {
    this.unsubscribe?.();
    this.listeners.clear();
  }
}

export const NetworkStatus = new NetworkStatusManager();

// ============================================================================
// RETRY UTILITIES
// ============================================================================

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateBackoff = (
  attempt: number,
  config: RetryConfig
): number => {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffFactor, attempt),
    config.maxDelay
  );
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
};

/**
 * Default condition for retrying requests
 */
const defaultRetryCondition = (error: any): boolean => {
  // Retry on network errors
  if (!error.response) return true;

  const status = error.response?.status;
  // Retry on 5xx errors and specific 4xx errors
  return status >= 500 || status === 429 || status === 408;
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const retryCondition = finalConfig.retryCondition || defaultRetryCondition;

  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      if (attempt >= finalConfig.maxRetries || !retryCondition(error)) {
        break;
      }

      // Calculate and wait for backoff
      const delay = calculateBackoff(attempt, finalConfig);
      ErrorLogger.logWarning(`Retry attempt ${attempt + 1} after ${delay}ms`, {
        error: error.message,
      });
      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================================================
// ERROR PARSING
// ============================================================================

/**
 * Parse any error into a structured NetworkError
 */
export function parseNetworkError(error: any): NetworkError {
  // No connection
  if (!NetworkStatus.getIsConnected()) {
    return {
      type: 'NO_CONNECTION',
      message: 'No network connection',
      userMessage: ERROR_MESSAGES.NO_CONNECTION,
      retryable: true,
      originalError: error,
    };
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      type: 'TIMEOUT',
      message: 'Request timeout',
      userMessage: ERROR_MESSAGES.TIMEOUT,
      retryable: true,
      originalError: error,
    };
  }

  // HTTP errors
  const status = error.response?.status;
  if (status) {
    if (status >= 500) {
      return {
        type: 'SERVER_ERROR',
        message: `Server error: ${status}`,
        userMessage: ERROR_MESSAGES.SERVER_ERROR,
        statusCode: status,
        retryable: true,
        originalError: error,
      };
    }
    if (status >= 400) {
      return {
        type: 'CLIENT_ERROR',
        message: error.response?.data?.message || `Client error: ${status}`,
        userMessage: getClientErrorMessage(status, error.response?.data),
        statusCode: status,
        retryable: status === 429 || status === 408,
        originalError: error,
      };
    }
  }

  // Unknown error
  return {
    type: 'UNKNOWN',
    message: error.message || 'Unknown error',
    userMessage: ERROR_MESSAGES.UNKNOWN,
    retryable: false,
    originalError: error,
  };
}

/**
 * Get user-friendly message for client errors
 */
function getClientErrorMessage(status: number, data?: any): string {
  switch (status) {
    case 400:
      return data?.message || 'Invalid request. Please check your input.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return "You don't have permission to do this.";
    case 404:
      return 'The requested item was not found.';
    case 409:
      return 'This conflicts with existing data.';
    case 422:
      return 'Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment.';
    default:
      return ERROR_MESSAGES.CLIENT_ERROR;
  }
}

// ============================================================================
// REQUEST QUEUE (FOR OFFLINE SYNC)
// ============================================================================

class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;

  async init(): Promise<void> {
    await this.loadQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Loading request queue' });
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Saving request queue' });
    }
  }

  async addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    
    // Sort by priority
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    await this.saveQueue();
    ErrorLogger.logInfo('Request queued for offline sync', { id, url: request.url });

    return id;
  }

  async removeFromQueue(id: string): Promise<void> {
    this.queue = this.queue.filter((r) => r.id !== id);
    await this.saveQueue();
  }

  async processQueue(): Promise<void> {
    if (!NetworkStatus.getIsConnected() || this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    ErrorLogger.logInfo('Processing offline request queue', { count: this.queue.length });

    const processedIds: string[] = [];

    for (const request of this.queue) {
      if (!NetworkStatus.getIsConnected()) {
        break; // Stop if we lose connection
      }

      try {
        await this.executeRequest(request);
        processedIds.push(request.id);
      } catch (error) {
        request.retryCount++;
        
        // Remove if too many retries
        if (request.retryCount >= 5) {
          processedIds.push(request.id);
          ErrorLogger.logError(error as Error, {
            context: 'Request failed permanently',
            requestId: request.id,
          });
        }
      }
    }

    // Remove processed requests
    this.queue = this.queue.filter((r) => !processedIds.includes(r.id));
    await this.saveQueue();

    this.isProcessing = false;
    ErrorLogger.logInfo('Queue processing complete', { processed: processedIds.length });
  }

  private async executeRequest(request: QueuedRequest): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
}

export const RequestQueue = new RequestQueueManager();

// ============================================================================
// FETCH WRAPPER WITH ERROR HANDLING
// ============================================================================

export interface FetchOptions extends RequestInit {
  retry?: Partial<RetryConfig>;
  timeout?: number;
  queueIfOffline?: boolean;
  queuePriority?: 'high' | 'normal' | 'low';
}

export async function fetchWithErrorHandling<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    retry,
    timeout = TIMEOUT_MS,
    queueIfOffline = false,
    queuePriority = 'normal',
    ...fetchOptions
  } = options;

  // Check if offline and should queue
  if (!NetworkStatus.getIsConnected() && queueIfOffline) {
    await RequestQueue.addToQueue({
      url,
      method: fetchOptions.method || 'GET',
      body: fetchOptions.body,
      headers: fetchOptions.headers as Record<string, string>,
      priority: queuePriority,
    });
    throw parseNetworkError(new Error('Offline'));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const executeRequest = async (): Promise<T> => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}`);
        error.response = {
          status: response.status,
          data: await response.json().catch(() => null),
        };
        throw error;
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError: any = new Error('Request timeout');
        timeoutError.code = 'ECONNABORTED';
        throw timeoutError;
      }
      
      throw error;
    }
  };

  try {
    if (retry) {
      return await withRetry(executeRequest, retry);
    }
    return await executeRequest();
  } catch (error) {
    const networkError = parseNetworkError(error);
    ErrorLogger.logError(error as Error, {
      url,
      networkError,
    });
    throw networkError;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initNetworkErrorHandling(): Promise<void> {
  await NetworkStatus.init();
  await RequestQueue.init();
  ErrorLogger.logInfo('Network error handling initialized');
}

export default {
  NetworkStatus,
  RequestQueue,
  withRetry,
  parseNetworkError,
  fetchWithErrorHandling,
  initNetworkErrorHandling,
};
