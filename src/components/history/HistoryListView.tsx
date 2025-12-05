import React, { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { DailySummary, FoodLogWithDetails } from '../../types';
import { SwipeableRow } from '../common';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HistoryListViewProps {
  summaries: DailySummary[];
  foodLogs: Record<string, FoodLogWithDetails[]>; // Keyed by date string
  onEditLog: (log: FoodLogWithDetails) => void;
  onDeleteLog: (logId: number) => void;
}

export const HistoryListView: React.FC<HistoryListViewProps> = ({
  summaries,
  foodLogs,
  onEditLog,
  onDeleteLog,
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const toggleExpand = (date: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDate(expandedDate === date ? null : date);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <View className="px-4 pt-4 pb-20">
      {summaries.map((summary) => {
        const isExpanded = expandedDate === summary.date;
        const logs = foodLogs[summary.date] || [];

        return (
          <View key={summary.date} className="mb-4 bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Summary Header */}
            <Pressable
              onPress={() => toggleExpand(summary.date)}
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  {formatDate(summary.date)}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-sm text-gray-500 mr-3">
                    {Math.round(summary.totalCalories)} kcal
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {Math.round(summary.totalProtein)}g protein
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center">
                {summary.goalsMetCalories && summary.goalsMetProtein && (
                  <View className="bg-success-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-success-700 font-medium">Goal Met</Text>
                  </View>
                )}
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.gray[400]}
                />
              </View>
            </Pressable>

            {/* Expanded Details */}
            {isExpanded && (
              <View className="border-t border-gray-100">
                {logs.length === 0 ? (
                  <View className="p-4 items-center">
                    <Text className="text-gray-400 italic">No meals logged</Text>
                  </View>
                ) : (
                  logs.map((log, index) => (
                    <SwipeableRow
                      key={log.id}
                      onEdit={() => onEditLog(log)}
                      onDelete={() => onDeleteLog(log.id)}
                    >
                      <View className={`p-4 flex-row items-center bg-gray-50 ${index !== logs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3 shadow-sm">
                          <Ionicons 
                            name={
                              log.mealType === 'breakfast' ? 'sunny-outline' :
                              log.mealType === 'lunch' ? 'restaurant-outline' :
                              log.mealType === 'dinner' ? 'moon-outline' : 'cafe-outline'
                            } 
                            size={20} 
                            color={colors.primary[500]} 
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-gray-900">
                            {log.foodName}
                          </Text>
                          <Text className="text-xs text-gray-500 capitalize">
                            {log.mealType} • {log.quantity} {log.servingUnit}(s)
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-sm font-medium text-gray-900">
                            {Math.round(log.calories)} kcal
                          </Text>
                        </View>
                      </View>
                    </SwipeableRow>
                  ))
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};
