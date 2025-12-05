/**
 * TextInput Component
 *
 * A styled text input with label, error state, and helper text support.
 *
 * @example
 * // Basic usage
 * <TextInput
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 *
 * @example
 * // With error
 * <TextInput
 *   label="Password"
 *   secureTextEntry
 *   error="Password is required"
 *   helperText="Must be at least 8 characters"
 * />
 *
 * Props:
 * - label: string - Input label
 * - error: string - Error message (shows error state)
 * - helperText: string - Helper text below input
 * - leftIcon: ReactNode - Icon on left side
 * - rightIcon: ReactNode - Icon on right side
 * - variant: 'outlined' | 'filled' - Input style variant
 */

import React, { useState, useCallback, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export type InputVariant = 'outlined' | 'filled';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Right icon press handler */
  onRightIconPress?: () => void;
  /** Style variant */
  variant?: InputVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Required indicator */
  required?: boolean;
  /** Additional container class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  disabled = false,
  required = false,
  className = '',
  testID,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  // Handle focus
  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  }, [onFocus, focusAnim]);

  // Handle blur
  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  }, [onBlur, focusAnim]);

  // Animated border style
  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? colors.error[500]
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          [colors.gray[300], colors.primary[500]]
        );
    
    return {
      borderColor,
      borderWidth: isFocused ? 2 : 1,
    };
  });

  // Determine styles based on variant
  const variantStyles = {
    outlined: 'bg-white',
    filled: 'bg-gray-100',
  };

  // Determine text color
  const textColor = disabled ? colors.gray[400] : colors.gray[900];
  const placeholderColor = colors.gray[400];

  return (
    <View className={`mb-4 ${className}`} testID={testID}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center mb-1.5">
          <Text className="text-sm font-medium text-gray-700">
            {label}
          </Text>
          {required && (
            <Text className="text-error-500 ml-1">*</Text>
          )}
        </View>
      )}

      {/* Input Container */}
      <Animated.View
        style={animatedContainerStyle}
        className={`
          flex-row items-center rounded-lg px-3 min-h-[48px]
          ${variantStyles[variant]}
          ${disabled ? 'opacity-60' : ''}
          ${error ? 'border-error-500' : ''}
        `}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View className="mr-2" accessibilityElementsHidden>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <RNTextInput
          ref={ref}
          className="flex-1 text-base py-3"
          style={{ color: textColor }}
          placeholderTextColor={placeholderColor}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessible={true}
          accessibilityLabel={label}
          accessibilityState={{
            disabled,
          }}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            className="ml-2 p-1"
            accessibilityRole={onRightIconPress ? 'button' : 'none'}
          >
            {rightIcon}
          </Pressable>
        )}
      </Animated.View>

      {/* Error Message */}
      {error && (
        <Text 
          className="text-sm text-error-500 mt-1"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Text className="text-sm text-gray-500 mt-1">
          {helperText}
        </Text>
      )}
    </View>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;
