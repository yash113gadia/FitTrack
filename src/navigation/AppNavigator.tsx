/**
 * FitTrack Navigation System
 * 
 * Comprehensive navigation with:
 * - Bottom tab navigation for main screens
 * - Stack navigation for modal screens
 * - Deep linking support
 * - Onboarding flow
 * - Type-safe navigation
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, LinkingOptions, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import LogFoodScreen from '../screens/LogFoodScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import AIFoodScannerScreen from '../screens/AIFoodScannerScreen';
import AddEditReminderScreen from '../screens/AddEditReminderScreen';
import ReminderListScreen from '../screens/ReminderListScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Store and utilities
import { useAppStore } from '../store/appStore';
import { colors } from '../constants/theme';
import { navigationRef, isReadyRef } from './navigationRef';
import type { RootStackParamList, MainTabParamList } from './types';

// Re-export types for convenience
export type { RootStackParamList, MainTabParamList, NavigationParamList } from './types';

// ============================================================================
// NAVIGATOR INSTANCES
// ============================================================================

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================================================
// DEEP LINKING CONFIGURATION
// ============================================================================

// Deep linking prefix - in production, use expo-linking.createURL('/')
const prefix = 'fittrack://';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'https://fittrack.app'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          History: 'history',
          Chatbot: 'chatbot',
          Profile: 'profile',
        },
      },
      LogFood: {
        path: 'log-food/:editId?',
        parse: {
          editId: (editId: string) => parseInt(editId, 10),
        },
      },
      BarcodeScanner: 'scan-barcode',
      AIScanner: 'ai-scan',
      FoodDetails: {
        path: 'food/:foodId',
        parse: {
          foodId: (foodId: string) => parseInt(foodId, 10),
        },
      },
      EditReminder: {
        path: 'reminder/:reminderId?',
        parse: {
          reminderId: (reminderId: string) => parseInt(reminderId, 10),
        },
      },
      Settings: 'settings',
      ReminderList: 'reminders',
    },
  },
};

// ============================================================================
// NAVIGATION THEME
// ============================================================================

const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary[500],
    background: colors.background.primary,
    card: colors.background.card,
    text: colors.text.primary,
    border: colors.gray[200],
    notification: colors.error[500],
  },
};

const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary[400],
    background: colors.gray[900],
    card: colors.gray[800],
    text: colors.white,
    border: colors.gray[700],
    notification: colors.error[500],
  },
};

// ============================================================================
// SCREEN OPTIONS
// ============================================================================

const defaultStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.primary[500],
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '600',
  },
  animation: 'slide_from_right',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

const modalScreenOptions: NativeStackNavigationOptions = {
  ...defaultStackScreenOptions,
  presentation: 'modal',
  animation: 'slide_from_bottom',
  gestureDirection: 'vertical',
};

// ============================================================================
// LOADING / SPLASH SCREEN
// ============================================================================

const SplashScreen: React.FC = () => (
  <View style={styles.splashContainer}>
    <View style={styles.splashContent}>
      <Ionicons name="fitness" size={80} color={colors.primary[500]} />
      <Text style={styles.splashTitle}>FitTrack</Text>
      <Text style={styles.splashSubtitle}>Your Nutrition Companion</Text>
      <ActivityIndicator 
        size="large" 
        color={colors.primary[500]} 
        style={styles.splashLoader}
      />
    </View>
  </View>
);

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary[500]} />
  </View>
);

// OnboardingScreen is imported from screens/OnboardingScreen

// ============================================================================
// SETTINGS SCREEN (Placeholder)
// ============================================================================

const SettingsScreen: React.FC = () => (
  <View style={styles.settingsContainer}>
    <Text style={styles.settingsTitle}>Settings</Text>
    <Text style={styles.settingsSubtitle}>Coming soon...</Text>
  </View>
);

// ============================================================================
// FOOD DETAILS SCREEN (Placeholder)
// ============================================================================

const FoodDetailsScreen: React.FC<{ route: any }> = ({ route }) => {
  const { foodId } = route.params;
  
  return (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Food Details</Text>
      <Text style={styles.settingsSubtitle}>Food ID: {foodId}</Text>
    </View>
  );
};

// ============================================================================
// TAB BAR ICON COMPONENT
// ============================================================================

interface TabBarIconProps {
  route: { name: keyof MainTabParamList };
  focused: boolean;
  color: string;
  size: number;
}

const getTabBarIcon = ({ route, focused, color, size }: TabBarIconProps): React.ReactNode => {
  const iconMap: Record<keyof MainTabParamList, { active: string; inactive: string }> = {
    Dashboard: { active: 'home', inactive: 'home-outline' },
    History: { active: 'time', inactive: 'time-outline' },
    Chatbot: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
  };

  const icons = iconMap[route.name];
  const iconName = (focused ? icons.active : icons.inactive) as keyof typeof Ionicons.glyphMap;

  return <Ionicons name={iconName} size={size} color={color} />;
};

// ============================================================================
// MAIN TAB NAVIGATOR
// ============================================================================

const MainTabs: React.FC = () => {
  // Get unread messages count from store for badge
  const unreadMessages = useAppStore((state) => state.unreadMessages ?? 0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: (props) => getTabBarIcon({ route, ...props }),
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: isDark ? colors.gray[400] : colors.gray[400],
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 16,
          left: 20,
          right: 20,
          backgroundColor: isDark ? colors.gray[800] : colors.background.card,
          borderRadius: 32,
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
          height: 72,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          tabBarLabel: 'Home',
          tabBarTestID: 'dashboard-tab',
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ 
          tabBarLabel: 'History',
          tabBarTestID: 'history-tab',
        }}
      />
      <Tab.Screen 
        name="Chatbot" 
        component={ChatbotScreen}
        options={{ 
          tabBarLabel: 'Coach',
          tabBarTestID: 'chatbot-tab',
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.error[500],
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: 'Profile',
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tab.Navigator>
  );
};

// ============================================================================
// ROOT NAVIGATOR / APP NAVIGATOR
// ============================================================================

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const user = useAppStore((state) => state.user);
  const isOnboarded = !!user;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Simulate initial app loading / data fetching
    const initializeApp = async () => {
      try {
        // Add any async initialization here (e.g., loading cached data)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle navigation ready state
  const onReady = useCallback(() => {
    isReadyRef.current = true;
  }, []);

  // Handle navigation state change for analytics
  const onStateChange = useCallback(() => {
    // You can add analytics tracking here
    // const currentRoute = navigationRef.getCurrentRoute();
    // trackScreenView(currentRoute?.name);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          theme={isDark ? DarkNavigationTheme : LightNavigationTheme}
          fallback={<LoadingScreen />}
          onReady={onReady}
          onStateChange={onStateChange}
      >
        <Stack.Navigator
          initialRouteName={isOnboarded ? 'MainTabs' : 'Onboarding'}
          screenOptions={defaultStackScreenOptions}
        >
          {/* Onboarding - only show if not onboarded */}
          {!isOnboarded && (
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          )}
          
          {/* Main Tab Navigator */}
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          
          {/* Log Food Screen - Modal */}
          <Stack.Screen 
            name="LogFood" 
            component={LogFoodScreen}
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
          
          {/* Barcode Scanner - Full Screen */}
          <Stack.Screen 
            name="BarcodeScanner" 
            component={BarcodeScannerScreen}
            options={{ 
              title: 'Scan Barcode',
              headerShown: false,
              animation: 'fade',
            }}
          />
          
          {/* AI Food Scanner - Full Screen */}
          <Stack.Screen 
            name="AIScanner" 
            component={AIFoodScannerScreen}
            options={{ 
              title: 'AI Food Scanner',
              headerShown: false,
              animation: 'fade',
            }}
          />
          
          {/* Food Details */}
          <Stack.Screen 
            name="FoodDetails" 
            component={FoodDetailsScreen}
            options={{ 
              title: 'Food Details',
              animation: 'slide_from_right',
            }}
          />
          
          {/* Edit Reminder - Modal */}
          <Stack.Screen 
            name="EditReminder" 
            component={AddEditReminderScreen}
            options={{ 
              title: 'Edit Reminder',
              ...modalScreenOptions,
            }}
          />
          
          {/* Settings */}
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              title: 'Settings',
              animation: 'slide_from_right',
            }}
          />
          
          {/* Reminder List */}
          <Stack.Screen 
            name="ReminderList" 
            component={ReminderListScreen}
            options={{ 
              title: 'Reminders',
              animation: 'slide_from_right',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginTop: 16,
  },
  splashSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
  },
  splashLoader: {
    marginTop: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  settingsSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
  },
});

export default AppNavigator;
