import React, { useMemo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { colors } from '../../constants/theme';
import { DailySummary } from '../../types';

interface CalendarViewProps {
  currentDate: Date;
  summaries: DailySummary[];
  onSelectDate: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  summaries,
  onSelectDate,
}) => {
  const summariesMap = useMemo(() => {
    return summaries.reduce((acc, summary) => {
      acc[summary.date] = summary;
      return acc;
    }, {} as Record<string, DailySummary>);
  }, [summaries]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Add empty slots for days before start of month
    const firstDay = date.getDay(); // 0 = Sunday
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const getDayStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const summary = summariesMap[dateStr];
    
    if (!summary) return 'none';
    if (summary.goalsMetCalories && summary.goalsMetProtein) return 'success';
    if (summary.goalsMetCalories || summary.goalsMetProtein) return 'partial';
    return 'missed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return colors.success[500];
      case 'partial': return colors.warning[500];
      case 'missed': return colors.error[500];
      default: return 'transparent';
    }
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const screenWidth = Dimensions.get('window').width;
  const cellSize = (screenWidth - 32) / 7;

  return (
    <View className="p-4 bg-white rounded-xl shadow-sm mx-4 mt-4">
      {/* Weekday Headers */}
      <View className="flex-row mb-2">
        {weekDays.map((day, index) => (
          <View key={index} style={{ width: cellSize }} className="items-center">
            <Text className="text-gray-400 font-medium text-xs">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={{ width: cellSize, height: cellSize }} />;
          }

          const status = getDayStatus(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = date.toDateString() === currentDate.toDateString();

          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => onSelectDate(date)}
              style={{ width: cellSize, height: cellSize }}
              className="items-center justify-center p-1"
            >
              <View
                className={`w-8 h-8 items-center justify-center rounded-full ${
                  isSelected ? 'bg-primary-100' : ''
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-primary-600' : 'text-gray-700'
                  } ${isToday ? 'font-bold' : ''}`}
                >
                  {date.getDate()}
                </Text>
                
                {/* Status Dot */}
                {status !== 'none' && (
                  <View
                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getStatusColor(status) }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View className="flex-row justify-center mt-4 space-x-4">
        <View className="flex-row items-center mr-3">
          <View className="w-2 h-2 rounded-full bg-success-500 mr-1.5" />
          <Text className="text-xs text-gray-500">Met Goals</Text>
        </View>
        <View className="flex-row items-center mr-3">
          <View className="w-2 h-2 rounded-full bg-warning-500 mr-1.5" />
          <Text className="text-xs text-gray-500">Partial</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-error-500 mr-1.5" />
          <Text className="text-xs text-gray-500">Missed</Text>
        </View>
      </View>
    </View>
  );
};
