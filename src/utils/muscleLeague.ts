import { LeagueRank, MuscleGroup } from '../types';
import { colors } from '../constants/theme';

export const LEAGUE_RANKS: LeagueRank[] = ['Beginner', 'Intermediate', 'Elite', 'Legendary'];

export const RANK_COLORS: Record<LeagueRank, string> = {
  Beginner: '#9CA3AF', // Gray (gray-400)
  Intermediate: '#3B82F6', // Blue (primary-500 approx)
  Elite: '#EF4444', // Red (error-500)
  Legendary: '#06B6D4', // Cyan (cyan-500)
};

// Thresholds in KG
const LEAGUE_THRESHOLDS: Record<MuscleGroup, Record<Exclude<LeagueRank, 'Beginner'>, number>> = {
  Chest: {
    Intermediate: 60,
    Elite: 100,
    Legendary: 140,
  },
  Back: {
    Intermediate: 70, // e.g. Barbell Row / Pullup weighted
    Elite: 110,
    Legendary: 150,
  },
  Legs: {
    Intermediate: 80, // e.g. Squat
    Elite: 120,
    Legendary: 160,
  },
  Shoulders: {
    Intermediate: 40, // e.g. Overhead Press
    Elite: 70,
    Legendary: 90,
  },
  Arms: {
    Intermediate: 30, // e.g. Barbell Curl
    Elite: 50,
    Legendary: 70,
  },
};

/**
 * Calculates the league rank based on the muscle group and weight lifted.
 * @param muscleGroup The muscle group being trained
 * @param weight Weight lifted in KG
 * @returns The calculated LeagueRank
 */
export function calculateLeagueRank(muscleGroup: MuscleGroup, weight: number): LeagueRank {
  const thresholds = LEAGUE_THRESHOLDS[muscleGroup];
  
  if (weight >= thresholds.Legendary) return 'Legendary';
  if (weight >= thresholds.Elite) return 'Elite';
  if (weight >= thresholds.Intermediate) return 'Intermediate';
  return 'Beginner';
}

/**
 * Helper to determine if a new rank is higher than the current rank.
 */
export function isRankUpgrade(currentRank: LeagueRank, newRank: LeagueRank): boolean {
  const ranks = LEAGUE_RANKS;
  return ranks.indexOf(newRank) > ranks.indexOf(currentRank);
}
