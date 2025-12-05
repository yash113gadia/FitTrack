import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { colors } from '../../constants/theme';
import { DailySummary } from '../../types';

interface ChartsViewProps {
  data: DailySummary[];
  period: 'week' | 'month' | 'quarter';
}

export const ChartsView: React.FC<ChartsViewProps> = ({ data, period }) => {
  const screenWidth = Dimensions.get('window').width;
  
  // Prepare data for charts
  const calorieData = data.map(d => ({
    value: d.totalCalories,
    label: new Date(d.date).getDate().toString(),
    dataPointText: Math.round(d.totalCalories).toString(),
  }));

  const proteinData = data.map(d => ({
    value: d.totalProtein,
    label: new Date(d.date).getDate().toString(),
  }));

  const weeklyAverages = React.useMemo(() => {
    // Simple logic to group by week - for now just showing daily bars for simplicity in this view
    // or we could aggregate. Let's show daily bars for the selected period.
    return data.map(d => ({
      value: d.totalCalories,
      label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      frontColor: d.goalsMetCalories ? colors.success[500] : colors.primary[500],
    }));
  }, [data]);

  return (
    <ScrollView className="flex-1 bg-gray-50 pt-4 pb-20">
      {/* Calorie Trend */}
      <View className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Calorie Trend</Text>
        <LineChart
          data={calorieData}
          color={colors.primary[500]}
          thickness={2}
          startFillColor={colors.primary[100]}
          endFillColor={colors.primary[50]}
          startOpacity={0.9}
          endOpacity={0.2}
          initialSpacing={10}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.gray[200]}
          rulesType="solid"
          rulesColor={colors.gray[100]}
          yAxisTextStyle={{ color: colors.gray[400], fontSize: 10 }}
          width={screenWidth - 64}
          height={200}
          curved
          isAnimated
        />
      </View>

      {/* Protein Intake */}
      <View className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Protein Intake (g)</Text>
        <LineChart
          data={proteinData}
          color={colors.macros.protein}
          thickness={2}
          hideDataPoints={false}
          dataPointsColor={colors.macros.protein}
          initialSpacing={10}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.gray[200]}
          rulesType="solid"
          rulesColor={colors.gray[100]}
          yAxisTextStyle={{ color: colors.gray[400], fontSize: 10 }}
          width={screenWidth - 64}
          height={200}
          isAnimated
        />
      </View>

      {/* Daily Performance */}
      <View className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Daily Performance</Text>
        <BarChart
          data={weeklyAverages}
          barWidth={20}
          spacing={14}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{ color: colors.gray[400] }}
          noOfSections={3}
          maxValue={3000} // Should be dynamic based on max value
          width={screenWidth - 64}
          height={200}
          isAnimated
        />
      </View>
    </ScrollView>
  );
};
