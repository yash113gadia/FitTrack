/**
 * Security Utilities for FitTrack
 * 
 * Provides encryption, secure storage, input validation,
 * and other security best practices.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { z } from 'zod';

// ============================================
// CONSTANTS
// ============================================

const ENCRYPTION_ALGORITHM = Crypto.CryptoDigestAlgorithm.SHA256;
const KEY_STORAGE_KEY = 'fittrack_encryption_key';
const AUTH_TOKEN_KEY = 'fittrack_auth_token';
const REFRESH_TOKEN_KEY = 'fittrack_refresh_token';

// ============================================
// SECURE STORAGE
// ============================================

/**
 * Securely store a value using expo-secure-store
 * Falls back to console warning if secure store is unavailable
 */
export async function secureStore(key: string, value: string): Promise<boolean> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      console.warn('SecureStore not available on this device');
      return false;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
    return true;
  } catch (error) {
    console.error('SecureStore error:', error);
    return false;
  }
}

/**
 * Retrieve a value from secure storage
 */
export async function secureRetrieve(key: string): Promise<string | null> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      console.warn('SecureStore not available on this device');
      return null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('SecureStore retrieval error:', error);
    return null;
  }
}

/**
 * Delete a value from secure storage
 */
export async function secureDelete(key: string): Promise<boolean> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) return false;
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error('SecureStore delete error:', error);
    return false;
  }
}

// ============================================
// ENCRYPTION
// ============================================

/**
 * Generate a device-specific encryption key
 * Uses device identifiers to derive a unique key
 */
export async function getEncryptionKey(): Promise<string> {
  // Check if we already have a stored key
  const storedKey = await secureRetrieve(KEY_STORAGE_KEY);
  if (storedKey) {
    return storedKey;
  }

  // Generate new key based on device-specific data
  const deviceId = Device.modelId || 'unknown';
  const osVersion = Device.osVersion || 'unknown';
  const brand = Device.brand || 'unknown';
  
  // Create a seed from device data
  const seed = `${deviceId}-${osVersion}-${brand}-${Date.now()}`;
  
  // Hash the seed to create the encryption key
  const key = await Crypto.digestStringAsync(ENCRYPTION_ALGORITHM, seed);
  
  // Store the key securely
  await secureStore(KEY_STORAGE_KEY, key);
  
  return key;
}

/**
 * Encrypt sensitive data using SHA-256 hash
 * For actual encryption, you'd use a proper encryption library
 * This provides a one-way hash for sensitive data like passwords
 */
export async function hashSensitiveData(data: string): Promise<string> {
  const key = await getEncryptionKey();
  const saltedData = `${key}:${data}`;
  return await Crypto.digestStringAsync(ENCRYPTION_ALGORITHM, saltedData);
}

/**
 * Generate a random string for tokens, IDs, etc.
 */
export async function generateRandomString(length: number = 32): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(new Uint8Array(bytes))
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

// ============================================
// INPUT VALIDATION SCHEMAS (Zod)
// ============================================

// User profile validation
export const UserProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  gender: z.enum(['male', 'female']),
  age: z.number()
    .int('Age must be a whole number')
    .min(13, 'Age must be at least 13')
    .max(120, 'Age must be less than 120'),
  weight: z.number()
    .min(30, 'Weight must be at least 30 kg')
    .max(500, 'Weight must be less than 500 kg'),
  height: z.number()
    .min(100, 'Height must be at least 100 cm')
    .max(300, 'Height must be less than 300 cm'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
});

// Daily goals validation
export const DailyGoalsSchema = z.object({
  calories: z.number()
    .min(1000, 'Calories must be at least 1000')
    .max(10000, 'Calories must be less than 10000'),
  protein: z.number()
    .min(30, 'Protein must be at least 30g')
    .max(500, 'Protein must be less than 500g'),
  fats: z.number()
    .min(20, 'Fats must be at least 20g')
    .max(300, 'Fats must be less than 300g'),
  carbs: z.number()
    .min(50, 'Carbs must be at least 50g')
    .max(800, 'Carbs must be less than 800g'),
});

// Food log validation
export const FoodLogSchema = z.object({
  foodItemId: z.number().positive(),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(100, 'Quantity seems too high'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Reminder validation
export const ReminderSchema = z.object({
  type: z.enum(['meal', 'supplement', 'water', 'weigh_in', 'custom']),
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title is too long'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  days: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day'),
  enabled: z.boolean(),
});

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potential SQL injection characters
    .replace(/['";\\]/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .substring(0, 10000);
}

/**
 * Sanitize input for AI prompts
 * Removes potential prompt injection attempts
 */
export function sanitizeForAI(input: string): string {
  if (!input) return '';
  
  return input
    // Remove common prompt injection patterns
    .replace(/ignore (previous|all|the above) instructions?/gi, '')
    .replace(/you are now/gi, '')
    .replace(/act as/gi, '')
    .replace(/pretend to be/gi, '')
    .replace(/system:/gi, '')
    .replace(/assistant:/gi, '')
    .replace(/user:/gi, '')
    // Remove markdown that might confuse the model
    .replace(/```/g, '')
    // Basic string sanitization
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 1000);
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any, min: number, max: number, defaultValue: number): number {
  const num = parseFloat(input);
  if (isNaN(num)) return defaultValue;
  return Math.max(min, Math.min(max, num));
}

// ============================================
// AUTHENTICATION TOKEN MANAGEMENT
// ============================================

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

/**
 * Store authentication tokens securely
 */
export async function storeAuthTokens(tokens: TokenData): Promise<boolean> {
  try {
    await secureStore(AUTH_TOKEN_KEY, tokens.accessToken);
    await secureStore(REFRESH_TOKEN_KEY, JSON.stringify({
      token: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    }));
    return true;
  } catch (error) {
    console.error('Failed to store auth tokens:', error);
    return false;
  }
}

/**
 * Retrieve the access token
 */
export async function getAccessToken(): Promise<string | null> {
  return secureRetrieve(AUTH_TOKEN_KEY);
}

/**
 * Check if the token is expired or about to expire
 */
export async function isTokenExpired(bufferSeconds: number = 60): Promise<boolean> {
  try {
    const refreshData = await secureRetrieve(REFRESH_TOKEN_KEY);
    if (!refreshData) return true;
    
    const { expiresAt } = JSON.parse(refreshData);
    const now = Math.floor(Date.now() / 1000);
    
    return now >= (expiresAt - bufferSeconds);
  } catch {
    return true;
  }
}

/**
 * Get refresh token for token renewal
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const refreshData = await secureRetrieve(REFRESH_TOKEN_KEY);
    if (!refreshData) return null;
    
    const { token } = JSON.parse(refreshData);
    return token;
  } catch {
    return null;
  }
}

/**
 * Clear all authentication data (logout)
 */
export async function clearAuthData(): Promise<void> {
  await secureDelete(AUTH_TOKEN_KEY);
  await secureDelete(REFRESH_TOKEN_KEY);
}

/**
 * Clear all sensitive data (for account deletion)
 */
export async function clearAllSensitiveData(): Promise<void> {
  await clearAuthData();
  await secureDelete(KEY_STORAGE_KEY);
  // Clear any other sensitive keys as needed
}

// ============================================
// PRIVACY & COMPLIANCE
// ============================================

export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  personalizedAdsEnabled: boolean;
  dataShareEnabled: boolean;
}

const PRIVACY_SETTINGS_KEY = 'privacy_settings';

/**
 * Get user's privacy preferences
 */
export async function getPrivacySettings(): Promise<PrivacySettings> {
  try {
    const stored = await secureRetrieve(PRIVACY_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  
  // Default settings (privacy-first)
  return {
    analyticsEnabled: false,
    crashReportingEnabled: false,
    personalizedAdsEnabled: false,
    dataShareEnabled: false,
  };
}

/**
 * Update privacy preferences
 */
export async function updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
  const current = await getPrivacySettings();
  const updated = { ...current, ...settings };
  await secureStore(PRIVACY_SETTINGS_KEY, JSON.stringify(updated));
}

/**
 * Anonymize user data for analytics
 */
export function anonymizeForAnalytics(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['name', 'email', 'phone', 'address', 'id', 'userId'];
  const anonymized = { ...data };
  
  for (const field of sensitiveFields) {
    if (anonymized[field]) {
      anonymized[field] = '[REDACTED]';
    }
  }
  
  return anonymized;
}

// ============================================
// APP HARDENING
// ============================================

/**
 * Check if device might be rooted/jailbroken
 * Note: This is not foolproof and can be bypassed
 */
export function checkDeviceSecurity(): { 
  isSecure: boolean; 
  warnings: string[] 
} {
  const warnings: string[] = [];
  
  // Check if running in development
  if (__DEV__) {
    warnings.push('Running in development mode');
  }
  
  // Check device type
  if (!Device.isDevice) {
    warnings.push('Running on simulator/emulator');
  }
  
  // Additional checks could include:
  // - Checking for root management apps (Android)
  // - Checking for jailbreak artifacts (iOS)
  // - Checking for debugger attached
  // These require native modules or additional libraries
  
  return {
    isSecure: warnings.length === 0,
    warnings,
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate data against a Zod schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}

/**
 * Validate user profile input
 */
export function validateUserProfile(data: unknown) {
  return validateData(UserProfileSchema, data);
}

/**
 * Validate daily goals input
 */
export function validateDailyGoals(data: unknown) {
  return validateData(DailyGoalsSchema, data);
}

/**
 * Validate food log input
 */
export function validateFoodLog(data: unknown) {
  return validateData(FoodLogSchema, data);
}

/**
 * Validate reminder input
 */
export function validateReminder(data: unknown) {
  return validateData(ReminderSchema, data);
}

// ============================================
// EXPORTS
// ============================================

export const security = {
  // Secure storage
  secureStore,
  secureRetrieve,
  secureDelete,
  
  // Encryption
  getEncryptionKey,
  hashSensitiveData,
  generateRandomString,
  
  // Sanitization
  sanitizeString,
  sanitizeForAI,
  sanitizeNumber,
  
  // Auth tokens
  storeAuthTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  clearAuthData,
  clearAllSensitiveData,
  
  // Privacy
  getPrivacySettings,
  updatePrivacySettings,
  anonymizeForAnalytics,
  
  // Hardening
  checkDeviceSecurity,
  
  // Validation
  validateUserProfile,
  validateDailyGoals,
  validateFoodLog,
  validateReminder,
};

export default security;
