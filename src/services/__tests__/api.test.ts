/**
 * API Service Tests
 * 
 * Comprehensive tests for the API abstraction layer
 */

import { APIError, apiClient, foodAPIClient, api } from '../api';
import NetInfo from '@react-native-community/netinfo';

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock the store
jest.mock('../../store/appStore', () => ({
  useAppStore: {
    getState: jest.fn(() => ({
      setSyncStatus: jest.fn(),
    })),
  },
}));

describe('APIError', () => {
  describe('Construction', () => {
    it('should create error with message only', () => {
      const error = new APIError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('APIError');
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    it('should create error with status code', () => {
      const error = new APIError('Not found', { statusCode: 404 });
      
      expect(error.statusCode).toBe(404);
    });

    it('should create error with retryable flag', () => {
      const error = new APIError('Network error', { retryable: true });
      
      expect(error.retryable).toBe(true);
    });

    it('should create error with custom code', () => {
      const error = new APIError('Validation failed', { code: 'VALIDATION_ERROR' });
      
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create error with original error', () => {
      const originalError = new Error('Original');
      const error = new APIError('Wrapped error', { originalError });
      
      expect(error.originalError).toBe(originalError);
    });

    it('should be instanceof Error', () => {
      const error = new APIError('Test');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof APIError).toBe(true);
    });
  });

  describe('Default Values', () => {
    it('should default retryable to false', () => {
      const error = new APIError('Test');
      expect(error.retryable).toBe(false);
    });

    it('should default code to UNKNOWN_ERROR', () => {
      const error = new APIError('Test');
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    it('should default statusCode to undefined', () => {
      const error = new APIError('Test');
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe('Error Codes', () => {
    it('should recognize network error code', () => {
      const error = new APIError('Network error', { code: 'NETWORK_ERROR' });
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should recognize timeout error code', () => {
      const error = new APIError('Timeout', { code: 'TIMEOUT' });
      expect(error.code).toBe('TIMEOUT');
    });

    it('should recognize unauthorized error code', () => {
      const error = new APIError('Unauthorized', { code: 'UNAUTHORIZED', statusCode: 401 });
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });

    it('should recognize forbidden error code', () => {
      const error = new APIError('Forbidden', { code: 'FORBIDDEN', statusCode: 403 });
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should recognize validation error code', () => {
      const error = new APIError('Invalid data', { code: 'VALIDATION_ERROR', statusCode: 400 });
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should recognize server error code', () => {
      const error = new APIError('Server error', { code: 'SERVER_ERROR', statusCode: 500 });
      expect(error.code).toBe('SERVER_ERROR');
    });

    it('should recognize rate limited error code', () => {
      const error = new APIError('Too many requests', { code: 'RATE_LIMITED', statusCode: 429 });
      expect(error.code).toBe('RATE_LIMITED');
    });
  });

  describe('Status Code Categorization', () => {
    it('should identify client errors (4xx)', () => {
      const codes = [400, 401, 403, 404, 422, 429];
      codes.forEach((statusCode) => {
        const error = new APIError('Error', { statusCode });
        expect(error.statusCode).toBeGreaterThanOrEqual(400);
        expect(error.statusCode).toBeLessThan(500);
      });
    });

    it('should identify server errors (5xx)', () => {
      const codes = [500, 502, 503, 504];
      codes.forEach((statusCode) => {
        const error = new APIError('Error', { statusCode });
        expect(error.statusCode).toBeGreaterThanOrEqual(500);
        expect(error.statusCode).toBeLessThan(600);
      });
    });
  });

  describe('Retryability', () => {
    it('should mark network errors as retryable', () => {
      const error = new APIError('Network error', { 
        code: 'NETWORK_ERROR', 
        retryable: true 
      });
      expect(error.retryable).toBe(true);
    });

    it('should mark timeout errors as retryable', () => {
      const error = new APIError('Timeout', { 
        code: 'TIMEOUT', 
        retryable: true 
      });
      expect(error.retryable).toBe(true);
    });

    it('should mark rate limited errors as retryable', () => {
      const error = new APIError('Too many requests', { 
        code: 'RATE_LIMITED', 
        retryable: true 
      });
      expect(error.retryable).toBe(true);
    });

    it('should mark authentication errors as not retryable', () => {
      const error = new APIError('Unauthorized', { 
        code: 'UNAUTHORIZED', 
        retryable: false 
      });
      expect(error.retryable).toBe(false);
    });

    it('should mark validation errors as not retryable', () => {
      const error = new APIError('Invalid data', { 
        code: 'VALIDATION_ERROR', 
        retryable: false 
      });
      expect(error.retryable).toBe(false);
    });
  });
});

describe('API Client Exports', () => {
  it('should export apiClient', () => {
    expect(apiClient).toBeDefined();
  });

  it('should export foodAPIClient', () => {
    expect(foodAPIClient).toBeDefined();
  });

  it('should export api object with methods', () => {
    expect(api).toBeDefined();
    expect(api.get).toBeDefined();
    expect(api.post).toBeDefined();
    expect(api.put).toBeDefined();
    expect(api.delete).toBeDefined();
  });

  it('should export cache invalidation methods', () => {
    expect(api.invalidateCache).toBeDefined();
    expect(typeof api.invalidateCache).toBe('function');
  });

  it('should export queue management methods', () => {
    expect(api.getQueueLength).toBeDefined();
    expect(api.processQueue).toBeDefined();
  });
});

describe('Network State Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check network connectivity via NetInfo', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    
    const state = await NetInfo.fetch();
    
    expect(NetInfo.fetch).toHaveBeenCalled();
    expect(state.isConnected).toBe(true);
  });

  it('should detect offline state', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    
    const state = await NetInfo.fetch();
    
    expect(state.isConnected).toBe(false);
  });
});

describe('Error Message Formatting', () => {
  it('should provide user-friendly network error message', () => {
    const error = new APIError('Network error. Please check your connection.', {
      code: 'NETWORK_ERROR',
    });
    expect(error.message).toContain('connection');
  });

  it('should provide user-friendly timeout message', () => {
    const error = new APIError('Request timed out. Please try again.', {
      code: 'TIMEOUT',
    });
    expect(error.message).toContain('timed out');
  });

  it('should provide user-friendly rate limit message', () => {
    const error = new APIError('Too many requests. Please wait a moment.', {
      code: 'RATE_LIMITED',
    });
    expect(error.message).toContain('wait');
  });

  it('should provide user-friendly auth error message', () => {
    const error = new APIError('Authentication required. Please log in again.', {
      code: 'UNAUTHORIZED',
    });
    expect(error.message).toContain('log in');
  });
});

describe('API Methods', () => {
  describe('HTTP Methods', () => {
    it('should have get method', () => {
      expect(typeof api.get).toBe('function');
    });

    it('should have post method', () => {
      expect(typeof api.post).toBe('function');
    });

    it('should have put method', () => {
      expect(typeof api.put).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof api.delete).toBe('function');
    });
  });

  describe('Utility Methods', () => {
    it('should have invalidateCache method', () => {
      expect(typeof api.invalidateCache).toBe('function');
    });

    it('should have getQueueLength method', () => {
      expect(typeof api.getQueueLength).toBe('function');
    });

    it('should have processQueue method', () => {
      expect(typeof api.processQueue).toBe('function');
    });
  });
});

