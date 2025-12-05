import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/theme';
import { DailySummary, FoodLogWithDetails } from '../types';
import { databaseService } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';

const HistoryScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthSummaries, setMonthSummaries] = useState<DailySummary[]>([]);
  const [dailyLogs, setDailyLogs] = useState<FoodLogWithDetails[]>([]);

  const user = useAppStore((state) => state.user);
  const userId = user?.id;

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch month summaries for calendar
      const monthData = await databaseService.getMonthlyData(
        userId, 
        currentDate.getFullYear(), 
        currentDate.getMonth() + 1
      );
      setMonthSummaries(monthData);

      // Fetch detailed logs for selected date
      const logs = await databaseService.getFoodLogsWithDetailsForDate(userId, selectedDate);
      setDailyLogs(logs);

    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentDate, selectedDate, userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Navigate to previous/next month
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getDaySummary = (date: Date | null) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return monthSummaries.find(s => s.date === dateStr);
  };

  const handleDeleteLog = async (logId: number) => {
    if (!userId) return;
    
    try {
      await databaseService.deleteFoodLog(logId);
      fetchData(); // Refresh
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!userId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-4 text-center">
            No History Yet
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Complete your profile setup to start tracking your nutrition history
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const calendarDays = getCalendarDays();
  const selectedDaySummary = monthSummaries.find(s => s.date === selectedDate);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">History</Text>
        </View>

        {/* Month Navigator */}
        <View className="mx-4 mt-3 p-3 bg-white dark:bg-gray-800 rounded-[28px] shadow-sm flex-row justify-between items-center">
          <TouchableOpacity onPress={() => changeMonth('prev')} className="p-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700">
            <Ionicons name="chevron-back" size={24} color={colors.gray[500]} />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity onPress={() => changeMonth('next')} className="p-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700">
            <Ionicons name="chevron-forward" size={24} color={colors.gray[500]} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View className="mx-4 my-3 p-4 bg-white dark:bg-gray-800 rounded-[28px] shadow-sm">
          {/* Day Labels */}
          <View className="flex-row mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <View key={i} className="flex-1 items-center">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
              }

              const dateStr = date.toISOString().split('T')[0];
              const summary = getDaySummary(date);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const hasData = summary && summary.totalCalories > 0;

              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => setSelectedDate(dateStr)}
                  className="w-[14.28%] aspect-square p-1"
                >
                  <View 
                    className={`flex-1 rounded-2xl items-center justify-center ${
                      isSelected 
                        ? 'bg-primary-500' 
                        : isToday 
                        ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700' 
                        : hasData 
                        ? 'bg-green-50 dark:bg-green-900/30' 
                        : 'bg-transparent'
                    }`}
                  >
                    <Text 
                      className={`text-sm font-medium ${
                        isSelected 
                          ? 'text-white' 
                          : isToday 
                          ? 'text-primary-700 dark:text-primary-300' 
                          : hasData 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                    {hasData && !isSelected && (
                      <View className="w-1 h-1 rounded-full bg-green-500 mt-1" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Summary */}
        <View className="px-4 mb-3">
          <View className="bg-white dark:bg-gray-800 rounded-[28px] p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>

            {selectedDaySummary && selectedDaySummary.totalCalories > 0 ? (
              <View>
                {/* Macro Summary */}
                <View className="flex-row justify-between mb-4">
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(selectedDaySummary.totalCalories)}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Calories</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(selectedDaySummary.totalProtein)}g
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Protein</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {Math.round(selectedDaySummary.totalCarbs)}g
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Carbs</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(selectedDaySummary.totalFats)}g
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Fats</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No food logged for this day
              </Text>
            )}
          </View>
        </View>

        {/* Food Logs for Selected Day */}
        {dailyLogs.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Food Logs</Text>
            {dailyLogs.map((log) => (
              <View 
                key={log.id} 
                className="bg-white dark:bg-gray-800 rounded-[24px] p-4 mb-2 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {log.foodName}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      {log.quantity}x serving
                      {log.mealType && ` • ${log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1)}`}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleDeleteLog(log.id)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.gray[500]} />
                  </TouchableOpacity>
                </View>
                
                <View className="flex-row justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(log.calories * log.quantity)} cal
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    P: {Math.round(log.protein * log.quantity)}g
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    C: {Math.round(log.carbs * log.quantity)}g
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    F: {Math.round(log.fats * log.quantity)}g
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom padding for floating tab bar */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoryScreen;
