import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { LeagueRank, MuscleGroup } from '../../types';
import { RANK_COLORS } from '../../utils/muscleLeague';
import { colors } from '../../constants/theme'; // Assuming colors are defined here for direct access

interface MuscleBadgeProps {
  muscleGroup: MuscleGroup;
  level: LeagueRank;
  size?: number; // Size of the badge (width/height)
  fontSize?: number; // Font size of the level text
}

// Helper to get an appropriate icon for each muscle group
const getMuscleIcon = (group: MuscleGroup) => {
  switch (group) {
    case 'Chest':
      return 'barbell-outline';
    case 'Back':
      return 'fitness-outline'; // Generic fitness for back
    case 'Arms':
      return 'body-outline'; // Represents upper body strength
    case 'Legs':
      return 'walk-outline'; // Represents movement/legs
    case 'Shoulders':
      return 'accessibility-outline'; // Represents upper body posture/shoulders
    default:
      return 'trophy-outline';
  }
};

const MuscleBadge: React.FC<MuscleBadgeProps> = ({
  muscleGroup,
  level,
  size = 60,
  fontSize = 10,
}) => {
  const rankColor = RANK_COLORS[level] || colors.gray[500]; // Fallback to gray
  const iconName = getMuscleIcon(muscleGroup);

  // Animation for Legendary rank
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (level === 'Legendary') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite repeat
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite repeat
        false
      );
    } else {
      // Reset animation values if not Legendary
      pulseScale.value = 1;
      pulseOpacity.value = 1;
    }
  }, [level, pulseScale, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      // Add a subtle border glow effect for Legendary
      // borderColor: level === 'Legendary' ? rankColor : 'transparent',
      // borderWidth: level === 'Legendary' ? 2 : 0,
      shadowColor: level === 'Legendary' ? rankColor : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: level === 'Legendary' ? pulseOpacity.value * 0.8 : 0,
      shadowRadius: level === 'Legendary' ? pulseScale.value * 8 : 0,
      elevation: level === 'Legendary' ? pulseScale.value * 5 : 0, // For Android shadow
    };
  });

  return (
    <Animated.View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: rankColor,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={iconName} size={size * 0.4} color="#fff" />
      <Text style={[styles.levelText, { fontSize: fontSize, color: colors.white }]}>
        {level}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    overflow: 'hidden', // Clip children for borderRadius
  },
  levelText: {
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default MuscleBadge;