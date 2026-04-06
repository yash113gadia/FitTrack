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

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAppStore((state) => state.login);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll use a simple email/password validation
      // In a real app, this would call an authentication API
      
      // Check if user exists in database (for demo purposes)
      // In production, this should validate against a backend
      const success = await login(email, password);
      
      if (!success) {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      // Continue as guest - will trigger onboarding flow
      await login('guest@fittrack.app', 'guest', true);
    } catch (error) {
      console.error('Guest login error:', error);
      Alert.alert('Error', 'Failed to continue as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupPress = () => {
    navigation.navigate('Signup');
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
              {/* Fitness Character Illustration */}
              <View className="items-center justify-center mb-6" style={{ height: 200 }}>
                {/* Character with dumbbell */}
                <View className="items-center">
                  {/* Body */}
                  <Svg height="140" width="120" style={{ marginBottom: -20 }}>
                    {/* Head */}
                    <Circle cx="60" cy="35" r="25" fill="white" />
                    {/* Eyes */}
                    <Circle cx="52" cy="32" r="3" fill={colors.gray[900]} />
                    <Circle cx="68" cy="32" r="3" fill={colors.gray[900]} />
                    {/* Happy mouth */}
                    <Path d="M 52 42 Q 60 48 68 42" stroke={colors.gray[900]} strokeWidth="2" fill="none" strokeLinecap="round" />
                    
                    {/* Torso */}
                    <Ellipse cx="60" cy="85" rx="28" ry="35" fill="white" />
                    
                    {/* Arms */}
                    <Ellipse cx="35" cy="75" rx="8" ry="25" fill="white" transform="rotate(-20 35 75)" />
                    <Ellipse cx="85" cy="75" rx="8" ry="25" fill="white" transform="rotate(20 85 75)" />
                    
                    {/* Legs */}
                    <Ellipse cx="48" cy="135" rx="8" ry="20" fill="white" />
                    <Ellipse cx="72" cy="135" rx="8" ry="20" fill="white" />
                    
                    {/* Heart on chest */}
                    <Path d="M 60 75 L 55 70 Q 52 67 52 63 Q 52 58 56 58 Q 58 58 60 60 Q 62 58 64 58 Q 68 58 68 63 Q 68 67 65 70 Z" fill={colors.error[400]} />
                  </Svg>
                  
                  {/* Dumbbell */}
                  <View style={{ position: 'absolute', top: 80, left: -10, transform: [{ rotate: '-25deg' }] }}>
                    <Svg height="20" width="60">
                      <Ellipse cx="10" cy="10" rx="8" ry="6" fill={colors.gray[700]} />
                      <Ellipse cx="50" cy="10" rx="8" ry="6" fill={colors.gray[700]} />
                      <Path d="M 18 10 L 42 10" stroke={colors.gray[800]} strokeWidth="4" />
                    </Svg>
                  </View>
                </View>
              </View>

              {/* App Title */}
              <Text className="text-white text-5xl font-bold mb-2" style={{ letterSpacing: 1 }}>
                Whole Fit
              </Text>
              <Text className="text-white px-8 text-center mb-6" style={{ fontSize: 15, opacity: 0.9 }}>
                Transform your health, one step at a time
              </Text>
            </View>
          </View>

          {/* Login Card - Floating Squircle Design */}
          <View className="bg-white dark:bg-gray-900 m-4 px-6 pt-6 pb-8 rounded-3xl shadow-lg" style={{ elevation: 10 }}>
            {/* Welcome Text - Compact */}
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Welcome Back!
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mb-5" style={{ fontSize: 14 }}>
              Sign in to continue your fitness journey
            </Text>

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
            <View className="mb-4 mx-1">
              <View
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 flex-row items-center rounded-xl"
                style={{ height: 50 }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary[500]} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
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

            {/* Login Button - Squircle with Margin */}
            <TouchableOpacity
              onPress={handleLogin}
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
                <Text className="text-white font-bold" style={{ fontSize: 16 }}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider - Compact */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <Text className="px-3 text-gray-400 dark:text-gray-500" style={{ fontSize: 13 }}>or</Text>
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </View>

            {/* Guest Button - Squircle with Margin */}
            <TouchableOpacity
              onPress={handleGuestLogin}
              disabled={isLoading}
              className="border-2 flex-row items-center justify-center mx-1 rounded-xl"
              style={{ 
                borderColor: colors.primary[300],
                opacity: isLoading ? 0.6 : 1,
                height: 50,
              }}
            >
              <MaterialCommunityIcons name="run-fast" size={20} color={colors.primary[500]} />
              <Text className="font-bold ml-2" style={{ color: colors.primary[500], fontSize: 16 }}>
                Continue as Guest
              </Text>
            </TouchableOpacity>

            {/* Footer - Compact */}
            <View className="items-center mt-5">
              <Text className="text-gray-500 dark:text-gray-400" style={{ fontSize: 13 }}>
                Don't have an account?{' '}
                <Text 
                  className="font-bold" 
                  style={{ color: colors.primary[500] }}
                  onPress={handleSignupPress}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
