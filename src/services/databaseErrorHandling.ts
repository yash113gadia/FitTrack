/**
 * Database Error Handling
 * 
 * Provides:
 * - Transaction management with rollback
 * - Data integrity checks
 * - Corruption detection and recovery
 * - Backup before risky operations
 * - Error-safe CRUD operations
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorLogger } from './errorLogging';

// ============================================================================
// TYPES
// ============================================================================

export interface DatabaseError {
  type: DatabaseErrorType;
  message: string;
  query?: string;
  params?: any[];
  originalError?: any;
  recoverable: boolean;
}

export type DatabaseErrorType =
  | 'CONNECTION_ERROR'
  | 'QUERY_ERROR'
  | 'CONSTRAINT_ERROR'
  | 'CORRUPTION_ERROR'
  | 'TRANSACTION_ERROR'
  | 'BACKUP_ERROR'
  | 'MIGRATION_ERROR'
  | 'UNKNOWN';

export interface TransactionContext {
  id: string;
  startTime: number;
  operations: string[];
  savepoints: string[];
}

export interface BackupInfo {
  id: string;
  timestamp: number;
  path: string;
  size: number;
  reason: string;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tablesChecked: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'fittrack.db';
const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
const BACKUP_METADATA_KEY = '@fittrack_backup_metadata';
const MAX_BACKUPS = 5;
const INTEGRITY_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const LAST_INTEGRITY_CHECK_KEY = '@fittrack_last_integrity_check';

// ============================================================================
// DATABASE ERROR HANDLER
// ============================================================================

class DatabaseErrorHandler {
  private db: SQLite.SQLiteDatabase | null = null;
  private currentTransaction: TransactionContext | null = null;
  private isInitialized = false;

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  async init(database: SQLite.SQLiteDatabase): Promise<void> {
    this.db = database;
    this.isInitialized = true;

    // Ensure backup directory exists
    await this.ensureBackupDirectory();

    // Check if integrity check is due
    await this.checkIntegrityIfDue();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      }
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Creating backup directory' });
    }
  }

  // --------------------------------------------------------------------------
  // ERROR PARSING
  // --------------------------------------------------------------------------

  parseError(error: any, query?: string, params?: any[]): DatabaseError {
    const message = error?.message || String(error);

    // Detect error type from message
    let type: DatabaseErrorType = 'UNKNOWN';
    let recoverable = false;

    if (message.includes('SQLITE_CORRUPT') || message.includes('malformed')) {
      type = 'CORRUPTION_ERROR';
      recoverable = false; // Needs restoration from backup
    } else if (message.includes('SQLITE_CONSTRAINT') || message.includes('UNIQUE constraint')) {
      type = 'CONSTRAINT_ERROR';
      recoverable = true;
    } else if (message.includes('SQLITE_BUSY') || message.includes('database is locked')) {
      type = 'CONNECTION_ERROR';
      recoverable = true;
    } else if (message.includes('no such table') || message.includes('syntax error')) {
      type = 'QUERY_ERROR';
      recoverable = true;
    } else if (message.includes('transaction')) {
      type = 'TRANSACTION_ERROR';
      recoverable = true;
    }

    const dbError: DatabaseError = {
      type,
      message,
      query,
      params,
      originalError: error,
      recoverable,
    };

    // Log the error
    ErrorLogger.logError(error as Error, {
      databaseError: dbError,
      query: query?.substring(0, 200), // Truncate long queries
    });

    return dbError;
  }

  // --------------------------------------------------------------------------
  // SAFE QUERY EXECUTION
  // --------------------------------------------------------------------------

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context?: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const dbError = this.parseError(error);

        // Don't retry non-recoverable errors
        if (!dbError.recoverable) {
          throw dbError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(100 * Math.pow(2, attempt), 2000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          ErrorLogger.logWarning(`Database retry attempt ${attempt + 1}`, { context });
        }
      }
    }

    throw this.parseError(lastError);
  }

  // --------------------------------------------------------------------------
  // TRANSACTION MANAGEMENT
  // --------------------------------------------------------------------------

  async beginTransaction(): Promise<string> {
    if (!this.db) throw this.parseError(new Error('Database not initialized'));

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      await this.db.execAsync('BEGIN TRANSACTION');

      this.currentTransaction = {
        id: transactionId,
        startTime: Date.now(),
        operations: [],
        savepoints: [],
      };

      ErrorLogger.addBreadcrumb('database', 'Transaction started', { id: transactionId });
      return transactionId;
    } catch (error) {
      throw this.parseError(error, 'BEGIN TRANSACTION');
    }
  }

  async commitTransaction(): Promise<void> {
    if (!this.db) throw this.parseError(new Error('Database not initialized'));
    if (!this.currentTransaction) {
      throw this.parseError(new Error('No active transaction'));
    }

    try {
      await this.db.execAsync('COMMIT');

      const duration = Date.now() - this.currentTransaction.startTime;
      ErrorLogger.addBreadcrumb('database', 'Transaction committed', {
        id: this.currentTransaction.id,
        duration,
        operations: this.currentTransaction.operations.length,
      });

      this.currentTransaction = null;
    } catch (error) {
      // Try to rollback on commit failure
      await this.rollbackTransaction();
      throw this.parseError(error, 'COMMIT');
    }
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.execAsync('ROLLBACK');

      if (this.currentTransaction) {
        ErrorLogger.logWarning('Transaction rolled back', {
          id: this.currentTransaction.id,
          operations: this.currentTransaction.operations,
        });
      }

      this.currentTransaction = null;
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Rollback failed' });
      this.currentTransaction = null;
    }
  }

  async createSavepoint(name: string): Promise<void> {
    if (!this.db || !this.currentTransaction) {
      throw this.parseError(new Error('No active transaction for savepoint'));
    }

    try {
      await this.db.execAsync(`SAVEPOINT ${name}`);
      this.currentTransaction.savepoints.push(name);
    } catch (error) {
      throw this.parseError(error, `SAVEPOINT ${name}`);
    }
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    if (!this.db || !this.currentTransaction) {
      throw this.parseError(new Error('No active transaction for savepoint rollback'));
    }

    try {
      await this.db.execAsync(`ROLLBACK TO SAVEPOINT ${name}`);

      // Remove savepoints after this one
      const index = this.currentTransaction.savepoints.indexOf(name);
      if (index !== -1) {
        this.currentTransaction.savepoints = this.currentTransaction.savepoints.slice(0, index);
      }

      ErrorLogger.addBreadcrumb('database', 'Rolled back to savepoint', { name });
    } catch (error) {
      throw this.parseError(error, `ROLLBACK TO SAVEPOINT ${name}`);
    }
  }

  /**
   * Execute operations within a transaction with automatic rollback on failure
   */
  async withTransaction<T>(
    operation: () => Promise<T>,
    options?: { backupFirst?: boolean; context?: string }
  ): Promise<T> {
    // Optionally create backup before risky operations
    if (options?.backupFirst) {
      await this.createBackup(options.context || 'pre-transaction');
    }

    await this.beginTransaction();

    try {
      const result = await operation();
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  recordOperation(description: string): void {
    if (this.currentTransaction) {
      this.currentTransaction.operations.push(description);
    }
  }

  // --------------------------------------------------------------------------
  // BACKUP MANAGEMENT
  // --------------------------------------------------------------------------

  async createBackup(reason: string): Promise<BackupInfo | null> {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
      const backupId = `backup_${Date.now()}`;
      const backupPath = `${BACKUP_DIR}${backupId}.db`;

      // Check if source exists
      const sourceInfo = await FileSystem.getInfoAsync(dbPath);
      if (!sourceInfo.exists) {
        ErrorLogger.logWarning('Database file not found for backup');
        return null;
      }

      // Copy database file
      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath,
      });

      const backupInfo = await FileSystem.getInfoAsync(backupPath);
      const backup: BackupInfo = {
        id: backupId,
        timestamp: Date.now(),
        path: backupPath,
        size: backupInfo.exists ? (backupInfo as any).size || 0 : 0,
        reason,
      };

      // Save backup metadata
      await this.saveBackupMetadata(backup);

      // Clean old backups
      await this.cleanOldBackups();

      ErrorLogger.logInfo('Database backup created', backup);
      return backup;
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Creating database backup' });
      return null;
    }
  }

  async restoreFromBackup(backupId?: string): Promise<boolean> {
    try {
      const backups = await this.getBackups();
      
      if (backups.length === 0) {
        ErrorLogger.logWarning('No backups available for restoration');
        return false;
      }

      // Use specified backup or most recent
      const backup = backupId
        ? backups.find((b) => b.id === backupId)
        : backups[0];

      if (!backup) {
        ErrorLogger.logWarning('Backup not found', { backupId });
        return false;
      }

      const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

      // Verify backup exists
      const backupExists = await FileSystem.getInfoAsync(backup.path);
      if (!backupExists.exists) {
        ErrorLogger.logWarning('Backup file not found', { path: backup.path });
        return false;
      }

      // Close current database connection (if possible)
      // Note: This would need to be handled at the app level

      // Replace database with backup
      await FileSystem.copyAsync({
        from: backup.path,
        to: dbPath,
      });

      ErrorLogger.logInfo('Database restored from backup', { backup });
      return true;
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Restoring database backup' });
      return false;
    }
  }

  async getBackups(): Promise<BackupInfo[]> {
    try {
      const stored = await AsyncStorage.getItem(BACKUP_METADATA_KEY);
      if (!stored) return [];

      const backups: BackupInfo[] = JSON.parse(stored);
      // Sort by timestamp, newest first
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      return [];
    }
  }

  private async saveBackupMetadata(backup: BackupInfo): Promise<void> {
    try {
      const backups = await this.getBackups();
      backups.unshift(backup);
      await AsyncStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(backups));
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Saving backup metadata' });
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.getBackups();

      if (backups.length <= MAX_BACKUPS) return;

      const toDelete = backups.slice(MAX_BACKUPS);

      for (const backup of toDelete) {
        try {
          await FileSystem.deleteAsync(backup.path, { idempotent: true });
        } catch (error) {
          // Ignore individual deletion errors
        }
      }

      // Update metadata
      const remaining = backups.slice(0, MAX_BACKUPS);
      await AsyncStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(remaining));

      ErrorLogger.logInfo('Cleaned old backups', { deleted: toDelete.length });
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Cleaning old backups' });
    }
  }

  // --------------------------------------------------------------------------
  // INTEGRITY CHECKS
  // --------------------------------------------------------------------------

  async checkIntegrity(): Promise<IntegrityCheckResult> {
    if (!this.db) {
      return {
        isValid: false,
        errors: ['Database not initialized'],
        warnings: [],
        tablesChecked: 0,
      };
    }

    const result: IntegrityCheckResult = {
      isValid: true,
      errors: [],
      warnings: [],
      tablesChecked: 0,
    };

    try {
      // Run SQLite integrity check
      const integrityCheck = await this.db.getFirstAsync<{ integrity_check: string }>(
        'PRAGMA integrity_check'
      );

      if (integrityCheck?.integrity_check !== 'ok') {
        result.isValid = false;
        result.errors.push(`Integrity check failed: ${integrityCheck?.integrity_check}`);
      }

      // Check foreign keys
      const foreignKeyCheck = await this.db.getAllAsync<{ table: string; rowid: number }>(
        'PRAGMA foreign_key_check'
      );

      if (foreignKeyCheck.length > 0) {
        result.warnings.push(
          `Foreign key violations in tables: ${[...new Set(foreignKeyCheck.map((r) => r.table))].join(', ')}`
        );
      }

      // Get table count
      const tables = await this.db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      result.tablesChecked = tables.length;

      // Check each table for row count
      for (const table of tables) {
        try {
          const count = await this.db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM ${table.name}`
          );
          // Table is readable
        } catch (error) {
          result.warnings.push(`Table ${table.name} may have issues: ${(error as Error).message}`);
        }
      }

      // Record check time
      await AsyncStorage.setItem(LAST_INTEGRITY_CHECK_KEY, Date.now().toString());

      ErrorLogger.logInfo('Database integrity check completed', result);
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Integrity check error: ${(error as Error).message}`);
      ErrorLogger.logError(error as Error, { context: 'Database integrity check' });
    }

    return result;
  }

  private async checkIntegrityIfDue(): Promise<void> {
    try {
      const lastCheck = await AsyncStorage.getItem(LAST_INTEGRITY_CHECK_KEY);
      const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0;

      if (Date.now() - lastCheckTime > INTEGRITY_CHECK_INTERVAL) {
        const result = await this.checkIntegrity();

        if (!result.isValid) {
          ErrorLogger.logError(new Error('Database integrity check failed'), {
            result,
          });
          // Could trigger recovery flow here
        }
      }
    } catch (error) {
      // Don't fail initialization for integrity check errors
      ErrorLogger.logWarning('Integrity check scheduling failed', { error });
    }
  }

  // --------------------------------------------------------------------------
  // VACUUM & OPTIMIZATION
  // --------------------------------------------------------------------------

  async vacuum(): Promise<void> {
    if (!this.db) return;

    try {
      // Create backup before vacuum
      await this.createBackup('pre-vacuum');

      await this.db.execAsync('VACUUM');
      ErrorLogger.logInfo('Database vacuumed successfully');
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Database vacuum' });
      throw this.parseError(error, 'VACUUM');
    }
  }

  async analyze(): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.execAsync('ANALYZE');
      ErrorLogger.logInfo('Database analyzed successfully');
    } catch (error) {
      ErrorLogger.logError(error as Error, { context: 'Database analyze' });
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const DatabaseErrors = new DatabaseErrorHandler();

export default DatabaseErrors;
