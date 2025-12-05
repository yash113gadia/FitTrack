/**
 * Application Configuration
 * 
 * Centralizes all environment variables and configuration settings.
 * Uses expo-constants for secure access to environment variables.
 * Supports multiple environments: development, staging, production.
 */

import Constants from 'expo-constants';

// ============================================
// TYPES
// ============================================

export type Environment = 'dev' | 'staging' | 'prod';

export interface EnvironmentConfig {
  /** Current environment name */
  env: Environment;
  /** Base URL for API requests */
  apiUrl: string;
  /** Gemini AI API key */
  geminiApiKey: string;
  /** Enable debug logging and tools */
  enableDebug: boolean;
  /** Enable analytics tracking */
  enableAnalytics: boolean;
  /** App version from Constants */
  appVersion: string;
  /** Build number */
  buildNumber: string;
  /** Is development environment */
  isDev: boolean;
  /** Is staging environment */
  isStaging: boolean;
  /** Is production environment */
  isProd: boolean;
}

// ============================================
// ENVIRONMENT DETECTION
// ============================================

export const IS_DEV = __DEV__;
export const IS_PROD = !__DEV__;

/**
 * Get current environment from Expo config or auto-detect
 */
const getCurrentEnv = (): Environment => {
  const configEnv = Constants.expoConfig?.extra?.appEnv;
  if (configEnv && ['dev', 'staging', 'prod'].includes(configEnv)) {
    return configEnv as Environment;
  }
  return __DEV__ ? 'dev' : 'prod';
};

export const CURRENT_ENV = getCurrentEnv();

// ============================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// ============================================

const ENV_CONFIG: Record<Environment, Omit<EnvironmentConfig, 'env' | 'appVersion' | 'buildNumber' | 'isDev' | 'isStaging' | 'isProd'>> = {
  dev: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey || '',
    enableDebug: true,
    enableAnalytics: false,
  },
  staging: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.fittrack.app',
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey || '',
    enableDebug: true,
    enableAnalytics: true,
  },
  prod: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.fittrack.app',
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey || '',
    enableDebug: false,
    enableAnalytics: true,
  },
};

/**
 * Get environment-specific configuration
 */
export const getEnvConfig = (env: Environment = CURRENT_ENV): EnvironmentConfig => {
  const envConfig = ENV_CONFIG[env];
  
  return {
    ...envConfig,
    env,
    appVersion: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber || 
                 Constants.expoConfig?.android?.versionCode?.toString() || 
                 '1',
    isDev: env === 'dev',
    isStaging: env === 'staging',
    isProd: env === 'prod',
  };
};

export const envConfig = getEnvConfig();

// ============================================
// API CONFIGURATION
// ============================================

export const config = {
  // Gemini AI API
  gemini: {
    apiKey: envConfig.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash',
    maxTokens: 2048,
    temperature: 0.3,
  },

  // Open Food Facts API
  openFoodFacts: {
    baseUrl: 'https://world.openfoodfacts.org/api/v2',
    userAgent: process.env.EXPO_PUBLIC_OPENFOODFACTS_USER_AGENT || 'FitTrack/1.0',
  },

  // Backend API (for cloud sync, if applicable)
  api: {
    baseUrl: envConfig.apiUrl,
    timeout: 30000,
  },

  // Feature Flags
  features: {
    premiumEnabled: process.env.EXPO_PUBLIC_PREMIUM_ENABLED === 'true',
    analyticsEnabled: envConfig.enableAnalytics,
    debugMode: envConfig.enableDebug,
  },

  // App Info
  app: {
    name: 'FitTrack',
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',
    slug: Constants.expoConfig?.slug || 'fittrack',
  },

  // Limits and Validation
  limits: {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxFoodNameLength: 100,
    maxNotesLength: 500,
    minCalories: 1000,
    maxCalories: 10000,
    minProtein: 30,
    maxProtein: 500,
    minAge: 13,
    maxAge: 120,
    minWeight: 30,
    maxWeight: 500,
    minHeight: 100,
    maxHeight: 300,
  },

  // Cache TTLs (in milliseconds)
  cache: {
    foodSearch: 5 * 60 * 1000, // 5 minutes
    userProfile: 30 * 60 * 1000, // 30 minutes
    dailySummary: 1 * 60 * 1000, // 1 minute
  },
} as const;

// ============================================
// VALIDATION
// ============================================

/**
 * Check if required configuration is present
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check required API keys
  if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key_here') {
    missing.push('EXPO_PUBLIC_GEMINI_API_KEY');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Log configuration status (only in dev)
 */
export function logConfigStatus(): void {
  if (!envConfig.enableDebug) return;

  console.log('=== FitTrack Configuration ===');
  console.log(`Environment: ${envConfig.env}`);
  console.log(`Version: ${config.app.version}`);
  console.log(`API URL: ${envConfig.apiUrl}`);
  console.log(`Debug Mode: ${config.features.debugMode}`);
  console.log(`Analytics: ${config.features.analyticsEnabled}`);
  
  const validation = validateConfig();
  if (!validation.valid) {
    console.warn('Missing configuration:', validation.missing.join(', '));
  } else {
    console.log('All required configuration present ✓');
  }
  console.log('==============================');
}

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  // User
  USER: {
    PROFILE: '/user/profile',
    SETTINGS: '/user/settings',
    GOALS: '/user/goals',
  },
  // Food
  FOOD: {
    SEARCH: '/food/search',
    DETAILS: '/food/details',
    LOG: '/food/log',
    HISTORY: '/food/history',
  },
  // AI
  AI: {
    ANALYZE_IMAGE: '/ai/analyze-image',
    CHAT: '/ai/chat',
    SUGGESTIONS: '/ai/suggestions',
  },
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * Feature flags for gradual rollout and A/B testing
 */
export const getFeatureFlags = (env: Environment = CURRENT_ENV) => ({
  // AI Features
  enableAIFoodRecognition: true,
  enableChatbot: true,
  enableMealSuggestions: env !== 'dev', // Disabled in dev to save API calls
  
  // Premium Features
  enablePremiumFeatures: false,
  enableInAppPurchases: env === 'prod',
  
  // Beta Features
  enableBarcodeScanner: true,
  enableSocialSharing: env !== 'prod', // Beta only
  enableAdvancedAnalytics: true,
  
  // Debug Features
  enableNetworkInspector: env === 'dev',
  enablePerformanceMonitor: env !== 'prod',
  enableMockData: env === 'dev',
});

// ============================================
// TIMEOUT CONFIGURATIONS
// ============================================

export const TIMEOUTS = {
  /** API request timeout in ms */
  API_REQUEST: 30000,
  /** Image upload timeout in ms */
  IMAGE_UPLOAD: 60000,
  /** AI analysis timeout in ms */
  AI_ANALYSIS: 45000,
  /** Database operation timeout in ms */
  DATABASE: 5000,
  /** Cache expiry in ms (24 hours) */
  CACHE_EXPIRY: 24 * 60 * 60 * 1000,
  /** Session timeout in ms (30 minutes) */
  SESSION_TIMEOUT: 30 * 60 * 1000,
} as const;

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: '@fittrack/auth_token',
  REFRESH_TOKEN: '@fittrack/refresh_token',
  USER_DATA: '@fittrack/user_data',
  
  // App State
  ONBOARDING_COMPLETE: '@fittrack/onboarding_complete',
  APP_SETTINGS: '@fittrack/app_settings',
  THEME_PREFERENCE: '@fittrack/theme',
  
  // Analytics
  ANALYTICS_CONSENT: '@fittrack/analytics_consent',
  ANALYTICS_USER_ID: '@fittrack/analytics_user_id',
  ANALYTICS_QUEUE: '@fittrack/analytics_queue',
  
  // Cache
  FOOD_CACHE: '@fittrack/food_cache',
  SEARCH_HISTORY: '@fittrack/search_history',
  
  // Notifications
  NOTIFICATION_SETTINGS: '@fittrack/notification_settings',
  PUSH_TOKEN: '@fittrack/push_token',
} as const;

export default config;
