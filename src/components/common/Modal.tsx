/**
 * Modal Component
 *
 * A centered modal for confirmations, alerts, and forms.
 *
 * @example
 * // Confirmation modal
 * <Modal
 *   visible={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   title="Delete Item?"
 *   message="This action cannot be undone."
 *   actions={[
 *     { label: 'Cancel', onPress: () => setShowConfirm(false) },
 *     { label: 'Delete', onPress: handleDelete, variant: 'danger' },
 *   ]}
 * />
 *
 * @example
 * // Custom content modal
 * <Modal
 *   visible={isOpen}
 *   onClose={handleClose}
 *   title="Edit Profile"
 * >
 *   <Form>...</Form>
 * </Modal>
 *
 * Props:
 * - visible: boolean - Modal visibility
 * - onClose: () => void - Close handler
 * - title: string - Modal title
 * - message: string - Modal message (for alerts/confirmations)
 * - children: ReactNode - Custom content
 * - actions: Array - Action buttons
 * - dismissible: boolean - Can close by backdrop tap
 * - size: 'sm' | 'md' | 'lg' - Modal width
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { Button, ButtonVariant } from './Button';

// ============================================================================
// TYPES
// ============================================================================

export interface ModalAction {
  /** Button label */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Button variant */
  variant?: ButtonVariant;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  /** Modal visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal message (for simple alerts) */
  message?: string;
  /** Custom content */
  children?: React.ReactNode;
  /** Action buttons */
  actions?: ModalAction[];
  /** Can close by backdrop tap */
  dismissible?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Modal width */
  size?: ModalSize;
  /** Icon to show */
  icon?: React.ReactNode;
  /** Icon color variant */
  iconVariant?: 'info' | 'success' | 'warning' | 'error';
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// STYLE MAPPINGS
// ============================================================================

const sizeStyles: Record<ModalSize, string> = {
  sm: 'w-72',
  md: 'w-80',
  lg: 'w-96',
  full: 'w-[90%]',
};

const iconVariantStyles: Record<string, { bg: string; color: string }> = {
  info: { bg: 'bg-primary-100', color: colors.primary[500] },
  success: { bg: 'bg-success-100', color: colors.success[500] },
  warning: { bg: 'bg-warning-100', color: colors.warning[500] },
  error: { bg: 'bg-error-100', color: colors.error[500] },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  message,
  children,
  actions,
  dismissible = true,
  showCloseButton = false,
  size = 'md',
  icon,
  iconVariant = 'info',
  className = '',
  testID,
}) => {
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.9, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, scale, opacity]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const iconStyle = iconVariantStyles[iconVariant];

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissible ? onClose : undefined}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Backdrop */}
        <Animated.View
          style={backdropStyle}
          className="absolute inset-0 bg-black/50"
        >
          <Pressable
            className="flex-1"
            onPress={dismissible ? onClose : undefined}
          />
        </Animated.View>

        {/* Modal Container */}
        <View className="flex-1 items-center justify-center p-4">
          <Animated.View
            style={containerStyle}
            className={`
              bg-white rounded-2xl overflow-hidden
              ${sizeStyles[size]}
              ${className}
            `}
            testID={testID}
            accessible={true}
            accessibilityRole="alert"
            accessibilityViewIsModal={true}
          >
            {/* Close Button */}
            {showCloseButton && (
              <Pressable
                onPress={onClose}
                className="absolute top-3 right-3 z-10 p-1"
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={24} color={colors.gray[400]} />
              </Pressable>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Content */}
              <View className="p-6">
                {/* Icon */}
                {icon && (
                  <View className="items-center mb-4">
                    <View className={`w-14 h-14 rounded-full items-center justify-center ${iconStyle.bg}`}>
                      {icon}
                    </View>
                  </View>
                )}

                {/* Title */}
                {title && (
                  <Text
                    className="text-xl font-bold text-gray-900 text-center mb-2"
                    accessibilityRole="header"
                  >
                    {title}
                  </Text>
                )}

                {/* Message */}
                {message && (
                  <Text className="text-base text-gray-600 text-center mb-4">
                    {message}
                  </Text>
                )}

                {/* Custom Children */}
                {children}
              </View>

              {/* Actions */}
              {actions && actions.length > 0 && (
                <View className="flex-row border-t border-gray-100">
                  {actions.map((action, index) => (
                    <View
                      key={index}
                      className={`flex-1 ${index > 0 ? 'border-l border-gray-100' : ''}`}
                    >
                      <Pressable
                        onPress={action.onPress}
                        disabled={action.disabled || action.loading}
                        className={`
                          py-4 items-center justify-center
                          ${action.disabled ? 'opacity-50' : ''}
                        `}
                        accessibilityRole="button"
                        accessibilityLabel={action.label}
                      >
                        <Text
                          className={`
                            text-base font-semibold
                            ${action.variant === 'danger' ? 'text-error-500' : 
                              action.variant === 'primary' ? 'text-primary-500' : 'text-gray-700'}
                          `}
                        >
                          {action.label}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

// ============================================================================
// PRESET MODALS
// ============================================================================

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttonText = 'OK',
}) => (
  <Modal
    visible={visible}
    onClose={onClose}
    title={title}
    message={message}
    actions={[{ label: buttonText, onPress: onClose, variant: 'primary' }]}
  />
);

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
}) => (
  <Modal
    visible={visible}
    onClose={onClose}
    title={title}
    message={message}
    actions={[
      { label: cancelText, onPress: onClose },
      { 
        label: confirmText, 
        onPress: onConfirm, 
        variant: destructive ? 'danger' : 'primary',
        loading,
      },
    ]}
  />
);

export default Modal;
