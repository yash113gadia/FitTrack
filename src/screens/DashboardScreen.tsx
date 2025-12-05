import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/theme';
import { useAppStore } from '../store/appStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { databaseService } from '../services/database';

const { width } = Dimensions.get('window');

// Animated Progress Ring Component
const ProgressRing = ({ 
  size = 120, 
  strokeWidth = 12, 
  progress = 0, 
  color = colors.primary[500],
  label = '',
  value = '',
  icon = 'flame' as any
}: {
  size?: number;
  strokeWidth?: number;
  progress?: number;
  color?: string;
  label?: string;
  value?: string;
  icon?: any;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View className="absolute" style={{ top: size / 2 - 30 }}>
        <Ionicons name={icon as any} size={24} color={color} style={{ alignSelf: 'center' }} />
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mt-1">{value}</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">{label}</Text>
      </View>
    </View>
  );
};

// Macro Bar Component
const MacroBar = ({ label, current, goal, color, icon }: {
  label: string;
  current: number;
  goal: number;
  color: string;
  icon: any;
}) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: color + '20' }}>
            <Ionicons name={icon as any} size={16} color={color} />
          </View>
          <Text className="text-sm font-semibold text-gray-900 dark:text-white">{label}</Text>
        </View>
        <Text className="text-sm font-bold text-gray-900 dark:text-white">
          {current}g <Text className="text-gray-400 dark:text-gray-500">/ {goal}g</Text>
        </Text>
      </View>
      <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <View 
          className="h-full rounded-full" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </View>
      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{percentage.toFixed(0)}%</Text>
    </View>
  );
};

// Quick Stats Card
const StatCard = ({ icon, label, value, color, trend }: { 
  icon: any; 
  label: string; 
  value: any; 
  color: string; 
  trend?: number;
}) => (
  <View className="bg-white dark:bg-gray-800 rounded-[20px] p-4 shadow-sm" style={{ width: (width - 48) / 2 }}>
    <View className="flex-row justify-between items-start mb-2">
      <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: color + '15' }}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      {trend && (
        <View className="flex-row items-center">
          <Ionicons name={trend > 0 ? 'trending-up' : 'trending-down'} size={14} color={trend > 0 ? colors.success[500] : colors.error[500]} />
          <Text className="text-xs ml-1" style={{ color: trend > 0 ? colors.success[500] : colors.error[500] }}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
    <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</Text>
    <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
  </View>
);

// Water Intake Component
const WaterIntake = ({ 
  current, 
  goal, 
  onGlassPress 
}: { 
  current: number; 
  goal: number; 
  onGlassPress: (index: number) => void;
}) => {
  const glasses = Array.from({ length: 8 }, (_, i) => i < current);
  
  return (
    <View className="bg-white dark:bg-gray-800 rounded-[28px] p-4 shadow-sm mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Water Intake</Text>
        <Text className="text-sm font-semibold text-primary">{current} / {goal} glasses</Text>
      </View>
      <View className="flex-row flex-wrap">
        {glasses.map((filled, index) => (
          <TouchableOpacity key={index} onPress={() => onGlassPress(index)} className="mr-2 mb-2">
            <Ionicons 
              name={filled ? 'water' : 'water-outline'} 
              size={32} 
              color={filled ? colors.primary[500] : colors.gray[300]} 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [todayData, setTodayData] = useState({
    calories: { current: 0, goal: 2000 },
    protein: { current: 0, goal: 150 },
    carbs: { current: 0, goal: 200 },
    fats: { current: 0, goal: 70 },
    water: { current: 0, goal: 8 },
    meals: 0,
    streak: 0,
    weight: '0 kg',
    avgCalories: 0
  });

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get daily summary
      const summary = await databaseService.getDailySummary(user.id, today);
      
      // Get user goals
      const goals = await databaseService.getUserGoals(user.id);
      
      // Get streak data
      const streakData = await databaseService.getCurrentStreak(user.id);
      
      // Get today's food logs to count meals
      const foodLogs = await databaseService.getFoodLogsForDate(user.id, today);
      
      // Get user profile for weight
      const profile = await databaseService.getUser(user.id);
      
      // Get weekly average calories
      const endDate = today;
      const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const weeklySummary = await databaseService.getWeeklySummary(user.id, startDate);
      const avgCalories = Math.round(
        weeklySummary.reduce((sum, day) => sum + day.totalCalories, 0) / weeklySummary.length
      );
      
      // Get water intake for today
      const waterCurrent = await databaseService.getWaterIntake(user.id, today);
      
      setTodayData({
        calories: { current: Math.round(summary.totalCalories), goal: goals.calories },
        protein: { current: Math.round(summary.totalProtein), goal: goals.protein },
        carbs: { current: Math.round(summary.totalCarbs), goal: goals.carbs },
        fats: { current: Math.round(summary.totalFats), goal: goals.fats },
        water: { current: waterCurrent, goal: 8 },
        meals: foodLogs.length,
        streak: streakData.currentStreak,
        weight: profile?.weight ? `${profile.weight.toFixed(1)} kg` : 'N/A',
        avgCalories
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleWaterGlassPress = async (index: number) => {
    if (!user?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      let newWaterCount: number;
      
      // If clicking on a filled glass (index < current), decrement
      // If clicking on an empty glass (index >= current), increment
      if (index < todayData.water.current) {
        newWaterCount = await databaseService.decrementWaterIntake(user.id, today);
      } else {
        newWaterCount = await databaseService.incrementWaterIntake(user.id, today);
      }
      
      // Update local state
      setTodayData(prev => ({
        ...prev,
        water: { ...prev.water, current: newWaterCount }
      }));
    } catch (error) {
      console.error('Error updating water intake:', error);
    }
  };

  const caloriesPercentage = (todayData.calories.current / todayData.calories.goal) * 100;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Ionicons name="nutrition" size={64} color={colors.primary[500]} />
        <Text className="text-lg text-gray-600 dark:text-gray-400 mt-4">Loading your progress...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Today's Progress</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Keep up the great work! 🔥</Text>
        </View>

        {/* Main Calorie Ring */}
        <View className="items-center py-6 bg-white dark:bg-gray-800 mx-4 rounded-[28px] shadow-sm mb-4 mt-4">
          <ProgressRing 
            size={200}
            strokeWidth={16}
            progress={caloriesPercentage}
            color={caloriesPercentage > 100 ? colors.error[500] : colors.primary[500]}
            label={`of ${todayData.calories.goal.toLocaleString()} kcal`}
            value={todayData.calories.current.toLocaleString()}
            icon="flame"
          />
          <View className="flex-row mt-4 justify-center">
            <View className="items-center px-6">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Remaining</Text>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.max(0, todayData.calories.goal - todayData.calories.current).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Quick Stats</Text>
          <View className="flex-row justify-between mb-3">
            <StatCard icon="restaurant" label="Meals Logged" value={todayData.meals} color={colors.success[500]} />
            <StatCard icon="flame" label="Day Streak" value={todayData.streak} color={colors.warning[500]} trend={5} />
          </View>
          <View className="flex-row justify-between">
            <StatCard icon="barbell" label="Current Weight" value={todayData.weight} color={colors.primary[500]} />
            <StatCard icon="analytics" label="Avg Calories" value={todayData.avgCalories.toLocaleString()} color={colors.macros.calories} />
          </View>
        </View>

        {/* Macros */}
        <View className="bg-white dark:bg-gray-800 rounded-[28px] p-4 mx-4 shadow-sm mb-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Macronutrients</Text>
          <MacroBar 
            label="Protein" 
            current={todayData.protein.current} 
            goal={todayData.protein.goal}
            color={colors.success[500]}
            icon="nutrition"
          />
          <MacroBar 
            label="Carbs" 
            current={todayData.carbs.current} 
            goal={todayData.carbs.goal}
            color={colors.warning[500]}
            icon="pizza"
          />
          <MacroBar 
            label="Fats" 
            current={todayData.fats.current} 
            goal={todayData.fats.goal}
            color={colors.macros.fats}
            icon="water"
          />
        </View>

        {/* Water Intake */}
        <View className="px-4 mb-4">
          <WaterIntake 
            current={todayData.water.current} 
            goal={todayData.water.goal} 
            onGlassPress={handleWaterGlassPress}
          />
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-8">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              className="bg-primary rounded-[20px] p-4 flex-1 mr-2 items-center"
              onPress={() => navigation.navigate('LogFood', {})}
            >
              <Ionicons name="add-circle" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">Log Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-success-500 rounded-[20px] p-4 flex-1 ml-2 items-center"
              onPress={() => navigation.navigate('BarcodeScanner')}
            >
              <Ionicons name="barcode" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">Scan Food</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding for floating tab bar */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
