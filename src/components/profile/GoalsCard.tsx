import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/theme';
import { DailyGoals } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface GoalsCardProps {
  goals: DailyGoals;
  calculatedGoals: DailyGoals;
  onUpdateGoals: (goals: DailyGoals) => void;
  onApplyCalculated: () => void;
}

export const GoalsCard: React.FC<GoalsCardProps> = ({
  goals,
  calculatedGoals,
  onUpdateGoals,
  onApplyCalculated,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field: keyof DailyGoals, value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdateGoals({ ...goals, [field]: numValue });
  };

  return (
    <View className="bg-white dark:bg-gray-800 p-4 rounded-[24px] shadow-sm mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Daily Goals</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text className="text-primary-600 font-medium">
            {isEditing ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recommendation Banner */}
      <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} style={{ marginTop: 2 }} />
          <View className="ml-2 flex-1">
            <Text className="text-sm font-semibold text-blue-900 dark:text-blue-100">Recommended for you:</Text>
            <Text className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {Math.round(calculatedGoals.calories)} kcal • {Math.round(calculatedGoals.protein)}g Protein
            </Text>
            <TouchableOpacity onPress={onApplyCalculated} className="mt-2">
              <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">Apply Recommendations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Goals Inputs */}
      <View className="flex-row flex-wrap justify-between">
        <View className="w-[48%] mb-4">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase">Calories</Text>
          <TextInput
            editable={isEditing}
            className={`p-3 rounded-lg text-lg font-bold ${
              isEditing 
                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600' 
                : 'bg-transparent text-gray-900 dark:text-white'
            }`}
            value={goals.calories.toString()}
            onChangeText={(text) => handleChange('calories', text)}
            keyboardType="numeric"
          />
        </View>

        <View className="w-[48%] mb-4">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase">Protein (g)</Text>
          <TextInput
            editable={isEditing}
            className={`p-3 rounded-lg text-lg font-bold ${
              isEditing 
                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600' 
                : 'bg-transparent text-gray-900 dark:text-white'
            }`}
            value={goals.protein.toString()}
            onChangeText={(text) => handleChange('protein', text)}
            keyboardType="numeric"
          />
        </View>

        <View className="w-[48%] mb-4">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase">Carbs (g)</Text>
          <TextInput
            editable={isEditing}
            className={`p-3 rounded-lg text-lg font-bold ${
              isEditing 
                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600' 
                : 'bg-transparent text-gray-900 dark:text-white'
            }`}
            value={goals.carbs.toString()}
            onChangeText={(text) => handleChange('carbs', text)}
            keyboardType="numeric"
          />
        </View>

        <View className="w-[48%] mb-4">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase">Fats (g)</Text>
          <TextInput
            editable={isEditing}
            className={`p-3 rounded-lg text-lg font-bold ${
              isEditing 
                ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600' 
                : 'bg-transparent text-gray-900 dark:text-white'
            }`}
            value={goals.fats.toString()}
            onChangeText={(text) => handleChange('fats', text)}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );
};
