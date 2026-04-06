/**
 * Navigation Type Definitions
 * 
 * Centralized type definitions for the navigation system.
 * Separated to avoid circular imports between AppNavigator and navigationRef.
 */

// ============================================================================
// STACK PARAM LISTS
// ============================================================================

/**
 * Root stack navigator param list
 */
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  LogFood: { 
    editId?: number; 
    duplicateId?: number;
    initialFood?: {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      servingSize?: string;
      barcode?: string;
    };
  };
  BarcodeScanner: undefined;
  AIScanner: undefined;
  FoodDetails: { foodId: number };
  EditReminder: { reminderId?: number };
  Settings: undefined;
  ReminderList: undefined;
  PRTracker: undefined;
  AIBodyScan: undefined;
  MyPlan: undefined;
  UserProfile: { userId: number };
};

/**
 * Main tab navigator param list
 */
export type MainTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Community: undefined;
  Chatbot: undefined;
  Profile: undefined;
};

/**
 * Combined navigation params for useNavigation hook
 */
export type NavigationParamList = RootStackParamList & MainTabParamList;

// ============================================================================
// NAVIGATION PROP TYPES
// ============================================================================

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

/**
 * Navigation prop for root stack screens
 */
export type RootStackNavigationProp<T extends keyof RootStackParamList> = 
  NativeStackNavigationProp<RootStackParamList, T>;

/**
 * Navigation prop for tab screens
 */
export type MainTabNavigationProp<T extends keyof MainTabParamList> = 
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;

/**
 * Route prop for root stack screens
 */
export type RootStackRouteProp<T extends keyof RootStackParamList> = 
  RouteProp<RootStackParamList, T>;

/**
 * Route prop for tab screens
 */
export type MainTabRouteProp<T extends keyof MainTabParamList> = 
  RouteProp<MainTabParamList, T>;

// ============================================================================
// SCREEN PROPS
// ============================================================================

/**
 * Props for LogFood screen
 */
export type LogFoodScreenProps = {
  navigation: RootStackNavigationProp<'LogFood'>;
  route: RootStackRouteProp<'LogFood'>;
};

/**
 * Props for FoodDetails screen
 */
export type FoodDetailsScreenProps = {
  navigation: RootStackNavigationProp<'FoodDetails'>;
  route: RootStackRouteProp<'FoodDetails'>;
};

/**
 * Props for EditReminder screen
 */
export type EditReminderScreenProps = {
  navigation: RootStackNavigationProp<'EditReminder'>;
  route: RootStackRouteProp<'EditReminder'>;
};

/**
 * Props for Dashboard screen
 */
export type DashboardScreenProps = {
  navigation: MainTabNavigationProp<'Dashboard'>;
  route: MainTabRouteProp<'Dashboard'>;
};

/**
 * Props for History screen
 */
export type HistoryScreenProps = {
  navigation: MainTabNavigationProp<'History'>;
  route: MainTabRouteProp<'History'>;
};

/**
 * Props for Chatbot screen
 */
export type ChatbotScreenProps = {
  navigation: MainTabNavigationProp<'Chatbot'>;
  route: MainTabRouteProp<'Chatbot'>;
};

/**
 * Props for Profile screen
 */
export type ProfileScreenProps = {
  navigation: MainTabNavigationProp<'Profile'>;
  route: MainTabRouteProp<'Profile'>;
};
