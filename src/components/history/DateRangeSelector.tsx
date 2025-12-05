import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export type DateRangeOption = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

interface DateRangeSelectorProps {
  selectedRange: DateRangeOption;
  onSelectRange: (range: DateRangeOption) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedRange,
  onSelectRange,
  currentDate,
  onDateChange,
}) => {
  const ranges: { label: string; value: DateRangeOption }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' },
  ];

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (selectedRange === 'today') newDate.setDate(newDate.getDate() - 1);
    else if (selectedRange === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (selectedRange === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (selectedRange === 'quarter') newDate.setMonth(newDate.getMonth() - 3);
    else if (selectedRange === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (selectedRange === 'today') newDate.setDate(newDate.getDate() + 1);
    else if (selectedRange === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (selectedRange === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (selectedRange === 'quarter') newDate.setMonth(newDate.getMonth() + 3);
    else if (selectedRange === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
    onDateChange(newDate);
  };

  const formatDateDisplay = () => {
    if (selectedRange === 'today') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (selectedRange === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (selectedRange === 'year') {
      return currentDate.getFullYear().toString();
    }
    // Simplified for other ranges
    return currentDate.toLocaleDateString();
  };

  return (
    <View className="bg-white border-b border-gray-200">
      {/* Range Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {ranges.map((range) => (
          <Pressable
            key={range.value}
            onPress={() => onSelectRange(range.value)}
            className={`mr-2 px-4 py-1.5 rounded-full border ${
              selectedRange === range.value
                ? 'bg-primary-500 border-primary-500'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedRange === range.value ? 'text-white' : 'text-gray-600'
              }`}
            >
              {range.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Date Navigation */}
      <View className="flex-row items-center justify-between px-4 pb-3">
        <Pressable onPress={handlePrev} className="p-2">
          <Ionicons name="chevron-back" size={20} color={colors.gray[600]} />
        </Pressable>
        
        <Text className="text-base font-semibold text-gray-900">
          {formatDateDisplay()}
        </Text>

        <Pressable onPress={handleNext} className="p-2">
          <Ionicons name="chevron-forward" size={20} color={colors.gray[600]} />
        </Pressable>
      </View>
    </View>
  );
};
