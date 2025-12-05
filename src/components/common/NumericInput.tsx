/**
 * NumericInput Component
 *
 * A number input with increment/decrement buttons.
 *
 * @example
 * // Basic usage
 * <NumericInput
 *   label="Servings"
 *   value={servings}
 *   onChange={setServings}
 *   min={1}
 *   max={10}
 * />
 *
 * @example
 * // With step and unit
 * <NumericInput
 *   label="Weight"
 *   value={weight}
 *   onChange={setWeight}
 *   step={0.5}
 *   unit="kg"
 *   decimals={1}
 * />
 *
 * Props:
 * - value: number - Current value
 * - onChange: (value: number) => void - Change handler
 * - min: number - Minimum value
 * - max: number - Maximum value
 * - step: number - Increment/decrement step
 * - unit: string - Unit label
 * - decimals: number - Number of decimal places
 * - label: string - Input label
 */

import React, { useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export interface NumericInputProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Increment/decrement step */
  step?: number;
  /** Unit label */
  unit?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Input label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// STEPPER BUTTON COMPONENT
// ============================================================================

interface StepperButtonProps {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
  size: 'sm' | 'md' | 'lg';
}

const StepperButton: React.FC<StepperButtonProps> = ({
  icon,
  onPress,
  disabled,
  size,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      scale.value = withSpring(0.9, { damping: 20, stiffness: 300 });
    }
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [scale]);

  const sizeStyles = {
    sm: { button: 'w-8 h-8', icon: 16 },
    md: { button: 'w-10 h-10', icon: 20 },
    lg: { button: 'w-12 h-12', icon: 24 },
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={`
        ${sizeStyles[size].button}
        items-center justify-center rounded-full
        ${disabled ? 'bg-gray-100' : 'bg-primary-100'}
      `}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase' : 'Decrease'}
      accessibilityState={{ disabled }}
    >
      <Ionicons
        name={icon}
        size={sizeStyles[size].icon}
        color={disabled ? colors.gray[400] : colors.primary[500]}
      />
    </AnimatedPressable>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  unit,
  decimals = 0,
  label,
  helperText,
  error,
  disabled = false,
  size = 'md',
  className = '',
  testID,
}) => {
  // Format value for display
  const formatValue = (val: number): string => {
    return val.toFixed(decimals);
  };

  // Increment handler
  const handleIncrement = useCallback(() => {
    const newValue = Math.min(value + step, max);
    onChange(Number(newValue.toFixed(decimals)));
  }, [value, step, max, decimals, onChange]);

  // Decrement handler
  const handleDecrement = useCallback(() => {
    const newValue = Math.max(value - step, min);
    onChange(Number(newValue.toFixed(decimals)));
  }, [value, step, min, decimals, onChange]);

  // Direct input handler
  const handleTextChange = useCallback((text: string) => {
    const numValue = parseFloat(text);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(Number(clampedValue.toFixed(decimals)));
    } else if (text === '' || text === '-') {
      onChange(min);
    }
  }, [min, max, decimals, onChange]);

  // Size-based input styles
  const inputSizes = {
    sm: 'text-base min-w-[60px]',
    md: 'text-lg min-w-[80px]',
    lg: 'text-xl min-w-[100px]',
  };

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  return (
    <View className={`${className}`} testID={testID}>
      {/* Label */}
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Text>
      )}

      {/* Input Row */}
      <View 
        className={`
          flex-row items-center justify-between 
          bg-white border rounded-xl px-3 py-2
          ${error ? 'border-error-500' : 'border-gray-200'}
          ${disabled ? 'opacity-60' : ''}
        `}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={label || 'Numeric input'}
        accessibilityValue={{
          min,
          max,
          now: value,
        }}
      >
        {/* Decrement Button */}
        <StepperButton
          icon="remove"
          onPress={handleDecrement}
          disabled={!canDecrement}
          size={size}
        />

        {/* Value Input */}
        <View className="flex-row items-center justify-center flex-1">
          <TextInput
            className={`text-center font-semibold text-gray-900 ${inputSizes[size]}`}
            value={formatValue(value)}
            onChangeText={handleTextChange}
            keyboardType="decimal-pad"
            editable={!disabled}
            selectTextOnFocus
            accessibilityLabel={`Current value: ${value}`}
          />
          {unit && (
            <Text className="text-gray-500 ml-1">
              {unit}
            </Text>
          )}
        </View>

        {/* Increment Button */}
        <StepperButton
          icon="add"
          onPress={handleIncrement}
          disabled={!canIncrement}
          size={size}
        />
      </View>

      {/* Error Message */}
      {error && (
        <Text className="text-sm text-error-500 mt-1">
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
};

export default NumericInput;
