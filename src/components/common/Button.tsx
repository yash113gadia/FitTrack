/**
 * Button Component
 *
 * A customizable button component with multiple variants, sizes, and states.
 *
 * @example
 * // Primary button
 * <Button variant="primary" onPress={handlePress}>Submit</Button>
 *
 * @example
 * // Loading button with icon
 * <Button variant="secondary" loading icon={<CheckIcon />}>Save</Button>
 *
 * @example
 * // Full width outline button
 * <Button variant="outline" fullWidth size="lg">Continue</Button>
 *
 * Props:
 * - variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
 * - size: 'sm' | 'md' | 'lg'
 * - loading: boolean - Shows loading spinner
 * - disabled: boolean - Disables the button
 * - icon: ReactNode - Icon to display (left side by default)
 * - iconPosition: 'left' | 'right' - Position of the icon
 * - fullWidth: boolean - Makes button full width
 * - onPress: () => void - Press handler
 * - accessibilityLabel: string - Screen reader label
 * - accessibilityHint: string - Screen reader hint
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  AccessibilityProps,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends AccessibilityProps {
  /** Button text content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Shows loading spinner and disables button */
  loading?: boolean;
  /** Disables the button */
  disabled?: boolean;
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
  /** Makes button full width */
  fullWidth?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Additional class names */
  className?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// STYLE MAPPINGS
// ============================================================================

const variantStyles: Record<ButtonVariant, { container: string; text: string; pressedBg: string }> = {
  primary: {
    container: 'bg-primary-500',
    text: 'text-white',
    pressedBg: 'bg-primary-600',
  },
  secondary: {
    container: 'bg-gray-200',
    text: 'text-gray-800',
    pressedBg: 'bg-gray-300',
  },
  outline: {
    container: 'bg-transparent border-2 border-primary-500',
    text: 'text-primary-500',
    pressedBg: 'bg-primary-50',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-primary-500',
    pressedBg: 'bg-gray-100',
  },
  danger: {
    container: 'bg-error-500',
    text: 'text-white',
    pressedBg: 'bg-error-600',
  },
  success: {
    container: 'bg-success-500',
    text: 'text-white',
    pressedBg: 'bg-success-600',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; iconSize: number }> = {
  sm: {
    container: 'py-2 px-3 min-h-[32px]',
    text: 'text-sm',
    iconSize: 16,
  },
  md: {
    container: 'py-3 px-4 min-h-[44px]',
    text: 'text-base',
    iconSize: 20,
  },
  lg: {
    container: 'py-4 px-6 min-h-[56px]',
    text: 'text-lg',
    iconSize: 24,
  },
};

const disabledStyles = {
  container: 'bg-gray-300 border-gray-300',
  text: 'text-gray-500',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onPress,
  onLongPress,
  className = '',
  testID,
  accessibilityLabel,
  accessibilityHint,
  ...accessibilityProps
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(pressed.value, [0, 1], [1, 0.9]),
  }));

  // Handlers
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
    pressed.value = withSpring(1);
  }, [scale, pressed]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    pressed.value = withSpring(0);
  }, [scale, pressed]);

  // Determine if button is effectively disabled
  const isDisabled = disabled || loading;

  // Get styles based on variant and size
  const variantStyle = isDisabled ? disabledStyles : variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  // Compose class names
  const containerClasses = [
    'flex-row items-center justify-center rounded-lg',
    variantStyle.container,
    sizeStyle.container,
    fullWidth ? 'w-full' : 'self-start',
    className,
  ].join(' ');

  const textClasses = [
    'font-semibold',
    variantStyle.text,
    sizeStyle.text,
  ].join(' ');

  // Spinner color
  const spinnerColor = variant === 'outline' || variant === 'ghost' 
    ? colors.primary[500] 
    : colors.white;

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={containerClasses}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      {...accessibilityProps}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={spinnerColor}
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View className="mr-2" accessibilityElementsHidden>
              {icon}
            </View>
          )}
          
          {typeof children === 'string' ? (
            <Text className={textClasses}>{children}</Text>
          ) : (
            children
          )}
          
          {icon && iconPosition === 'right' && (
            <View className="ml-2" accessibilityElementsHidden>
              {icon}
            </View>
          )}
        </>
      )}
    </AnimatedPressable>
  );
};

// ============================================================================
// ICON BUTTON VARIANT
// ============================================================================

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'iconPosition'> {
  /** Icon element to display */
  icon: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}) => {
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'w-8 h-8 p-0',
    md: 'w-10 h-10 p-0',
    lg: 'w-12 h-12 p-0',
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;
