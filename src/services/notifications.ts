/**
 * Notification Service
 *
 * Comprehensive notification system for FitTrack app.
 * Handles permission management, scheduling, rich notifications,
 * deep linking, and analytics tracking.
 *
 * @example
 * // Initialize notifications on app start
 * await notificationService.initialize();
 *
 * // Schedule a meal reminder
 * const id = await notificationService.scheduleReminder({
 *   id: 1,
 *   userId: 1,
 *   type: 'meal',
 *   title: 'Lunch Time',
 *   time: '12:00',
 *   days: [1, 2, 3, 4, 5], // Monday - Friday
 *   enabled: true,
 * });
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, DailySummary, DailyGoals } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  PERMISSION_STATUS: '@fittrack_notification_permission',
  QUIET_HOURS: '@fittrack_quiet_hours',
  PAUSED_UNTIL: '@fittrack_notifications_paused',
  ANALYTICS: '@fittrack_notification_analytics',
  SCHEDULED_IDS: '@fittrack_scheduled_notification_ids',
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Notification category types supported by the app
 */
export type NotificationCategory =
  | 'meal_reminder'
  | 'supplement_reminder'
  | 'water_reminder'
  | 'weigh_in_reminder'
  | 'streak_celebration'
  | 'goal_achieved'
  | 'weekly_summary'
  | 'custom';

/**
 * Notification action identifiers
 */
export type NotificationAction = 'log_now' | 'snooze' | 'dismiss' | 'mark_done' | 'view';

/**
 * Data attached to notifications for deep linking
 */
export interface NotificationData {
  category: NotificationCategory;
  screen?: string;
  params?: Record<string, any>;
  reminderId?: number;
  userId?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp?: string;
  [key: string]: unknown; // Index signature for compatibility
}

/**
 * Quiet hours configuration
 */
export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  weekendsOnly?: boolean;
}

/**
 * Notification analytics data
 */
export interface NotificationAnalytics {
  totalSent: number;
  totalTapped: number;
  totalDismissed: number;
  byCategoryStats: Record<NotificationCategory, {
    sent: number;
    tapped: number;
    dismissed: number;
  }>;
  lastUpdated: string;
}

/**
 * Pending notification info
 */
export interface PendingNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  triggerDate?: Date;
  data?: NotificationData;
}

/**
 * Schedule options for notifications
 */
export interface ScheduleOptions {
  title: string;
  body: string;
  category: NotificationCategory;
  data?: NotificationData;
  sound?: boolean;
  priority?: 'default' | 'high' | 'max';
  badge?: number;
  subtitle?: string;
}

// ============================================================================
// NOTIFICATION HANDLER SETUP
// ============================================================================

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================================================
// NOTIFICATION SERVICE CLASS
// ============================================================================

class NotificationService {
  private isInitialized = false;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;
  private navigationRef: any = null;
  private analytics: NotificationAnalytics | null = null;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the notification service.
   * Call this on app startup.
   */
  async initialize(navigationRef?: any): Promise<void> {
    if (this.isInitialized) return;

    this.navigationRef = navigationRef;

    // Set up notification categories with actions
    await this.setupNotificationCategories();

    // Load analytics
    await this.loadAnalytics();

    // Set up listeners
    this.setupListeners();

    this.isInitialized = true;
    console.log('[NotificationService] Initialized');
  }

  /**
   * Set up notification categories with action buttons
   */
  private async setupNotificationCategories(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('meal_reminder', [
        {
          identifier: 'log_now',
          buttonTitle: '📝 Log Now',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'snooze',
          buttonTitle: '⏰ Snooze 15m',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('supplement_reminder', [
        {
          identifier: 'mark_done',
          buttonTitle: '✅ Taken',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'snooze',
          buttonTitle: '⏰ Snooze',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('water_reminder', [
        {
          identifier: 'mark_done',
          buttonTitle: '💧 Logged',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Skip',
          options: { isDestructive: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('streak_celebration', [
        {
          identifier: 'view',
          buttonTitle: '🔥 View Progress',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('goal_achieved', [
        {
          identifier: 'view',
          buttonTitle: '🎉 View Stats',
          options: { opensAppToForeground: true },
        },
      ]);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Listener for when notification is received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[NotificationService] Received:', notification.request.identifier);
        this.trackNotificationSent(notification.request.content.data?.category as NotificationCategory);
      }
    );

    // Listener for when user interacts with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Clean up listeners on unmount
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Request notification permissions from the user.
   * Handles platform-specific requirements.
   */
  async requestPermissions(): Promise<boolean> {
    // Check if we're on a physical device
    if (!Device.isDevice) {
      console.warn('[NotificationService] Must use physical device for notifications');
      return false;
    }

    try {
      // Get current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: true,
          },
        });
        finalStatus = status;
      }

      // Store permission status
      await AsyncStorage.setItem(
        STORAGE_KEYS.PERMISSION_STATUS,
        finalStatus
      );

      // Set up push token for iOS if needed
      if (Platform.OS === 'ios' && finalStatus === 'granted') {
        // Configure notification channel for Android
        // (iOS doesn't need this but it won't hurt)
        await this.createAndroidChannels();
      }

      if (Platform.OS === 'android') {
        await this.createAndroidChannels();
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('[NotificationService] Permission request error:', error);
      return false;
    }
  }

  /**
   * Check if notifications are permitted
   */
  async hasPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Create Android notification channels
   */
  private async createAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('meals', {
      name: 'Meal Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('supplements', {
      name: 'Supplement Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#4ECDC4',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('water', {
      name: 'Water Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100],
      lightColor: '#45B7D1',
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements & Celebrations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 100, 250],
      lightColor: '#FFD700',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('general', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // ============================================================================
  // SCHEDULING
  // ============================================================================

  /**
   * Schedule a reminder notification
   */
  async scheduleReminder(reminder: Reminder): Promise<string[]> {
    // Check permissions
    const hasPermission = await this.hasPermission();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    // Cancel any existing notifications for this reminder
    if (reminder.notificationId) {
      await this.cancelNotification(reminder.notificationId);
    }

    // Get notification content based on type
    const content = this.getReminderContent(reminder);

    // Schedule for each selected day
    const scheduledIds: string[] = [];

    for (const day of reminder.days) {
      const [hours, minutes] = reminder.time.split(':').map(Number);

      const trigger: Notifications.WeeklyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1, // expo-notifications uses 1-7 (Sunday-Saturday)
        hour: hours,
        minute: minutes,
      };

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            ...content,
            data: {
              ...content.data,
              reminderId: reminder.id,
              dayOfWeek: day,
            },
          },
          trigger,
        });

        scheduledIds.push(notificationId);
      } catch (error) {
        console.error(`[NotificationService] Failed to schedule for day ${day}:`, error);
      }
    }

    // Store scheduled IDs
    await this.storeScheduledIds(reminder.id, scheduledIds);

    return scheduledIds;
  }

  /**
   * Get notification content based on reminder type
   */
  private getReminderContent(reminder: Reminder): Notifications.NotificationContentInput {
    const baseContent: Notifications.NotificationContentInput = {
      title: reminder.title,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    };

    switch (reminder.type) {
      case 'meal':
        return {
          ...baseContent,
          title: `🍽️ Time for ${reminder.title}!`,
          body: 'What are you eating? Tap to log your meal.',
          categoryIdentifier: 'meal_reminder',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            category: 'meal_reminder' as NotificationCategory,
            screen: 'LogFood',
            params: { mealType: this.getMealTypeFromTitle(reminder.title) },
          },
          ...(Platform.OS === 'android' && { channelId: 'meals' }),
        };

      case 'supplement':
        return {
          ...baseContent,
          title: '💊 Supplement Reminder',
          body: `Don't forget: ${reminder.title}`,
          categoryIdentifier: 'supplement_reminder',
          data: {
            category: 'supplement_reminder' as NotificationCategory,
            screen: 'Profile',
            reminderId: reminder.id,
          },
          ...(Platform.OS === 'android' && { channelId: 'supplements' }),
        };

      case 'water':
        return {
          ...baseContent,
          title: '💧 Hydration Check',
          body: 'Have you had water recently? Stay hydrated!',
          categoryIdentifier: 'water_reminder',
          data: {
            category: 'water_reminder' as NotificationCategory,
            screen: 'LogFood',
          },
          ...(Platform.OS === 'android' && { channelId: 'water' }),
        };

      case 'weigh_in':
        return {
          ...baseContent,
          title: '⚖️ Weigh-in Reminder',
          body: 'Time to track your progress!',
          data: {
            category: 'weigh_in_reminder' as NotificationCategory,
            screen: 'Profile',
          },
          ...(Platform.OS === 'android' && { channelId: 'general' }),
        };

      default:
        return {
          ...baseContent,
          body: reminder.title,
          data: {
            category: 'custom' as NotificationCategory,
            screen: 'Dashboard',
          },
          ...(Platform.OS === 'android' && { channelId: 'general' }),
        };
    }
  }

  /**
   * Infer meal type from reminder title
   */
  private getMealTypeFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('breakfast')) return 'breakfast';
    if (lowerTitle.includes('lunch')) return 'lunch';
    if (lowerTitle.includes('dinner')) return 'dinner';
    return 'snack';
  }

  /**
   * Schedule a streak celebration notification
   */
  async scheduleStreakCelebration(streak: number): Promise<string | null> {
    const hasPermission = await this.hasPermission();
    if (!hasPermission) return null;

    // Only celebrate milestones
    const milestones = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
    if (!milestones.includes(streak)) return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔥 ${streak} Day Streak!`,
          body: this.getStreakMessage(streak),
          categoryIdentifier: 'streak_celebration',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            category: 'streak_celebration' as NotificationCategory,
            screen: 'Dashboard',
            streak,
          },
          ...(Platform.OS === 'android' && { channelId: 'achievements' }),
        },
        trigger: null, // Immediate
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to send streak notification:', error);
      return null;
    }
  }

  /**
   * Get motivational message based on streak length
   */
  private getStreakMessage(streak: number): string {
    if (streak >= 365) return "A FULL YEAR! You're absolutely incredible! 🏆";
    if (streak >= 100) return "Triple digits! You're a nutrition master! 💪";
    if (streak >= 30) return "A whole month! You're building lasting habits! 🌟";
    if (streak >= 14) return "Two weeks strong! You're on a roll! 🎯";
    if (streak >= 7) return "One week down! Great consistency! ✨";
    return "You're on fire! Keep up the amazing work! 💥";
  }

  /**
   * Schedule a goal achieved notification
   */
  async scheduleGoalAchieved(
    goalType: 'calories' | 'protein' | 'fats' | 'carbs' | 'all'
  ): Promise<string | null> {
    const hasPermission = await this.hasPermission();
    if (!hasPermission) return null;

    const titles: Record<string, string> = {
      calories: '🎉 Calorie Goal Hit!',
      protein: '💪 Protein Goal Achieved!',
      fats: '🥑 Fat Goal Reached!',
      carbs: '🍞 Carb Goal Complete!',
      all: '🏆 All Goals Achieved!',
    };

    const bodies: Record<string, string> = {
      calories: 'You hit your calorie target for today!',
      protein: 'Great job getting your protein in!',
      fats: 'You met your healthy fat goals!',
      carbs: 'Carb goals nailed!',
      all: 'Perfect day! You hit all your macro targets!',
    };

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: titles[goalType],
          body: bodies[goalType],
          categoryIdentifier: 'goal_achieved',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            category: 'goal_achieved' as NotificationCategory,
            screen: 'Dashboard',
            goalType,
          },
          ...(Platform.OS === 'android' && { channelId: 'achievements' }),
        },
        trigger: null, // Immediate
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to send goal notification:', error);
      return null;
    }
  }

  /**
   * Schedule weekly summary notification
   */
  async scheduleWeeklySummary(
    summary: { avgCalories: number; avgProtein: number; daysLogged: number; streak: number }
  ): Promise<string | null> {
    const hasPermission = await this.hasPermission();
    if (!hasPermission) return null;

    const body = `This week: ${summary.daysLogged}/7 days logged, ${Math.round(summary.avgCalories)} avg calories, ${summary.streak} day streak!`;

    try {
      // Schedule for Sunday at 7 PM
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Your Weekly Summary',
          body,
          data: {
            category: 'weekly_summary' as NotificationCategory,
            screen: 'History',
            summary,
          },
          ...(Platform.OS === 'android' && { channelId: 'general' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday
          hour: 19,
          minute: 0,
        } as Notifications.WeeklyTriggerInput,
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to schedule weekly summary:', error);
      return null;
    }
  }

  /**
   * Schedule immediate notification
   */
  async sendImmediateNotification(options: ScheduleOptions): Promise<string | null> {
    const hasPermission = await this.hasPermission();
    if (!hasPermission) return null;

    // Check quiet hours
    if (await this.isInQuietHours()) {
      console.log('[NotificationService] Skipped - quiet hours active');
      return null;
    }

    // Check if paused
    if (await this.isNotificationsPaused()) {
      console.log('[NotificationService] Skipped - notifications paused');
      return null;
    }

    try {
      const channelId = this.getChannelForCategory(options.category);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          subtitle: options.subtitle,
          sound: options.sound ?? true,
          badge: options.badge,
          data: options.data,
          priority: this.mapPriority(options.priority),
          categoryIdentifier: options.category,
          ...(Platform.OS === 'android' && channelId && { channelId }),
        },
        trigger: null, // Immediate
      });

      this.trackNotificationSent(options.category);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to send notification:', error);
      return null;
    }
  }

  /**
   * Get Android channel for category
   */
  private getChannelForCategory(category: NotificationCategory): string {
    switch (category) {
      case 'meal_reminder':
        return 'meals';
      case 'supplement_reminder':
        return 'supplements';
      case 'water_reminder':
        return 'water';
      case 'streak_celebration':
      case 'goal_achieved':
        return 'achievements';
      default:
        return 'general';
    }
  }

  /**
   * Map priority to Android constant
   */
  private mapPriority(
    priority?: 'default' | 'high' | 'max'
  ): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  // ============================================================================
  // RESPONSE HANDLING
  // ============================================================================

  /**
   * Handle notification response (when user taps or takes action)
   */
  async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data as NotificationData;

    console.log('[NotificationService] Response:', actionIdentifier, data);

    // Track analytics
    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      this.trackNotificationTapped(data.category);
    } else if (actionIdentifier === 'dismiss') {
      this.trackNotificationDismissed(data.category);
    }

    // Handle specific actions
    switch (actionIdentifier) {
      case 'snooze':
        await this.snoozeNotification(data, 15); // 15 minutes
        break;

      case 'mark_done':
        // Could log to database that supplement was taken
        console.log('[NotificationService] Marked as done:', data.reminderId);
        break;

      case Notifications.DEFAULT_ACTION_IDENTIFIER:
      case 'log_now':
      case 'view':
        // Navigate to appropriate screen
        this.navigateToScreen(data);
        break;
    }
  }

  /**
   * Navigate to screen based on notification data
   */
  private navigateToScreen(data: NotificationData): void {
    if (!this.navigationRef?.isReady()) {
      console.warn('[NotificationService] Navigation not ready');
      return;
    }

    const screen = data.screen || 'Dashboard';
    const params = data.params || {};

    try {
      this.navigationRef.navigate(screen, params);
    } catch (error) {
      console.error('[NotificationService] Navigation error:', error);
    }
  }

  /**
   * Snooze a notification
   */
  private async snoozeNotification(data: NotificationData, minutes: number): Promise<void> {
    const content = this.getSnoozedContent(data);

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        repeats: false,
      },
    });
  }

  /**
   * Get content for snoozed notification
   */
  private getSnoozedContent(data: NotificationData): Notifications.NotificationContentInput {
    switch (data.category) {
      case 'meal_reminder':
        return {
          title: '🍽️ Snoozed Reminder',
          body: "Don't forget to log your meal!",
          data,
          categoryIdentifier: 'meal_reminder',
        };
      case 'supplement_reminder':
        return {
          title: '💊 Supplement Reminder (Snoozed)',
          body: 'Time to take your supplements!',
          data,
          categoryIdentifier: 'supplement_reminder',
        };
      default:
        return {
          title: '⏰ Snoozed Reminder',
          body: 'You snoozed this reminder.',
          data,
        };
    }
  }

  // ============================================================================
  // MANAGEMENT
  // ============================================================================

  /**
   * Cancel a single notification by ID
   */
  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('[NotificationService] Cancel error:', error);
    }
  }

  /**
   * Cancel all notifications for a reminder
   */
  async cancelReminderNotifications(reminderId: number): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_IDS);
      if (storedData) {
        const allIds = JSON.parse(storedData);
        const reminderIds = allIds[reminderId.toString()] || [];

        for (const id of reminderIds) {
          await this.cancelNotification(id);
        }

        // Remove from storage
        delete allIds[reminderId.toString()];
        await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_IDS, JSON.stringify(allIds));
      }
    } catch (error) {
      console.error('[NotificationService] Cancel reminder notifications error:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_IDS);
    } catch (error) {
      console.error('[NotificationService] Cancel all error:', error);
    }
  }

  /**
   * Get all pending notifications
   */
  async getPendingNotifications(): Promise<PendingNotification[]> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();

      return scheduled.map((notification) => ({
        id: notification.identifier,
        title: notification.content.title || '',
        body: notification.content.body || '',
        category: (notification.content.data?.category as NotificationCategory) || 'custom',
        triggerDate: this.getTriggerDate(notification.trigger),
        data: notification.content.data as NotificationData,
      }));
    } catch (error) {
      console.error('[NotificationService] Get pending error:', error);
      return [];
    }
  }

  /**
   * Get trigger date from notification trigger
   */
  private getTriggerDate(trigger: Notifications.NotificationTrigger | null): Date | undefined {
    if (!trigger) return undefined;

    if ('dateComponents' in trigger && trigger.dateComponents) {
      const dateComponents = trigger.dateComponents as {
        year?: number;
        month?: number;
        day?: number;
        hour?: number;
        minute?: number;
      };
      const { year, month, day, hour, minute } = dateComponents;
      if (year && month && day) {
        return new Date(year, month - 1, day, hour || 0, minute || 0);
      }
    }

    return undefined;
  }

  /**
   * Store scheduled notification IDs
   */
  private async storeScheduledIds(reminderId: number, ids: string[]): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_IDS);
      const allIds = storedData ? JSON.parse(storedData) : {};
      allIds[reminderId.toString()] = ids;
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_IDS, JSON.stringify(allIds));
    } catch (error) {
      console.error('[NotificationService] Store IDs error:', error);
    }
  }

  // ============================================================================
  // QUIET HOURS / DO NOT DISTURB
  // ============================================================================

  /**
   * Set quiet hours
   */
  async setQuietHours(config: QuietHours): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.QUIET_HOURS, JSON.stringify(config));
  }

  /**
   * Get quiet hours configuration
   */
  async getQuietHours(): Promise<QuietHours | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.QUIET_HOURS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if currently in quiet hours
   */
  async isInQuietHours(): Promise<boolean> {
    const config = await this.getQuietHours();
    if (!config?.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check weekends only setting
    if (config.weekendsOnly) {
      const day = now.getDay();
      if (day !== 0 && day !== 6) return false; // Not weekend
    }

    // Compare times (handles overnight quiet hours like 22:00 - 07:00)
    if (config.startTime <= config.endTime) {
      return currentTime >= config.startTime && currentTime <= config.endTime;
    } else {
      // Overnight quiet hours
      return currentTime >= config.startTime || currentTime <= config.endTime;
    }
  }

  /**
   * Pause all notifications until a specific time
   */
  async pauseNotifications(until: Date): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PAUSED_UNTIL, until.toISOString());
  }

  /**
   * Resume notifications
   */
  async resumeNotifications(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.PAUSED_UNTIL);
  }

  /**
   * Check if notifications are paused
   */
  async isNotificationsPaused(): Promise<boolean> {
    try {
      const pausedUntil = await AsyncStorage.getItem(STORAGE_KEYS.PAUSED_UNTIL);
      if (!pausedUntil) return false;

      const pauseEnd = new Date(pausedUntil);
      if (pauseEnd <= new Date()) {
        await this.resumeNotifications();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Load analytics from storage
   */
  private async loadAnalytics(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (data) {
        this.analytics = JSON.parse(data);
      } else {
        this.analytics = this.getEmptyAnalytics();
      }
    } catch {
      this.analytics = this.getEmptyAnalytics();
    }
  }

  /**
   * Get empty analytics object
   */
  private getEmptyAnalytics(): NotificationAnalytics {
    const byCategoryStats: NotificationAnalytics['byCategoryStats'] = {} as any;
    const categories: NotificationCategory[] = [
      'meal_reminder',
      'supplement_reminder',
      'water_reminder',
      'weigh_in_reminder',
      'streak_celebration',
      'goal_achieved',
      'weekly_summary',
      'custom',
    ];

    for (const category of categories) {
      byCategoryStats[category] = { sent: 0, tapped: 0, dismissed: 0 };
    }

    return {
      totalSent: 0,
      totalTapped: 0,
      totalDismissed: 0,
      byCategoryStats,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Save analytics to storage
   */
  private async saveAnalytics(): Promise<void> {
    if (!this.analytics) return;

    this.analytics.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(this.analytics));
  }

  /**
   * Track notification sent
   */
  private trackNotificationSent(category?: NotificationCategory): void {
    if (!this.analytics) return;

    this.analytics.totalSent++;
    if (category && this.analytics.byCategoryStats[category]) {
      this.analytics.byCategoryStats[category].sent++;
    }
    this.saveAnalytics();
  }

  /**
   * Track notification tapped
   */
  private trackNotificationTapped(category?: NotificationCategory): void {
    if (!this.analytics) return;

    this.analytics.totalTapped++;
    if (category && this.analytics.byCategoryStats[category]) {
      this.analytics.byCategoryStats[category].tapped++;
    }
    this.saveAnalytics();
  }

  /**
   * Track notification dismissed
   */
  private trackNotificationDismissed(category?: NotificationCategory): void {
    if (!this.analytics) return;

    this.analytics.totalDismissed++;
    if (category && this.analytics.byCategoryStats[category]) {
      this.analytics.byCategoryStats[category].dismissed++;
    }
    this.saveAnalytics();
  }

  /**
   * Get notification analytics
   */
  async getAnalytics(): Promise<NotificationAnalytics> {
    if (!this.analytics) {
      await this.loadAnalytics();
    }
    return this.analytics || this.getEmptyAnalytics();
  }

  /**
   * Reset analytics
   */
  async resetAnalytics(): Promise<void> {
    this.analytics = this.getEmptyAnalytics();
    await this.saveAnalytics();
  }

  // ============================================================================
  // TESTING & DEBUGGING
  // ============================================================================

  /**
   * Send a test notification (for development/settings preview)
   */
  async sendTestNotification(
    type: NotificationCategory = 'meal_reminder'
  ): Promise<string | null> {
    const testContents: Record<NotificationCategory, { title: string; body: string }> = {
      meal_reminder: {
        title: '🍽️ Test: Meal Reminder',
        body: 'This is how your meal reminder will appear!',
      },
      supplement_reminder: {
        title: '💊 Test: Supplement Reminder',
        body: 'This is how your supplement reminder will appear!',
      },
      water_reminder: {
        title: '💧 Test: Water Reminder',
        body: 'This is how your water reminder will appear!',
      },
      weigh_in_reminder: {
        title: '⚖️ Test: Weigh-in Reminder',
        body: 'This is how your weigh-in reminder will appear!',
      },
      streak_celebration: {
        title: '🔥 Test: Streak Celebration',
        body: 'This is how streak celebrations will appear!',
      },
      goal_achieved: {
        title: '🎉 Test: Goal Achieved',
        body: 'This is how goal achievements will appear!',
      },
      weekly_summary: {
        title: '📊 Test: Weekly Summary',
        body: 'This is how your weekly summary will appear!',
      },
      custom: {
        title: '🔔 Test: Custom Notification',
        body: 'This is a custom notification preview!',
      },
    };

    const content = testContents[type];

    return this.sendImmediateNotification({
      ...content,
      category: type,
      data: { category: type, screen: 'Dashboard' },
    });
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
export const notificationService = new NotificationService();

// Export legacy function for backwards compatibility
export const scheduleReminder = async (title: string, body: string, seconds: number) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
};