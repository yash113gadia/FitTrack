/**
 * Privacy-Focused Analytics Service
 * 
 * Provides analytics tracking while respecting user privacy:
 * - No PII collection
 * - Anonymized user IDs
 * - Opt-out support
 * - GDPR/CCPA compliant
 * - Local-first with optional remote sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ErrorLogger } from './errorLogging';

// ============================================================================
// TYPES
// ============================================================================

export type AnalyticsEventType =
  // App lifecycle
  | 'app_open'
  | 'app_close'
  | 'app_background'
  | 'app_foreground'
  // Onboarding
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  // Food logging
  | 'food_logged'
  | 'food_edited'
  | 'food_deleted'
  | 'barcode_scanned'
  | 'ai_scan_used'
  | 'manual_entry'
  // Goals & Streaks
  | 'goal_achieved'
  | 'streak_milestone'
  | 'daily_goal_progress'
  // Features
  | 'feature_used'
  | 'chatbot_message_sent'
  | 'reminder_created'
  | 'profile_updated'
  // Errors
  | 'error_occurred'
  | 'crash_detected'
  // Performance
  | 'performance_metric'
  // Screen
  | 'screen_view'
  | 'screen_exit'
  // Custom
  | 'custom_event';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  properties?: Record<string, any>;
  metrics?: Record<string, number>;
}

export interface ScreenViewEvent {
  screenName: string;
  enterTime: number;
  exitTime?: number;
  duration?: number;
  previousScreen?: string;
}

export interface PerformanceMetric {
  category: string;
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count' | 'percent';
  timestamp: number;
}

export interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  screenViews: number;
  events: number;
  isFirstSession: boolean;
  appVersion: string;
  platform: string;
  deviceType: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackScreenViews: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
  batchSize: number;
  flushInterval: number; // ms
  maxStoredEvents: number;
  remoteEndpoint?: string;
  debugMode: boolean;
}

export interface ConsentSettings {
  analyticsEnabled: boolean;
  performanceEnabled: boolean;
  crashReportingEnabled: boolean;
  lastUpdated: string;
  version: number;
}

export interface UserProperties {
  // All properties are anonymized/aggregated
  installDate: string;
  daysSinceInstall: number;
  totalSessions: number;
  lastActiveDate: string;
  preferredMealTime?: string; // 'morning' | 'afternoon' | 'evening'
  primaryInputMethod?: string; // 'manual' | 'barcode' | 'ai'
  goalType?: string; // 'lose' | 'maintain' | 'gain'
  activityLevel?: string;
  streakRecord?: number;
  appVersion: string;
  platform: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  CONSENT: '@fittrack_analytics_consent',
  USER_ID: '@fittrack_anonymous_id',
  EVENTS: '@fittrack_analytics_events',
  SESSION: '@fittrack_current_session',
  USER_PROPS: '@fittrack_user_properties',
  METRICS: '@fittrack_performance_metrics',
  INSTALL_DATE: '@fittrack_install_date',
  SESSION_COUNT: '@fittrack_session_count',
};

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  trackScreenViews: true,
  trackPerformance: true,
  trackErrors: true,
  batchSize: 20,
  flushInterval: 60000, // 1 minute
  maxStoredEvents: 500,
  debugMode: __DEV__,
};

const DEFAULT_CONSENT: ConsentSettings = {
  analyticsEnabled: false, // Opt-in by default for privacy
  performanceEnabled: false,
  crashReportingEnabled: true, // Usually allowed by default
  lastUpdated: new Date().toISOString(),
  version: 1,
};

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
  private config: AnalyticsConfig;
  private consent: ConsentSettings;
  private anonymousId: string | null = null;
  private currentSession: SessionData | null = null;
  private currentScreen: ScreenViewEvent | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private metricsQueue: PerformanceMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private appStateSubscription: any = null;

  constructor() {
    this.config = DEFAULT_CONFIG;
    this.consent = DEFAULT_CONSENT;
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  async init(customConfig?: Partial<AnalyticsConfig>): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.config = { ...DEFAULT_CONFIG, ...customConfig };

      // Load consent settings
      await this.loadConsent();

      // Generate or load anonymous ID
      await this.ensureAnonymousId();

      // Load any pending events
      await this.loadPendingEvents();

      // Start new session
      await this.startSession();

      // Set up app state listener
      this.setupAppStateListener();

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;
      this.log('Analytics initialized');

      // Track app open
      if (this.consent.analyticsEnabled) {
        this.trackEvent('app_open');
      }
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Analytics init' });
    }
  }

  private async ensureAnonymousId(): Promise<void> {
    try {
      let id = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

      if (!id) {
        // Generate a new anonymous ID using secure random
        const randomBytes = await Crypto.getRandomBytesAsync(16);
        id = Array.from(new Uint8Array(randomBytes))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, id);

        // Record install date
        await AsyncStorage.setItem(
          STORAGE_KEYS.INSTALL_DATE,
          new Date().toISOString()
        );
      }

      this.anonymousId = id;
    } catch (error) {
      // Generate fallback ID
      this.anonymousId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // --------------------------------------------------------------------------
  // CONSENT MANAGEMENT
  // --------------------------------------------------------------------------

  async loadConsent(): Promise<ConsentSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONSENT);
      if (stored) {
        this.consent = JSON.parse(stored);
      }
    } catch (error) {
      this.consent = DEFAULT_CONSENT;
    }
    return this.consent;
  }

  async updateConsent(settings: Partial<ConsentSettings>): Promise<void> {
    this.consent = {
      ...this.consent,
      ...settings,
      lastUpdated: new Date().toISOString(),
      version: this.consent.version + 1,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(this.consent));

    this.log('Consent updated', this.consent);

    // If analytics disabled, clear stored data
    if (!this.consent.analyticsEnabled) {
      await this.clearAllData();
    }
  }

  getConsent(): ConsentSettings {
    return { ...this.consent };
  }

  hasConsent(type: 'analytics' | 'performance' | 'crashReporting'): boolean {
    switch (type) {
      case 'analytics':
        return this.consent.analyticsEnabled;
      case 'performance':
        return this.consent.performanceEnabled;
      case 'crashReporting':
        return this.consent.crashReportingEnabled;
      default:
        return false;
    }
  }

  // --------------------------------------------------------------------------
  // SESSION MANAGEMENT
  // --------------------------------------------------------------------------

  private async startSession(): Promise<void> {
    const sessionCount = await this.incrementSessionCount();
    const isFirstSession = sessionCount === 1;

    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      screenViews: 0,
      events: 0,
      isFirstSession,
      appVersion: '1.0.0', // Would come from app config
      platform: Platform.OS,
      deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'phone' : 'tablet',
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify(this.currentSession)
    );
  }

  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration =
      this.currentSession.endTime - this.currentSession.startTime;

    // Track session end
    if (this.consent.analyticsEnabled) {
      this.trackEvent('app_close', {
        sessionDuration: this.currentSession.duration,
        screenViews: this.currentSession.screenViews,
        eventsTracked: this.currentSession.events,
      });
    }

    // Flush remaining events
    await this.flush();
  }

  private async incrementSessionCount(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
      const count = (stored ? parseInt(stored, 10) : 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_COUNT, count.toString());
      return count;
    } catch {
      return 1;
    }
  }

  getSession(): SessionData | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  // --------------------------------------------------------------------------
  // EVENT TRACKING
  // --------------------------------------------------------------------------

  trackEvent(
    type: AnalyticsEventType,
    properties?: Record<string, any>,
    metrics?: Record<string, number>
  ): void {
    if (!this.config.enabled || !this.consent.analyticsEnabled) return;

    const event: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || 'unknown',
      properties: this.sanitizeProperties(properties),
      metrics,
    };

    this.eventQueue.push(event);

    if (this.currentSession) {
      this.currentSession.events++;
    }

    this.log('Event tracked', event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Convenience methods for common events
  trackFoodLogged(method: 'manual' | 'barcode' | 'ai', mealType: string): void {
    this.trackEvent('food_logged', {
      method,
      mealType,
      timeOfDay: this.getTimeOfDay(),
    });
  }

  trackGoalAchieved(goalType: string, value: number): void {
    this.trackEvent('goal_achieved', {
      goalType,
      achievementValue: value,
    });
  }

  trackStreakMilestone(streakDays: number): void {
    this.trackEvent('streak_milestone', {
      streakDays,
      milestone: this.getStreakMilestone(streakDays),
    });
  }

  trackFeatureUsed(featureName: string, details?: Record<string, any>): void {
    this.trackEvent('feature_used', {
      feature: featureName,
      ...details,
    });
  }

  trackError(errorType: string, errorMessage: string, isFatal: boolean = false): void {
    if (!this.consent.crashReportingEnabled) return;

    this.trackEvent('error_occurred', {
      errorType,
      // Don't include full error message for privacy - just category
      errorCategory: this.categorizeError(errorMessage),
      isFatal,
    });
  }

  // --------------------------------------------------------------------------
  // SCREEN TRACKING
  // --------------------------------------------------------------------------

  trackScreenView(screenName: string): void {
    if (!this.config.enabled || !this.config.trackScreenViews || !this.consent.analyticsEnabled) {
      return;
    }

    const now = Date.now();

    // End previous screen view
    if (this.currentScreen) {
      this.currentScreen.exitTime = now;
      this.currentScreen.duration = now - this.currentScreen.enterTime;

      this.trackEvent('screen_exit', {
        screenName: this.currentScreen.screenName,
        duration: this.currentScreen.duration,
      });
    }

    // Start new screen view
    this.currentScreen = {
      screenName,
      enterTime: now,
      previousScreen: this.currentScreen?.screenName,
    };

    this.trackEvent('screen_view', {
      screenName,
      previousScreen: this.currentScreen.previousScreen,
    });

    if (this.currentSession) {
      this.currentSession.screenViews++;
    }
  }

  // --------------------------------------------------------------------------
  // PERFORMANCE TRACKING
  // --------------------------------------------------------------------------

  trackTiming(
    category: string,
    name: string,
    timeMs: number,
    unit: PerformanceMetric['unit'] = 'ms'
  ): void {
    if (!this.config.enabled || !this.config.trackPerformance || !this.consent.performanceEnabled) {
      return;
    }

    const metric: PerformanceMetric = {
      category,
      name,
      value: timeMs,
      unit,
      timestamp: Date.now(),
    };

    this.metricsQueue.push(metric);

    this.log('Timing tracked', metric);

    // Also track as event for aggregation
    this.trackEvent('performance_metric', {
      category,
      name,
    }, {
      [name]: timeMs,
    });
  }

  // Convenience methods for performance tracking
  trackAppStartup(timeMs: number): void {
    this.trackTiming('app', 'startup_time', timeMs);
  }

  trackScreenRender(screenName: string, timeMs: number): void {
    this.trackTiming('screen', `render_${screenName}`, timeMs);
  }

  trackApiResponse(endpoint: string, timeMs: number): void {
    // Anonymize endpoint
    const anonymizedEndpoint = this.anonymizeEndpoint(endpoint);
    this.trackTiming('api', anonymizedEndpoint, timeMs);
  }

  trackDatabaseQuery(queryType: string, timeMs: number): void {
    this.trackTiming('database', queryType, timeMs);
  }

  trackImageProcessing(operation: string, timeMs: number): void {
    this.trackTiming('image', operation, timeMs);
  }

  /**
   * Create a timing measurement helper
   */
  startTiming(category: string, name: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.trackTiming(category, name, duration);
    };
  }

  // --------------------------------------------------------------------------
  // USER PROPERTIES
  // --------------------------------------------------------------------------

  async setUserProperty(property: string, value: any): Promise<void> {
    if (!this.consent.analyticsEnabled) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROPS);
      const props: UserProperties = stored
        ? JSON.parse(stored)
        : this.getDefaultUserProperties();

      // Only allow known properties
      if (this.isAllowedUserProperty(property)) {
        (props as any)[property] = value;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROPS, JSON.stringify(props));
      }
    } catch (error) {
      this.log('Error setting user property', error);
    }
  }

  async getUserProperties(): Promise<UserProperties> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROPS);
      return stored ? JSON.parse(stored) : this.getDefaultUserProperties();
    } catch {
      return this.getDefaultUserProperties();
    }
  }

  private getDefaultUserProperties(): UserProperties {
    return {
      installDate: new Date().toISOString(),
      daysSinceInstall: 0,
      totalSessions: 0,
      lastActiveDate: new Date().toISOString(),
      appVersion: '1.0.0',
      platform: Platform.OS,
    };
  }

  private isAllowedUserProperty(prop: string): boolean {
    const allowed = [
      'preferredMealTime',
      'primaryInputMethod',
      'goalType',
      'activityLevel',
      'streakRecord',
    ];
    return allowed.includes(prop);
  }

  // --------------------------------------------------------------------------
  // DATA MANAGEMENT
  // --------------------------------------------------------------------------

  private async loadPendingEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      if (stored) {
        this.eventQueue = JSON.parse(stored);
      }
    } catch {
      this.eventQueue = [];
    }
  }

  private async savePendingEvents(): Promise<void> {
    try {
      // Limit stored events
      const eventsToStore = this.eventQueue.slice(-this.config.maxStoredEvents);
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventsToStore));
    } catch (error) {
      this.log('Error saving events', error);
    }
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0 && this.metricsQueue.length === 0) return;

    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        // Save for later
        await this.savePendingEvents();
        return;
      }

      // In production, send to analytics backend
      if (this.config.remoteEndpoint && !__DEV__) {
        await this.sendToRemote();
      }

      // Clear queues
      this.eventQueue = [];
      this.metricsQueue = [];

      // Clear stored events
      await AsyncStorage.removeItem(STORAGE_KEYS.EVENTS);

      this.log('Analytics flushed');
    } catch (error) {
      // Save events for retry
      await this.savePendingEvents();
      this.log('Flush failed, events saved for retry', error);
    }
  }

  private async sendToRemote(): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    const payload = {
      anonymousId: this.anonymousId,
      session: this.currentSession,
      events: this.eventQueue,
      metrics: this.metricsQueue,
      userProperties: await this.getUserProperties(),
      timestamp: Date.now(),
    };

    // In production, would send to analytics service
    // await fetch(this.config.remoteEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });

    this.log('Would send to remote:', payload);
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EVENTS,
        STORAGE_KEYS.USER_PROPS,
        STORAGE_KEYS.METRICS,
      ]);

      this.eventQueue = [];
      this.metricsQueue = [];

      this.log('Analytics data cleared');
    } catch (error) {
      this.log('Error clearing data', error);
    }
  }

  /**
   * Export all analytics data for user (GDPR requirement)
   */
  async exportUserData(): Promise<object> {
    return {
      anonymousId: this.anonymousId,
      consent: this.consent,
      userProperties: await this.getUserProperties(),
      pendingEvents: this.eventQueue,
      currentSession: this.currentSession,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete all user data (GDPR right to erasure)
   */
  async deleteAllUserData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));

    this.anonymousId = null;
    this.currentSession = null;
    this.eventQueue = [];
    this.metricsQueue = [];
    this.consent = DEFAULT_CONSENT;

    this.log('All user data deleted');
  }

  // --------------------------------------------------------------------------
  // APP STATE HANDLING
  // --------------------------------------------------------------------------

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (!this.consent.analyticsEnabled) return;

    if (nextAppState === 'active') {
      this.trackEvent('app_foreground');
    } else if (nextAppState === 'background') {
      this.trackEvent('app_background');
      this.flush();
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private sanitizeProperties(props?: Record<string, any>): Record<string, any> | undefined {
    if (!props) return undefined;

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(props)) {
      // Skip potential PII fields
      if (this.isPotentialPII(key)) continue;

      // Sanitize values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        sanitized[key] = null;
      }
      // Skip complex objects
    }

    return sanitized;
  }

  private isPotentialPII(key: string): boolean {
    const piiPatterns = [
      'email', 'phone', 'name', 'address', 'ssn', 'password',
      'credit', 'card', 'account', 'ip', 'location', 'lat', 'lng',
      'user_id', 'userId', 'user', 'token', 'auth', 'secret',
    ];
    const lowerKey = key.toLowerCase();
    return piiPatterns.some((pattern) => lowerKey.includes(pattern));
  }

  private sanitizeString(str: string): string {
    // Limit length
    const maxLength = 100;
    if (str.length > maxLength) {
      str = str.substring(0, maxLength) + '...';
    }

    // Remove potential PII patterns
    str = str.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]');
    str = str.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]');

    return str;
  }

  private anonymizeEndpoint(endpoint: string): string {
    // Remove query params and IDs from endpoint
    return endpoint
      .split('?')[0]
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid');
  }

  private categorizeError(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'network_error';
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('sqlite')) {
      return 'database_error';
    }
    if (lowerMessage.includes('permission')) {
      return 'permission_error';
    }
    if (lowerMessage.includes('timeout')) {
      return 'timeout_error';
    }
    if (lowerMessage.includes('parse') || lowerMessage.includes('json')) {
      return 'parsing_error';
    }

    return 'general_error';
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private getStreakMilestone(days: number): string {
    if (days >= 365) return '1_year';
    if (days >= 100) return '100_days';
    if (days >= 30) return '30_days';
    if (days >= 7) return '7_days';
    if (days >= 3) return '3_days';
    return 'started';
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[Analytics] ${message}`, data || '');
    }
  }

  // --------------------------------------------------------------------------
  // CLEANUP
  // --------------------------------------------------------------------------

  async cleanup(): Promise<void> {
    await this.endSession();

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.isInitialized = false;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const Analytics = new AnalyticsService();

// Convenience exports
export const trackEvent = Analytics.trackEvent.bind(Analytics);
export const trackScreen = Analytics.trackScreenView.bind(Analytics);
export const trackTiming = Analytics.trackTiming.bind(Analytics);

export default Analytics;
