/**
 * Card Component
 *
 * A flexible card container with multiple variants and sub-components.
 *
 * @example
 * // Basic card
 * <Card>
 *   <CardHeader title="Profile" subtitle="User settings" />
 *   <CardBody>Content here</CardBody>
 *   <CardFooter>
 *     <Button>Save</Button>
 *   </CardFooter>
 * </Card>
 *
 * @example
 * // Pressable card with shadow
 * <Card variant="elevated" pressable onPress={handlePress}>
 *   <Text>Tap me</Text>
 * </Card>
 *
 * Props:
 * - variant: 'default' | 'flat' | 'elevated' | 'outlined'
 * - padding: 'none' | 'sm' | 'md' | 'lg'
 * - pressable: boolean - Makes card tappable
 * - onPress: () => void - Press handler (requires pressable)
 */

import React, { useCallback } from 'react';
import {
  View,
  Pressable,
  Text,
  ViewProps,
  AccessibilityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = 'default' | 'flat' | 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends ViewProps, AccessibilityProps {
  /** Card content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Makes card pressable */
  pressable?: boolean;
  /** Press handler (requires pressable) */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Additional class names */
  className?: string;
  /** Test ID for testing */
  testID?: string;
}

export interface CardHeaderProps {
  /** Title text */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Right side action element */
  action?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export interface CardBodyProps {
  /** Body content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export interface CardFooterProps {
  /** Footer content */
  children: React.ReactNode;
  /** Alignment */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Additional class names */
  className?: string;
}

// ============================================================================
// STYLE MAPPINGS
// ============================================================================

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white rounded-xl shadow-md',
  flat: 'bg-white rounded-xl border border-gray-200',
  elevated: 'bg-white rounded-xl shadow-lg',
  outlined: 'bg-transparent rounded-xl border border-gray-300',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const footerAlignStyles: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <View className={`flex-row items-center justify-between pb-3 ${className}`}>
      <View className="flex-1">
        <Text 
          className="text-lg font-semibold text-gray-900"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {action && (
        <View className="ml-3">
          {action}
        </View>
      )}
    </View>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
}) => {
  return (
    <View className={`py-2 ${className}`}>
      {children}
    </View>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = 'right',
  className = '',
}) => {
  return (
    <View 
      className={`flex-row items-center pt-3 border-t border-gray-100 ${footerAlignStyles[align]} ${className}`}
    >
      {children}
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  pressable = false,
  onPress,
  onLongPress,
  className = '',
  testID,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  // Animation values for pressable cards
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (pressable) {
      scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
    }
  }, [pressable, scale]);

  const handlePressOut = useCallback(() => {
    if (pressable) {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }
  }, [pressable, scale]);

  // Compose class names
  const containerClasses = [
    variantStyles[variant],
    paddingStyles[padding],
    className,
  ].join(' ');

  // Render pressable version
  if (pressable) {
    return (
      <AnimatedPressable
        style={animatedStyle}
        className={containerClasses}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint || 'Tap to interact'}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  // Render static version
  return (
    <View
      className={containerClasses}
      testID={testID}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </View>
  );
};

// ============================================================================
// COMPOUND COMPONENT PATTERN
// ============================================================================

interface CardComponent extends React.FC<CardProps> {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
}

const CardWithSubComponents = Card as CardComponent;
CardWithSubComponents.Header = CardHeader;
CardWithSubComponents.Body = CardBody;
CardWithSubComponents.Footer = CardFooter;

export default CardWithSubComponents;
