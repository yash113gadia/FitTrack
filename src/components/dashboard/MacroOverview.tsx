/**
 * MacroOverview Component
 *
 * Displays 4 circular progress rings for macronutrients in a 2x2 grid.
 * Supports animated entry with stagger effect and tap for detailed breakdown.
 *
 * @example
 * <MacroOverview
 *   calories={{ current: 1500, goal: 2000 }}
 *   protein={{ current: 80, goal: 150 }}
 *   fats={{ current: 50, goal: 65 }}
 *   carbs={{ current: 180, goal: 250 }}
 *   onMacroPress={(macro) => showDetails(macro)}
 * />
 */

import React, { memo, useEffect } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { MacroProgressRing, MacroType } from '../common/MacroProgressRing';
import { Card } from '../common/Card';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface MacroValue {
  current: number;
  goal: number;
}

export interface MacroOverviewProps {
  /** Calories data */
  calories: MacroValue;
  /** Protein data */
  protein: MacroValue;
  /** Fats data */
  fats: MacroValue;
  /** Carbs data */
  carbs: MacroValue;
  /** Handler when a macro ring is pressed */
  onMacroPress?: (macro: MacroType) => void;
  /** Loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// ANIMATED MACRO RING
// ============================================================================

interface AnimatedMacroRingProps {
  macro: MacroType;
  current: number;
  goal: number;
  delay: number;
  onPress?: (macro: MacroType) => void;
  size: number;
}

const AnimatedMacroRing: React.FC<AnimatedMacroRingProps> = memo(({
  macro,
  current,
  goal,
  delay,
  onPress,
  size,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 200 }));
    opacity.value = withDelay(delay, withSpring(1));
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className="items-center">
      <MacroProgressRing
        macro={macro}
        current={current}
        goal={goal}
        size={size}
        strokeWidth={size * 0.1}
        onPress={onPress ? () => onPress(macro) : undefined}
        showDetails={true}
        animateOnMount={true}
      />
    </Animated.View>
  );
});

AnimatedMacroRing.displayName = 'AnimatedMacroRing';

// ============================================================================
// LOADING SKELETON
// ============================================================================

export const MacroOverviewSkeleton: React.FC = () => (
  <Card className="p-4">
    <View className="flex-row flex-wrap justify-between">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} className="w-[48%] items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
          <View className="w-16 h-4 bg-gray-200 rounded mt-2 animate-pulse" />
          <View className="w-20 h-3 bg-gray-200 rounded mt-1 animate-pulse" />
        </View>
      ))}
    </View>
  </Card>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MacroOverview: React.FC<MacroOverviewProps> = memo(({
  calories,
  protein,
  fats,
  carbs,
  onMacroPress,
  loading = false,
  className = '',
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Calculate ring size based on screen width
  const ringSize = isTablet ? 100 : Math.min(80, (width - 80) / 4);

  // Macro data array for rendering
  const macros: { type: MacroType; data: MacroValue; delay: number }[] = [
    { type: 'calories', data: calories, delay: 0 },
    { type: 'protein', data: protein, delay: 100 },
    { type: 'fats', data: fats, delay: 200 },
    { type: 'carbs', data: carbs, delay: 300 },
  ];

  if (loading) {
    return <MacroOverviewSkeleton />;
  }

  return (
    <Card
      className={`p-4 ${className}`}
      variant="default"
      testID="macro-overview"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">
          Today's Macros
        </Text>
        <Text className="text-sm text-gray-500">
          {Math.round((calories.current / calories.goal) * 100)}% of daily goal
        </Text>
      </View>

      {/* Macro Rings Grid */}
      <View
        className={`
          ${isTablet ? 'flex-row justify-around' : 'flex-row flex-wrap justify-between'}
        `}
      >
        {macros.map(({ type, data, delay }) => (
          <View
            key={type}
            className={isTablet ? 'items-center' : 'w-[48%] items-center mb-4'}
          >
            <AnimatedMacroRing
              macro={type}
              current={data.current}
              goal={data.goal}
              delay={delay}
              onPress={onMacroPress}
              size={ringSize}
            />
          </View>
        ))}
      </View>

      {/* Summary Footer */}
      <Animated.View
        entering={FadeIn.delay(500)}
        className="mt-4 pt-3 border-t border-gray-100"
      >
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-500">
            Remaining: {Math.max(0, calories.goal - calories.current)} kcal
          </Text>
          <Pressable
            onPress={() => onMacroPress?.('calories')}
            accessibilityRole="button"
            accessibilityLabel="View detailed breakdown"
          >
            <Text className="text-sm text-primary-500 font-medium">
              View Details →
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Card>
  );
});

MacroOverview.displayName = 'MacroOverview';

export default MacroOverview;
