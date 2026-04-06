import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { colors } from '../constants/theme';
import { calculateBMR, calculateTDEE, calculateMacros } from '../utils/calculations';
import * as Haptics from 'expo-haptics';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { databaseService } from '../services/database';
import { ScrollWheelPicker } from '../components/common';

const { width } = Dimensions.get('window');

type OnboardingStep = 0 | 1 | 2 | 3 | 4;

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain';
type UnitSystem = 'metric' | 'imperial';

interface OnboardingData {
  name: string;
  age: string;
  gender: Gender;
  weight: string;
  height: string; // cm or ft
  heightInches: string; // for imperial
  activityLevel: ActivityLevel;
  goal: Goal;
  unitSystem: UnitSystem;
}

const INITIAL_DATA: OnboardingData = {
  name: '',
  age: '',
  gender: 'male',
  weight: '',
  height: '',
  heightInches: '',
  activityLevel: 'moderate',
  goal: 'maintain',
  unitSystem: 'metric',
};

const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [step, setStep] = useState<OnboardingStep>(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [calculatedGoals, setCalculatedGoals] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  console.log('[OnboardingScreen] Rendering. Step:', step);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const setUser = useAppStore((state) => state.setUser);

  const updateData = (key: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (!validateStep()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (step === 3) {
      calculateGoals();
    }

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep((prev) => (prev + 1) as OnboardingStep);
      slideAnim.setValue(width);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep((prev) => (prev - 1) as OnboardingStep);
      slideAnim.setValue(-width);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!data.name.trim()) {
          Alert.alert('Required', 'Please enter your name');
          return false;
        }
        if (!data.age || isNaN(Number(data.age)) || Number(data.age) < 10 || Number(data.age) > 120) {
          Alert.alert('Invalid Age', 'Please enter a valid age (10-120)');
          return false;
        }
        return true;
      case 2:
        if (!data.weight || isNaN(Number(data.weight)) || Number(data.weight) <= 0) {
          Alert.alert('Invalid Weight', 'Please enter a valid weight');
          return false;
        }
        if (!data.height || isNaN(Number(data.height)) || Number(data.height) <= 0) {
          Alert.alert('Invalid Height', 'Please enter a valid height');
          return false;
        }
        if (data.unitSystem === 'imperial' && (!data.heightInches || isNaN(Number(data.heightInches)))) {
           Alert.alert('Invalid Height', 'Please enter inches');
           return false;
        }
        return true;
      default:
        return true;
    }
  };

  const calculateGoals = () => {
    let weightKg = Number(data.weight);
    let heightCm = Number(data.height);

    if (data.unitSystem === 'imperial') {
      weightKg = weightKg * 0.453592;
      heightCm = (Number(data.height) * 30.48) + (Number(data.heightInches || 0) * 2.54);
    }

    const bmr = calculateBMR(weightKg, heightCm, Number(data.age), data.gender);
    const tdee = calculateTDEE(bmr, data.activityLevel);
    const macros = calculateMacros(tdee, weightKg, data.goal);

    setCalculatedGoals(macros);
  };

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      return { cameraStatus, notifStatus };
    } catch (error) {
      console.log('Error requesting permissions:', error);
    }
  };

  const finishOnboarding = async () => {
    if (!calculatedGoals) return;

    try {
      await requestPermissions();

      // Check if a user already exists (user ID 1)
      const existingUser = await databaseService.getUser(1);
      
      let savedUser;
      if (existingUser) {
        // Update existing user
        await databaseService.updateUser(1, {
          name: data.name,
          gender: data.gender,
          age: Number(data.age),
          weight: Number(data.weight),
          height: Number(data.height),
          activityLevel: data.activityLevel,
          goal: data.goal,
          dailyCalorieGoal: calculatedGoals.calories,
          dailyProteinGoal: calculatedGoals.protein,
          dailyFatGoal: calculatedGoals.fats,
          dailyCarbGoal: calculatedGoals.carbs,
        });
        savedUser = await databaseService.getUser(1);
      } else {
        // Create new user in database
        savedUser = await databaseService.createUser({
          name: data.name,
          gender: data.gender,
          age: Number(data.age),
          weight: Number(data.weight),
          height: Number(data.height),
          activityLevel: data.activityLevel,
          goal: data.goal,
          dailyCalorieGoal: calculatedGoals.calories,
          dailyProteinGoal: calculatedGoals.protein,
          dailyFatGoal: calculatedGoals.fats,
          dailyCarbGoal: calculatedGoals.carbs,
        });
      }

      // Update store with the saved user
      if (savedUser) {
        setUser(savedUser);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="fitness" size={60} color="#fff" />
        </View>
        <Text style={styles.appName}>Whole Fit</Text>
        <Text style={styles.tagline}>Track Your Nutrition, Reach Your Goals</Text>
      </View>

      <View style={styles.featuresContainer}>
        <FeatureItem icon="stats-chart" text="Smart macro tracking" color="#4F46E5" />
        <FeatureItem icon="flame" text="Streak motivation" color="#F59E0B" />
        <FeatureItem icon="camera" text="AI food recognition" color="#10B981" />
        <FeatureItem icon="chatbubbles" text="Personal AI coach" color="#EC4899" />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={async () => {
          // Skip with defaults - save to database
          try {
            const existingUser = await databaseService.getUser(1);
            
            let savedUser;
            if (existingUser) {
              // Update existing user with defaults
              await databaseService.updateUser(1, {
                name: 'User',
                gender: 'male',
                age: 30,
                weight: 70,
                height: 175,
                activityLevel: 'moderate',
                goal: 'maintain',
                dailyCalorieGoal: 2000,
                dailyProteinGoal: 150,
                dailyFatGoal: 65,
                dailyCarbGoal: 250,
              });
              savedUser = await databaseService.getUser(1);
            } else {
              savedUser = await databaseService.createUser({
                name: 'User',
                gender: 'male',
                age: 30,
                weight: 70,
                height: 175,
                activityLevel: 'moderate',
                goal: 'maintain',
                dailyCalorieGoal: 2000,
                dailyProteinGoal: 150,
                dailyFatGoal: 65,
                dailyCarbGoal: 250,
              });
            }
            
            if (savedUser) {
              setUser(savedUser);
            }
            navigation.replace('MainTabs');
          } catch (error) {
            console.error('Error creating default user:', error);
            Alert.alert('Error', 'Failed to create profile');
          }
        }}
      >
        <Text style={styles.secondaryButtonText}>Skip Setup</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>This helps us calculate your personalized goals.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>What should we call you?</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={data.name}
          onChangeText={(text) => updateData('name', text)}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>How old are you?</Text>
        <ScrollWheelPicker
          items={Array.from({ length: 91 }, (_, i) => (i + 10).toString())}
          initialValue={data.age || '30'}
          onValueChange={(val) => updateData('age', val)}
          height={150}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderOption, data.gender === 'male' && styles.genderOptionSelected]}
            onPress={() => updateData('gender', 'male')}
          >
            <Ionicons name="male" size={24} color={data.gender === 'male' ? '#fff' : colors.text.secondary} />
            <Text style={[styles.genderText, data.gender === 'male' && styles.genderTextSelected]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderOption, data.gender === 'female' && styles.genderOptionSelected]}
            onPress={() => updateData('gender', 'female')}
          >
            <Ionicons name="female" size={24} color={data.gender === 'female' ? '#fff' : colors.text.secondary} />
            <Text style={[styles.genderText, data.gender === 'female' && styles.genderTextSelected]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPhysicalData = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Physical Data</Text>
      <Text style={styles.stepSubtitle}>We use this to calculate your metabolism.</Text>

      <View style={styles.unitToggleContainer}>
        <TouchableOpacity
          style={[styles.unitToggle, data.unitSystem === 'metric' && styles.unitToggleSelected]}
          onPress={() => updateData('unitSystem', 'metric')}
        >
          <Text style={[styles.unitText, data.unitSystem === 'metric' && styles.unitTextSelected]}>Metric (kg/cm)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitToggle, data.unitSystem === 'imperial' && styles.unitToggleSelected]}
          onPress={() => updateData('unitSystem', 'imperial')}
        >
          <Text style={[styles.unitText, data.unitSystem === 'imperial' && styles.unitTextSelected]}>Imperial (lbs/ft)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight ({data.unitSystem === 'metric' ? 'kg' : 'lbs'})</Text>
        <ScrollWheelPicker
          items={
            data.unitSystem === 'metric'
              ? Array.from({ length: 171 }, (_, i) => (i + 30).toString()) // 30-200
              : Array.from({ length: 391 }, (_, i) => (i + 60).toString()) // 60-450
          }
          initialValue={data.weight || (data.unitSystem === 'metric' ? '70' : '150')}
          onValueChange={(val) => updateData('weight', val)}
          height={150}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Height</Text>
        {data.unitSystem === 'metric' ? (
          <ScrollWheelPicker
            items={Array.from({ length: 151 }, (_, i) => (i + 100).toString())} // 100-250
            initialValue={data.height || '170'}
            onValueChange={(val) => updateData('height', val)}
            height={150}
            label="cm"
          />
        ) : (
          <View style={styles.imperialHeightContainer}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ScrollWheelPicker
                items={['3', '4', '5', '6', '7', '8']}
                initialValue={data.height || '5'}
                onValueChange={(val) => updateData('height', val)}
                height={150}
                label="ft"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ScrollWheelPicker
                items={Array.from({ length: 12 }, (_, i) => i.toString())}
                initialValue={data.heightInches || '8'}
                onValueChange={(val) => updateData('heightInches', val)}
                height={150}
                label="in"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderActivityGoals = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Activity & Goals</Text>
      
      <Text style={styles.sectionHeader}>Activity Level</Text>
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <ActivityOption 
          label="Sedentary" 
          desc="Little to no exercise" 
          icon="bed" 
          selected={data.activityLevel === 'sedentary'}
          onSelect={() => updateData('activityLevel', 'sedentary')}
        />
        <ActivityOption 
          label="Light" 
          desc="1-3 days/week" 
          icon="walk" 
          selected={data.activityLevel === 'light'}
          onSelect={() => updateData('activityLevel', 'light')}
        />
        <ActivityOption 
          label="Moderate" 
          desc="3-5 days/week" 
          icon="bicycle" 
          selected={data.activityLevel === 'moderate'}
          onSelect={() => updateData('activityLevel', 'moderate')}
        />
        <ActivityOption 
          label="Active" 
          desc="6-7 days/week" 
          icon="barbell" 
          selected={data.activityLevel === 'active'}
          onSelect={() => updateData('activityLevel', 'active')}
        />
        <ActivityOption 
          label="Very Active" 
          desc="Athlete level" 
          icon="flame" 
          selected={data.activityLevel === 'very_active'}
          onSelect={() => updateData('activityLevel', 'very_active')}
        />

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Your Goal</Text>
        <GoalOption 
          label="Lose Weight" 
          desc="Calorie deficit" 
          icon="trending-down" 
          selected={data.goal === 'lose'}
          onSelect={() => updateData('goal', 'lose')}
        />
        <GoalOption 
          label="Maintain" 
          desc="Stay current" 
          icon="remove" 
          selected={data.goal === 'maintain'}
          onSelect={() => updateData('goal', 'maintain')}
        />
        <GoalOption 
          label="Gain Weight" 
          desc="Muscle building" 
          icon="trending-up" 
          selected={data.goal === 'gain'}
          onSelect={() => updateData('goal', 'gain')}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );

  const renderCalculation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Plan</Text>
      <Text style={styles.stepSubtitle}>Based on your data, here are your daily targets.</Text>

      {calculatedGoals && (
        <View style={styles.resultsContainer}>
          <View style={styles.calorieCard}>
            <Text style={styles.calorieLabel}>Daily Calories</Text>
            <Text style={styles.calorieValue}>{calculatedGoals.calories}</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
          </View>

          <View style={styles.macrosContainer}>
            <MacroCard label="Protein" value={calculatedGoals.protein} color="#4F46E5" />
            <MacroCard label="Carbs" value={calculatedGoals.carbs} color="#10B981" />
            <MacroCard label="Fats" value={calculatedGoals.fats} color="#F59E0B" />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
            <Text style={styles.infoText}>
              These targets are a starting point. You can adjust them later in your profile settings.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {step > 0 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={prevStep} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
            </View>
            <View style={{ width: 40 }} />
          </View>
        )}

        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }] 
            }
          ]}
        >
          {step === 0 && renderWelcome()}
          {step === 1 && renderBasicInfo()}
          {step === 2 && renderPhysicalData()}
          {step === 3 && renderActivityGoals()}
          {step === 4 && renderCalculation()}
        </Animated.View>

        {step > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={step === 4 ? finishOnboarding : nextStep}
            >
              <Text style={styles.primaryButtonText}>
                {step === 4 ? "Let's Go!" : 'Next'}
              </Text>
              {step !== 4 && <Ionicons name="arrow-forward" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, text, color }: { icon: any, text: string, color: string }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const ActivityOption = ({ label, desc, icon, selected, onSelect }: any) => (
  <TouchableOpacity 
    style={[styles.optionCard, selected && styles.optionCardSelected]} 
    onPress={onSelect}
  >
    <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
      <Ionicons name={icon} size={24} color={selected ? '#fff' : colors.text.secondary} />
    </View>
    <View style={styles.optionTextContainer}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>{desc}</Text>
    </View>
    {selected && <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />}
  </TouchableOpacity>
);

const GoalOption = ({ label, desc, icon, selected, onSelect }: any) => (
  <TouchableOpacity 
    style={[styles.optionCard, selected && styles.optionCardSelected]} 
    onPress={onSelect}
  >
    <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
      <Ionicons name={icon} size={24} color={selected ? '#fff' : colors.text.secondary} />
    </View>
    <View style={styles.optionTextContainer}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>{desc}</Text>
    </View>
    {selected && <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />}
  </TouchableOpacity>
);

const MacroCard = ({ label, value, color }: any) => (
  <View style={styles.macroCard}>
    <Text style={[styles.macroValue, { color }]}>{value}g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.background.card,
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.card,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    textAlignVertical: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 8,
  },
  genderOptionSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  genderTextSelected: {
    color: '#fff',
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  unitToggle: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitToggleSelected: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  unitTextSelected: {
    color: colors.text.primary,
  },
  imperialHeightContainer: {
    flexDirection: 'row',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  scrollArea: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50] + '50',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconSelected: {
    backgroundColor: colors.primary[500],
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: colors.primary[700],
  },
  optionDesc: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  optionDescSelected: {
    color: colors.primary[600],
  },
  resultsContainer: {
    alignItems: 'center',
  },
  calorieCard: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: colors.background.card,
    padding: 32,
    borderRadius: 100,
    width: 200,
    height: 200,
    justifyContent: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 4,
    borderColor: colors.primary[100],
  },
  calorieLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  calorieUnit: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: colors.primary[700],
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});

export default OnboardingScreen;
