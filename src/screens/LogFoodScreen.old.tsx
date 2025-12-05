/**
 * LogFoodScreen
 *
 * Comprehensive manual food entry screen with:
 * - Form fields with validation
 * - Autocomplete from database
 * - Recently used and My Foods sections
 * - Real-time macro calculations
 * - Daily totals preview
 * - Success animations
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format, setHours, setMinutes } from 'date-fns';
import { z } from 'zod';

import {
  Button,
  Card,
  TextInput,
  NumericInput,
  Dropdown,
  Modal,
  Toast,
  useToast,
} from '../components/common';
import { colors } from '../constants/theme';
import { FoodItem, FoodLog, DailySummary } from '../types';
import { databaseService } from '../services/database';
import { useAppStore } from '../store/appStore';

// ============================================================================
// TYPES
// ============================================================================

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type ServingUnit = 'g' | 'ml' | 'oz' | 'cup' | 'piece';

interface FormData {
  foodName: string;
  mealType: MealType;
  servingSize: number;
  servingUnit: ServingUnit;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  notes: string;
  time: Date;
  imageUri: string | null;
  saveAsFavorite: boolean;
}

interface ValidationErrors {
  foodName?: string;
  servingSize?: string;
  calories?: string;
  protein?: string;
  fats?: string;
  carbs?: string;
}

interface RecentFood {
  id: number;
  name: string;
  calories: number;
  protein: number;
  lastUsed: string;
  usageCount: number;
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const foodLogSchema = z.object({
  foodName: z
    .string()
    .min(1, 'Food name is required')
    .max(100, 'Food name must be 100 characters or less'),
  servingSize: z
    .number()
    .positive('Serving size must be greater than 0')
    .max(10000, 'Serving size seems too large'),
  servingUnit: z.enum(['g', 'ml', 'oz', 'cup', 'piece']),
  calories: z
    .number()
    .min(0, 'Calories cannot be negative')
    .max(10000, 'Calories seem too high for a single serving'),
  protein: z
    .number()
    .min(0, 'Protein cannot be negative')
    .max(500, 'Protein seems too high for a single serving'),
  fats: z
    .number()
    .min(0, 'Fats cannot be negative')
    .max(500, 'Fats seem too high for a single serving')
    .optional(),
  carbs: z
    .number()
    .min(0, 'Carbs cannot be negative')
    .max(1000, 'Carbs seem too high for a single serving')
    .optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

// ============================================================================
// CONSTANTS
// ============================================================================

const MEAL_TYPES: { label: string; value: MealType; icon: string }[] = [
  { label: 'Breakfast', value: 'breakfast', icon: 'sunny-outline' },
  { label: 'Lunch', value: 'lunch', icon: 'partly-sunny-outline' },
  { label: 'Dinner', value: 'dinner', icon: 'moon-outline' },
  { label: 'Snack', value: 'snack', icon: 'cafe-outline' },
];

const SERVING_UNITS: { label: string; value: ServingUnit }[] = [
  { label: 'grams', value: 'g' },
  { label: 'ml', value: 'ml' },
  { label: 'oz', value: 'oz' },
  { label: 'cup', value: 'cup' },
  { label: 'piece', value: 'piece' },
];

const QUICK_SERVINGS = [
  { label: '100g', size: 100, unit: 'g' as ServingUnit },
  { label: '200g', size: 200, unit: 'g' as ServingUnit },
  { label: '1 cup', size: 1, unit: 'cup' as ServingUnit },
  { label: '1 piece', size: 1, unit: 'piece' as ServingUnit },
];

const INITIAL_FORM_DATA: FormData = {
  foodName: '',
  mealType: 'breakfast',
  servingSize: 100,
  servingUnit: 'g',
  calories: 0,
  protein: 0,
  fats: 0,
  carbs: 0,
  notes: '',
  time: new Date(),
  imageUri: null,
  saveAsFavorite: false,
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Meal Type Segmented Control
interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
}

const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({ value, onChange }) => (
  <View className="flex-row bg-gray-100 rounded-xl p-1">
    {MEAL_TYPES.map((meal) => (
      <Pressable
        key={meal.value}
        onPress={() => onChange(meal.value)}
        className={`flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-lg ${
          value === meal.value ? 'bg-white shadow-sm' : ''
        }`}
        accessibilityRole="button"
        accessibilityState={{ selected: value === meal.value }}
        accessibilityLabel={meal.label}
      >
        <Ionicons
          name={meal.icon as any}
          size={16}
          color={value === meal.value ? colors.primary[500] : colors.gray[500]}
        />
        <Text
          className={`ml-1 text-xs font-medium ${
            value === meal.value ? 'text-primary-500' : 'text-gray-500'
          }`}
        >
          {meal.label}
        </Text>
      </Pressable>
    ))}
  </View>
);

// Time Picker Button
interface TimePickerButtonProps {
  time: Date;
  onPress: () => void;
}

const TimePickerButton: React.FC<TimePickerButtonProps> = ({ time, onPress }) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
    accessibilityRole="button"
    accessibilityLabel={`Time: ${format(time, 'h:mm a')}. Tap to change.`}
  >
    <Ionicons name="time-outline" size={20} color={colors.gray[600]} />
    <Text className="ml-2 text-gray-800 font-medium">{format(time, 'h:mm a')}</Text>
    <View className="flex-1" />
    <Ionicons name="chevron-down" size={16} color={colors.gray[400]} />
  </Pressable>
);

// Quick Serving Size Buttons
interface QuickServingsProps {
  onSelect: (size: number, unit: ServingUnit) => void;
}

const QuickServings: React.FC<QuickServingsProps> = ({ onSelect }) => (
  <View className="flex-row flex-wrap gap-2 mt-2">
    {QUICK_SERVINGS.map((item) => (
      <Pressable
        key={item.label}
        onPress={() => onSelect(item.size, item.unit)}
        className="bg-gray-100 px-3 py-1.5 rounded-full active:bg-gray-200"
        accessibilityRole="button"
        accessibilityLabel={`Set serving to ${item.label}`}
      >
        <Text className="text-gray-600 text-sm">{item.label}</Text>
      </Pressable>
    ))}
  </View>
);

// Autocomplete Suggestion Item
interface SuggestionItemProps {
  item: FoodItem;
  onSelect: () => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ item, onSelect }) => (
  <Pressable
    onPress={onSelect}
    className="flex-row items-center py-3 px-4 border-b border-gray-100 active:bg-gray-50"
    accessibilityRole="button"
  >
    <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
      <Ionicons name="nutrition-outline" size={20} color={colors.primary[500]} />
    </View>
    <View className="flex-1">
      <Text className="text-gray-900 font-medium" numberOfLines={1}>
        {item.name}
      </Text>
      <Text className="text-gray-500 text-sm">
        {item.calories} kcal · {item.protein}g protein
      </Text>
    </View>
    <Ionicons name="arrow-forward" size={16} color={colors.gray[400]} />
  </Pressable>
);

// Recent Food Item
interface RecentFoodItemProps {
  food: RecentFood;
  onSelect: () => void;
}

const RecentFoodItem: React.FC<RecentFoodItemProps> = ({ food, onSelect }) => (
  <Pressable
    onPress={onSelect}
    className="bg-white rounded-xl p-3 mr-3 w-32 border border-gray-100 active:bg-gray-50"
    accessibilityRole="button"
    accessibilityLabel={`${food.name}, ${food.calories} calories`}
  >
    <Text className="text-gray-900 font-medium text-sm" numberOfLines={2}>
      {food.name}
    </Text>
    <Text className="text-gray-500 text-xs mt-1">
      {food.calories} kcal
    </Text>
    <Text className="text-gray-400 text-xs">
      Used {food.usageCount}x
    </Text>
  </Pressable>
);

// Daily Preview Card
interface DailyPreviewProps {
  currentTotals: DailySummary | null;
  newEntry: { calories: number; protein: number; fats: number; carbs: number };
  goals: { calories: number; protein: number; fats: number; carbs: number };
}

const DailyPreview: React.FC<DailyPreviewProps> = ({ currentTotals, newEntry, goals }) => {
  const newCalories = (currentTotals?.totalCalories || 0) + newEntry.calories;
  const newProtein = (currentTotals?.totalProtein || 0) + newEntry.protein;
  const newFats = (currentTotals?.totalFats || 0) + newEntry.fats;
  const newCarbs = (currentTotals?.totalCarbs || 0) + newEntry.carbs;

  const calorieProgress = Math.min((newCalories / goals.calories) * 100, 100);
  const proteinProgress = Math.min((newProtein / goals.protein) * 100, 100);

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className="bg-primary-50 rounded-2xl p-4 mt-4"
    >
      <View className="flex-row items-center mb-3">
        <Ionicons name="analytics-outline" size={18} color={colors.primary[600]} />
        <Text className="text-primary-700 font-semibold ml-2">Daily Impact</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <View className="flex-1 mr-4">
          <Text className="text-gray-600 text-xs mb-1">Calories</Text>
          <View className="bg-white rounded-full h-2 overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${calorieProgress}%` }}
            />
          </View>
          <Text className="text-gray-600 text-xs mt-1">
            {Math.round(newCalories)} / {goals.calories}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-600 text-xs mb-1">Protein</Text>
          <View className="bg-white rounded-full h-2 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${proteinProgress}%`,
                backgroundColor: colors.macros.protein,
              }}
            />
          </View>
          <Text className="text-gray-600 text-xs mt-1">
            {Math.round(newProtein)}g / {goals.protein}g
          </Text>
        </View>
      </View>

      {newEntry.calories > 0 && (
        <View className="flex-row items-center mt-2 pt-2 border-t border-primary-100">
          <Ionicons name="add-circle" size={14} color={colors.success[500]} />
          <Text className="text-gray-600 text-xs ml-1">
            Adding: {newEntry.calories} kcal, {newEntry.protein}g P, {newEntry.fats}g F, {newEntry.carbs}g C
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

// Success Animation Overlay
interface SuccessOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ visible, onComplete }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(onComplete)();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [visible, scale, opacity, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute inset-0 bg-black/50 items-center justify-center z-50"
    >
      <View className="bg-white rounded-3xl p-8 items-center">
        <View className="w-20 h-20 rounded-full bg-success-100 items-center justify-center mb-4">
          <Ionicons name="checkmark" size={48} color={colors.success[500]} />
        </View>
        <Text className="text-gray-900 font-bold text-xl mb-1">Food Logged!</Text>
        <Text className="text-gray-500 text-center">
          Your meal has been saved successfully
        </Text>
      </View>
    </Animated.View>
  );
};

// Time Picker Modal
interface TimePickerModalProps {
  visible: boolean;
  time: Date;
  onClose: () => void;
  onConfirm: (time: Date) => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  time,
  onClose,
  onConfirm,
}) => {
  const [hours, setHoursState] = useState(time.getHours());
  const [minutes, setMinutesState] = useState(time.getMinutes());

  useEffect(() => {
    if (visible) {
      setHoursState(time.getHours());
      setMinutesState(time.getMinutes());
    }
  }, [visible, time]);

  const handleConfirm = () => {
    const newTime = setMinutes(setHours(new Date(), hours), minutes);
    onConfirm(newTime);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Select Time"
      size="sm"
    >
      <View className="items-center py-6">
        <View className="flex-row items-center">
          <View className="items-center">
            <Pressable
              onPress={() => setHoursState((h) => (h + 1) % 24)}
              className="p-2"
            >
              <Ionicons name="chevron-up" size={24} color={colors.gray[600]} />
            </Pressable>
            <Text className="text-4xl font-bold text-gray-900 w-16 text-center">
              {hours.toString().padStart(2, '0')}
            </Text>
            <Pressable
              onPress={() => setHoursState((h) => (h - 1 + 24) % 24)}
              className="p-2"
            >
              <Ionicons name="chevron-down" size={24} color={colors.gray[600]} />
            </Pressable>
          </View>

          <Text className="text-4xl font-bold text-gray-900 mx-2">:</Text>

          <View className="items-center">
            <Pressable
              onPress={() => setMinutesState((m) => (m + 5) % 60)}
              className="p-2"
            >
              <Ionicons name="chevron-up" size={24} color={colors.gray[600]} />
            </Pressable>
            <Text className="text-4xl font-bold text-gray-900 w-16 text-center">
              {minutes.toString().padStart(2, '0')}
            </Text>
            <Pressable
              onPress={() => setMinutesState((m) => (m - 5 + 60) % 60)}
              className="p-2"
            >
              <Ionicons name="chevron-down" size={24} color={colors.gray[600]} />
            </Pressable>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3 mt-4">
        <Button
          variant="outline"
          onPress={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleConfirm}
          className="flex-1"
        >
          Confirm
        </Button>
      </View>
    </Modal>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LogFoodScreen: React.FC = () => {
  // State
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Recent foods and daily data
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [frequentFoods, setFrequentFoods] = useState<FoodItem[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Store
  const user = useAppStore((state) => state.user);
  const toast = useToast();

  // Refs
  const foodNameInputRef = useRef<RNTextInput>(null);
  const caloriesInputRef = useRef<RNTextInput>(null);
  const proteinInputRef = useRef<RNTextInput>(null);
  const fatsInputRef = useRef<RNTextInput>(null);
  const carbsInputRef = useRef<RNTextInput>(null);
  const notesInputRef = useRef<RNTextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // User goals
  const goals = useMemo(() => ({
    calories: user?.dailyCalorieGoal || 2000,
    protein: user?.dailyProteinGoal || 150,
    fats: user?.dailyFatGoal || 65,
    carbs: user?.dailyCarbGoal || 250,
  }), [user]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);

      // Get today's date
      const today = format(new Date(), 'yyyy-MM-dd');
      const userId = user?.id || 1;

      // Load daily summary
      const summary = await databaseService.getDailySummary(userId, today);
      setDailySummary(summary);

      // Load recent foods (from food logs)
      const recentLogs = await databaseService.getFoodLogsForDateRange(
        userId,
        format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        today
      );

      // Aggregate recent foods with usage count
      const foodUsage = new Map<number, { count: number; lastUsed: string }>();
      for (const log of recentLogs) {
        const existing = foodUsage.get(log.foodItemId);
        if (existing) {
          existing.count++;
          if (log.loggedAt > existing.lastUsed) {
            existing.lastUsed = log.loggedAt;
          }
        } else {
          foodUsage.set(log.foodItemId, { count: 1, lastUsed: log.loggedAt });
        }
      }

      // Get food items for recent foods
      const recentFoodItems: RecentFood[] = [];
      for (const [foodId, usage] of foodUsage) {
        const foodItem = await databaseService.getFoodItemById(foodId);
        if (foodItem) {
          recentFoodItems.push({
            id: foodItem.id,
            name: foodItem.name,
            calories: foodItem.calories,
            protein: foodItem.protein,
            lastUsed: usage.lastUsed,
            usageCount: usage.count,
          });
        }
      }

      // Sort by usage count and limit
      recentFoodItems.sort((a, b) => b.usageCount - a.usageCount);
      setRecentFoods(recentFoodItems.slice(0, 10));
      setFrequentFoods(
        recentFoodItems.slice(0, 5).map(rf => ({
          id: rf.id,
          name: rf.name,
          calories: rf.calories,
          protein: rf.protein,
          servingSize: 100,
          servingUnit: 'g' as const,
          fats: 0,
          carbs: 0,
          source: 'manual' as const,
          createdAt: '',
        }))
      );

      // Determine default meal type based on time
      const hour = new Date().getHours();
      let defaultMealType: MealType = 'snack';
      if (hour >= 5 && hour < 11) defaultMealType = 'breakfast';
      else if (hour >= 11 && hour < 15) defaultMealType = 'lunch';
      else if (hour >= 17 && hour < 21) defaultMealType = 'dinner';

      setFormData((prev) => ({ ...prev, mealType: defaultMealType }));
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.warning('Failed to load data. Some features may be limited.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // ============================================================================
  // SEARCH / AUTOCOMPLETE
  // ============================================================================

  useEffect(() => {
    const searchFoods = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await databaseService.searchFoodItems(searchQuery, 10);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error searching foods:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchFoods, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectSuggestion = useCallback((food: FoodItem) => {
    setFormData((prev) => ({
      ...prev,
      foodName: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit as ServingUnit,
      calories: food.calories,
      protein: food.protein,
      fats: food.fats,
      carbs: food.carbs,
    }));
    setSearchQuery(food.name);
    setShowSuggestions(false);
    setErrors({});
  }, []);

  const handleSelectRecentFood = useCallback(async (food: RecentFood) => {
    try {
      const fullFood = await databaseService.getFoodItemById(food.id);
      if (fullFood) {
        handleSelectSuggestion(fullFood);
      }
    } catch (error) {
      console.error('Error loading food item:', error);
    }
  }, [handleSelectSuggestion]);

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const updateFormField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleQuickServing = useCallback((size: number, unit: ServingUnit) => {
    updateFormField('servingSize', size);
    updateFormField('servingUnit', unit);
  }, [updateFormField]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to add food photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateFormField('imageUri', result.assets[0].uri);
    }
  }, [updateFormField]);

  const handleTakePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your camera to take food photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateFormField('imageUri', result.assets[0].uri);
    }
  }, [updateFormField]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = useCallback((): boolean => {
    try {
      foodLogSchema.parse({
        foodName: formData.foodName,
        servingSize: formData.servingSize,
        servingUnit: formData.servingUnit,
        calories: formData.calories,
        protein: formData.protein,
        fats: formData.fats || undefined,
        carbs: formData.carbs || undefined,
        notes: formData.notes || undefined,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof ValidationErrors;
          newErrors[field] = issue.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  // ============================================================================
  // SUBMISSION
  // ============================================================================

  const handleSubmit = useCallback(async (addAnother: boolean = false) => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = user?.id || 1;

      // Create food item first
      const foodItem = await databaseService.createFoodItem({
        name: formData.foodName,
        servingSize: formData.servingSize,
        servingUnit: formData.servingUnit,
        calories: formData.calories,
        protein: formData.protein,
        fats: formData.fats,
        carbs: formData.carbs,
        source: 'manual',
        imageUri: formData.imageUri || undefined,
      });

      // Create food log
      const loggedAt = format(formData.time, "yyyy-MM-dd'T'HH:mm:ss");
      await databaseService.logFood({
        userId,
        foodItemId: foodItem.id,
        quantity: 1, // Already factored into servingSize
        mealType: formData.mealType,
        loggedAt,
        notes: formData.notes || undefined,
      });

      // Update daily summary and streak
      const today = format(new Date(), 'yyyy-MM-dd');
      const newSummary = await databaseService.getDailySummary(userId, today);
      setDailySummary(newSummary);
      await databaseService.updateDailyStreak(userId, today, newSummary);

      // Show success
      if (addAnother) {
        toast.success('Food logged! Add another.', { duration: 2000 });
        // Reset form but keep meal type
        setFormData({
          ...INITIAL_FORM_DATA,
          mealType: formData.mealType,
          time: new Date(),
        });
        setSearchQuery('');
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error saving food log:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, validateForm, toast]);

  const handleSuccessComplete = useCallback(() => {
    setShowSuccess(false);
    // Navigate back or reset - for now just reset
    setFormData(INITIAL_FORM_DATA);
    setSearchQuery('');
  }, []);

  // ============================================================================
  // DUPLICATE FROM HISTORY
  // ============================================================================

  const handleDuplicateFromHistory = useCallback(() => {
    // In a real app, this would open a modal with history
    Alert.alert(
      'Duplicate from History',
      'Select a meal from your history to duplicate.',
      [{ text: 'OK' }]
    );
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoadingData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900">Log Food</Text>
          <View className="flex-row">
            <Pressable
              onPress={handleDuplicateFromHistory}
              className="p-2 mr-2"
              accessibilityRole="button"
              accessibilityLabel="Duplicate from history"
            >
              <Ionicons name="copy-outline" size={22} color={colors.gray[600]} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerClassName="px-4 py-4 pb-32"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Recently Used Foods */}
          {recentFoods.length > 0 && (
            <Animated.View entering={FadeIn.delay(100)} className="mb-6">
              <Text className="text-gray-700 font-semibold mb-3">Recently Used</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="pb-1"
              >
                {recentFoods.slice(0, 5).map((food) => (
                  <RecentFoodItem
                    key={food.id}
                    food={food}
                    onSelect={() => handleSelectRecentFood(food)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Food Name Input with Autocomplete */}
          <Animated.View entering={FadeIn.delay(150)} className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Food Name <Text className="text-error-500">*</Text>
            </Text>
            <View className="relative">
              <TextInput
                ref={foodNameInputRef}
                value={searchQuery || formData.foodName}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  updateFormField('foodName', text);
                }}
                placeholder="Search or enter food name"
                error={errors.foodName}
                leftIcon={<Ionicons name="search" size={20} color={colors.gray[400]} />}
                rightIcon={
                  isSearching ? (
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                  ) : searchQuery ? (
                    <Pressable onPress={() => { setSearchQuery(''); updateFormField('foodName', ''); }}>
                      <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
                    </Pressable>
                  ) : null
                }
                returnKeyType="next"
                onSubmitEditing={() => caloriesInputRef.current?.focus()}
              />

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-64 overflow-hidden"
                >
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {suggestions.map((item) => (
                      <SuggestionItem
                        key={item.id}
                        item={item}
                        onSelect={() => handleSelectSuggestion(item)}
                      />
                    ))}
                  </ScrollView>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Meal Type Selector */}
          <Animated.View entering={FadeIn.delay(200)} className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Meal Type</Text>
            <MealTypeSelector
              value={formData.mealType}
              onChange={(value) => updateFormField('mealType', value)}
            />
          </Animated.View>

          {/* Time Picker */}
          <Animated.View entering={FadeIn.delay(250)} className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Time</Text>
            <TimePickerButton
              time={formData.time}
              onPress={() => setShowTimePicker(true)}
            />
          </Animated.View>

          {/* Serving Size with Unit */}
          <Animated.View entering={FadeIn.delay(300)} className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Serving Size <Text className="text-error-500">*</Text>
            </Text>
            <View className="flex-row items-start">
              <View className="flex-1 mr-3">
                <NumericInput
                  value={formData.servingSize}
                  onChange={(value) => updateFormField('servingSize', value)}
                  min={0.1}
                  max={10000}
                  step={1}
                  decimals={1}
                  error={errors.servingSize}
                />
              </View>
              <View className="w-32">
                <Dropdown
                  value={formData.servingUnit}
                  onChange={(value) => updateFormField('servingUnit', value as ServingUnit)}
                  options={SERVING_UNITS}
                  placeholder="Unit"
                />
              </View>
            </View>
            <QuickServings onSelect={handleQuickServing} />
          </Animated.View>

          {/* Macros Section */}
          <Animated.View entering={FadeIn.delay(350)} className="mb-4">
            <Text className="text-gray-700 font-semibold mb-3">Nutrition Info</Text>
            <Card className="p-4">
              {/* Calories & Protein (Required) */}
              <View className="flex-row mb-4">
                <View className="flex-1 mr-3">
                  <Text className="text-gray-600 text-sm mb-1">
                    Calories <Text className="text-error-500">*</Text>
                  </Text>
                  <NumericInput
                    value={formData.calories}
                    onChange={(value) => updateFormField('calories', value)}
                    min={0}
                    max={10000}
                    step={5}
                    unit="kcal"
                    error={errors.calories}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-1">
                    Protein <Text className="text-error-500">*</Text>
                  </Text>
                  <NumericInput
                    value={formData.protein}
                    onChange={(value) => updateFormField('protein', value)}
                    min={0}
                    max={500}
                    step={1}
                    unit="g"
                    error={errors.protein}
                  />
                </View>
              </View>

              {/* Fats & Carbs (Optional) */}
              <View className="flex-row">
                <View className="flex-1 mr-3">
                  <Text className="text-gray-600 text-sm mb-1">Fats</Text>
                  <NumericInput
                    value={formData.fats}
                    onChange={(value) => updateFormField('fats', value)}
                    min={0}
                    max={500}
                    step={1}
                    unit="g"
                    error={errors.fats}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-1">Carbs</Text>
                  <NumericInput
                    value={formData.carbs}
                    onChange={(value) => updateFormField('carbs', value)}
                    min={0}
                    max={1000}
                    step={1}
                    unit="g"
                    error={errors.carbs}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Photo Section */}
          <Animated.View entering={FadeIn.delay(400)} className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Photo (Optional)</Text>
            {formData.imageUri ? (
              <View className="relative">
                <Image
                  source={{ uri: formData.imageUri }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => updateFormField('imageUri', null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="close" size={20} color="white" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row">
                <Pressable
                  onPress={handleTakePhoto}
                  className="flex-1 bg-gray-100 rounded-xl p-4 items-center mr-3 active:bg-gray-200"
                  accessibilityRole="button"
                  accessibilityLabel="Take photo"
                >
                  <Ionicons name="camera-outline" size={24} color={colors.gray[600]} />
                  <Text className="text-gray-600 text-sm mt-1">Take Photo</Text>
                </Pressable>
                <Pressable
                  onPress={handlePickImage}
                  className="flex-1 bg-gray-100 rounded-xl p-4 items-center active:bg-gray-200"
                  accessibilityRole="button"
                  accessibilityLabel="Choose from gallery"
                >
                  <Ionicons name="images-outline" size={24} color={colors.gray[600]} />
                  <Text className="text-gray-600 text-sm mt-1">Gallery</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* Notes Section */}
          <Animated.View entering={FadeIn.delay(450)} className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Notes (Optional)</Text>
            <TextInput
              ref={notesInputRef}
              value={formData.notes}
              onChangeText={(text) => updateFormField('notes', text)}
              placeholder="Add any notes about this meal..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <Text className="text-gray-400 text-xs text-right mt-1">
              {formData.notes.length}/500
            </Text>
          </Animated.View>

          {/* Save as Favorite Toggle */}
          <Animated.View entering={FadeIn.delay(500)} className="mb-4">
            <Pressable
              onPress={() => updateFormField('saveAsFavorite', !formData.saveAsFavorite)}
              className="flex-row items-center py-3"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: formData.saveAsFavorite }}
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                  formData.saveAsFavorite
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300'
                }`}
              >
                {formData.saveAsFavorite && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text className="text-gray-700 font-medium">Save as favorite for quick access</Text>
            </Pressable>
          </Animated.View>

          {/* Daily Impact Preview */}
          {(formData.calories > 0 || formData.protein > 0) && (
            <DailyPreview
              currentTotals={dailySummary}
              newEntry={{
                calories: formData.calories,
                protein: formData.protein,
                fats: formData.fats,
                carbs: formData.carbs,
              }}
              goals={goals}
            />
          )}
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 pb-8">
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              onPress={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex-1"
              icon={<Ionicons name="add" size={18} color={colors.primary[500]} />}
              iconPosition="left"
            >
              Add Another
            </Button>
            <Button
              variant="primary"
              onPress={() => handleSubmit(false)}
              loading={isSubmitting}
              className="flex-1"
            >
              Done
            </Button>
          </View>
        </View>

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={showTimePicker}
          time={formData.time}
          onClose={() => setShowTimePicker(false)}
          onConfirm={(time) => updateFormField('time', time)}
        />

        {/* Success Overlay */}
        <SuccessOverlay visible={showSuccess} onComplete={handleSuccessComplete} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LogFoodScreen;
