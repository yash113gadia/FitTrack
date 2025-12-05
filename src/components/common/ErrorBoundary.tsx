/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child component tree and displays
 * a fallback UI instead of crashing the whole app.
 */

import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { ErrorLogger } from '../../services/errorLogging';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showStack: boolean;
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log to error service
    ErrorLogger.logComponentError(
      this.props.componentName || 'Unknown',
      error,
      errorInfo
    );

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    });
  };

  handleCopyError = (): void => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.name || 'Unknown'}
Message: ${error?.message || 'No message'}
Stack: ${error?.stack || 'No stack trace'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}
    `.trim();

    Clipboard.setString(errorText);
    Alert.alert('Copied', 'Error details copied to clipboard');
  };

  toggleStack = (): void => {
    this.setState((prev) => ({ showStack: !prev.showStack }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showStack } = this.state;
    const { children, fallback, showDetails = __DEV__ } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={64} color={colors.error[500]} />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorName}>{error.name}</Text>
                <Text style={styles.errorMessage}>{error.message}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleRetry}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {showDetails && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={this.toggleStack}
                >
                  <Ionicons
                    name={showStack ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.secondary}
                  />
                  <Text style={styles.secondaryButtonText}>
                    {showStack ? 'Hide Details' : 'Show Details'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showDetails && showStack && (
              <View style={styles.stackContainer}>
                <View style={styles.stackHeader}>
                  <Text style={styles.stackTitle}>Error Details</Text>
                  <TouchableOpacity
                    onPress={this.handleCopyError}
                    style={styles.copyButton}
                  >
                    <Ionicons name="copy" size={16} color={colors.primary[500]} />
                    <Text style={styles.copyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.stackScroll}>
                  {error?.stack && (
                    <>
                      <Text style={styles.stackLabel}>Stack Trace:</Text>
                      <Text style={styles.stackText}>{error.stack}</Text>
                    </>
                  )}
                  {errorInfo?.componentStack && (
                    <>
                      <Text style={styles.stackLabel}>Component Stack:</Text>
                      <Text style={styles.stackText}>
                        {errorInfo.componentStack}
                      </Text>
                    </>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return children;
  }
}

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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: colors.error[50],
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error[200],
    marginBottom: 24,
    width: '100%',
  },
  errorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.error[700],
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.error[600],
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  stackContainer: {
    marginTop: 24,
    width: '100%',
    maxHeight: 300,
    backgroundColor: colors.gray[900],
    borderRadius: 12,
    overflow: 'hidden',
  },
  stackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[300],
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    color: colors.primary[500],
  },
  stackScroll: {
    padding: 12,
  },
  stackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[400],
    marginTop: 8,
    marginBottom: 4,
  },
  stackText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.gray[300],
    lineHeight: 16,
  },
});

export default ErrorBoundary;
