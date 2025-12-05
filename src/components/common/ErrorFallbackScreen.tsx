/**
 * Error Fallback Screen
 * 
 * A dedicated full-screen error display for fatal errors
 * with options to restart, report, or get help.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Clipboard,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { ErrorLogger } from '../../services/errorLogging';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorFallbackScreenProps {
  error: Error | null;
  resetError?: () => void;
  isFatal?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ErrorFallbackScreen: React.FC<ErrorFallbackScreenProps> = ({
  error,
  resetError,
  isFatal = false,
}) => {
  const handleRestart = () => {
    if (resetError) {
      resetError();
    } else {
      // In a real app, you'd use react-native-restart or Updates.reloadAsync()
      Alert.alert(
        'Restart Required',
        'Please close and reopen the app to continue.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleReportError = async () => {
    try {
      const logs = await ErrorLogger.exportLogs();
      const errorSummary = error
        ? `Error: ${error.name}\nMessage: ${error.message}`
        : 'Unknown error';

      // Option 1: Copy to clipboard
      Clipboard.setString(`${errorSummary}\n\nRecent logs:\n${logs}`);
      Alert.alert(
        'Error Report Copied',
        'Error details have been copied to your clipboard. You can paste them in an email to support.',
        [
          {
            text: 'Send Email',
            onPress: () =>
              Linking.openURL(
                `mailto:support@fittrack.app?subject=FitTrack Error Report&body=${encodeURIComponent(
                  errorSummary
                )}`
              ),
          },
          { text: 'OK' },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to generate error report');
    }
  };

  const handleGetHelp = () => {
    Linking.openURL('https://fittrack.app/help');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={isFatal ? 'skull' : 'bug'}
              size={48}
              color={colors.error[500]}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isFatal ? 'App Crashed' : 'Oops! Something went wrong'}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {isFatal
            ? "We're sorry, but the app encountered a critical error and needs to restart."
            : "Don't worry, we've logged this error and our team will look into it."}
        </Text>

        {/* Error Details (if available) */}
        {error && __DEV__ && (
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons name="code-slash" size={16} color={colors.error[600]} />
              <Text style={styles.errorType}>{error.name}</Text>
            </View>
            <Text style={styles.errorMessage} numberOfLines={3}>
              {error.message}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRestart}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {isFatal ? 'Restart App' : 'Try Again'}
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReportError}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={18} color={colors.primary[500]} />
              <Text style={styles.secondaryButtonText}>Report Error</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGetHelp}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle" size={18} color={colors.primary[500]} />
              <Text style={styles.secondaryButtonText}>Get Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <Text style={styles.version}>
          FitTrack v1.0.0 • {Platform.OS} {Platform.Version}
        </Text>
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.error[200],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  errorCard: {
    backgroundColor: colors.error[50],
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error[200],
    marginBottom: 32,
    width: '100%',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error[700],
  },
  errorMessage: {
    fontSize: 13,
    color: colors.error[600],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  secondaryButtonText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
  version: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: colors.text.muted,
  },
});

export default ErrorFallbackScreen;
