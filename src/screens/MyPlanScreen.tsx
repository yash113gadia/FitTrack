import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/appStore';
import { databaseService } from '../services/database';
import { colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface WorkoutDay {
  day: string;
  exercises: {
    name: string;
    sets: string;
    reps: string;
    notes?: string;
  }[];
}

interface WorkoutPlan {
  analysis: {
    somatotype: string;
    bodyFatEstimate: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string;
  };
  schedule: {
    split: string;
    frequency: string;
  };
  routine: WorkoutDay[];
}

const MyPlanScreen: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      if (!user) return;
      try {
        const savedPlan = await databaseService.getLatestWorkoutPlan(user.id);
        if (savedPlan) {
          setPlan(savedPlan);
        }
      } catch (error) {
        console.error('Failed to load plan:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading your personalized plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text-outline" size={64} color={colors.gray[400]} />
        <Text style={styles.emptyText}>No workout plan found.</Text>
        <Text style={styles.subText}>Use the AI Body Scan to generate one!</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Your AI Plan</Text>
        
        {/* Analysis Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Physique Analysis</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Somatotype:</Text>
            <Text style={styles.value}>{plan.analysis.somatotype}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Est. Body Fat:</Text>
            <Text style={styles.value}>{plan.analysis.bodyFatEstimate}</Text>
          </View>
          <Text style={styles.label}>Strengths:</Text>
          <Text style={styles.value}>{plan.analysis.strengths.join(', ')}</Text>
          <Text style={styles.label}>Focus Areas:</Text>
          <Text style={styles.value}>{plan.analysis.weaknesses.join(', ')}</Text>
          <View style={styles.divider} />
          <Text style={styles.recommendation}>{plan.analysis.recommendations}</Text>
        </View>

        {/* Schedule Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <Text style={styles.value}>{plan.schedule.split} • {plan.schedule.frequency}</Text>
        </View>

        {/* Routine */}
        <Text style={styles.sectionHeader}>Workout Routine</Text>
        {plan.routine.map((day, index) => (
          <View key={index} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day.day}</Text>
            {day.exercises.map((ex, exIndex) => (
              <View key={exIndex} style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  {ex.notes && <Text style={styles.exerciseNotes}>{ex.notes}</Text>}
                </View>
                <View style={styles.exerciseSets}>
                  <Text style={styles.setText}>{ex.sets} x {ex.reps}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
  },
  subText: {
    color: colors.text.secondary,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Basic shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[500],
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 12,
  },
  recommendation: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  exerciseNotes: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  exerciseSets: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setText: {
    color: colors.primary[700],
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MyPlanScreen;
