import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/theme';
import { UserProfile, DailyGoals } from '../types';
import { databaseService } from '../services/database';
import { calculateBMR, calculateTDEE, calculateMacros } from '../utils/calculations';
import { ProfileForm } from '../components/profile/ProfileForm';
import { GoalsCard } from '../components/profile/GoalsCard';
import { SettingsSection } from '../components/profile/SettingsSection';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useAppStore } from '../store/appStore';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [goals, setGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    fats: 70,
    carbs: 200,
  });
  const [calculatedGoals, setCalculatedGoals] = useState<DailyGoals>({
    calories: 0,
    protein: 0,
    fats: 0,
    carbs: 0,
  });
  const [isMetric, setIsMetric] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const user = useAppStore((state) => state.user);
  const userId = user?.id;

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const user = await databaseService.getUser(userId);
      if (user) {
        setProfile(user);
        setGoals({
          calories: user.dailyCalorieGoal,
          protein: user.dailyProteinGoal,
          fats: user.dailyFatGoal || 0,
          carbs: user.dailyCarbGoal || 0,
        });
      } else {
        // Create default user if not exists (for dev)
        const newUser = await databaseService.createUser({
          name: 'New User',
          gender: 'male',
          age: 30,
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        });
        setProfile(newUser);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Recalculate goals when profile changes
  useEffect(() => {
    if (profile.weight && profile.height && profile.age && profile.gender && profile.activityLevel && profile.goal) {
      const bmr = calculateBMR(
        profile.weight, 
        profile.height, 
        profile.age, 
        profile.gender
      );
      const tdee = calculateTDEE(bmr, profile.activityLevel);
      const macros = calculateMacros(tdee, profile.weight, profile.goal);
      setCalculatedGoals(macros);
    }
  }, [profile.weight, profile.height, profile.age, profile.gender, profile.activityLevel, profile.goal]);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please complete your profile setup first');
      return;
    }
    
    try {
      await databaseService.updateUser(userId, {
        ...profile,
        dailyCalorieGoal: goals.calories,
        dailyProteinGoal: goals.protein,
        dailyFatGoal: goals.fats,
        dailyCarbGoal: goals.carbs,
      });
      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleApplyCalculated = () => {
    setGoals(calculatedGoals);
    setHasUnsavedChanges(true);
  };

  const handleExportData = async () => {
    if (!userId) {
      Alert.alert('Error', 'No user data to export');
      return;
    }

    try {
      // Get all user data
      const userProfile = await databaseService.getUser(userId);
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get food logs for last 30 days
      const foodLogs = await databaseService.getFoodLogsForDateRange(userId, thirtyDaysAgo, today);
      
      // Get monthly summary
      const monthlyData = await databaseService.getMonthlyData(
        userId,
        new Date().getFullYear(),
        new Date().getMonth() + 1
      );

      // Format data as text
      let exportText = '📊 Whole Fit Data Export\n';
      exportText += `Generated: ${new Date().toLocaleString()}\n\n`;
      
      exportText += '👤 PROFILE\n';
      exportText += `Name: ${userProfile?.name || 'N/A'}\n`;
      exportText += `Age: ${userProfile?.age || 'N/A'}\n`;
      exportText += `Weight: ${userProfile?.weight || 'N/A'} kg\n`;
      exportText += `Height: ${userProfile?.height || 'N/A'} cm\n`;
      exportText += `Goal: ${userProfile?.goal || 'N/A'}\n\n`;
      
      exportText += '🎯 DAILY GOALS\n';
      exportText += `Calories: ${goals.calories} kcal\n`;
      exportText += `Protein: ${goals.protein}g\n`;
      exportText += `Carbs: ${goals.carbs}g\n`;
      exportText += `Fats: ${goals.fats}g\n\n`;
      
      exportText += '📈 MONTHLY SUMMARY\n';
      monthlyData.forEach(day => {
        if (day.totalCalories > 0) {
          exportText += `${day.date}: ${Math.round(day.totalCalories)}kcal, `;
          exportText += `${Math.round(day.totalProtein)}g P, `;
          exportText += `${Math.round(day.totalCarbs)}g C, `;
          exportText += `${Math.round(day.totalFats)}g F\n`;
        }
      });
      
      exportText += `\n📝 FOOD LOGS (Last 30 Days)\n`;
      exportText += `Total Entries: ${foodLogs.length}\n\n`;

      // Share the data
      await Share.share({
        message: exportText,
        title: 'Whole Fit Data Export'
      });

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = async () => {
    try {
      await databaseService.resetDatabase();
      fetchData(); // Reload
      Alert.alert('Success', 'All data cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">Profile</Text>
        {hasUnsavedChanges && (
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-primary-600 font-bold text-base">Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-4">
          <ProfileForm
            profile={profile}
            onChange={handleProfileChange}
            isMetric={isMetric}
            onToggleMetric={() => setIsMetric(!isMetric)}
          />

          <GoalsCard
            goals={goals}
            calculatedGoals={calculatedGoals}
            onUpdateGoals={(newGoals) => {
              setGoals(newGoals);
              setHasUnsavedChanges(true);
            }}
            onApplyCalculated={handleApplyCalculated}
          />

          <SettingsSection
            onExportData={handleExportData}
            onClearData={handleClearData}
          />
          
          {/* Bottom padding for floating tab bar */}
          <View className="h-28" /> 
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileScreen;