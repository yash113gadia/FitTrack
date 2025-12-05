/**
 * RecentMealsList Component
 *
 * Displays the last 5 logged food items with meal info,
 * swipe-to-delete, and tap-to-edit functionality.
 *
 * @example
 * <RecentMealsList
 *   meals={recentMeals}
 *   onMealPress={(meal) => navigate('EditMeal', { mealId: meal.id })}
 *   onMealDelete={(id) => deleteMeal(id)}
 *   onViewAll={() => navigate('History')}
 * />
 */

import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { FoodLog } from '../../types';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface RecentMeal {
  id: string;
  foodName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  timestamp: Date | string;
  imageUrl?: string;
  servingSize?: string;
}

export interface RecentMealsListProps {
  /** List of recent meals */
  meals: RecentMeal[];
  /** Handler when meal is pressed */
  onMealPress?: (meal: RecentMeal) => void;
  /** Handler when meal is deleted */
  onMealDelete?: (id: string) => void;
  /** Handler for view all button */
  onViewAll?: () => void;
  /** Maximum number of meals to show */
  maxItems?: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MEAL_TYPE_CONFIG = {
  breakfast: {
    icon: 'sunny-outline',
    color: '#FF9500',
    label: 'Breakfast',
  },
  lunch: {
    icon: 'partly-sunny-outline',
    color: colors.primary[500],
    label: 'Lunch',
  },
  dinner: {
    icon: 'moon-outline',
    color: '#5856D6',
    label: 'Dinner',
  },
  snack: {
    icon: 'cafe-outline',
    color: colors.success[500],
    label: 'Snack',
  },
} as const;

const DELETE_THRESHOLD = -80;
const SWIPE_FRICTION = 0.8;

// ============================================================================
// SKELETON LOADER
// ============================================================================

export const RecentMealsListSkeleton: React.FC = memo(() => (
  <View className="bg-white rounded-2xl p-4 shadow-sm">
    {/* Header skeleton */}
    <View className="flex-row justify-between items-center mb-4">
      <View className="w-28 h-6 bg-gray-200 rounded-lg" />
      <View className="w-16 h-4 bg-gray-200 rounded" />
    </View>

    {/* Meal items skeleton */}
    {[1, 2, 3].map((i) => (
      <View key={i} className="flex-row items-center py-3 border-b border-gray-100">
        <View className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
        <View className="flex-1">
          <View className="w-32 h-4 bg-gray-200 rounded mb-2" />
          <View className="w-20 h-3 bg-gray-200 rounded" />
        </View>
        <View className="items-end">
          <View className="w-16 h-4 bg-gray-200 rounded mb-1" />
          <View className="w-12 h-3 bg-gray-200 rounded" />
        </View>
      </View>
    ))}
  </View>
));

RecentMealsListSkeleton.displayName = 'RecentMealsListSkeleton';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatMealTime = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
};

// ============================================================================
// SWIPEABLE MEAL ITEM
// ============================================================================

interface SwipeableMealItemProps {
  meal: RecentMeal;
  onPress?: () => void;
  onDelete?: () => void;
  index: number;
}

const SwipeableMealItem: React.FC<SwipeableMealItemProps> = memo(({
  meal,
  onPress,
  onDelete,
  index,
}) => {
  const translateX = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  const mealConfig = MEAL_TYPE_CONFIG[meal.mealType];

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Only allow left swipe
      if (event.translationX < 0) {
        translateX.value = event.translationX * SWIPE_FRICTION;
      }
    })
    .onEnd((event) => {
      if (translateX.value < DELETE_THRESHOLD) {
        // Trigger delete
        translateX.value = withTiming(-400, { duration: 200 });
        isDeleting.value = true;
        if (onDelete) {
          runOnJS(onDelete)();
        }
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20 });
      }
    });

  // Animated styles
  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50)}
      layout={Layout.springify()}
      className="overflow-hidden"
    >
      {/* Delete button (behind) */}
      <Animated.View
        style={[deleteButtonStyle]}
        className="absolute right-0 top-0 bottom-0 w-20 bg-error-500 items-center justify-center rounded-r-lg"
      >
        <Ionicons name="trash-outline" size={24} color="white" />
        <Text className="text-white text-xs mt-1">Delete</Text>
      </Animated.View>

      {/* Swipeable content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={itemStyle}>
          <Pressable
            onPress={onPress}
            className="flex-row items-center py-3 bg-white active:bg-gray-50"
            accessibilityRole="button"
            accessibilityLabel={`${meal.foodName}, ${meal.calories} calories`}
          >
            {/* Meal type icon or food image */}
            {meal.imageUrl ? (
              <Image
                source={{ uri: meal.imageUrl }}
                className="w-10 h-10 rounded-full mr-3"
                resizeMode="cover"
              />
            ) : (
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${mealConfig.color}15` }}
              >
                <Ionicons
                  name={mealConfig.icon as any}
                  size={20}
                  color={mealConfig.color}
                />
              </View>
            )}

            {/* Food details */}
            <View className="flex-1 mr-3">
              <Text
                className="text-gray-900 font-medium text-base"
                numberOfLines={1}
              >
                {meal.foodName}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-gray-500 text-sm">
                  {mealConfig.label}
                </Text>
                <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                <Text className="text-gray-400 text-sm">
                  {formatMealTime(meal.timestamp)}
                </Text>
              </View>
            </View>

            {/* Nutrition info */}
            <View className="items-end">
              <Text className="text-gray-900 font-semibold">
                {meal.calories} kcal
              </Text>
              <Text className="text-gray-500 text-sm">
                {meal.protein}g protein
              </Text>
            </View>

            {/* Chevron */}
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.gray[300]}
              style={{ marginLeft: 8 }}
            />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

SwipeableMealItem.displayName = 'SwipeableMealItem';

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC = memo(() => (
  <View className="items-center py-8">
    <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
      <Ionicons name="restaurant-outline" size={28} color={colors.gray[400]} />
    </View>
    <Text className="text-gray-600 font-medium mb-1">No meals logged yet</Text>
    <Text className="text-gray-400 text-sm text-center">
      Start tracking your nutrition by{'\n'}adding your first meal
    </Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RecentMealsList: React.FC<RecentMealsListProps> = memo(({
  meals,
  onMealPress,
  onMealDelete,
  onViewAll,
  maxItems = 5,
  isLoading = false,
  className = '',
}) => {
  const displayedMeals = meals.slice(0, maxItems);
  const hasMoreMeals = meals.length > maxItems;

  const handleMealPress = useCallback((meal: RecentMeal) => {
    onMealPress?.(meal);
  }, [onMealPress]);

  const handleMealDelete = useCallback((id: string) => {
    onMealDelete?.(id);
  }, [onMealDelete]);

  if (isLoading) {
    return <RecentMealsListSkeleton />;
  }

  return (
    <View className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-900 font-semibold text-lg">Recent Meals</Text>
        {onViewAll && meals.length > 0 && (
          <Pressable
            onPress={onViewAll}
            className="flex-row items-center active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="View all meals"
          >
            <Text className="text-primary-500 text-sm font-medium mr-1">
              View All
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary[500]} />
          </Pressable>
        )}
      </View>

      {/* Swipe hint */}
      {meals.length > 0 && onMealDelete && (
        <Text className="text-gray-400 text-xs mb-2">
          Swipe left to delete
        </Text>
      )}

      {/* Meal list */}
      {displayedMeals.length > 0 ? (
        <View className="divide-y divide-gray-100">
          {displayedMeals.map((meal, index) => (
            <SwipeableMealItem
              key={meal.id}
              meal={meal}
              onPress={() => handleMealPress(meal)}
              onDelete={onMealDelete ? () => handleMealDelete(meal.id) : undefined}
              index={index}
            />
          ))}
        </View>
      ) : (
        <EmptyState />
      )}

      {/* More meals indicator */}
      {hasMoreMeals && (
        <Pressable
          onPress={onViewAll}
          className="mt-3 py-2 items-center bg-gray-50 rounded-lg active:bg-gray-100"
          accessibilityRole="button"
        >
          <Text className="text-gray-600 text-sm font-medium">
            +{meals.length - maxItems} more meal{meals.length - maxItems > 1 ? 's' : ''}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

RecentMealsList.displayName = 'RecentMealsList';

export default RecentMealsList;
