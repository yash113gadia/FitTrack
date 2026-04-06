import './src/global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { cssInterop } from 'react-native-css-interop';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { databaseService } from './src/services/database';
import { ErrorLogger } from './src/services/errorLogging';
import { setupGlobalErrorHandler } from './src/services/globalErrorHandler';
import { initNetworkErrorHandling } from './src/services/networkErrorHandling';
import { notificationService } from './src/services/notifications';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import ErrorFallbackScreen from './src/components/common/ErrorFallbackScreen';
import { ToastProvider } from './src/components/common/Toast';
import { colors } from './src/constants/theme';

// Storage key for dark mode preference
const DARK_MODE_KEY = '@fittrack_dark_mode';

// Disable react-native-css-interop upgrade warnings that cause navigation context errors
if (__DEV__) {
  // @ts-ignore - Suppress the upgrade warnings that cause serialization issues with navigation
  cssInterop.warnOnce = () => {};
}

// Set up global error handler as early as possible
setupGlobalErrorHandler({
  showAlertOnFatal: true,
  enableRestartOnFatal: !__DEV__,
  customHandler: (error, isFatal) => {
    // Add any custom error handling here
    console.log('Global error caught:', error.message, 'Fatal:', isFatal);
  },
});

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [savedColorScheme, setSavedColorScheme] = useState<'light' | 'dark' | null>(null);

  console.log('[App] Rendering App component. isInitialized:', isInitialized, 'initError:', initError);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load saved dark mode preference FIRST (before other init)
        const savedMode = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (savedMode === 'dark' || savedMode === 'light') {
          setSavedColorScheme(savedMode);
          console.log('[App] Loaded saved color scheme:', savedMode);
        } else {
          setSavedColorScheme('light'); // Default to light
        }

        // Initialize error logging first
        await ErrorLogger.init({
          enableConsoleLogging: __DEV__,
          enableLocalStorage: true,
          enableRemoteLogging: !__DEV__,
          minLogLevel: __DEV__ ? 'debug' : 'warn',
        });

        ErrorLogger.logInfo('App initialization started');

        // Initialize network error handling
        await initNetworkErrorHandling();

        // Initialize database
        await databaseService.initDatabase();
        ErrorLogger.logInfo('Database initialized');

        // Initialize notifications
        await notificationService.initialize();
        ErrorLogger.logInfo('Notifications initialized');

        setIsInitialized(true);
        ErrorLogger.logInfo('App initialization complete');
      } catch (error) {
        const err = error as Error;
        ErrorLogger.logFatal(err, { context: 'App initialization' });
        setInitError(err);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (!isInitialized && !initError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading Whole Fit...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <ErrorFallbackScreen
        error={initError}
        isFatal
        resetError={() => {
          setInitError(null);
          setIsInitialized(false);
        }}
      />
    );
  }

  return (
    <ErrorBoundary
      componentName="App"
      fallback={<ErrorFallbackScreen error={null} isFatal />}
    >
      <ToastProvider>
        <AppContent initialColorScheme={savedColorScheme} />
      </ToastProvider>
    </ErrorBoundary>
  );
}

// Separate component to use hooks inside ToastProvider
function AppContent({ initialColorScheme }: { initialColorScheme: 'light' | 'dark' | null }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  
  // Apply saved color scheme on mount
  useEffect(() => {
    if (initialColorScheme && initialColorScheme !== colorScheme) {
      console.log('[AppContent] Applying saved color scheme:', initialColorScheme);
      setColorScheme(initialColorScheme);
    }
  }, [initialColorScheme]);
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
});