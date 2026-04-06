import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { colors } from '../constants/theme';
import { databaseService } from '../services/database';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAppStore((state) => state.login);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name');
      return;
    }

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // For demo purposes, we'll create a new user account
      // In production, this would call a backend API to register the user
      
      // Simulate account creation
      const success = await login(email, password);
      
      if (success) {
        Alert.alert(
          'Account Created!',
          'Welcome to Whole Fit! Let\'s set up your profile.',
          [{ text: 'Get Started', onPress: () => {} }]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Error', 'An error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.primary[500] }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Decorative Background - Top Section */}
          <View style={{ backgroundColor: colors.primary[500], minHeight: 300 }}>
            {/* Cloud decorations */}
            <View style={{ position: 'absolute', top: 40, left: -20, opacity: 0.3 }}>
              <Svg height="120" width="200">
                <Ellipse cx="60" cy="40" rx="50" ry="25" fill={colors.primary[300]} />
                <Ellipse cx="100" cy="35" rx="45" ry="23" fill={colors.primary[300]} />
                <Ellipse cx="140" cy="42" rx="40" ry="20" fill={colors.primary[300]} />
              </Svg>
            </View>
            
            <View style={{ position: 'absolute', top: 100, right: -30, opacity: 0.3 }}>
              <Svg height="100" width="180">
                <Ellipse cx="50" cy="35" rx="45" ry="22" fill={colors.primary[400]} />
                <Ellipse cx="90" cy="32" rx="40" ry="20" fill={colors.primary[400]} />
                <Ellipse cx="120" cy="38" rx="35" ry="18" fill={colors.primary[400]} />
              </Svg>
            </View>

            {/* Sparkle stars */}
            <View style={{ position: 'absolute', top: 60, right: 40, opacity: 0.6 }}>
              <Ionicons name="sparkles" size={16} color="white" />
            </View>
            <View style={{ position: 'absolute', top: 140, left: 50, opacity: 0.5 }}>
              <Ionicons name="sparkles" size={12} color="white" />
            </View>
            <View style={{ position: 'absolute', top: 180, right: 80, opacity: 0.7 }}>
              <Ionicons name="sparkles" size={14} color="white" />
            </View>

            {/* Hero Illustration */}
            <View className="items-center pt-12 pb-6">
              {/* Fitness Character Illustration - Running pose */}
              <View className="items-center justify-center mb-4" style={{ height: 160 }}>
                <View className="items-center">
                  {/* Running Character */}
                  <Svg height="120" width="100" style={{ marginBottom: -20 }}>
                    {/* Head */}
                    <Circle cx="50" cy="30" r="20" fill="white" />
                    {/* Eyes */}
                    <Circle cx="44" cy="28" r="2.5" fill={colors.gray[900]} />
                    <Circle cx="56" cy="28" r="2.5" fill={colors.gray[900]} />
                    {/* Smile */}
                    <Path d="M 44 36 Q 50 40 56 36" stroke={colors.gray[900]} strokeWidth="2" fill="none" strokeLinecap="round" />
                    
                    {/* Torso - leaning forward */}
                    <Ellipse cx="52" cy="68" rx="22" ry="28" fill="white" transform="rotate(10 52 68)" />
                    
                    {/* Arms - running position */}
                    <Ellipse cx="30" cy="60" rx="6" ry="20" fill="white" transform="rotate(-45 30 60)" />
                    <Ellipse cx="74" cy="70" rx="6" ry="20" fill="white" transform="rotate(35 74 70)" />
                    
                    {/* Legs - running stride */}
                    <Ellipse cx="42" cy="105" rx="6" ry="18" fill="white" transform="rotate(-15 42 105)" />
                    <Ellipse cx="62" cy="108" rx="6" ry="18" fill="white" transform="rotate(20 62 108)" />
                    
                    {/* Star burst on chest */}
                    <Path d="M 52 62 L 54 67 L 59 67 L 55 70 L 57 75 L 52 72 L 47 75 L 49 70 L 45 67 L 50 67 Z" fill={colors.warning[400]} />
                  </Svg>
                  
                  {/* Motion lines */}
                  <View style={{ position: 'absolute', top: 50, right: 80, opacity: 0.4 }}>
                    <Svg height="30" width="20">
                      <Path d="M 2 5 L 15 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <Path d="M 2 15 L 18 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <Path d="M 2 25 L 12 25" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                  </View>
                </View>
              </View>

              {/* App Title */}
              <Text className="text-white text-4xl font-bold mb-2" style={{ letterSpacing: 1 }}>
                Join Whole Fit
              </Text>
              <Text className="text-white px-8 text-center mb-4" style={{ fontSize: 14, opacity: 0.9 }}>
                Start your transformation journey today
              </Text>
            </View>
          </View>

          {/* Signup Card - Floating Squircle Design */}
          <View className="bg-white dark:bg-gray-900 m-4 px-6 pt-6 pb-8 rounded-3xl shadow-lg" style={{ elevation: 10 }}>
            {/* Welcome Text - Compact */}
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Create Account
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mb-5" style={{ fontSize: 14 }}>
              Fill in your details to get started
            </Text>

            {/* Name Input - Squircle with Margin */}
            <View className="mb-3 mx-1">
              <View
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 flex-row items-center rounded-xl"
                style={{ height: 50 }}
              >
                <Ionicons name="person-outline" size={20} color={colors.primary[500]} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={colors.gray[400]}
                  autoCapitalize="words"
                  autoCorrect={false}
                  className="flex-1 text-gray-900 dark:text-white ml-3"
                  style={{ fontSize: 15 }}
                />
              </View>
            </View>

            {/* Email Input - Squircle with Margin */}
            <View className="mb-3 mx-1">
              <View
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 flex-row items-center rounded-xl"
                style={{ height: 50 }}
              >
                <Ionicons name="mail-outline" size={20} color={colors.primary[500]} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-gray-900 dark:text-white ml-3"
                  style={{ fontSize: 15 }}
                />
              </View>
            </View>

            {/* Password Input - Squircle with Margin */}
            <View className="mb-3 mx-1">
              <View
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 flex-row items-center rounded-xl"
                style={{ height: 50 }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary[500]} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 text-gray-900 dark:text-white ml-3"
                  style={{ fontSize: 15 }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input - Squircle with Margin */}
            <View className="mb-4 mx-1">
              <View
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 flex-row items-center rounded-xl"
                style={{ height: 50 }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary[500]} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  className="flex-1 text-gray-900 dark:text-white ml-3"
                  style={{ fontSize: 15 }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button - Squircle with Margin */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              className="items-center mb-3 mx-1 rounded-xl"
              style={{ 
                backgroundColor: colors.primary[500],
                opacity: isLoading ? 0.6 : 1,
                height: 50,
                justifyContent: 'center',
                shadowColor: colors.primary[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold" style={{ fontSize: 16 }}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Terms text */}
            <Text className="text-gray-400 dark:text-gray-500 text-center mb-4 px-2" style={{ fontSize: 12 }}>
              By signing up, you agree to our{' '}
              <Text className="font-semibold" style={{ color: colors.primary[500] }}>Terms of Service</Text>
              {' '}and{' '}
              <Text className="font-semibold" style={{ color: colors.primary[500] }}>Privacy Policy</Text>
            </Text>

            {/* Divider - Compact */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <Text className="px-3 text-gray-400 dark:text-gray-500" style={{ fontSize: 13 }}>or</Text>
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </View>

            {/* Back to Login Button */}
            <TouchableOpacity
              onPress={handleBackToLogin}
              disabled={isLoading}
              className="border-2 flex-row items-center justify-center mx-1 rounded-xl"
              style={{ 
                borderColor: colors.primary[300],
                opacity: isLoading ? 0.6 : 1,
                height: 50,
              }}
            >
              <Ionicons name="arrow-back-outline" size={20} color={colors.primary[500]} />
              <Text className="font-bold ml-2" style={{ color: colors.primary[500], fontSize: 16 }}>
                Back to Login
              </Text>
            </TouchableOpacity>

            {/* Footer - Compact */}
            <View className="items-center mt-5">
              <Text className="text-gray-500 dark:text-gray-400" style={{ fontSize: 13 }}>
                Already have an account?{' '}
                <Text 
                  className="font-bold" 
                  style={{ color: colors.primary[500] }}
                  onPress={handleBackToLogin}
                >
                  Sign In
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
