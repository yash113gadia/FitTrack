import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';
import { MuscleLevels } from '../../types';
import { MuscleBadge } from '../common';

interface TrophyCaseProps {
  muscleLevels: MuscleLevels;
}

export const TrophyCase: React.FC<TrophyCaseProps> = ({ muscleLevels }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trophy Case</Text>
      <View style={styles.badgeRow}>
        <MuscleBadge muscleGroup="Chest" level={muscleLevels.Chest} />
        <MuscleBadge muscleGroup="Back" level={muscleLevels.Back} />
        <MuscleBadge muscleGroup="Arms" level={muscleLevels.Arms} />
        <MuscleBadge muscleGroup="Shoulders" level={muscleLevels.Shoulders} />
        <MuscleBadge muscleGroup="Legs" level={muscleLevels.Legs} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
});
