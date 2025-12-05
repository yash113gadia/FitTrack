/**
 * WeekdayPicker Component
 *
 * A visual weekday selector with toggleable day buttons.
 *
 * @example
 * // Basic usage
 * <WeekdayPicker
 *   selectedDays={[1, 2, 3, 4, 5]}
 *   onChange={(days) => setSelectedDays(days)}
 * />
 *
 * @example
 * // With preset buttons
 * <WeekdayPicker
 *   selectedDays={days}
 *   onChange={setDays}
 *   showPresets
 * />
 *
 * Props:
 * - selectedDays: number[] - Array of selected days (0=Sunday, 6=Saturday)
 * - onChange: (days: number[]) => void - Change handler
 * - showPresets: boolean - Show weekdays/weekend/all presets
 * - label: string - Optional label
 * - error: string - Error message
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface WeekdayPickerProps {
  /** Selected days (0-6, Sunday-Saturday) */
  selectedDays: number[];
  /** Change handler */
  onChange: (days: number[]) => void;
  /** Show preset buttons (Weekdays, Weekend, All) */
  showPresets?: boolean;
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Start week on Monday */
  startOnMonday?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_SUNDAY_START = [
  { short: 'S', full: 'Sunday', index: 0 },
  { short: 'M', full: 'Monday', index: 1 },
  { short: 'T', full: 'Tuesday', index: 2 },
  { short: 'W', full: 'Wednesday', index: 3 },
  { short: 'T', full: 'Thursday', index: 4 },
  { short: 'F', full: 'Friday', index: 5 },
  { short: 'S', full: 'Saturday', index: 6 },
];

const DAYS_MONDAY_START = [
  { short: 'M', full: 'Monday', index: 1 },
  { short: 'T', full: 'Tuesday', index: 2 },
  { short: 'W', full: 'Wednesday', index: 3 },
  { short: 'T', full: 'Thursday', index: 4 },
  { short: 'F', full: 'Friday', index: 5 },
  { short: 'S', full: 'Saturday', index: 6 },
  { short: 'S', full: 'Sunday', index: 0 },
];

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// ============================================================================
// DAY BUTTON COMPONENT
// ============================================================================

interface DayButtonProps {
  day: { short: string; full: string; index: number };
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DayButton: React.FC<DayButtonProps> = ({
  day,
  isSelected,
  onPress,
  disabled,
}) => {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isSelected ? 1 : 0);

  // Update progress when selection changes
  React.useEffect(() => {
    progress.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isSelected, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [colors.gray[100], colors.primary[500]]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [colors.gray[600], colors.white]
    );
    return { color };
  });

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={animatedStyle}
      className={`w-10 h-10 rounded-full items-center justify-center ${
        disabled ? 'opacity-50' : ''
      }`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected, disabled }}
      accessibilityLabel={`${day.full}, ${isSelected ? 'selected' : 'not selected'}`}
    >
      <Animated.Text
        style={textAnimatedStyle}
        className="text-sm font-semibold"
      >
        {day.short}
      </Animated.Text>
    </AnimatedPressable>
  );
};

// ============================================================================
// PRESET BUTTON COMPONENT
// ============================================================================

interface PresetButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const PresetButton: React.FC<PresetButtonProps> = ({
  label,
  isActive,
  onPress,
  disabled,
}) => {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full mr-2 ${
        isActive
          ? 'bg-primary-100 border border-primary-500'
          : 'bg-gray-100 border border-gray-200'
      } ${disabled ? 'opacity-50' : ''}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className={`text-xs font-medium ${
          isActive ? 'text-primary-700' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WeekdayPicker: React.FC<WeekdayPickerProps> = ({
  selectedDays,
  onChange,
  showPresets = false,
  label,
  error,
  helperText,
  disabled = false,
  startOnMonday = true,
  className = '',
}) => {
  const days = startOnMonday ? DAYS_MONDAY_START : DAYS_SUNDAY_START;

  // Check if presets are active
  const isWeekdaysActive = useMemo(() => {
    return (
      WEEKDAYS.every(d => selectedDays.includes(d)) &&
      !WEEKEND.some(d => selectedDays.includes(d))
    );
  }, [selectedDays]);

  const isWeekendActive = useMemo(() => {
    return (
      WEEKEND.every(d => selectedDays.includes(d)) &&
      !WEEKDAYS.some(d => selectedDays.includes(d))
    );
  }, [selectedDays]);

  const isAllActive = useMemo(() => {
    return ALL_DAYS.every(d => selectedDays.includes(d));
  }, [selectedDays]);

  // Toggle day selection
  const toggleDay = useCallback(
    (dayIndex: number) => {
      if (selectedDays.includes(dayIndex)) {
        // Remove day
        onChange(selectedDays.filter(d => d !== dayIndex));
      } else {
        // Add day
        onChange([...selectedDays, dayIndex].sort());
      }
    },
    [selectedDays, onChange]
  );

  // Preset handlers
  const handleWeekdays = useCallback(() => {
    onChange(WEEKDAYS);
  }, [onChange]);

  const handleWeekend = useCallback(() => {
    onChange(WEEKEND);
  }, [onChange]);

  const handleAll = useCallback(() => {
    onChange(ALL_DAYS);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <View className={className}>
      {/* Label */}
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      )}

      {/* Day buttons */}
      <View className="flex-row justify-between mb-2">
        {days.map(day => (
          <DayButton
            key={day.index}
            day={day}
            isSelected={selectedDays.includes(day.index)}
            onPress={() => toggleDay(day.index)}
            disabled={disabled}
          />
        ))}
      </View>

      {/* Presets */}
      {showPresets && (
        <View className="flex-row flex-wrap mt-2">
          <PresetButton
            label="Weekdays"
            isActive={isWeekdaysActive}
            onPress={handleWeekdays}
            disabled={disabled}
          />
          <PresetButton
            label="Weekend"
            isActive={isWeekendActive}
            onPress={handleWeekend}
            disabled={disabled}
          />
          <PresetButton
            label="Every Day"
            isActive={isAllActive}
            onPress={handleAll}
            disabled={disabled}
          />
          {selectedDays.length > 0 && (
            <PresetButton
              label="Clear"
              isActive={false}
              onPress={handleClear}
              disabled={disabled}
            />
          )}
        </View>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <Text className="text-xs text-gray-500 mt-2">{helperText}</Text>
      )}

      {/* Error */}
      {error && <Text className="text-xs text-error-500 mt-2">{error}</Text>}
    </View>
  );
};

export default WeekdayPicker;
