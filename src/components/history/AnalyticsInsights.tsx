import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { DailySummary, StreakData } from '../../types';
import { Card } from '../common';

interface AnalyticsInsightsProps {
  summaries: DailySummary[];
  streakData: StreakData;
}

export const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({
  summaries,
  streakData,
}) => {
  // Calculate insights
  const avgCalories = Math.round(
    summaries.reduce((acc, curr) => acc + curr.totalCalories, 0) / (summaries.length || 1)
  );

  const complianceRate = Math.round(
    (summaries.filter(s => s.goalsMetCalories && s.goalsMetProtein).length / (summaries.length || 1)) * 100
  );

  const bestDay = summaries.reduce((prev, current) => {
    return (prev.completionPercentage > current.completionPercentage) ? prev : current;
  }, summaries[0] || { date: '', completionPercentage: 0 });

  return (
    <ScrollView className="flex-1 bg-gray-50 pt-4 pb-20">
      <View className="px-4 flex-row flex-wrap justify-between">
        {/* Average Calories */}
        <Card className="w-[48%] mb-4 bg-white p-4">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mb-3">
            <Ionicons name="flame" size={20} color={colors.primary[500]} />
          </View>
          <Text className="text-gray-500 text-xs font-medium uppercase">Avg Calories</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">{avgCalories}</Text>
          <Text className="text-xs text-gray-400 mt-1">Last {summaries.length} days</Text>
        </Card>

        {/* Compliance Rate */}
        <Card className="w-[48%] mb-4 bg-white p-4">
          <View className="w-10 h-10 rounded-full bg-success-100 items-center justify-center mb-3">
            <Ionicons name="checkmark-circle" size={20} color={colors.success[500]} />
          </View>
          <Text className="text-gray-500 text-xs font-medium uppercase">Goal Met</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">{complianceRate}%</Text>
          <Text className="text-xs text-gray-400 mt-1">Success rate</Text>
        </Card>

        {/* Current Streak */}
        <Card className="w-[48%] mb-4 bg-white p-4">
          <View className="w-10 h-10 rounded-full bg-warning-100 items-center justify-center mb-3">
            <Ionicons name="trophy" size={20} color={colors.warning[500]} />
          </View>
          <Text className="text-gray-500 text-xs font-medium uppercase">Current Streak</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">{streakData.currentStreak}</Text>
          <Text className="text-xs text-gray-400 mt-1">Days in a row</Text>
        </Card>

        {/* Best Day */}
        <Card className="w-[48%] mb-4 bg-white p-4">
          <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mb-3">
            <Ionicons name="star" size={20} color="#A78BFA" />
          </View>
          <Text className="text-gray-500 text-xs font-medium uppercase">Best Day</Text>
          <Text className="text-lg font-bold text-gray-900 mt-1" numberOfLines={1}>
            {bestDay.date ? new Date(bestDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">
            {Math.round(bestDay.completionPercentage || 0)}% complete
          </Text>
        </Card>
      </View>

      {/* Macro Distribution Insight */}
      <View className="mx-4 mb-4 bg-white p-4 rounded-xl shadow-sm">
        <Text className="text-base font-semibold text-gray-900 mb-3">Macro Distribution</Text>
        <View className="flex-row h-4 rounded-full overflow-hidden">
          <View style={{ flex: 50, backgroundColor: colors.macros.carbs }} />
          <View style={{ flex: 30, backgroundColor: colors.macros.protein }} />
          <View style={{ flex: 20, backgroundColor: colors.macros.fats }} />
        </View>
        <View className="flex-row justify-between mt-2">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.macros.carbs }} />
            <Text className="text-xs text-gray-600">Carbs (50%)</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.macros.protein }} />
            <Text className="text-xs text-gray-600">Protein (30%)</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.macros.fats }} />
            <Text className="text-xs text-gray-600">Fats (20%)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
