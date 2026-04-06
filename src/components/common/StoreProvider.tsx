import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAppStore, initializeStore, useIsHydrated } from '../../store/appStore';
import { databaseService } from '../../services/database';
import { colors } from '../../constants/theme';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isHydrated = useIsHydrated();

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize database first
        await databaseService.initDatabase();
        
        // Then initialize store data
        await initializeStore();
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError((err as Error).message);
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-8">
        <Text className="text-error-600 text-lg font-bold text-center">
          Failed to initialize app
        </Text>
        <Text className="text-gray-500 text-center mt-2">{error}</Text>
      </View>
    );
  }

  if (!isInitialized || !isHydrated) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text className="text-gray-500 mt-4">Loading Whole Fit...</Text>
      </View>
    );
  }

  return <>{children}</>;
};
