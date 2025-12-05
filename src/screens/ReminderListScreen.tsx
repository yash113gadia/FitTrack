/**
 * ReminderListScreen
 *
 * Displays all active reminders grouped by type with swipe actions.
 * Features include:
 * - Grouped display by reminder type (Meals, Supplements, Other)
 * - Enable/disable toggle for each reminder
 * - Swipe to delete
 * - Tap to edit
 * - FAB to add new reminder
 *
 * @navigation
 * - AddEditReminder: Navigate to add/edit screen
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeOut,
  Layout,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { Card, SwipeableRow, EmptyState, Button } from '../components/common';
import { colors } from '../constants/theme';
import { databaseService } from '../services/database';
import { notificationService } from '../services/notifications';
import { Reminder } from '../types';

// ============================================================================
// TYPES
// ============================================================================

type ReminderType = 'meal' | 'supplement' | 'water' | 'weigh_in' | 'custom';

interface GroupedReminders {
  meals: Reminder[];
  supplements: Reminder[];
  other: Reminder[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const TYPE_ICONS: Record<ReminderType, string> = {
  meal: 'restaurant',
  supplement: 'medical',
  water: 'water',
  weigh_in: 'scale',
  custom: 'notifications',
};

const TYPE_COLORS: Record<ReminderType, string> = {
  meal: colors.macros.calories,
  supplement: colors.macros.protein,
  water: colors.primary[500],
  weigh_in: colors.warning[500],
  custom: colors.gray[500],
};

const GROUP_INFO = {
  meals: {
    title: 'Meal Reminders',
    icon: 'restaurant-outline',
    color: colors.macros.calories,
    types: ['meal'] as ReminderType[],
  },
  supplements: {
    title: 'Supplement Reminders',
    icon: 'medical-outline',
    color: colors.macros.protein,
    types: ['supplement'] as ReminderType[],
  },
  other: {
    title: 'Other Reminders',
    icon: 'notifications-outline',
    color: colors.primary[500],
    types: ['water', 'weigh_in', 'custom'] as ReminderType[],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const formatDays = (days: number[]): string => {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }
  // Show abbreviated days
  return days
    .sort()
    .map(d => DAYS_SHORT[d])
    .join(', ');
};

const groupReminders = (reminders: Reminder[]): GroupedReminders => {
  return {
    meals: reminders.filter(r => r.type === 'meal'),
    supplements: reminders.filter(r => r.type === 'supplement'),
    other: reminders.filter(r => ['water', 'weigh_in', 'custom'].includes(r.type)),
  };
};

// ============================================================================
// REMINDER ITEM COMPONENT
// ============================================================================

interface ReminderItemProps {
  reminder: Reminder;
  onToggle: (id: number, enabled: boolean) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: number) => void;
  index: number;
}

const ReminderItem: React.FC<ReminderItemProps> = ({
  reminder,
  onToggle,
  onEdit,
  onDelete,
  index,
}) => {
  const type = reminder.type as ReminderType;

  const handleToggle = useCallback((value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(reminder.id, value);
  }, [reminder.id, onToggle]);

  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(reminder);
  }, [reminder, onEdit]);

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(reminder.id),
        },
      ]
    );
  }, [reminder, onDelete]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
      <SwipeableRow
        onEdit={handleEdit}
        onDelete={handleDelete}
      >
        <Pressable
          onPress={handleEdit}
          className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100"
        >
          {/* Type icon */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${TYPE_COLORS[type]}20` }}
          >
            <Ionicons
              name={TYPE_ICONS[type] as any}
              size={20}
              color={TYPE_COLORS[type]}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text
              className={`text-base font-medium ${
                reminder.enabled ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {reminder.title}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons
                name="time-outline"
                size={14}
                color={reminder.enabled ? colors.gray[500] : colors.gray[300]}
              />
              <Text
                className={`text-sm ml-1 ${
                  reminder.enabled ? 'text-gray-500' : 'text-gray-300'
                }`}
              >
                {formatTime(reminder.time)}
              </Text>
              <Text className="text-gray-300 mx-2">•</Text>
              <Text
                className={`text-sm ${
                  reminder.enabled ? 'text-gray-500' : 'text-gray-300'
                }`}
              >
                {formatDays(reminder.days)}
              </Text>
            </View>
          </View>

          {/* Toggle */}
          <Switch
            value={reminder.enabled}
            onValueChange={handleToggle}
            trackColor={{
              false: colors.gray[200],
              true: colors.primary[400],
            }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.gray[200]}
          />
        </Pressable>
      </SwipeableRow>
    </Animated.View>
  );
};

// ============================================================================
// REMINDER GROUP COMPONENT
// ============================================================================

interface ReminderGroupProps {
  groupKey: keyof typeof GROUP_INFO;
  reminders: Reminder[];
  onToggle: (id: number, enabled: boolean) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: number) => void;
}

const ReminderGroup: React.FC<ReminderGroupProps> = ({
  groupKey,
  reminders,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const groupInfo = GROUP_INFO[groupKey];
  const [isExpanded, setIsExpanded] = useState(true);

  if (reminders.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      className="mb-4"
    >
      {/* Group header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between px-4 py-2"
      >
        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center mr-2"
            style={{ backgroundColor: `${groupInfo.color}20` }}
          >
            <Ionicons
              name={groupInfo.icon as any}
              size={18}
              color={groupInfo.color}
            />
          </View>
          <Text className="text-base font-semibold text-gray-900">
            {groupInfo.title}
          </Text>
          <View className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full">
            <Text className="text-xs text-gray-600 font-medium">
              {reminders.length}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.gray[400]}
        />
      </Pressable>

      {/* Items */}
      {isExpanded && (
        <Card variant="elevated" className="mx-4 overflow-hidden">
          {reminders.map((reminder, index) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              index={index}
            />
          ))}
        </Card>
      )}
    </Animated.View>
  );
};

// ============================================================================
// FAB COMPONENT
// ============================================================================

interface FABProps {
  onPress: () => void;
}

const FAB: React.FC<FABProps> = ({ onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Animated.View
      entering={SlideInRight.delay(300).springify()}
      style={[styles.fab, animatedStyle]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="w-14 h-14 rounded-full bg-primary-500 items-center justify-center shadow-lg"
        accessibilityRole="button"
        accessibilityLabel="Add new reminder"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

const ReminderListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Group reminders by type
  const groupedReminders = useMemo(() => groupReminders(reminders), [reminders]);

  // Load reminders
  const loadReminders = useCallback(async () => {
    try {
      // Assuming userId 1 for now - in real app, get from auth context
      const data = await databaseService.getReminders(1);
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Reload on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadReminders();
    });
    return unsubscribe;
  }, [navigation, loadReminders]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReminders();
  }, [loadReminders]);

  // Toggle reminder enabled state
  const handleToggle = useCallback(async (id: number, enabled: boolean) => {
    try {
      await databaseService.updateReminder(id, { enabled });

      // Update local state
      setReminders(prev =>
        prev.map(r => (r.id === id ? { ...r, enabled } : r))
      );

      // Update notification schedule
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        if (enabled) {
          await notificationService.scheduleReminder({ ...reminder, enabled });
        } else {
          await notificationService.cancelReminderNotifications(id);
        }
      }
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
      Alert.alert('Error', 'Failed to update reminder');
    }
  }, [reminders]);

  // Edit reminder
  const handleEdit = useCallback((reminder: Reminder) => {
    navigation.navigate('AddEditReminder', { reminder });
  }, [navigation]);

  // Delete reminder
  const handleDelete = useCallback(async (id: number) => {
    try {
      // Cancel notifications first
      await notificationService.cancelReminderNotifications(id);

      // Delete from database
      await databaseService.deleteReminder(id);

      // Update local state
      setReminders(prev => prev.filter(r => r.id !== id));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder');
    }
  }, []);

  // Add new reminder
  const handleAddReminder = useCallback(() => {
    navigation.navigate('AddEditReminder', { reminder: null });
  }, [navigation]);

  // Check if there are any reminders
  const hasReminders =
    groupedReminders.meals.length > 0 ||
    groupedReminders.supplements.length > 0 ||
    groupedReminders.other.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Reminders
        </Text>
        <Pressable
          onPress={handleAddReminder}
          className="p-2 -mr-2"
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary[500]} />
        </Pressable>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">Loading...</Text>
        </View>
      ) : hasReminders ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="py-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
        >
          {/* Meal reminders */}
          <ReminderGroup
            groupKey="meals"
            reminders={groupedReminders.meals}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Supplement reminders */}
          <ReminderGroup
            groupKey="supplements"
            reminders={groupedReminders.supplements}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Other reminders */}
          <ReminderGroup
            groupKey="other"
            reminders={groupedReminders.other}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Spacer for FAB */}
          <View className="h-24" />
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <EmptyState
            title="No Reminders Yet"
            subtitle="Set up reminders to help you stay on track with your nutrition goals."
            iconName="notifications-outline"
            actionLabel="Add Reminder"
            onAction={handleAddReminder}
          />
        </View>
      )}

      {/* FAB */}
      {hasReminders && <FAB onPress={handleAddReminder} />}
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ReminderListScreen;
