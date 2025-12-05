/**
 * Toast Component
 *
 * A notification toast component for temporary messages.
 *
 * @example
 * // Using toast manager
 * import { toast } from './Toast';
 *
 * toast.success('Item saved successfully!');
 * toast.error('Failed to save item');
 * toast.warning('You are offline');
 * toast.info('New update available');
 *
 * @example
 * // Direct component usage
 * <Toast
 *   visible={showToast}
 *   message="Operation completed"
 *   variant="success"
 *   onHide={() => setShowToast(false)}
 * />
 *
 * Props:
 * - visible: boolean - Toast visibility
 * - message: string - Toast message
 * - variant: 'success' | 'error' | 'warning' | 'info'
 * - duration: number - Auto-hide duration in ms
 * - position: 'top' | 'bottom' - Toast position
 * - onHide: () => void - Hide callback
 * - action: { label, onPress } - Optional action button
 */

import React, { useEffect, useCallback, createContext, useContext, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SlideInUp,
  SlideOutUp,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

export interface ToastAction {
  /** Action button label */
  label: string;
  /** Action press handler */
  onPress: () => void;
}

export interface ToastProps {
  /** Toast visibility */
  visible: boolean;
  /** Toast message */
  message: string;
  /** Toast variant */
  variant?: ToastVariant;
  /** Auto-hide duration in ms (0 to disable) */
  duration?: number;
  /** Toast position */
  position?: ToastPosition;
  /** Hide callback */
  onHide: () => void;
  /** Optional action button */
  action?: ToastAction;
  /** Show close button */
  showCloseButton?: boolean;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// STYLE MAPPINGS
// ============================================================================

interface VariantConfig {
  bg: string;
  text: string;
  icon: string;
  iconColor: string;
}

const variantConfig: Record<ToastVariant, VariantConfig> = {
  success: {
    bg: 'bg-success-600',
    text: 'text-white',
    icon: 'checkmark-circle',
    iconColor: colors.white,
  },
  error: {
    bg: 'bg-error-600',
    text: 'text-white',
    icon: 'alert-circle',
    iconColor: colors.white,
  },
  warning: {
    bg: 'bg-warning-500',
    text: 'text-gray-900',
    icon: 'warning',
    iconColor: colors.gray[900],
  },
  info: {
    bg: 'bg-primary-600',
    text: 'text-white',
    icon: 'information-circle',
    iconColor: colors.white,
  },
};

// ============================================================================
// TOAST COMPONENT
// ============================================================================

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  variant = 'info',
  duration = 3000,
  position = 'top',
  onHide,
  action,
  showCloseButton = true,
  testID,
}) => {
  const config = variantConfig[variant];

  // Auto-hide timer
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onHide, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  // Determine animation based on position
  const entering = position === 'top' ? SlideInUp : SlideInDown;
  const exiting = position === 'top' ? SlideOutUp : SlideOutDown;

  return (
    <Animated.View
      entering={entering.springify().damping(20)}
      exiting={exiting.duration(200)}
      className={`
        absolute left-4 right-4 z-50
        ${position === 'top' ? 'top-0' : 'bottom-0'}
      `}
      testID={testID}
    >
      <SafeAreaView>
        <View
          className={`
            flex-row items-center rounded-xl px-4 py-3 mx-auto
            ${config.bg}
            shadow-lg
          `}
          style={{ maxWidth: 400 }}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {/* Icon */}
          <Ionicons
            name={config.icon as any}
            size={24}
            color={config.iconColor}
          />

          {/* Message */}
          <Text
            className={`flex-1 mx-3 text-base font-medium ${config.text}`}
            numberOfLines={2}
          >
            {message}
          </Text>

          {/* Action */}
          {action && (
            <Pressable
              onPress={() => {
                action.onPress();
                onHide();
              }}
              className="px-3 py-1 rounded-lg bg-white/20"
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text className={`font-semibold ${config.text}`}>
                {action.label}
              </Text>
            </Pressable>
          )}

          {/* Close Button */}
          {showCloseButton && !action && (
            <Pressable
              onPress={onHide}
              className="p-1"
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            >
              <Ionicons
                name="close"
                size={20}
                color={config.iconColor}
              />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

// ============================================================================
// TOAST CONTEXT & PROVIDER
// ============================================================================

interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, options?: Partial<Omit<ToastState, 'visible' | 'message'>>) => void;
  success: (message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => void;
  error: (message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => void;
  warning: (message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => void;
  info: (message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'info',
    duration: 3000,
  });

  const show = useCallback((message: string, options?: Partial<Omit<ToastState, 'visible' | 'message'>>) => {
    setState({
      visible: true,
      message,
      variant: options?.variant || 'info',
      duration: options?.duration ?? 3000,
      action: options?.action,
    });
  }, []);

  const hide = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  const success = useCallback((message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => {
    show(message, { ...options, variant: 'success' });
  }, [show]);

  const error = useCallback((message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => {
    show(message, { ...options, variant: 'error' });
  }, [show]);

  const warning = useCallback((message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => {
    show(message, { ...options, variant: 'warning' });
  }, [show]);

  const info = useCallback((message: string, options?: Partial<Omit<ToastState, 'visible' | 'message' | 'variant'>>) => {
    show(message, { ...options, variant: 'info' });
  }, [show]);

  const contextValue: ToastContextValue = {
    show,
    success,
    error,
    warning,
    info,
    hide,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        visible={state.visible}
        message={state.message}
        variant={state.variant}
        duration={state.duration}
        action={state.action}
        onHide={hide}
      />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;
