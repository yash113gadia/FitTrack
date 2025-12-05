/**
 * LinearProgress Component
 *
 * A horizontal progress bar with animation and gradient support.
 *
 * @example
 * // Basic usage
 * <LinearProgress progress={60} />
 *
 * @example
 * // With label overlay
 * <LinearProgress
 *   progress={75}
 *   showLabel
 *   height={20}
 *   color="#4ECDC4"
 * />
 *
 * @example
 * // With gradient
 * <LinearProgress
 *   progress={80}
 *   gradientColors={['#FF6B6B', '#FFE66D']}
 * />
 *
 * Props:
 * - progress: number (0-100) - Current progress percentage
 * - height: number - Height of the progress bar
 * - color: string - Fill color (ignored if gradient is used)
 * - backgroundColor: string - Background track color
 * - showLabel: boolean - Show percentage label
 * - labelPosition: 'inside' | 'outside' | 'above' - Label position
 * - gradientColors: string[] - Gradient colors (left to right)
 * - animated: boolean - Animate progress changes
 * - duration: number - Animation duration in ms
 * - rounded: boolean - Use rounded corners
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export type LabelPosition = 'inside' | 'outside' | 'above';

export interface LinearProgressProps {
  /** Current progress (0-100) */
  progress: number;
  /** Height of the progress bar */
  height?: number;
  /** Fill color */
  color?: string;
  /** Background track color */
  backgroundColor?: string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Position of the label */
  labelPosition?: LabelPosition;
  /** Custom label text */
  label?: string;
  /** Gradient colors (overrides color prop) */
  gradientColors?: string[];
  /** Animate progress changes */
  animated?: boolean;
  /** Animation duration in ms */
  duration?: number;
  /** Use rounded corners */
  rounded?: boolean;
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LinearProgress: React.FC<LinearProgressProps> = ({
  progress,
  height = 8,
  color = colors.primary[500],
  backgroundColor = colors.gray[200],
  showLabel = false,
  labelPosition = 'inside',
  label,
  gradientColors,
  animated = true,
  duration = 500,
  rounded = true,
  className = '',
  testID,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Animation
  const animatedWidth = useSharedValue(animated ? 0 : clampedProgress);

  useEffect(() => {
    if (animated) {
      animatedWidth.value = withTiming(clampedProgress, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      animatedWidth.value = clampedProgress;
    }
  }, [clampedProgress, animated, duration, animatedWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  // Determine border radius
  const borderRadiusValue = rounded ? borderRadius.full : 0;

  // Label text
  const labelText = label || `${Math.round(clampedProgress)}%`;

  // Render label based on position
  const renderLabel = () => {
    if (!showLabel) return null;

    const isInsideLabel = labelPosition === 'inside' && height >= 16;
    const labelColor = isInsideLabel ? colors.white : colors.text.primary;

    if (labelPosition === 'above') {
      return (
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-gray-700">{label || 'Progress'}</Text>
          <Text className="text-sm font-medium text-gray-900">
            {Math.round(clampedProgress)}%
          </Text>
        </View>
      );
    }

    if (labelPosition === 'outside') {
      return (
        <Text className="text-sm font-medium text-gray-900 ml-2">
          {labelText}
        </Text>
      );
    }

    // Inside label
    return (
      <Text
        className="text-xs font-medium absolute right-2"
        style={{ color: labelColor }}
      >
        {labelText}
      </Text>
    );
  };

  return (
    <View
      className={className}
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress,
      }}
      accessibilityLabel={`Progress: ${Math.round(clampedProgress)}%`}
    >
      {labelPosition === 'above' && renderLabel()}
      
      <View
        className={`flex-row items-center ${labelPosition === 'outside' ? 'flex-1' : ''}`}
      >
        {/* Track */}
        <View
          style={[
            styles.track,
            {
              height,
              backgroundColor,
              borderRadius: borderRadiusValue,
            },
          ]}
          className="flex-1 overflow-hidden"
        >
          {/* Fill */}
          <Animated.View
            style={[
              styles.fill,
              animatedStyle,
              {
                height,
                borderRadius: borderRadiusValue,
              },
            ]}
          >
            {gradientColors && gradientColors.length >= 2 ? (
              <LinearGradient
                colors={gradientColors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.gradient,
                  { borderRadius: borderRadiusValue },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.solidFill,
                  { backgroundColor: color, borderRadius: borderRadiusValue },
                ]}
              />
            )}
            
            {/* Inside label */}
            {labelPosition === 'inside' && showLabel && height >= 16 && (
              <View className="absolute inset-0 items-end justify-center pr-2">
                <Text className="text-xs font-medium text-white">
                  {labelText}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Outside label */}
        {labelPosition === 'outside' && renderLabel()}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  gradient: {
    flex: 1,
  },
  solidFill: {
    flex: 1,
  },
});

export default LinearProgress;
