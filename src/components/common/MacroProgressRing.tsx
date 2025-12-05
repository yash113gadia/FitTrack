/**
 * MacroProgressRing Component
 *
 * A specialized circular progress component for macro nutrient tracking.
 *
 * @example
 * // Basic usage
 * <MacroProgressRing
 *   macro="protein"
 *   current={85}
 *   goal={150}
 * />
 *
 * @example
 * // With expand details
 * <MacroProgressRing
 *   macro="calories"
 *   current={1500}
 *   goal={2000}
 *   size={100}
 *   onPress={() => showDetails()}
 * />
 *
 * Props:
 * - macro: 'calories' | 'protein' | 'fats' | 'carbs' | 'fiber' | 'sugar'
 * - current: number - Current intake value
 * - goal: number - Target goal value
 * - unit: string - Unit label (g, kcal, etc.)
 * - size: number - Ring size
 * - strokeWidth: number - Ring stroke width
 * - onPress: () => void - Press handler for details
 * - showDetails: boolean - Show current/goal values
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { CircularProgress } from './CircularProgress';
import { colors } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export type MacroType = 'calories' | 'protein' | 'fats' | 'carbs' | 'fiber' | 'sugar';

export interface MacroProgressRingProps {
  /** Type of macro nutrient */
  macro: MacroType;
  /** Current intake value */
  current: number;
  /** Target goal value */
  goal: number;
  /** Unit label */
  unit?: string;
  /** Ring size */
  size?: number;
  /** Ring stroke width */
  strokeWidth?: number;
  /** Press handler for showing details */
  onPress?: () => void;
  /** Show detailed current/goal values */
  showDetails?: boolean;
  /** Animate on mount */
  animateOnMount?: boolean;
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// MACRO CONFIGURATION
// ============================================================================

interface MacroConfig {
  color: string;
  label: string;
  defaultUnit: string;
}

const macroConfig: Record<MacroType, MacroConfig> = {
  calories: {
    color: colors.macros.calories,
    label: 'Calories',
    defaultUnit: 'kcal',
  },
  protein: {
    color: colors.macros.protein,
    label: 'Protein',
    defaultUnit: 'g',
  },
  fats: {
    color: colors.macros.fats,
    label: 'Fats',
    defaultUnit: 'g',
  },
  carbs: {
    color: colors.macros.carbs,
    label: 'Carbs',
    defaultUnit: 'g',
  },
  fiber: {
    color: colors.macros.fiber,
    label: 'Fiber',
    defaultUnit: 'g',
  },
  sugar: {
    color: colors.macros.sugar,
    label: 'Sugar',
    defaultUnit: 'g',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MacroProgressRing: React.FC<MacroProgressRingProps> = ({
  macro,
  current,
  goal,
  unit,
  size = 80,
  strokeWidth = 8,
  onPress,
  showDetails = true,
  animateOnMount = true,
  className = '',
  testID,
}) => {
  // Get macro configuration
  const config = macroConfig[macro];
  const displayUnit = unit || config.defaultUnit;

  // Calculate progress percentage
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOverGoal = current > goal;

  // Animation for press
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
    }
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }
  }, [onPress, scale]);

  // Format large numbers
  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return Math.round(value).toString();
  };

  // Progress ring color - red if over goal
  const ringColor = isOverGoal ? colors.error[500] : config.color;

  const content = (
    <View className={`items-center ${className}`}>
      {/* Progress Ring */}
      <View className="relative">
        <CircularProgress
          progress={progress}
          size={size}
          strokeWidth={strokeWidth}
          color={ringColor}
          backgroundColor={colors.gray[100]}
          animateOnMount={animateOnMount}
          showLabel={false}
        />

        {/* Center Content */}
        <View
          className="absolute items-center justify-center"
          style={{ width: size, height: size }}
        >
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: size * 0.18 }}
            numberOfLines={1}
          >
            {formatValue(current)}
          </Text>
          <Text
            className="text-gray-500"
            style={{ fontSize: size * 0.1 }}
          >
            {displayUnit}
          </Text>
        </View>
      </View>

      {/* Label */}
      <Text
        className="text-sm font-medium text-gray-700 mt-2"
        style={{ color: config.color }}
      >
        {config.label}
      </Text>

      {/* Details */}
      {showDetails && (
        <Text className="text-xs text-gray-500">
          {formatValue(current)} / {formatValue(goal)} {displayUnit}
        </Text>
      )}

      {/* Over goal indicator */}
      {isOverGoal && (
        <View className="flex-row items-center mt-1">
          <View className="w-2 h-2 rounded-full bg-error-500 mr-1" />
          <Text className="text-xs text-error-500 font-medium">
            +{formatValue(current - goal)}
          </Text>
        </View>
      )}
    </View>
  );

  // Wrap in pressable if onPress provided
  if (onPress) {
    return (
      <AnimatedPressable
        style={animatedStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${config.label}: ${current} of ${goal} ${displayUnit}`}
        accessibilityHint="Tap to view details"
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`${config.label}: ${current} of ${goal} ${displayUnit}`}
    >
      {content}
    </View>
  );
};

// ============================================================================
// MACRO PROGRESS BAR (Linear variant)
// ============================================================================

export interface MacroProgressBarProps {
  /** Type of macro nutrient */
  macro: MacroType;
  /** Current intake value */
  current: number;
  /** Target goal value */
  goal: number;
  /** Unit label */
  unit?: string;
  /** Show numeric values */
  showValues?: boolean;
  /** Additional class names */
  className?: string;
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  macro,
  current,
  goal,
  unit,
  showValues = true,
  className = '',
}) => {
  const config = macroConfig[macro];
  const displayUnit = unit || config.defaultUnit;
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOverGoal = current > goal;

  return (
    <View className={className}>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </Text>
        {showValues && (
          <Text className={`text-sm ${isOverGoal ? 'text-error-500' : 'text-gray-600'}`}>
            {Math.round(current)} / {Math.round(goal)} {displayUnit}
          </Text>
        )}
      </View>
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: isOverGoal ? colors.error[500] : config.color,
          }}
        />
      </View>
    </View>
  );
};

export default MacroProgressRing;
