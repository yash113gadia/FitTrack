/**
 * StreakCounter Component
 *
 * Displays current streak with flame icon, longest streak info,
 * and celebratory animations when streak increases.
 *
 * @example
 * <StreakCounter
 *   currentStreak={7}
 *   longestStreak={14}
 *   goalsMet={true}
 *   onPress={() => showStreakHistory()}
 * />
 */

import React, { memo, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface StreakCounterProps {
  /** Current streak days */
  currentStreak: number;
  /** Longest streak achieved */
  longestStreak: number;
  /** Whether today's goals are met */
  goalsMet: boolean;
  /** Press handler to show streak history */
  onPress?: () => void;
  /** Whether to show celebration animation */
  celebrate?: boolean;
  /** Last log date */
  lastLogDate?: string;
  /** Loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// FLAME ANIMATION COMPONENT
// ============================================================================

const AnimatedFlame: React.FC<{ 
  size: number; 
  celebrating: boolean;
  streak: number;
}> = memo(({ size, celebrating, streak }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (celebrating) {
      // Celebration animation
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      rotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withRepeat(
          withSequence(
            withTiming(10, { duration: 100 }),
            withTiming(-10, { duration: 100 })
          ),
          3,
          true
        ),
        withTiming(0, { duration: 100 })
      );
    } else {
      // Subtle floating animation
      translateY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [celebrating, scale, rotation, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  // Determine flame color based on streak
  const getFlameColor = () => {
    if (streak >= 30) return '#FF4500'; // Orange-red for 30+ days
    if (streak >= 14) return '#FF6B00'; // Orange for 14+ days
    if (streak >= 7) return '#FF8C00'; // Dark orange for 7+ days
    return '#FFA500'; // Regular orange
  };

  return (
    <Animated.View style={animatedStyle}>
      <Text style={{ fontSize: size }}>🔥</Text>
    </Animated.View>
  );
});

AnimatedFlame.displayName = 'AnimatedFlame';

// ============================================================================
// CONFETTI PARTICLE
// ============================================================================

interface ConfettiParticle {
  id: number;
  x: number;
  delay: number;
  color: string;
}

const Confetti: React.FC<{ particle: ConfettiParticle }> = memo(({ particle }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      particle.delay,
      withTiming(-100, { duration: 1000 })
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.x, { duration: 1000 })
    );
    opacity.value = withDelay(
      particle.delay + 500,
      withTiming(0, { duration: 500 })
    );
    rotation.value = withDelay(
      particle.delay,
      withTiming(360 * 2, { duration: 1000 })
    );
  }, [particle, translateY, translateX, opacity, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
});

Confetti.displayName = 'Confetti';

// ============================================================================
// LOADING SKELETON
// ============================================================================

export const StreakCounterSkeleton: React.FC = () => (
  <Card className="p-4">
    <View className="flex-row items-center">
      <View className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
      <View className="ml-3 flex-1">
        <View className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
        <View className="w-32 h-4 bg-gray-200 rounded mt-1 animate-pulse" />
      </View>
    </View>
  </Card>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StreakCounter: React.FC<StreakCounterProps> = memo(({
  currentStreak,
  longestStreak,
  goalsMet,
  onPress,
  celebrate = false,
  lastLogDate,
  loading = false,
  className = '',
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);

  // Scale animation for the card
  const cardScale = useSharedValue(1);

  // Trigger celebration
  useEffect(() => {
    if (celebrate) {
      setShowConfetti(true);
      
      // Generate confetti particles
      const particles: ConfettiParticle[] = [];
      const confettiColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF8C00'];
      
      for (let i = 0; i < 12; i++) {
        particles.push({
          id: i,
          x: (Math.random() - 0.5) * 100,
          delay: i * 50,
          color: confettiColors[i % confettiColors.length],
        });
      }
      setConfettiParticles(particles);

      // Card bounce
      cardScale.value = withSequence(
        withSpring(1.02, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );

      // Clear confetti after animation
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setConfettiParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [celebrate, cardScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  if (loading) {
    return <StreakCounterSkeleton />;
  }

  // Determine streak status message
  const getStreakMessage = () => {
    if (currentStreak === 0) return 'Start your streak today!';
    if (currentStreak === longestStreak && currentStreak > 1) return 'Personal best! 🏆';
    if (currentStreak >= 30) return 'Incredible consistency! 💪';
    if (currentStreak >= 14) return 'Two weeks strong!';
    if (currentStreak >= 7) return 'One week down!';
    return goalsMet ? 'Keep it going!' : 'Log your meals to continue';
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <Card
        className={`p-4 overflow-hidden ${className}`}
        pressable={!!onPress}
        onPress={onPress}
        testID="streak-counter"
      >
        {/* Confetti overlay */}
        {showConfetti && (
          <View className="absolute inset-0 items-center justify-center">
            {confettiParticles.map((particle) => (
              <Confetti key={particle.id} particle={particle} />
            ))}
          </View>
        )}

        <View className="flex-row items-center">
          {/* Flame Icon */}
          <View className="relative">
            <AnimatedFlame
              size={40}
              celebrating={celebrate}
              streak={currentStreak}
            />
            {goalsMet && (
              <View className="absolute -top-1 -right-1">
                <View className="w-5 h-5 rounded-full bg-success-500 items-center justify-center">
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              </View>
            )}
          </View>

          {/* Streak Info */}
          <View className="ml-3 flex-1">
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-gray-900">
                {currentStreak}
              </Text>
              <Text className="text-lg text-gray-600 ml-1">
                {currentStreak === 1 ? 'Day' : 'Day'} Streak
              </Text>
            </View>
            <Text className="text-sm text-gray-500">
              {getStreakMessage()}
            </Text>
          </View>

          {/* Best Streak Badge */}
          {longestStreak > 0 && (
            <View className="items-end">
              <Text className="text-xs text-gray-400">Best</Text>
              <Text className="text-lg font-semibold text-gray-700">
                {longestStreak}
              </Text>
            </View>
          )}

          {/* Chevron if pressable */}
          {onPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.gray[400]}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>

        {/* Goals Met Badge */}
        {goalsMet && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <View className="flex-row items-center">
              <View className="bg-success-100 px-3 py-1 rounded-full flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
                <Text className="text-sm text-success-700 ml-1 font-medium">
                  Goals Met Today
                </Text>
              </View>
            </View>
          </View>
        )}
      </Card>
    </Animated.View>
  );
});

StreakCounter.displayName = 'StreakCounter';

export default StreakCounter;
