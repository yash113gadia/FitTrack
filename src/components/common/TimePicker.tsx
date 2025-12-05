/**
 * TimePicker Component
 *
 * A beautiful time picker with wheel or clock face selection.
 *
 * @example
 * // Basic usage
 * <TimePicker
 *   value="14:30"
 *   onChange={(time) => setTime(time)}
 * />
 *
 * @example
 * // With label and 12-hour format
 * <TimePicker
 *   value={time}
 *   onChange={setTime}
 *   label="Reminder Time"
 *   format="12h"
 * />
 *
 * Props:
 * - value: string - Time in HH:mm format
 * - onChange: (time: string) => void - Change handler
 * - label: string - Optional label
 * - format: '12h' | '24h' - Time format display
 * - minuteInterval: 1 | 5 | 10 | 15 | 30 - Minute selection interval
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Modal, ScrollView, SafeAreaView, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface TimePickerProps {
  /** Time value in HH:mm format */
  value: string;
  /** Change handler */
  onChange: (time: string) => void;
  /** Label text */
  label?: string;
  /** Time format */
  format?: '12h' | '24h';
  /** Minute interval */
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const parseTime = (time: string): { hours: number; minutes: number } => {
  const [h, m] = time.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
};

const formatTime = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const format12Hour = (hours: number, minutes: number): { display: string; period: 'AM' | 'PM' } => {
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  return {
    display: `${displayHours}:${minutes.toString().padStart(2, '0')}`,
    period,
  };
};

// ============================================================================
// WHEEL PICKER ITEM
// ============================================================================

interface WheelItemProps {
  value: number;
  displayValue: string;
  isSelected: boolean;
  onPress: () => void;
}

const WheelItem: React.FC<WheelItemProps> = ({
  value,
  displayValue,
  isSelected,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className={`py-3 px-4 items-center justify-center ${
        isSelected ? 'bg-primary-50' : ''
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <Text
        className={`text-xl ${
          isSelected
            ? 'text-primary-600 font-bold'
            : 'text-gray-400 font-medium'
        }`}
      >
        {displayValue}
      </Text>
    </Pressable>
  );
};

// ============================================================================
// WHEEL COLUMN COMPONENT
// ============================================================================

interface WheelColumnProps {
  values: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  formatDisplay?: (value: number) => string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  values,
  selectedValue,
  onSelect,
  formatDisplay = (v) => v.toString().padStart(2, '0'),
}) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const itemHeight = 52;

  // Scroll to selected value on mount
  useEffect(() => {
    const index = values.indexOf(selectedValue);
    if (index >= 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: index * itemHeight,
          animated: false,
        });
      }, 100);
    }
  }, [selectedValue, values]);

  const handleSelect = useCallback((value: number) => {
    Haptics.selectionAsync();
    onSelect(value);
  }, [onSelect]);

  return (
    <View className="h-52 flex-1 mx-1">
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: itemHeight * 2 }}
      >
        {values.map((value) => (
          <WheelItem
            key={value}
            value={value}
            displayValue={formatDisplay(value)}
            isSelected={value === selectedValue}
            onPress={() => handleSelect(value)}
          />
        ))}
      </ScrollView>
      {/* Selection indicator */}
      <View
        pointerEvents="none"
        className="absolute top-24 left-0 right-0 h-13 border-t border-b border-gray-200"
      />
    </View>
  );
};

// ============================================================================
// PERIOD SELECTOR (AM/PM)
// ============================================================================

interface PeriodSelectorProps {
  value: 'AM' | 'PM';
  onChange: (period: 'AM' | 'PM') => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const handleToggle = useCallback((period: 'AM' | 'PM') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(period);
  }, [onChange]);

  return (
    <View className="flex-row mx-2 bg-gray-100 rounded-lg overflow-hidden">
      <Pressable
        onPress={() => handleToggle('AM')}
        className={`px-4 py-3 ${value === 'AM' ? 'bg-primary-500' : ''}`}
      >
        <Text
          className={`font-semibold ${
            value === 'AM' ? 'text-white' : 'text-gray-500'
          }`}
        >
          AM
        </Text>
      </Pressable>
      <Pressable
        onPress={() => handleToggle('PM')}
        className={`px-4 py-3 ${value === 'PM' ? 'bg-primary-500' : ''}`}
      >
        <Text
          className={`font-semibold ${
            value === 'PM' ? 'text-white' : 'text-gray-500'
          }`}
        >
          PM
        </Text>
      </Pressable>
    </View>
  );
};

// ============================================================================
// QUICK TIME PRESETS
// ============================================================================

interface QuickPresetsProps {
  onSelect: (time: string) => void;
}

const QuickPresets: React.FC<QuickPresetsProps> = ({ onSelect }) => {
  const presets = [
    { label: '6:00 AM', time: '06:00' },
    { label: '8:00 AM', time: '08:00' },
    { label: '12:00 PM', time: '12:00' },
    { label: '6:00 PM', time: '18:00' },
    { label: '9:00 PM', time: '21:00' },
  ];

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-500 mb-2">Quick Select</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {presets.map((preset) => (
          <Pressable
            key={preset.time}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(preset.time);
            }}
            className="mr-2 px-3 py-2 bg-gray-100 rounded-lg"
          >
            <Text className="text-sm text-gray-700">{preset.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  format = '12h',
  minuteInterval = 5,
  disabled = false,
  error,
  helperText,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hours, minutes } = parseTime(value);
  const [tempHours, setTempHours] = useState(hours);
  const [tempMinutes, setTempMinutes] = useState(minutes);
  const [period, setPeriod] = useState<'AM' | 'PM'>(hours >= 12 ? 'PM' : 'AM');

  // Generate hour values
  const hourValues = useMemo(() => {
    if (format === '12h') {
      return Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [format]);

  // Generate minute values based on interval
  const minuteValues = useMemo(() => {
    const values: number[] = [];
    for (let i = 0; i < 60; i += minuteInterval) {
      values.push(i);
    }
    return values;
  }, [minuteInterval]);

  // Update temp values when value changes
  useEffect(() => {
    const { hours: h, minutes: m } = parseTime(value);
    if (format === '12h') {
      let displayHours = h % 12;
      if (displayHours === 0) displayHours = 12;
      setTempHours(displayHours);
      setPeriod(h >= 12 ? 'PM' : 'AM');
    } else {
      setTempHours(h);
    }
    // Snap to nearest interval
    const snappedMinutes = Math.round(m / minuteInterval) * minuteInterval;
    setTempMinutes(snappedMinutes >= 60 ? 0 : snappedMinutes);
  }, [value, format, minuteInterval]);

  // Display text
  const displayText = useMemo(() => {
    if (format === '12h') {
      const { display, period: p } = format12Hour(hours, minutes);
      return `${display} ${p}`;
    }
    return formatTime(hours, minutes);
  }, [hours, minutes, format]);

  // Open picker
  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [disabled]);

  // Close picker
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Confirm selection
  const handleConfirm = useCallback(() => {
    let finalHours = tempHours;
    if (format === '12h') {
      if (period === 'PM' && tempHours !== 12) {
        finalHours = tempHours + 12;
      } else if (period === 'AM' && tempHours === 12) {
        finalHours = 0;
      }
    }
    const newTime = formatTime(finalHours, tempMinutes);
    onChange(newTime);
    setIsOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [tempHours, tempMinutes, period, format, onChange]);

  // Quick preset handler
  const handleQuickSelect = useCallback((time: string) => {
    const { hours: h, minutes: m } = parseTime(time);
    if (format === '12h') {
      let displayHours = h % 12;
      if (displayHours === 0) displayHours = 12;
      setTempHours(displayHours);
      setPeriod(h >= 12 ? 'PM' : 'AM');
    } else {
      setTempHours(h);
    }
    setTempMinutes(m);
  }, [format]);

  return (
    <View className={className}>
      {/* Label */}
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      )}

      {/* Time display button */}
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        className={`flex-row items-center justify-between px-4 py-3.5 bg-white border rounded-xl ${
          error ? 'border-error-500' : 'border-gray-200'
        } ${disabled ? 'opacity-50 bg-gray-50' : ''}`}
      >
        <View className="flex-row items-center">
          <Ionicons
            name="time-outline"
            size={20}
            color={colors.gray[400]}
          />
          <Text
            className={`ml-3 text-base ${
              value ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {displayText}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.gray[400]}
        />
      </Pressable>

      {/* Helper text */}
      {helperText && !error && (
        <Text className="text-xs text-gray-500 mt-1.5">{helperText}</Text>
      )}

      {/* Error */}
      {error && (
        <Text className="text-xs text-error-500 mt-1.5">{error}</Text>
      )}

      {/* Modal */}
      <Modal
        visible={isOpen}
        animationType="none"
        transparent
        onRequestClose={handleClose}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable className="flex-1" onPress={handleClose} />
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            exiting={SlideOutDown}
            className="bg-white rounded-t-3xl"
          >
            <SafeAreaView>
              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Pressable onPress={handleClose} className="p-2">
                  <Text className="text-gray-500 font-medium">Cancel</Text>
                </Pressable>
                <Text className="text-lg font-semibold text-gray-900">
                  Select Time
                </Text>
                <Pressable onPress={handleConfirm} className="p-2">
                  <Text className="text-primary-600 font-semibold">Done</Text>
                </Pressable>
              </View>

              {/* Content */}
              <View className="px-4 py-4">
                {/* Quick presets */}
                <QuickPresets onSelect={handleQuickSelect} />

                {/* Time wheels */}
                <View className="flex-row items-center justify-center">
                  {/* Hours */}
                  <WheelColumn
                    values={hourValues}
                    selectedValue={tempHours}
                    onSelect={setTempHours}
                    formatDisplay={(v) =>
                      format === '12h' ? v.toString() : v.toString().padStart(2, '0')
                    }
                  />

                  {/* Separator */}
                  <Text className="text-3xl font-bold text-gray-400 mx-1">:</Text>

                  {/* Minutes */}
                  <WheelColumn
                    values={minuteValues}
                    selectedValue={tempMinutes}
                    onSelect={setTempMinutes}
                  />

                  {/* AM/PM selector */}
                  {format === '12h' && (
                    <PeriodSelector value={period} onChange={setPeriod} />
                  )}
                </View>

                {/* Current selection display */}
                <View className="mt-4 py-3 bg-primary-50 rounded-xl items-center">
                  <Text className="text-sm text-primary-600 font-medium">
                    Selected Time
                  </Text>
                  <Text className="text-2xl font-bold text-primary-700 mt-1">
                    {format === '12h'
                      ? `${tempHours}:${tempMinutes.toString().padStart(2, '0')} ${period}`
                      : `${tempHours.toString().padStart(2, '0')}:${tempMinutes.toString().padStart(2, '0')}`}
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default TimePicker;
