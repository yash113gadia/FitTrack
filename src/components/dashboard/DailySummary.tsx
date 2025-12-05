/**
 * DailySummary Component
 *
 * Compact card showing daily nutrition summary with date navigation.
 * Features: Date selector (swipe/arrows), Calories/Protein vs goal, Quick stats
 *
 * @example
 * <DailySummary
 *   date={new Date()}
 *   onDateChange={setDate}
 *   totalCalories={1850}
 *   goalCalories={2200}
 *   totalProtein={85}
 *   goalProtein={120}
 *   totalCarbs={200}
 *   totalFat={65}
 *   mealsLogged={3}
 *   onViewDetails={() => navigate('DailyDetails')}
 * />
 */

import React, { memo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
import { LinearProgress } from '../common';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface DailySummaryProps {
  /** Selected date */
  date: Date;
  /** Handler when date changes */
  onDateChange: (date: Date) => void;
  /** Total calories consumed */
  totalCalories: number;
  /** Daily calorie goal */
  goalCalories: number;
  /** Total protein consumed (g) */
  totalProtein: number;
  /** Daily protein goal (g) */
  goalProtein: number;
  /** Total carbs consumed (g) */
  totalCarbs: number;
  /** Total fat consumed (g) */
  totalFat: number;
  /** Number of meals logged */
  mealsLogged: number;
  /** Handler for view details button */
  onViewDetails?: () => void;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

export const DailySummarySkeleton: React.FC = memo(() => (
  <View className="bg-white rounded-2xl p-4 shadow-sm">
    {/* Date selector skeleton */}
    <View className="flex-row items-center justify-between mb-4">
      <View className="w-8 h-8 rounded-full bg-gray-200" />
      <View className="w-32 h-6 bg-gray-200 rounded-lg" />
      <View className="w-8 h-8 rounded-full bg-gray-200" />
    </View>

    {/* Progress bars skeleton */}
    <View className="mb-3">
      <View className="flex-row justify-between mb-2">
        <View className="w-16 h-4 bg-gray-200 rounded" />
        <View className="w-24 h-4 bg-gray-200 rounded" />
      </View>
      <View className="h-2 bg-gray-200 rounded-full" />
    </View>

    <View className="mb-4">
      <View className="flex-row justify-between mb-2">
        <View className="w-14 h-4 bg-gray-200 rounded" />
        <View className="w-20 h-4 bg-gray-200 rounded" />
      </View>
      <View className="h-2 bg-gray-200 rounded-full" />
    </View>

    {/* Stats row skeleton */}
    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
      <View className="flex-row">
        <View className="w-16 h-4 bg-gray-200 rounded mr-4" />
        <View className="w-16 h-4 bg-gray-200 rounded" />
      </View>
      <View className="w-24 h-8 bg-gray-200 rounded-lg" />
    </View>
  </View>
));

DailySummarySkeleton.displayName = 'DailySummarySkeleton';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getDateLabel = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DailySummary: React.FC<DailySummaryProps> = memo(({
  date,
  onDateChange,
  totalCalories,
  goalCalories,
  totalProtein,
  goalProtein,
  totalCarbs,
  totalFat,
  mealsLogged,
  onViewDetails,
  isLoading = false,
  className = '',
}) => {
  const translateX = useSharedValue(0);

  // Calculate progress percentages
  const calorieProgress = Math.min((totalCalories / goalCalories) * 100, 100);
  const proteinProgress = Math.min((totalProtein / goalProtein) * 100, 100);
  const caloriesRemaining = Math.max(goalCalories - totalCalories, 0);
  const proteinRemaining = Math.max(goalProtein - totalProtein, 0);

  // Navigation handlers
  const goToPreviousDay = useCallback(() => {
    onDateChange(subDays(date, 1));
  }, [date, onDateChange]);

  const goToNextDay = useCallback(() => {
    onDateChange(addDays(date, 1));
  }, [date, onDateChange]);

  // Swipe gesture for date navigation
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.3;
    })
    .onEnd((event) => {
      translateX.value = withSpring(0);
      if (event.translationX > 50) {
        runOnJS(goToPreviousDay)();
      } else if (event.translationX < -50) {
        runOnJS(goToNextDay)();
      }
    });

  // Animated style for swipe feedback
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Get calorie status color
  const getCalorieStatusColor = () => {
    const percentage = (totalCalories / goalCalories) * 100;
    if (percentage < 80) return colors.primary[500];
    if (percentage < 100) return colors.warning[500];
    return colors.error[500];
  };

  // Get protein status color
  const getProteinStatusColor = () => {
    const percentage = (totalProtein / goalProtein) * 100;
    if (percentage < 80) return colors.macros.protein;
    if (percentage >= 100) return colors.success[500];
    return colors.macros.protein;
  };

  if (isLoading) {
    return <DailySummarySkeleton />;
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        style={cardStyle}
        className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}
      >
        {/* Date Navigation */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={goToPreviousDay}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
            accessibilityRole="button"
            accessibilityLabel="Previous day"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          </Pressable>

          <View className="flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary[500]}
              style={{ marginRight: 6 }}
            />
            <Text className="text-gray-900 font-semibold text-base">
              {getDateLabel(date)}
            </Text>
          </View>

          <Pressable
            onPress={goToNextDay}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
            disabled={isToday(date)}
            style={{ opacity: isToday(date) ? 0.4 : 1 }}
            accessibilityRole="button"
            accessibilityLabel="Next day"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Calories Progress */}
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-700 font-medium">Calories</Text>
            <Text className="text-gray-600 text-sm">
              <Text style={{ color: getCalorieStatusColor() }} className="font-semibold">
                {totalCalories.toLocaleString()}
              </Text>
              {' / '}
              {goalCalories.toLocaleString()} kcal
            </Text>
          </View>
          <LinearProgress
            progress={calorieProgress}
            color={getCalorieStatusColor()}
            backgroundColor={colors.gray[100]}
            height={8}
            animated
          />
          <Text className="text-gray-500 text-xs mt-1">
            {caloriesRemaining > 0
              ? `${caloriesRemaining.toLocaleString()} kcal remaining`
              : `${Math.abs(goalCalories - totalCalories).toLocaleString()} kcal over goal`}
          </Text>
        </View>

        {/* Protein Progress */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-700 font-medium">Protein</Text>
            <Text className="text-gray-600 text-sm">
              <Text style={{ color: getProteinStatusColor() }} className="font-semibold">
                {totalProtein}g
              </Text>
              {' / '}
              {goalProtein}g
            </Text>
          </View>
          <LinearProgress
            progress={proteinProgress}
            color={getProteinStatusColor()}
            backgroundColor={colors.gray[100]}
            height={8}
            animated
          />
          <Text className="text-gray-500 text-xs mt-1">
            {proteinRemaining > 0
              ? `${proteinRemaining}g remaining`
              : 'Goal reached! 🎉'}
          </Text>
        </View>

        {/* Quick Stats & View Details */}
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            {/* Carbs */}
            <View className="flex-row items-center mr-4">
              <View
                className="w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ backgroundColor: colors.macros.carbs }}
              />
              <Text className="text-gray-600 text-sm">{totalCarbs}g C</Text>
            </View>

            {/* Fat */}
            <View className="flex-row items-center mr-4">
              <View
                className="w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ backgroundColor: colors.macros.fats }}
              />
              <Text className="text-gray-600 text-sm">{totalFat}g F</Text>
            </View>

            {/* Meals */}
            <View className="flex-row items-center">
              <Ionicons
                name="restaurant-outline"
                size={14}
                color={colors.text.muted}
                style={{ marginRight: 4 }}
              />
              <Text className="text-gray-500 text-sm">
                {mealsLogged} meal{mealsLogged !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {onViewDetails && (
            <Pressable
              onPress={onViewDetails}
              className="flex-row items-center bg-primary-50 px-3 py-1.5 rounded-lg active:bg-primary-100"
              accessibilityRole="button"
              accessibilityLabel="View daily details"
            >
              <Text className="text-primary-600 text-sm font-medium mr-1">Details</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary[600]} />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

DailySummary.displayName = 'DailySummary';

export default DailySummary;
