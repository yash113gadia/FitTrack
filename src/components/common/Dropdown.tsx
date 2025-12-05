/**
 * Dropdown Component
 *
 * A styled picker/select component for selecting from a list of options.
 *
 * @example
 * // Basic usage
 * <Dropdown
 *   label="Activity Level"
 *   value={activityLevel}
 *   onChange={setActivityLevel}
 *   options={[
 *     { label: 'Sedentary', value: 'sedentary' },
 *     { label: 'Active', value: 'active' },
 *   ]}
 * />
 *
 * @example
 * // With placeholder and error
 * <Dropdown
 *   label="Goal"
 *   placeholder="Select your goal"
 *   value={goal}
 *   onChange={setGoal}
 *   options={goalOptions}
 *   error="Please select a goal"
 * />
 *
 * Props:
 * - value: string | number - Selected value
 * - onChange: (value) => void - Change handler
 * - options: Array<{ label: string, value: any }> - Options list
 * - label: string - Input label
 * - placeholder: string - Placeholder text
 * - error: string - Error message
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface DropdownOption {
  /** Display label */
  label: string;
  /** Option value */
  value: string | number;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

export interface DropdownProps {
  /** Selected value */
  value: string | number | null;
  /** Change handler */
  onChange: (value: string | number) => void;
  /** Options list */
  options: DropdownOption[];
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required indicator */
  required?: boolean;
  /** Search enabled */
  searchable?: boolean;
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  error,
  helperText,
  disabled = false,
  required = false,
  searchable = false,
  className = '',
  testID,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rotation = useSharedValue(0);

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options by search
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Animated chevron rotation
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Open dropdown
  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      rotation.value = withSpring(180);
    }
  }, [disabled, rotation]);

  // Close dropdown
  const handleClose = useCallback(() => {
    setIsOpen(false);
    rotation.value = withSpring(0);
    setSearchQuery('');
  }, [rotation]);

  // Select option
  const handleSelect = useCallback((option: DropdownOption) => {
    if (!option.disabled) {
      onChange(option.value);
      handleClose();
    }
  }, [onChange, handleClose]);

  // Render option item
  const renderOption = useCallback(({ item }: { item: DropdownOption }) => {
    const isSelected = item.value === value;
    
    return (
      <Pressable
        className={`
          flex-row items-center py-4 px-4 border-b border-gray-100
          ${isSelected ? 'bg-primary-50' : 'bg-white'}
          ${item.disabled ? 'opacity-50' : ''}
        `}
        onPress={() => handleSelect(item)}
        disabled={item.disabled}
        accessible={true}
        accessibilityRole="menuitem"
        accessibilityState={{ selected: isSelected, disabled: item.disabled }}
      >
        {item.icon && (
          <View className="mr-3">
            {item.icon}
          </View>
        )}
        <Text className={`flex-1 text-base ${isSelected ? 'text-primary-600 font-medium' : 'text-gray-900'}`}>
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
        )}
      </Pressable>
    );
  }, [value, handleSelect]);

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

      {/* Trigger Button */}
      <Pressable
        className={`
          flex-row items-center justify-between
          bg-white border rounded-lg px-4 min-h-[48px]
          ${error ? 'border-error-500' : 'border-gray-300'}
          ${disabled ? 'opacity-60 bg-gray-100' : ''}
        `}
        onPress={handleOpen}
        disabled={disabled}
        accessible={true}
        accessibilityRole="combobox"
        accessibilityLabel={label || 'Dropdown'}
        accessibilityState={{
          expanded: isOpen,
          disabled,
        }}
        accessibilityHint="Double tap to open dropdown"
      >
        <Text
          className={`flex-1 text-base ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Animated.View style={chevronStyle}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.gray[400]}
          />
        </Animated.View>
      </Pressable>

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

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={handleClose}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70%]"
          >
            <SafeAreaView>
              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-lg font-semibold text-gray-900">
                  {label || 'Select Option'}
                </Text>
                <Pressable
                  onPress={handleClose}
                  className="p-2"
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={24} color={colors.gray[500]} />
                </Pressable>
              </View>

              {/* Search (if enabled) */}
              {searchable && (
                <View className="px-4 py-2 border-b border-gray-200">
                  <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
                    <Ionicons name="search" size={20} color={colors.gray[400]} />
                    <TextInput
                      className="flex-1 py-2 px-2 text-base"
                      placeholder="Search..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                  </View>
                </View>
              )}

              {/* Options List */}
              <FlatList
                data={filteredOptions}
                renderItem={renderOption}
                keyExtractor={(item) => String(item.value)}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">No options available</Text>
                  </View>
                }
              />
            </SafeAreaView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

// Need to import TextInput for the search functionality
import { TextInput } from 'react-native';

export default Dropdown;
