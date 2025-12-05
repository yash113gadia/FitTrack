/**
 * ListItem Component
 *
 * A reusable list item with icon, title, subtitle, and action support.
 *
 * @example
 * // Basic usage
 * <ListItem
 *   title="Account Settings"
 *   subtitle="Manage your account"
 *   leftIcon={<Ionicons name="settings" size={24} />}
 *   onPress={() => navigate('settings')}
 * />
 *
 * @example
 * // With right action
 * <ListItem
 *   title="Notifications"
 *   rightElement={<Switch value={enabled} onValueChange={setEnabled} />}
 * />
 *
 * Props:
 * - title: string - Main title text
 * - subtitle: string - Secondary text
 * - leftIcon: ReactNode - Icon on left
 * - leftElement: ReactNode - Custom left element
 * - rightElement: ReactNode - Custom right element (e.g., switch, badge)
 * - onPress: () => void - Press handler
 * - showChevron: boolean - Show right chevron
 * - disabled: boolean - Disabled state
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export interface ListItemProps {
  /** Main title */
  title: string;
  /** Secondary text */
  subtitle?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Custom left element (overrides leftIcon) */
  leftElement?: React.ReactNode;
  /** Custom right element */
  rightElement?: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Show right chevron */
  showChevron?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Compact size */
  compact?: boolean;
  /** Show bottom border */
  showBorder?: boolean;
  /** Custom title style */
  titleClassName?: string;
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  leftElement,
  rightElement,
  onPress,
  onLongPress,
  showChevron = false,
  disabled = false,
  compact = false,
  showBorder = true,
  titleClassName = '',
  className = '',
  testID,
}) => {
  // Animation for press feedback
  const backgroundColor = useSharedValue('transparent');

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  const handlePressIn = useCallback(() => {
    if (!disabled && onPress) {
      backgroundColor.value = withTiming(colors.gray[100], { duration: 100 });
    }
  }, [disabled, onPress, backgroundColor]);

  const handlePressOut = useCallback(() => {
    backgroundColor.value = withTiming('transparent', { duration: 200 });
  }, [backgroundColor]);

  const isInteractive = !!onPress && !disabled;

  // Render left content
  const renderLeft = () => {
    if (leftElement) return leftElement;
    if (leftIcon) {
      return (
        <View className="mr-3 items-center justify-center">
          {leftIcon}
        </View>
      );
    }
    return null;
  };

  const content = (
    <>
      {/* Left */}
      {renderLeft()}

      {/* Center (title + subtitle) */}
      <View className="flex-1 justify-center">
        <Text
          className={`text-base text-gray-900 ${disabled ? 'text-gray-400' : ''} ${titleClassName}`}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            className={`text-sm text-gray-500 mt-0.5 ${disabled ? 'text-gray-300' : ''}`}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right */}
      {rightElement && (
        <View className="ml-3">
          {rightElement}
        </View>
      )}

      {/* Chevron */}
      {showChevron && !rightElement && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={disabled ? colors.gray[300] : colors.gray[400]}
        />
      )}
    </>
  );

  // Base classes
  const baseClasses = `
    flex-row items-center bg-white
    ${compact ? 'py-2 px-3' : 'py-4 px-4'}
    ${showBorder ? 'border-b border-gray-100' : ''}
    ${disabled ? 'opacity-60' : ''}
    ${className}
  `;

  // Render pressable or static
  if (isInteractive) {
    return (
      <AnimatedPressable
        style={animatedStyle}
        className={baseClasses}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle}
        accessibilityState={{ disabled }}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View
      className={baseClasses}
      testID={testID}
      accessible={true}
      accessibilityLabel={title}
    >
      {content}
    </View>
  );
};

// ============================================================================
// LIST SECTION HEADER
// ============================================================================

export interface ListSectionProps {
  /** Section title */
  title: string;
  /** Right action */
  action?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export const ListSection: React.FC<ListSectionProps> = ({
  title,
  action,
  className = '',
}) => {
  return (
    <View className={`flex-row items-center justify-between px-4 py-2 bg-gray-50 ${className}`}>
      <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </Text>
      {action}
    </View>
  );
};

// ============================================================================
// LIST SEPARATOR
// ============================================================================

export const ListSeparator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <View className={`h-px bg-gray-200 ml-4 ${className}`} />
);

export default ListItem;
