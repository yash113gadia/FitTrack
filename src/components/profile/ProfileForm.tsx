import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch } from 'react-native';
// Removed unused Picker import

import { colors } from '../../constants/theme';
import { UserProfile } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface ProfileFormProps {
  profile: Partial<UserProfile>;
  onChange: (field: keyof UserProfile, value: any) => void;
  isMetric: boolean;
  onToggleMetric: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onChange,
  isMetric,
  onToggleMetric,
}) => {
  return (
    <View className="bg-white dark:bg-gray-800 p-4 rounded-[24px] shadow-sm mb-4">
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Personal Details</Text>

      {/* Name */}
      <View className="mb-4">
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</Text>
        <TextInput
          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-gray-900 dark:text-white"
          value={profile.name}
          onChangeText={(text) => onChange('name', text)}
          placeholder="Your Name"
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Gender */}
      <View className="mb-4">
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Gender</Text>
        <View className="flex-row" style={{ gap: 16 }}>
          {['male', 'female'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => onChange('gender', g)}
              className={`flex-1 p-3 rounded-lg items-center border ${
                profile.gender === g 
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <Text className={`capitalize font-medium ${
                profile.gender === g ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-row justify-between mb-4">
        {/* Age */}
        <View className="w-[30%]">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Age</Text>
          <TextInput
            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-gray-900 dark:text-white"
            value={profile.age?.toString()}
            onChangeText={(text) => onChange('age', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        {/* Weight */}
        <View className="w-[32%]">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Weight ({isMetric ? 'kg' : 'lbs'})</Text>
          <TextInput
            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-gray-900 dark:text-white"
            value={profile.weight?.toString()}
            onChangeText={(text) => onChange('weight', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        {/* Height */}
        <View className="w-[32%]">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Height ({isMetric ? 'cm' : 'ft'})</Text>
          <TextInput
            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-gray-900 dark:text-white"
            value={profile.height?.toString()}
            onChangeText={(text) => onChange('height', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="175"
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>

      {/* Unit Toggle */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-gray-600 dark:text-gray-400">Use Metric Units</Text>
        <Switch
          value={isMetric}
          onValueChange={onToggleMetric}
          trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
        />
      </View>

      {/* Activity Level */}
      <View className="mb-4">
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Activity Level</Text>
        <View style={{ gap: 8 }}>
          {[
            { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
            { value: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
            { value: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
            { value: 'active', label: 'Very Active', desc: '6-7 days/week' },
            { value: 'very_active', label: 'Extremely Active', desc: 'Physical job or athlete' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange('activityLevel', option.value)}
              className={`p-3 rounded-lg border ${
                profile.activityLevel === option.value
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <Text className={`font-medium ${
                profile.activityLevel === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
              }`}>
                {option.label}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Goal */}
      <View className="mb-2">
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Goal</Text>
        <View className="flex-row" style={{ gap: 8 }}>
          {[
            { value: 'lose', label: 'Lose Weight' },
            { value: 'maintain', label: 'Maintain' },
            { value: 'gain', label: 'Gain Muscle' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange('goal', option.value)}
              className={`flex-1 p-3 rounded-lg items-center border ${
                profile.goal === option.value
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <Text className={`text-xs font-bold text-center ${
                profile.goal === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};
