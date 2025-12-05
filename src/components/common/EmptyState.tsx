/**
 * EmptyState Component
 *
 * A component for displaying empty state scenarios with icon, title, subtitle, and action.
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   icon={<Ionicons name="restaurant-outline" size={64} />}
 *   title="No meals logged"
 *   subtitle="Start tracking your nutrition by logging your first meal"
 *   actionLabel="Log Food"
 *   onAction={() => navigate('LogFood')}
 * />
 *
 * @example
 * // Minimal variant
 * <EmptyState
 *   title="No results"
 *   subtitle="Try a different search term"
 *   variant="minimal"
 * />
 *
 * Props:
 * - icon: ReactNode - Illustration or icon
 * - title: string - Main title
 * - subtitle: string - Description text
 * - actionLabel: string - Action button text
 * - onAction: () => void - Action button handler
 * - secondaryActionLabel: string - Secondary action text
 * - onSecondaryAction: () => void - Secondary action handler
 * - variant: 'default' | 'minimal' | 'illustrated'
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { Button } from './Button';

// ============================================================================
// TYPES
// ============================================================================

export type EmptyStateVariant = 'default' | 'minimal' | 'illustrated';

export interface EmptyStateProps {
  /** Icon or illustration */
  icon?: React.ReactNode;
  /** Icon name (Ionicons) - alternative to icon prop */
  iconName?: string;
  /** Main title */
  title: string;
  /** Description text */
  subtitle?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action handler */
  onAction?: () => void;
  /** Secondary action label */
  secondaryActionLabel?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// PRESET EMPTY STATES
// ============================================================================

export const emptyStatePresets = {
  noFood: {
    iconName: 'restaurant-outline',
    title: 'No meals logged yet',
    subtitle: 'Start tracking your nutrition by logging your first meal',
    actionLabel: 'Log Food',
  },
  noResults: {
    iconName: 'search-outline',
    title: 'No results found',
    subtitle: 'Try adjusting your search or filters',
  },
  noHistory: {
    iconName: 'time-outline',
    title: 'No history yet',
    subtitle: 'Your logged meals will appear here',
  },
  noReminders: {
    iconName: 'notifications-outline',
    title: 'No reminders set',
    subtitle: 'Create reminders to stay on track with your nutrition goals',
    actionLabel: 'Add Reminder',
  },
  error: {
    iconName: 'alert-circle-outline',
    title: 'Something went wrong',
    subtitle: 'Please try again or contact support if the problem persists',
    actionLabel: 'Try Again',
  },
  offline: {
    iconName: 'cloud-offline-outline',
    title: 'You\'re offline',
    subtitle: 'Check your internet connection and try again',
    actionLabel: 'Retry',
  },
  noStreak: {
    iconName: 'flame-outline',
    title: 'Start your streak!',
    subtitle: 'Meet your daily goals to build a streak',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconName,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  className = '',
  testID,
}) => {
  // Determine icon to render
  const renderIcon = () => {
    if (icon) return icon;
    if (iconName) {
      const iconSize = variant === 'minimal' ? 48 : 64;
      const iconColor = variant === 'minimal' ? colors.gray[400] : colors.gray[300];
      
      return (
        <View className={`
          items-center justify-center rounded-full mb-4
          ${variant === 'minimal' ? '' : 'w-24 h-24 bg-gray-100'}
        `}>
          <Ionicons
            name={iconName as any}
            size={iconSize}
            color={iconColor}
          />
        </View>
      );
    }
    return null;
  };

  // Variant-specific styles
  const variantStyles = {
    default: {
      container: 'py-12 px-6',
      title: 'text-xl font-semibold text-gray-900',
      subtitle: 'text-base text-gray-500',
    },
    minimal: {
      container: 'py-8 px-4',
      title: 'text-base font-medium text-gray-700',
      subtitle: 'text-sm text-gray-500',
    },
    illustrated: {
      container: 'py-16 px-8',
      title: 'text-2xl font-bold text-gray-900',
      subtitle: 'text-base text-gray-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <View
      className={`items-center justify-center ${styles.container} ${className}`}
      testID={testID}
      accessible={true}
      accessibilityLabel={`${title}. ${subtitle || ''}`}
    >
      {/* Icon */}
      {renderIcon()}

      {/* Title */}
      <Text
        className={`text-center ${styles.title} ${variant !== 'minimal' ? 'mt-2' : ''}`}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text className={`text-center mt-2 max-w-xs ${styles.subtitle}`}>
          {subtitle}
        </Text>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <View className="mt-6 items-center">
          {actionLabel && onAction && (
            <Button
              variant="primary"
              onPress={onAction}
              size={variant === 'minimal' ? 'sm' : 'md'}
            >
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="ghost"
              onPress={onSecondaryAction}
              className="mt-2"
              size={variant === 'minimal' ? 'sm' : 'md'}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================================================
// PRESET COMPONENTS
// ============================================================================

interface PresetEmptyStateProps {
  onAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyFoodLog: React.FC<PresetEmptyStateProps> = (props) => (
  <EmptyState
    {...emptyStatePresets.noFood}
    {...props}
  />
);

export const EmptySearchResults: React.FC<PresetEmptyStateProps> = (props) => (
  <EmptyState
    {...emptyStatePresets.noResults}
    variant="minimal"
    {...props}
  />
);

export const EmptyHistory: React.FC<PresetEmptyStateProps> = (props) => (
  <EmptyState
    {...emptyStatePresets.noHistory}
    {...props}
  />
);

export const ErrorState: React.FC<PresetEmptyStateProps> = (props) => (
  <EmptyState
    {...emptyStatePresets.error}
    {...props}
  />
);

export const OfflineState: React.FC<PresetEmptyStateProps> = (props) => (
  <EmptyState
    {...emptyStatePresets.offline}
    {...props}
  />
);

export default EmptyState;
