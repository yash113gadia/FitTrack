import React from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/theme';
import { CommonActions } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from 'nativewind';
import { navigationRef } from '../../navigation/navigationRef';
import { useAppStore } from '../../store/appStore';

// Storage key for dark mode - must match App.tsx
const DARK_MODE_KEY = '@fittrack_dark_mode';

interface SettingsSectionProps {
  onExportData: () => void;
  onClearData: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  onExportData,
  onClearData,
}) => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const logout = useAppStore((state) => state.logout);

  // Navigation helper using ref instead of hook (avoids context issues)
  const navigateTo = (screenName: string) => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(CommonActions.navigate({ name: screenName }));
    }
  };

  // Load notification permission status
  React.useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    })();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsEnabled(true);
        Alert.alert('Success', 'Notifications enabled! Set up reminders to stay on track.');
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert('Disabled', 'Notifications have been turned off.');
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    console.log('[Settings] Dark mode toggle:', value, 'Current:', colorScheme);
    const newScheme = value ? 'dark' : 'light';
    
    // Save preference to AsyncStorage FIRST
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, newScheme);
      console.log('[Settings] Saved color scheme to storage:', newScheme);
    } catch (error) {
      console.error('[Settings] Failed to save color scheme:', error);
    }
    
    // Then apply the color scheme change
    setColorScheme(newScheme);
    console.log('[Settings] Set color scheme to:', newScheme);
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Multiple language support coming soon!');
  };

  const handleAbout = () => {
    Alert.alert(
      'About Whole Fit',
      'Whole Fit - Your personal nutrition tracking companion\n\nVersion 1.0.0\n\nTrack your meals, monitor your macros, and achieve your fitness goals with ease.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. Whole Fit stores all your data locally on your device. We do not collect, share, or sell your personal information.\n\nFor the full privacy policy, visit our website.',
      [{ text: 'OK' }]
    );
  };

  const handleRateApp = async () => {
    // For iOS App Store rating
    const appStoreUrl = 'https://apps.apple.com/app/id123456789'; // Replace with actual App Store ID
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.yourcompany.fittrack';
    
    Alert.alert(
      'Rate Whole Fit',
      'Enjoying Whole Fit? Please rate us on the App Store!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Rate Now', 
          onPress: () => {
            // In production, this would open the app store
            Alert.alert('Thank you!', 'App Store rating will be available after app is published.');
          }
        }
      ]
    );
  };

  const handlePremium = () => {
    Alert.alert(
      'Premium Features',
      '🌟 Unlock Premium Features:\n\n• AI-Powered Meal Planning\n• Advanced Analytics & Insights\n• Custom Macro Goals\n• Export to PDF\n• Priority Support\n\nComing Soon!',
      [{ text: 'OK' }]
    );
  };

  const renderItem = (icon: any, title: string, rightElement?: React.ReactNode, onPress?: () => void, color: string = colors.gray[700]) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700"
    >
      <View className="flex-row items-center">
        <View className="w-8 items-center mr-3">
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text className="text-base text-gray-900 dark:text-white">{title}</Text>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />}
    </TouchableOpacity>
  );

  return (
    <View className="bg-white dark:bg-gray-800 p-4 rounded-[24px] shadow-sm mb-4">
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">Settings</Text>
      
      {/* Premium Banner */}
      <TouchableOpacity 
        onPress={handlePremium}
        activeOpacity={0.85}
        style={{
          borderRadius: 14,
          marginBottom: 16,
          shadowColor: '#5B21B6',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={['#7C3AED', '#6D28D9', '#5B21B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
              Upgrade to Premium
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
              Unlock AI Meal Plans & Advanced Stats
            </Text>
          </View>
          <View 
            style={{ 
              width: 40, 
              height: 40, 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="diamond" size={22} color="white" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* App Settings */}
      <Text className="text-xs font-bold text-gray-400 uppercase mt-2 mb-1">Preferences</Text>
      {renderItem('moon-outline', 'Dark Mode', (
        <Switch 
          value={colorScheme === 'dark'} 
          onValueChange={handleDarkModeToggle}
          trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
        />
      ), () => handleDarkModeToggle(colorScheme !== 'dark'))}
      {renderItem('notifications-outline', 'Notifications', (
        <Switch 
          value={notificationsEnabled} 
          onValueChange={handleNotificationToggle}
          trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
        />
      ), () => handleNotificationToggle(!notificationsEnabled))}
      {renderItem('alarm-outline', 'Manage Reminders', null, () => navigateTo('ReminderList'))}
      {renderItem('language-outline', 'Language', <Text className="text-gray-500">English</Text>, handleLanguage)}

      {/* Data Management */}
      <Text className="text-xs font-bold text-gray-400 uppercase mt-4 mb-1">Data</Text>
      {renderItem('download-outline', 'Export Data', null, onExportData)}
      {renderItem('trash-outline', 'Clear All Data', null, () => {
        Alert.alert(
          'Clear Data & Logout',
          'Are you sure you want to delete all your data and logout? This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete & Logout', 
              style: 'destructive', 
              onPress: async () => {
                // First clear the data
                await onClearData();
                // Then logout (this will reset auth state and return to login)
                await logout();
                Alert.alert('Logged Out', 'All data has been cleared and you have been logged out.');
              }
            }
          ]
        );
      }, colors.error[500])}

      {/* About */}
      <Text className="text-xs font-bold text-gray-400 uppercase mt-4 mb-1">About</Text>
      {renderItem('information-circle-outline', 'About Whole Fit', null, handleAbout)}
      {renderItem('document-text-outline', 'Privacy Policy', null, handlePrivacyPolicy)}
      {renderItem('star-outline', 'Rate App', null, handleRateApp)}
      
      <View className="mt-4 items-center">
        <Text className="text-xs text-gray-400">Version 1.0.0</Text>
      </View>
    </View>
  );
};
