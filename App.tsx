import './src/global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import AppNavigator from './src/navigation/AppNavigator';
import { databaseService } from './src/services/database';
import { ErrorLogger } from './src/services/errorLogging';
import { setupGlobalErrorHandler } from './src/services/globalErrorHandler';
import { initNetworkErrorHandling } from './src/services/networkErrorHandling';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import ErrorFallbackScreen from './src/components/common/ErrorFallbackScreen';
import { ToastProvider } from './src/components/common/Toast';
import { colors } from './src/constants/theme';

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

  console.log('[App] Rendering App component. isInitialized:', isInitialized, 'initError:', initError);

  useEffect(() => {
    const initializeApp = async () => {
      try {
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
        <Text style={styles.loadingText}>Loading FitTrack...</Text>
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
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

// Separate component to use hooks inside ToastProvider
function AppContent() {
  const { colorScheme } = useColorScheme();
  
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