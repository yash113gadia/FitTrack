/**
 * Error Logging Service
 * 
 * Centralized error logging with support for:
 * - Console logging (development)
 * - Local storage for debugging
 * - Remote error reporting (Sentry-ready)
 * - User context tracking
 * - Breadcrumb trail for debugging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
  breadcrumbs?: Breadcrumb[];
  user?: UserContext;
  device?: DeviceInfo;
}

export interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  data?: Record<string, any>;
  level: LogLevel;
}

export interface UserContext {
  id?: number;
  name?: string;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string | null;
  deviceName: string | null;
  deviceModel: string | null;
  isDevice: boolean;
  appVersion: string;
}

export interface ErrorLoggerConfig {
  maxStoredLogs: number;
  maxBreadcrumbs: number;
  enableConsoleLogging: boolean;
  enableLocalStorage: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
  minLogLevel: LogLevel;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = '@fittrack_error_logs';
const BREADCRUMB_KEY = '@fittrack_breadcrumbs';
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const DEFAULT_CONFIG: ErrorLoggerConfig = {
  maxStoredLogs: 100,
  maxBreadcrumbs: 50,
  enableConsoleLogging: __DEV__,
  enableLocalStorage: true,
  enableRemoteLogging: !__DEV__,
  minLogLevel: __DEV__ ? 'debug' : 'warn',
};

// ============================================================================
// ERROR LOGGER CLASS
// ============================================================================

class ErrorLoggerService {
  private config: ErrorLoggerConfig;
  private userContext: UserContext | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private isInitialized = false;
  private deviceInfo: DeviceInfo | null = null;
  private pendingLogs: LogEntry[] = [];

  constructor() {
    this.config = DEFAULT_CONFIG;
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  async init(customConfig?: Partial<ErrorLoggerConfig>): Promise<void> {
    if (this.isInitialized) return;

    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    
    // Get device info
    this.deviceInfo = {
      platform: Platform.OS,
      osVersion: Platform.Version?.toString() ?? null,
      deviceName: Device.deviceName,
      deviceModel: Device.modelName,
      isDevice: Device.isDevice,
      appVersion: '1.0.0', // Would come from app.json in production
    };

    // Load persisted breadcrumbs
    await this.loadBreadcrumbs();

    this.isInitialized = true;
    this.logInfo('ErrorLogger initialized', { config: this.config });

    // Flush any pending logs
    await this.flushPendingLogs();
  }

  // --------------------------------------------------------------------------
  // PUBLIC LOGGING METHODS
  // --------------------------------------------------------------------------

  logDebug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, undefined, context);
  }

  logInfo(message: string, context?: Record<string, any>): void {
    this.log('info', message, undefined, context);
  }

  logWarning(message: string, context?: Record<string, any>): void {
    this.log('warn', message, undefined, context);
  }

  logError(error: Error | string, context?: Record<string, any>): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    this.log('error', errorObj.message, errorObj, context);
  }

  logFatal(error: Error | string, context?: Record<string, any>): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    this.log('fatal', errorObj.message, errorObj, context);
  }

  // Convenience method for component errors
  logComponentError(
    componentName: string,
    error: Error,
    errorInfo?: React.ErrorInfo
  ): void {
    this.logError(error, {
      component: componentName,
      componentStack: errorInfo?.componentStack,
    });
  }

  // --------------------------------------------------------------------------
  // USER CONTEXT
  // --------------------------------------------------------------------------

  setUser(userId: number, metadata?: Record<string, any>): void {
    this.userContext = {
      id: userId,
      metadata,
    };
    this.addBreadcrumb('user', 'User context set', { userId });
  }

  setUserName(name: string): void {
    if (this.userContext) {
      this.userContext.name = name;
    } else {
      this.userContext = { name };
    }
  }

  clearUser(): void {
    this.userContext = null;
    this.addBreadcrumb('user', 'User context cleared');
  }

  // --------------------------------------------------------------------------
  // BREADCRUMBS
  // --------------------------------------------------------------------------

  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, any>,
    level: LogLevel = 'info'
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
      level,
    };

    this.breadcrumbs.push(breadcrumb);

    // Limit breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    // Persist breadcrumbs
    this.saveBreadcrumbs();
  }

  // Navigation breadcrumbs
  addNavigationBreadcrumb(routeName: string, params?: Record<string, any>): void {
    this.addBreadcrumb('navigation', `Navigated to ${routeName}`, params);
  }

  // User action breadcrumbs
  addActionBreadcrumb(action: string, data?: Record<string, any>): void {
    this.addBreadcrumb('user_action', action, data);
  }

  // Network breadcrumbs
  addNetworkBreadcrumb(
    method: string,
    url: string,
    status?: number,
    duration?: number
  ): void {
    this.addBreadcrumb('network', `${method} ${url}`, {
      status,
      duration,
    });
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
    AsyncStorage.removeItem(BREADCRUMB_KEY);
  }

  // --------------------------------------------------------------------------
  // LOG RETRIEVAL
  // --------------------------------------------------------------------------

  async getLogs(options?: {
    level?: LogLevel;
    limit?: number;
    since?: Date;
  }): Promise<LogEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let logs: LogEntry[] = stored ? JSON.parse(stored) : [];

      if (options?.level) {
        const minPriority = LOG_LEVEL_PRIORITY[options.level];
        logs = logs.filter(
          (log) => LOG_LEVEL_PRIORITY[log.level] >= minPriority
        );
      }

      if (options?.since) {
        logs = logs.filter(
          (log) => new Date(log.timestamp) >= options.since!
        );
      }

      if (options?.limit) {
        logs = logs.slice(-options.limit);
      }

      return logs;
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // --------------------------------------------------------------------------
  // PRIVATE METHODS
  // --------------------------------------------------------------------------

  private async log(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): Promise<void> {
    // Check minimum log level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.minLogLevel]) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      context,
      breadcrumbs: [...this.breadcrumbs],
      user: this.userContext || undefined,
      device: this.deviceInfo || undefined,
    };

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(entry);
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      if (this.isInitialized) {
        await this.saveLog(entry);
      } else {
        this.pendingLogs.push(entry);
      }
    }

    // Remote logging
    if (this.config.enableRemoteLogging && level !== 'debug') {
      await this.sendToRemote(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}:`;
    const contextStr = entry.context
      ? `\nContext: ${JSON.stringify(entry.context, null, 2)}`
      : '';

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, contextStr);
        break;
      case 'info':
        console.info(prefix, entry.message, contextStr);
        break;
      case 'warn':
        console.warn(prefix, entry.message, contextStr);
        break;
      case 'error':
      case 'fatal':
        console.error(prefix, entry.message, entry.error?.stack || '', contextStr);
        break;
    }
  }

  private async saveLog(entry: LogEntry): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let logs: LogEntry[] = stored ? JSON.parse(stored) : [];

      logs.push(entry);

      // Limit stored logs
      if (logs.length > this.config.maxStoredLogs) {
        logs = logs.slice(-this.config.maxStoredLogs);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      // In production, this would send to Sentry, LogRocket, etc.
      // For now, we'll just log that we would send it
      if (__DEV__) {
        console.log('[ErrorLogger] Would send to remote:', entry.level, entry.message);
      }

      // Example implementation:
      // await fetch(this.config.remoteEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error('Failed to send log to remote:', error);
    }
  }

  private async saveBreadcrumbs(): Promise<void> {
    try {
      await AsyncStorage.setItem(BREADCRUMB_KEY, JSON.stringify(this.breadcrumbs));
    } catch (error) {
      // Silent fail for breadcrumbs
    }
  }

  private async loadBreadcrumbs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(BREADCRUMB_KEY);
      if (stored) {
        this.breadcrumbs = JSON.parse(stored);
      }
    } catch (error) {
      this.breadcrumbs = [];
    }
  }

  private async flushPendingLogs(): Promise<void> {
    for (const entry of this.pendingLogs) {
      await this.saveLog(entry);
    }
    this.pendingLogs = [];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const ErrorLogger = new ErrorLoggerService();

// Convenience exports for common use cases
export const logError = (error: Error | string, context?: Record<string, any>) =>
  ErrorLogger.logError(error, context);

export const logWarning = (message: string, context?: Record<string, any>) =>
  ErrorLogger.logWarning(message, context);

export const logInfo = (message: string, context?: Record<string, any>) =>
  ErrorLogger.logInfo(message, context);

export const addBreadcrumb = (
  category: string,
  message: string,
  data?: Record<string, any>
) => ErrorLogger.addBreadcrumb(category, message, data);

export default ErrorLogger;
