/**
 * CircularProgress Component
 *
 * An animated circular progress indicator with customizable appearance.
 *
 * @example
 * // Basic usage
 * <CircularProgress progress={75} />
 *
 * @example
 * // With label and custom colors
 * <CircularProgress
 *   progress={60}
 *   size={120}
 *   strokeWidth={10}
 *   color="#4ECDC4"
 *   showLabel
 *   label="Protein"
 * />
 *
 * @example
 * // Multiple nested rings
 * <CircularProgress
 *   progress={80}
 *   innerRings={[
 *     { progress: 60, color: '#FF6B6B' },
 *     { progress: 40, color: '#FFE66D' },
 *   ]}
 * />
 *
 * Props:
 * - progress: number (0-100) - Current progress percentage
 * - size: number - Diameter of the circle
 * - strokeWidth: number - Width of the progress stroke
 * - color: string - Color of the progress arc
 * - backgroundColor: string - Color of the background circle
 * - showLabel: boolean - Show percentage label in center
 * - label: string - Custom label text
 * - labelValue: string - Custom value text (overrides percentage)
 * - animateOnMount: boolean - Animate from 0 on mount
 * - duration: number - Animation duration in ms
 * - innerRings: Array - Additional inner progress rings
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ============================================================================
// TYPES
// ============================================================================

export interface InnerRing {
  /** Progress percentage (0-100) */
  progress: number;
  /** Ring color */
  color: string;
}

export interface CircularProgressProps {
  /** Current progress (0-100) */
  progress: number;
  /** Diameter of the circle */
  size?: number;
  /** Width of the progress stroke */
  strokeWidth?: number;
  /** Color of the progress arc */
  color?: string;
  /** Color of the background circle */
  backgroundColor?: string;
  /** Show percentage in center */
  showLabel?: boolean;
  /** Custom label text below value */
  label?: string;
  /** Custom value text (overrides percentage) */
  labelValue?: string;
  /** Animate from 0 on mount */
  animateOnMount?: boolean;
  /** Animation duration in ms */
  duration?: number;
  /** Additional inner rings */
  innerRings?: InnerRing[];
  /** Line cap style */
  lineCap?: 'butt' | 'round' | 'square';
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// ANIMATED RING COMPONENT
// ============================================================================

interface AnimatedRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor: string;
  animateOnMount: boolean;
  duration: number;
  lineCap: 'butt' | 'round' | 'square';
  ringIndex: number;
}

const AnimatedRing: React.FC<AnimatedRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  backgroundColor,
  animateOnMount,
  duration,
  lineCap,
  ringIndex,
}) => {
  const animatedProgress = useSharedValue(animateOnMount ? 0 : progress);

  const radius = (size - strokeWidth * (ringIndex * 2 + 1)) / 2 - ringIndex * strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress, duration, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value / 100),
  }));

  return (
    <G rotation="-90" origin={`${center}, ${center}`}>
      {/* Background circle */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Progress circle */}
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap={lineCap}
      />
    </G>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color = colors.primary[500],
  backgroundColor = colors.gray[200],
  showLabel = false,
  label,
  labelValue,
  animateOnMount = true,
  duration = 1000,
  innerRings = [],
  lineCap = 'round',
  className = '',
  testID,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Calculate all rings (main + inner)
  const allRings = [
    { progress: clampedProgress, color },
    ...innerRings.map(ring => ({
      ...ring,
      progress: Math.max(0, Math.min(100, ring.progress)),
    })),
  ];

  return (
    <View
      className={`items-center justify-center ${className}`}
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress,
      }}
      accessibilityLabel={label ? `${label}: ${labelValue || `${Math.round(clampedProgress)}%`}` : `Progress: ${Math.round(clampedProgress)}%`}
    >
      <Svg width={size} height={size}>
        {allRings.map((ring, index) => (
          <AnimatedRing
            key={index}
            progress={ring.progress}
            size={size}
            strokeWidth={strokeWidth}
            color={ring.color}
            backgroundColor={index === 0 ? backgroundColor : 'transparent'}
            animateOnMount={animateOnMount}
            duration={duration + index * 100}
            lineCap={lineCap}
            ringIndex={index}
          />
        ))}
      </Svg>

      {/* Center label */}
      {showLabel && (
        <View 
          className="absolute items-center justify-center"
          style={{ width: size, height: size }}
        >
          <Text className="text-2xl font-bold text-gray-900">
            {labelValue || `${Math.round(clampedProgress)}%`}
          </Text>
          {label && (
            <Text className="text-xs text-gray-500 mt-0.5">
              {label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default CircularProgress;
