/**
 * Simplified LogFoodScreen
 * 
 * Quick and easy food logging with AI nutrition calculation and offline database
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/theme';
import { databaseService } from '../services/database';
import { geminiService } from '../services/geminiAPI';
import { useAppStore } from '../store/appStore';
import { searchCommonFoods, calculateNutrition, type CommonFood } from '../data/commonFoods';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES = [
  { value: 'breakfast' as MealType, label: 'Breakfast', icon: 'sunny' },
  { value: 'lunch' as MealType, label: 'Lunch', icon: 'partly-sunny' },
  { value: 'dinner' as MealType, label: 'Dinner', icon: 'moon' },
  { value: 'snack' as MealType, label: 'Snack', icon: 'cafe' },
];

const LogFoodScreen = () => {
  const navigation = useNavigation();
  const { user } = useAppStore();
  
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchResults, setSearchResults] = useState<CommonFood[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search common foods database as user types
  useEffect(() => {
    if (foodName.trim().length >= 2) {
      const results = searchCommonFoods(foodName);
      setSearchResults(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [foodName]);

  // Handle selecting a food from suggestions (Offline Calculator)
  const handleSelectCommonFood = (food: CommonFood) => {
    setFoodName(food.name);
    setServingSize(food.servingSize.toString());
    setServingUnit(food.servingUnit);
    
    // Calculate nutrition for the serving size
    const nutrition = calculateNutrition(food, food.servingSize, food.servingUnit);
    setCalories(nutrition.calories.toString());
    setProtein(nutrition.protein.toString());
    setCarbs(nutrition.carbs.toString());
    setFats(nutrition.fats.toString());
    
    setShowSuggestions(false);
  };

  // Offline calculator - calculate from database
  const handleOfflineCalculate = () => {
    if (!foodName.trim()) {
      Alert.alert('Missing Info', 'Please enter a food name');
      return;
    }
    
    const results = searchCommonFoods(foodName);
    if (results.length > 0) {
      // Use the best match
      const bestMatch = results[0];
      const serving = parseFloat(servingSize) || 100;
      const nutrition = calculateNutrition(bestMatch, serving, servingUnit);
      
      setCalories(nutrition.calories.toString());
      setProtein(nutrition.protein.toString());
      setCarbs(nutrition.carbs.toString());
      setFats(nutrition.fats.toString());
      
      Alert.alert('📊 Offline Calculation', `Nutrition calculated for ${bestMatch.name}`);
    } else {
      Alert.alert('Not Found', 'Food not found in offline database. Try the AI Calculator instead.');
    }
  };

  const handleAICalculate = async () => {
    if (!foodName.trim()) {
      Alert.alert('Missing Info', 'Please enter a food name');
      return;
    }
    
    if (!servingSize.trim()) {
      Alert.alert('Missing Info', 'Please enter serving size');
      return;
    }

    setIsCalculating(true);
    try {
      const nutritionData = await geminiService.estimateFromText(
        foodName,
        parseFloat(servingSize),
        servingUnit
      );
      
      if (nutritionData) {
        setCalories(nutritionData.calories.toString());
        setProtein(nutritionData.protein.toString());
        setCarbs(nutritionData.carbs.toString());
        setFats(nutritionData.fats.toString());
        Alert.alert('✨ AI Success!', 'Nutrition values calculated by AI');
      } else {
        throw new Error('Failed to get nutrition data');
      }
    } catch (error) {
      console.error('AI calculation error:', error);
      Alert.alert('Error', 'Failed to calculate nutrition. Try the Offline Calculator instead.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!foodName.trim()) {
      Alert.alert('Missing Info', 'Please enter a food name');
      return;
    }
    
    if (!calories || !protein || !carbs || !fats) {
      Alert.alert('Missing Info', 'Please fill in all nutrition values or use AI Calculator');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsSaving(true);
    try {
      // Create food item
      const foodItem = await databaseService.createFoodItem({
        name: foodName.trim(),
        servingSize: parseFloat(servingSize) || 100,
        servingUnit: servingUnit as any,
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        fats: parseFloat(fats),
        carbs: parseFloat(carbs),
        source: calories ? 'manual' : 'ai_estimate',
      });

      // Log the food
      await databaseService.logFood({
        userId: user.id,
        foodItemId: foodItem.id,
        quantity: 1,
        mealType,
        loggedAt: new Date().toISOString(),
      });

      Alert.alert('Success!', 'Food logged successfully', [
        { text: 'Log Another', onPress: resetForm },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving food:', error);
      Alert.alert('Error', 'Failed to log food. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFoodName('');
    setServingSize('100');
    setServingUnit('g');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="close" size={24} color={colors.gray[500]} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Log Food</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4">
            {/* Meal Type Selector */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meal Type</Text>
              <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {MEAL_TYPES.map((meal) => (
                  <TouchableOpacity
                    key={meal.value}
                    onPress={() => setMealType(meal.value)}
                    className={`flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-lg ${
                      mealType === meal.value ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
                    }`}
                  >
                    <Ionicons
                      name={meal.icon as any}
                      size={16}
                      color={mealType === meal.value ? colors.primary[500] : colors.gray[500]}
                    />
                    <Text
                      className={`ml-1 text-xs font-medium ${
                        mealType === meal.value ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {meal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Food Name with Autocomplete */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Food Name *</Text>
              <TextInput
                value={foodName}
                onChangeText={setFoodName}
                onFocus={() => foodName.length >= 2 && setShowSuggestions(true)}
                placeholder="Chicken breast, Brown rice, Apple"
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                placeholderTextColor={colors.gray[400]}
              />
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && searchResults.length > 0 && (
                <View className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mt-2 max-h-48">
                  <ScrollView keyboardShouldPersistTaps="always">
                    {searchResults.map((food) => (
                      <TouchableOpacity
                        key={food.id}
                        onPress={() => handleSelectCommonFood(food)}
                        className="px-4 py-3 border-b border-gray-100 dark:border-gray-700"
                      >
                        <Text className="text-gray-900 dark:text-white font-medium">{food.name}</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {food.category} • {food.calories} cal per {food.servingSize}{food.servingUnit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Serving Size */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serving Size *</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <TextInput
                  value={servingSize}
                  onChangeText={setServingSize}
                  placeholder="100"
                  keyboardType="decimal-pad"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                  placeholderTextColor={colors.gray[400]}
                />
                <View className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3" style={{ width: 80 }}>
                  <TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white">{servingUnit}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Calculator Buttons */}
            <View className="mb-6" style={{ gap: 12 }}>
              {/* Offline Calculator */}
              <TouchableOpacity
                onPress={handleOfflineCalculate}
                className="bg-green-500 rounded-xl py-4 flex-row items-center justify-center"
              >
                <Ionicons name="calculator" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Offline Calculator (100 Foods)</Text>
              </TouchableOpacity>

              {/* AI Calculate Button */}
              <TouchableOpacity
                onPress={handleAICalculate}
                disabled={isCalculating}
                className="bg-purple-500 rounded-xl py-4 flex-row items-center justify-center"
                style={{ opacity: isCalculating ? 0.6 : 1 }}
              >
                {isCalculating ? (
                  <>
                    <ActivityIndicator color="white" />
                    <Text className="text-white font-semibold ml-2">Calculating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">AI Calculator (Requires Internet)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Nutrition Values - Compact Grid */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nutrition Values</Text>
              
              {/* Row 1: Calories and Protein */}
              <View className="flex-row mb-3" style={{ gap: 8 }}>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calories *</Text>
                  <TextInput
                    value={calories}
                    onChangeText={setCalories}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mb-1">Protein (g) *</Text>
                  <TextInput
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              {/* Row 2: Carbs and Fats */}
              <View className="flex-row" style={{ gap: 8 }}>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mb-1">Carbs (g) *</Text>
                  <TextInput
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fats (g) *</Text>
                  <TextInput
                    value={fats}
                    onChangeText={setFats}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="bg-primary rounded-xl py-4 flex-row items-center justify-center mb-8"
              style={{ opacity: isSaving ? 0.6 : 1 }}
            >
              {isSaving ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text className="text-white font-semibold ml-2">Saving...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Log Food</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LogFoodScreen;
