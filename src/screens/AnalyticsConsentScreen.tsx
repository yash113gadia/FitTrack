/**
 * Analytics Consent Screen
 * 
 * Privacy-first consent management for analytics.
 * Allows users to control what data is collected.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { Analytics, ConsentSettings } from '../services/analytics';

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsConsentScreenProps {
  onComplete?: () => void;
  showHeader?: boolean;
  isInitialSetup?: boolean;
}

interface ConsentOption {
  key: keyof Omit<ConsentSettings, 'lastUpdated' | 'version'>;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  required?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONSENT_OPTIONS: ConsentOption[] = [
  {
    key: 'analyticsEnabled',
    title: 'Usage Analytics',
    description:
      'Help us understand how you use the app. We track feature usage and app performance anonymously - never personal information.',
    icon: 'bar-chart',
  },
  {
    key: 'performanceEnabled',
    title: 'Performance Monitoring',
    description:
      'Allow us to measure app speed and responsiveness to improve your experience.',
    icon: 'speedometer',
  },
  {
    key: 'crashReportingEnabled',
    title: 'Crash Reporting',
    description:
      'Automatically report app crashes to help us fix bugs quickly. This helps make FitTrack more stable.',
    icon: 'bug',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const AnalyticsConsentScreen: React.FC<AnalyticsConsentScreenProps> = ({
  onComplete,
  showHeader = true,
  isInitialSetup = false,
}) => {
  const [consent, setConsent] = useState<ConsentSettings>(Analytics.getConsent());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load current consent settings
    const loadConsent = async () => {
      const currentConsent = await Analytics.loadConsent();
      setConsent(currentConsent);
    };
    loadConsent();
  }, []);

  const handleToggle = (key: keyof ConsentSettings, value: boolean) => {
    setConsent((prev: ConsentSettings) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await Analytics.updateConsent(consent);
    setHasChanges(false);

    if (isInitialSetup) {
      onComplete?.();
    } else {
      Alert.alert('Saved', 'Your privacy preferences have been updated.');
    }
  };

  const handleAcceptAll = async () => {
    const allEnabled: Partial<ConsentSettings> = {
      analyticsEnabled: true,
      performanceEnabled: true,
      crashReportingEnabled: true,
    };
    setConsent((prev: ConsentSettings) => ({ ...prev, ...allEnabled }));
    await Analytics.updateConsent(allEnabled);
    onComplete?.();
  };

  const handleDeclineAll = async () => {
    const allDisabled: Partial<ConsentSettings> = {
      analyticsEnabled: false,
      performanceEnabled: false,
      crashReportingEnabled: false,
    };
    setConsent((prev: ConsentSettings) => ({ ...prev, ...allDisabled }));
    await Analytics.updateConsent(allDisabled);
    onComplete?.();
  };

  const handleExportData = async () => {
    try {
      const data = await Analytics.exportUserData();
      Alert.alert(
        'Your Data',
        JSON.stringify(data, null, 2).substring(0, 500) + '...',
        [
          { text: 'OK' },
          {
            text: 'Email to Me',
            onPress: () => {
              Linking.openURL(
                `mailto:?subject=My FitTrack Analytics Data&body=${encodeURIComponent(
                  JSON.stringify(data, null, 2)
                )}`
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all analytics data associated with your device. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Analytics.deleteAllUserData();
            Alert.alert('Deleted', 'All analytics data has been deleted.');
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://fittrack.app/privacy');
  };

  return (
    <SafeAreaView style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Privacy Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={48} color={colors.primary[500]} />
          </View>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroDescription}>
            We believe in transparency. Choose what data you're comfortable sharing
            to help improve FitTrack. You can change these settings anytime.
          </Text>
        </View>

        {/* What We DON'T Collect */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="lock-closed" size={20} color={colors.success[600]} />
            <Text style={styles.infoTitle}>What we NEVER collect</Text>
          </View>
          <View style={styles.bulletList}>
            <BulletItem text="Your name, email, or contact info" />
            <BulletItem text="Your exact location" />
            <BulletItem text="Your food diary contents" />
            <BulletItem text="Photos from your camera" />
            <BulletItem text="Data from other apps" />
          </View>
        </View>

        {/* Consent Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection Preferences</Text>

          {CONSENT_OPTIONS.map((option) => (
            <View key={option.key as string} style={styles.consentCard}>
              <View style={styles.consentHeader}>
                <View style={styles.consentIconContainer}>
                  <Ionicons name={option.icon} size={24} color={colors.primary[500]} />
                </View>
                <View style={styles.consentTextContainer}>
                  <Text style={styles.consentTitle}>{option.title}</Text>
                  <Text style={styles.consentDescription}>{option.description}</Text>
                </View>
              </View>
              <Switch
                value={consent[option.key] as boolean}
                onValueChange={(value) => handleToggle(option.key, value)}
                trackColor={{
                  false: colors.gray[300],
                  true: colors.primary[200],
                }}
                thumbColor={
                  consent[option.key] ? colors.primary[500] : colors.gray[100]
                }
              />
            </View>
          ))}
        </View>

        {/* Quick Actions (for initial setup) */}
        {isInitialSetup && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.acceptAllButton}
              onPress={handleAcceptAll}
            >
              <Text style={styles.acceptAllText}>Accept All & Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDeclineAll}
            >
              <Text style={styles.declineText}>Continue Without Analytics</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Data Management */}
        {!isInitialSetup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Data</Text>

            <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
              <Ionicons name="download" size={20} color={colors.primary[500]} />
              <Text style={styles.actionButtonText}>Export My Data</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDeleteData}>
              <Ionicons name="trash" size={20} color={colors.error[500]} />
              <Text style={[styles.actionButtonText, { color: colors.error[500] }]}>
                Delete All Analytics Data
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy Policy Link */}
        <TouchableOpacity style={styles.privacyLink} onPress={handlePrivacyPolicy}>
          <Text style={styles.privacyLinkText}>Read our Privacy Policy</Text>
          <Ionicons name="open-outline" size={16} color={colors.primary[500]} />
        </TouchableOpacity>

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>
          Settings last updated: {new Date(consent.lastUpdated).toLocaleDateString()}
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button (for settings page) */}
      {!isInitialSetup && hasChanges && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const BulletItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.bulletItem}>
    <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 32,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: colors.success[50],
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success[200],
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success[700],
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    fontSize: 14,
    color: colors.success[700],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  consentCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentHeader: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 16,
  },
  consentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consentTextContainer: {
    flex: 1,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  acceptAllButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  declineText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  privacyLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  privacyLinkText: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  saveButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalyticsConsentScreen;
