import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig,
  AxiosError 
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAppStore } from '../store/appStore';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface APIConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

export interface RequestConfig extends AxiosRequestConfig {
  cache?: CacheConfig;
  retry?: boolean;
  skipAuth?: boolean;
}

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  config?: RequestConfig;
  timestamp: number;
  retries: number;
}

// ============================================
// API ERROR CLASS
// ============================================

export class APIError extends Error {
  statusCode?: number;
  retryable: boolean;
  originalError: any;
  code: string;

  constructor(
    message: string, 
    options: {
      statusCode?: number;
      retryable?: boolean;
      originalError?: any;
      code?: string;
    } = {}
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.originalError = options.originalError;
    this.code = options.code ?? 'UNKNOWN_ERROR';
  }
}

// ============================================
// ERROR HANDLER
// ============================================

function handleAPIError(error: any): APIError {
  // Network error (no response)
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return new APIError('Network error. Please check your connection.', {
      retryable: true,
      originalError: error,
      code: 'NETWORK_ERROR',
    });
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Timeout
  if (error.code === 'ECONNABORTED' || status === 408) {
    return new APIError('Request timed out. Please try again.', {
      statusCode: status,
      retryable: true,
      originalError: error,
      code: 'TIMEOUT',
    });
  }

  // Rate limiting
  if (status === 429) {
    return new APIError('Too many requests. Please wait a moment.', {
      statusCode: status,
      retryable: true,
      originalError: error,
      code: 'RATE_LIMITED',
    });
  }

  // Authentication errors
  if (status === 401) {
    return new APIError('Authentication required. Please log in again.', {
      statusCode: status,
      retryable: false,
      originalError: error,
      code: 'UNAUTHORIZED',
    });
  }

  if (status === 403) {
    return new APIError('You do not have permission to perform this action.', {
      statusCode: status,
      retryable: false,
      originalError: error,
      code: 'FORBIDDEN',
    });
  }

  // Not found
  if (status === 404) {
    return new APIError(data?.message || 'Resource not found.', {
      statusCode: status,
      retryable: false,
      originalError: error,
      code: 'NOT_FOUND',
    });
  }

  // Validation errors
  if (status === 400 || status === 422) {
    return new APIError(data?.message || 'Invalid request data.', {
      statusCode: status,
      retryable: false,
      originalError: error,
      code: 'VALIDATION_ERROR',
    });
  }

  // Server errors (retryable)
  if (status >= 500) {
    const retryableCodes = [500, 502, 503, 504];
    return new APIError('Server error. Please try again later.', {
      statusCode: status,
      retryable: retryableCodes.includes(status),
      originalError: error,
      code: 'SERVER_ERROR',
    });
  }

  // Generic client error
  if (status >= 400 && status < 500) {
    return new APIError(data?.message || 'Request failed.', {
      statusCode: status,
      retryable: false,
      originalError: error,
      code: 'CLIENT_ERROR',
    });
  }

  // Unknown error
  return new APIError('An unexpected error occurred.', {
    originalError: error,
    code: 'UNKNOWN_ERROR',
  });
}

// ============================================
// API CLIENT CLASS
// ============================================

class APIClient {
  private axiosInstance: AxiosInstance;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue: boolean = false;
  private readonly CACHE_PREFIX = 'api_cache_';
  private readonly QUEUE_KEY = 'api_request_queue';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  constructor(config: APIConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
    this.loadQueueFromStorage();
    this.setupNetworkListener();
  }

  // ========== INTERCEPTORS ==========

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Check online status
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
          // Will be caught and potentially queued
          throw new APIError('No internet connection', {
            code: 'OFFLINE',
            retryable: true,
          });
        }

        // Add auth token if needed
        const customConfig = config as InternalAxiosRequestConfig & { skipAuth?: boolean };
        if (!customConfig.skipAuth) {
          const token = await this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const apiError = handleAPIError(error);
        
        // Update store sync status on error
        useAppStore.getState().setSyncStatus('error');
        
        throw apiError;
      }
    );
  }

  // ========== AUTH TOKEN ==========

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  // ========== CACHING ==========

  private getCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${this.CACHE_PREFIX}${url}${paramString}`;
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const parsed: CachedResponse<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp < parsed.ttl) {
        return parsed.data;
      }

      // Cache expired, remove it
      await AsyncStorage.removeItem(key);
      return null;
    } catch {
      return null;
    }
  }

  private async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const cached: CachedResponse<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  async invalidateCache(pattern?: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
      
      if (pattern) {
        const toRemove = cacheKeys.filter(k => k.includes(pattern));
        await AsyncStorage.multiRemove(toRemove);
      } else {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('Failed to invalidate cache:', error);
    }
  }

  // ========== RETRY LOGIC ==========

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = 0
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (error instanceof APIError && error.retryable && retries < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[retries] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        
        console.log(`Retrying request (attempt ${retries + 1}/${this.MAX_RETRIES}) after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries + 1);
      }
      throw error;
    }
  }

  // ========== OFFLINE QUEUE ==========

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (stored) {
        this.requestQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load request queue:', error);
    }
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.requestQueue));
    } catch (error) {
      console.warn('Failed to save request queue:', error);
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: this.generateRequestId(),
      timestamp: Date.now(),
      retries: 0,
    };

    this.requestQueue.push(queuedRequest);
    await this.saveQueueToStorage();
    
    console.log('Request queued for later:', queuedRequest.url);
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const { setOnlineStatus, setSyncStatus } = useAppStore.getState();
      setOnlineStatus(state.isConnected ?? false);

      if (state.isConnected && this.requestQueue.length > 0) {
        this.processQueue();
      }
    });
  }

  async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    useAppStore.getState().setSyncStatus('syncing');

    const queue = [...this.requestQueue];
    const failedRequests: QueuedRequest[] = [];

    for (const request of queue) {
      try {
        switch (request.method) {
          case 'GET':
            await this.get(request.url, request.config);
            break;
          case 'POST':
            await this.post(request.url, request.data, request.config);
            break;
          case 'PUT':
            await this.put(request.url, request.data, request.config);
            break;
          case 'DELETE':
            await this.delete(request.url, request.config);
            break;
        }

        // Remove from queue on success
        const index = this.requestQueue.findIndex(r => r.id === request.id);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
        }
      } catch (error) {
        request.retries++;
        if (request.retries < this.MAX_RETRIES) {
          failedRequests.push(request);
        } else {
          console.error('Request failed after max retries:', request.url);
        }
      }
    }

    this.requestQueue = failedRequests;
    await this.saveQueueToStorage();

    this.isProcessingQueue = false;
    useAppStore.getState().setSyncStatus(this.requestQueue.length > 0 ? 'error' : 'idle');
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }

  // ========== HTTP METHODS ==========

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const { cache, retry = true, ...axiosConfig } = config ?? {};

    // Check cache first
    if (cache?.enabled) {
      const cacheKey = cache.key ?? this.getCacheKey(url, axiosConfig.params);
      const cached = await this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestFn = async (): Promise<T> => {
      const response = await this.axiosInstance.get<T>(url, axiosConfig);
      
      // Cache the response
      if (cache?.enabled) {
        const cacheKey = cache.key ?? this.getCacheKey(url, axiosConfig.params);
        await this.setCache(cacheKey, response.data, cache.ttl);
      }

      useAppStore.getState().setSyncStatus('idle');
      return response.data;
    };

    return retry ? this.retryRequest(requestFn) : requestFn();
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const { cache, retry = true, ...axiosConfig } = config ?? {};

    const requestFn = async (): Promise<T> => {
      try {
        const response = await this.axiosInstance.post<T>(url, data, axiosConfig);
        
        // Invalidate related cache on write
        await this.invalidateCache(url.split('/')[1]); // Invalidate by resource type
        
        useAppStore.getState().setSyncStatus('idle');
        return response.data;
      } catch (error) {
        // Queue for offline if network error
        if (error instanceof APIError && error.code === 'OFFLINE') {
          await this.addToQueue({ method: 'POST', url, data, config });
          throw error;
        }
        throw error;
      }
    };

    return retry ? this.retryRequest(requestFn) : requestFn();
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const { cache, retry = true, ...axiosConfig } = config ?? {};

    const requestFn = async (): Promise<T> => {
      try {
        const response = await this.axiosInstance.put<T>(url, data, axiosConfig);
        
        // Invalidate related cache on write
        await this.invalidateCache(url.split('/')[1]);
        
        useAppStore.getState().setSyncStatus('idle');
        return response.data;
      } catch (error) {
        if (error instanceof APIError && error.code === 'OFFLINE') {
          await this.addToQueue({ method: 'PUT', url, data, config });
          throw error;
        }
        throw error;
      }
    };

    return retry ? this.retryRequest(requestFn) : requestFn();
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const { cache, retry = true, ...axiosConfig } = config ?? {};

    const requestFn = async (): Promise<T> => {
      try {
        const response = await this.axiosInstance.delete<T>(url, axiosConfig);
        
        // Invalidate related cache on write
        await this.invalidateCache(url.split('/')[1]);
        
        useAppStore.getState().setSyncStatus('idle');
        return response.data;
      } catch (error) {
        if (error instanceof APIError && error.code === 'OFFLINE') {
          await this.addToQueue({ method: 'DELETE', url, config });
          throw error;
        }
        throw error;
      }
    };

    return retry ? this.retryRequest(requestFn) : requestFn();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

// Default API client for the app's backend
export const apiClient = new APIClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.fittrack.app',
  timeout: 30000,
});

// Food database API client (e.g., Open Food Facts)
export const foodAPIClient = new APIClient({
  baseURL: 'https://world.openfoodfacts.org/api/v2',
  timeout: 15000,
});

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const api = {
  get: <T>(url: string, config?: RequestConfig) => apiClient.get<T>(url, config),
  post: <T>(url: string, data?: any, config?: RequestConfig) => apiClient.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config?: RequestConfig) => apiClient.put<T>(url, data, config),
  delete: <T>(url: string, config?: RequestConfig) => apiClient.delete<T>(url, config),
  invalidateCache: (pattern?: string) => apiClient.invalidateCache(pattern),
  getQueueLength: () => apiClient.getQueueLength(),
  processQueue: () => apiClient.processQueue(),
};

export default api;
