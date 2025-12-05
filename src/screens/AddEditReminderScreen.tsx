/**
 * AddEditReminderScreen
 *
 * Form for creating or editing reminders with smart defaults.
 * Features include:
 * - Reminder type selection (Meal, Supplement, Water, Weigh-in, Custom)
 * - Auto-filled title based on type
 * - Beautiful time picker with AM/PM
 * - Visual weekday selector
 * - Smart defaults for common scenarios
 * - Validation (at least one day, duplicate checking, sleep hour warnings)
 * - Test notification button
 *
 * @navigation
 * - route.params.reminder: Reminder | null - Existing reminder for editing
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import {
  Card,
  Button,
  TextInput,
  Dropdown,
  WeekdayPicker,
  TimePicker,
} from '../components/common';
import { colors } from '../constants/theme';
import { databaseService } from '../services/database';
import { notificationService } from '../services/notifications';
import { Reminder } from '../types';

// ============================================================================
// TYPES
// ============================================================================

type ReminderType = 'meal' | 'supplement' | 'water' | 'weigh_in' | 'custom';

interface FormData {
  type: ReminderType;
  title: string;
  time: string;
  days: number[];
  enabled: boolean;
}

type RouteParams = {
  AddEditReminder: {
    reminder: Reminder | null;
  };
};

// ============================================================================
// CONSTANTS
// ============================================================================

const REMINDER_TYPES = [
  { label: '🍽️ Meal', value: 'meal' },
  { label: '💊 Supplement', value: 'supplement' },
  { label: '💧 Water', value: 'water' },
  { label: '⚖️ Weigh-in', value: 'weigh_in' },
  { label: '🔔 Custom', value: 'custom' },
];

const DEFAULT_TITLES: Record<ReminderType, string> = {
  meal: 'Meal Reminder',
  supplement: 'Take Supplements',
  water: 'Drink Water',
  weigh_in: 'Weigh-in Time',
  custom: 'Custom Reminder',
};

// Smart defaults based on reminder type
const SMART_DEFAULTS: Record<ReminderType, { time: string; days: number[] }> = {
  meal: { time: '12:30', days: [1, 2, 3, 4, 5] }, // Weekdays lunch
  supplement: { time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] }, // Every day morning
  water: { time: '10:00', days: [0, 1, 2, 3, 4, 5, 6] }, // Every day
  weigh_in: { time: '07:00', days: [1] }, // Monday morning
  custom: { time: '09:00', days: [1, 2, 3, 4, 5] }, // Weekdays
};

// Meal-specific presets
const MEAL_PRESETS = [
  { label: 'Breakfast', title: 'Breakfast Time', time: '08:00', days: [1, 2, 3, 4, 5] },
  { label: 'Lunch', title: 'Lunch Time', time: '12:30', days: [1, 2, 3, 4, 5] },
  { label: 'Dinner', title: 'Dinner Time', time: '19:00', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Snack', title: 'Snack Time', time: '15:00', days: [1, 2, 3, 4, 5] },
];

// Sleep hours for warning (10 PM - 6 AM)
const SLEEP_HOURS_START = 22;
const SLEEP_HOURS_END = 6;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isInSleepHours = (time: string): boolean => {
  const [hours] = time.split(':').map(Number);
  return hours >= SLEEP_HOURS_START || hours < SLEEP_HOURS_END;
};

// ============================================================================
// MEAL PRESET SELECTOR
// ============================================================================

interface MealPresetSelectorProps {
  onSelect: (preset: { title: string; time: string; days: number[] }) => void;
}

const MealPresetSelector: React.FC<MealPresetSelectorProps> = ({ onSelect }) => {
  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <Text className="text-sm font-medium text-gray-700 mb-2">Quick Select</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {MEAL_PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(preset);
            }}
            className="mr-2 px-4 py-2.5 bg-primary-50 rounded-xl border border-primary-200"
          >
            <Text className="text-sm font-medium text-primary-700">{preset.label}</Text>
            <Text className="text-xs text-primary-500 mt-0.5">{preset.time}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

// ============================================================================
// FORM SECTION COMPONENT
// ============================================================================

interface FormSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  delay?: number;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  children,
  delay = 0,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="mb-6"
    >
      <View className="flex-row items-center mb-3">
        {icon && (
          <Ionicons
            name={icon as any}
            size={18}
            color={colors.gray[500]}
            style={{ marginRight: 8 }}
          />
        )}
        <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </Text>
      </View>
      {children}
    </Animated.View>
  );
};

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

const AddEditReminderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AddEditReminder'>>();
  const existingReminder = route.params?.reminder;
  const isEditing = !!existingReminder;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    type: existingReminder?.type || 'meal',
    title: existingReminder?.title || DEFAULT_TITLES.meal,
    time: existingReminder?.time || SMART_DEFAULTS.meal.time,
    days: existingReminder?.days || SMART_DEFAULTS.meal.days,
    enabled: existingReminder?.enabled ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.days.length === 0) {
      newErrors.days = 'Select at least one day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle type change with smart defaults
  const handleTypeChange = useCallback((type: string | number) => {
    const newType = type as ReminderType;
    const defaults = SMART_DEFAULTS[newType];

    setFormData(prev => ({
      ...prev,
      type: newType,
      title: isEditing ? prev.title : DEFAULT_TITLES[newType],
      time: isEditing ? prev.time : defaults.time,
      days: isEditing ? prev.days : defaults.days,
    }));
    setErrors({});
  }, [isEditing]);

  // Handle meal preset selection
  const handleMealPreset = useCallback((preset: { title: string; time: string; days: number[] }) => {
    setFormData(prev => ({
      ...prev,
      title: preset.title,
      time: preset.time,
      days: preset.days,
    }));
  }, []);

  // Check for sleep hours warning
  const showSleepWarning = useMemo(() => {
    return isInSleepHours(formData.time);
  }, [formData.time]);

  // Save reminder
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Sleep hours confirmation
    if (showSleepWarning) {
      Alert.alert(
        'Sleep Hours Warning',
        'This reminder is scheduled during typical sleep hours (10 PM - 6 AM). Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => saveReminder(),
          },
        ]
      );
      return;
    }

    await saveReminder();
  }, [validateForm, showSleepWarning]);

  const saveReminder = async () => {
    setIsSaving(true);

    try {
      // Assuming userId 1 - in real app, get from auth context
      const reminderData: Omit<Reminder, 'id'> = {
        userId: 1,
        type: formData.type,
        title: formData.title.trim(),
        time: formData.time,
        days: formData.days,
        enabled: formData.enabled,
      };

      let savedReminder: Reminder;

      if (isEditing) {
        // Update existing reminder
        await databaseService.updateReminder(existingReminder!.id, reminderData);
        savedReminder = { ...reminderData, id: existingReminder!.id };

        // Update notification schedule
        if (formData.enabled) {
          await notificationService.cancelReminderNotifications(existingReminder!.id);
          await notificationService.scheduleReminder(savedReminder);
        } else {
          await notificationService.cancelReminderNotifications(existingReminder!.id);
        }
      } else {
        // Create new reminder
        savedReminder = await databaseService.createReminder(reminderData);

        // Schedule notification if enabled
        if (formData.enabled) {
          const notificationIds = await notificationService.scheduleReminder(savedReminder);
          // Update reminder with notification ID
          if (notificationIds.length > 0) {
            await databaseService.updateReminder(savedReminder.id, {
              notificationId: notificationIds[0],
            });
          }
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save reminder:', error);
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Test notification
  const handleTestNotification = useCallback(async () => {
    try {
      const hasPermission = await notificationService.hasPermission();
      if (!hasPermission) {
        const granted = await notificationService.requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive reminders.'
          );
          return;
        }
      }

      // Map reminder type to notification category
      const categoryMap: Record<ReminderType, any> = {
        meal: 'meal_reminder',
        supplement: 'supplement_reminder',
        water: 'water_reminder',
        weigh_in: 'weigh_in_reminder',
        custom: 'custom',
      };

      await notificationService.sendTestNotification(categoryMap[formData.type]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  }, [formData.type]);

  // Delete reminder (only when editing)
  const handleDelete = useCallback(() => {
    if (!existingReminder) return;

    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${existingReminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.cancelReminderNotifications(existingReminder.id);
              await databaseService.deleteReminder(existingReminder.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  }, [existingReminder, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Ionicons name="close" size={24} color={colors.gray[700]} />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Reminder' : 'New Reminder'}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="p-2 -mr-2"
            accessibilityRole="button"
            accessibilityLabel="Save"
          >
            <Text
              className={`text-base font-semibold ${
                isSaving ? 'text-gray-400' : 'text-primary-600'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Reminder Type */}
          <FormSection title="Reminder Type" icon="notifications-outline" delay={0}>
            <Dropdown
              value={formData.type}
              onChange={handleTypeChange}
              options={REMINDER_TYPES}
              placeholder="Select type"
            />
          </FormSection>

          {/* Meal presets (only for meal type) */}
          {formData.type === 'meal' && !isEditing && (
            <MealPresetSelector onSelect={handleMealPreset} />
          )}

          {/* Title */}
          <FormSection title="Title" icon="text-outline" delay={50}>
            <TextInput
              value={formData.title}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, title: text }));
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              placeholder="Enter reminder title"
              error={errors.title}
              maxLength={50}
            />
          </FormSection>

          {/* Time */}
          <FormSection title="Time" icon="time-outline" delay={100}>
            <TimePicker
              value={formData.time}
              onChange={(time) => setFormData(prev => ({ ...prev, time }))}
              format="12h"
              minuteInterval={5}
            />
            {showSleepWarning && (
              <View className="flex-row items-center mt-2 px-3 py-2 bg-warning-50 rounded-lg">
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={colors.warning[600]}
                />
                <Text className="text-sm text-warning-700 ml-2 flex-1">
                  This time is during typical sleep hours
                </Text>
              </View>
            )}
          </FormSection>

          {/* Days */}
          <FormSection title="Repeat Days" icon="calendar-outline" delay={150}>
            <Card variant="outlined" padding="md">
              <WeekdayPicker
                selectedDays={formData.days}
                onChange={(days) => {
                  setFormData(prev => ({ ...prev, days }));
                  if (errors.days) setErrors(prev => ({ ...prev, days: undefined }));
                }}
                showPresets
                error={errors.days}
              />
            </Card>
          </FormSection>

          {/* Enabled toggle */}
          <FormSection title="Status" icon="power-outline" delay={200}>
            <Card variant="outlined" padding="md">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-base font-medium text-gray-900">
                    Reminder Active
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {formData.enabled
                      ? 'You will receive notifications'
                      : 'Notifications are paused'}
                  </Text>
                </View>
                <Switch
                  value={formData.enabled}
                  onValueChange={(enabled) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFormData(prev => ({ ...prev, enabled }));
                  }}
                  trackColor={{
                    false: colors.gray[200],
                    true: colors.primary[400],
                  }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.gray[200]}
                />
              </View>
            </Card>
          </FormSection>

          {/* Test notification button */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Button
              variant="outline"
              onPress={handleTestNotification}
              icon={<Ionicons name="notifications-outline" size={18} color={colors.primary[600]} />}
              className="mb-4"
            >
              Send Test Notification
            </Button>
          </Animated.View>

          {/* Delete button (only when editing) */}
          {isEditing && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Button
                variant="ghost"
                onPress={handleDelete}
                icon={<Ionicons name="trash-outline" size={18} color={colors.error[600]} />}
                className="mb-8"
              >
                <Text className="text-error-600 font-medium">Delete Reminder</Text>
              </Button>
            </Animated.View>
          )}

          {/* Bottom spacing */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddEditReminderScreen;
