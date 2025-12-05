/**
 * BottomSheet Component
 *
 * A slide-up modal for actions and content.
 *
 * @example
 * // Basic usage
 * <BottomSheet
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Actions"
 * >
 *   <Text>Content here</Text>
 * </BottomSheet>
 *
 * @example
 * // With snap points
 * <BottomSheet
 *   visible={isOpen}
 *   onClose={handleClose}
 *   snapPoints={['25%', '50%', '90%']}
 *   initialSnap={1}
 * >
 *   <ScrollableContent />
 * </BottomSheet>
 *
 * Props:
 * - visible: boolean - Sheet visibility
 * - onClose: () => void - Close handler
 * - title: string - Header title
 * - snapPoints: string[] - Height snap points
 * - initialSnap: number - Initial snap point index
 * - showHandle: boolean - Show drag handle
 * - dismissible: boolean - Can dismiss by backdrop tap
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

export interface BottomSheetProps {
  /** Sheet visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Header title */
  title?: string;
  /** Sheet content */
  children: React.ReactNode;
  /** Height snap points (e.g., ['25%', '50%', '90%']) */
  snapPoints?: string[];
  /** Initial snap point index */
  initialSnap?: number;
  /** Show drag handle */
  showHandle?: boolean;
  /** Can dismiss by backdrop tap */
  dismissible?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Header right action */
  headerRight?: React.ReactNode;
  /** Enable scroll inside sheet */
  scrollable?: boolean;
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const parseSnapPoint = (point: string): number => {
  const percentage = parseFloat(point) / 100;
  return SCREEN_HEIGHT * percentage;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  snapPoints = ['50%'],
  initialSnap = 0,
  showHandle = true,
  dismissible = true,
  showCloseButton = true,
  headerRight,
  scrollable = false,
  className = '',
  testID,
}) => {
  // Calculate snap heights
  const snapHeights = snapPoints.map(parseSnapPoint);
  const maxHeight = Math.max(...snapHeights);
  const minHeight = Math.min(...snapHeights);

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const currentHeight = useSharedValue(snapHeights[initialSnap]);

  // Open animation
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(SCREEN_HEIGHT - snapHeights[initialSnap], {
        damping: 25,
        stiffness: 300,
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, initialSnap, snapHeights, translateY, backdropOpacity]);

  // Close handler
  const handleClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    backdropOpacity.value = withTiming(0, { duration: 300 });
    // Delay onClose to allow animation
    setTimeout(onClose, 300);
  }, [onClose, translateY, backdropOpacity]);

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateY = Math.max(
        SCREEN_HEIGHT - maxHeight,
        SCREEN_HEIGHT - snapHeights[initialSnap] + event.translationY
      );
      translateY.value = newTranslateY;
    })
    .onEnd((event) => {
      // Find closest snap point
      const currentY = SCREEN_HEIGHT - translateY.value;
      
      // If dragged down significantly, close
      if (event.velocityY > 500 || currentY < minHeight * 0.5) {
        if (dismissible) {
          runOnJS(handleClose)();
        } else {
          translateY.value = withSpring(SCREEN_HEIGHT - minHeight, {
            damping: 25,
            stiffness: 300,
          });
        }
        return;
      }

      // Snap to closest point
      let closestSnap = snapHeights[0];
      let closestDistance = Math.abs(currentY - closestSnap);
      
      for (const snap of snapHeights) {
        const distance = Math.abs(currentY - snap);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSnap = snap;
        }
      }

      translateY.value = withSpring(SCREEN_HEIGHT - closestSnap, {
        damping: 25,
        stiffness: 300,
      });
    });

  // Animated styles
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissible ? handleClose : undefined}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={dismissible ? handleClose : undefined}
          />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                height: maxHeight + 50, // Extra for overscroll
                backgroundColor: colors.white,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              },
              sheetStyle,
            ]}
            testID={testID}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              {/* Handle */}
              {showHandle && (
                <View className="items-center pt-3 pb-2">
                  <View className="w-10 h-1 rounded-full bg-gray-300" />
                </View>
              )}

              {/* Header */}
              {(title || showCloseButton || headerRight) && (
                <View className="flex-row items-center justify-between px-4 pb-3 border-b border-gray-100">
                  {showCloseButton ? (
                    <Pressable
                      onPress={handleClose}
                      className="p-2 -ml-2"
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Ionicons name="close" size={24} color={colors.gray[600]} />
                    </Pressable>
                  ) : (
                    <View className="w-10" />
                  )}
                  
                  {title && (
                    <Text className="text-lg font-semibold text-gray-900 flex-1 text-center">
                      {title}
                    </Text>
                  )}
                  
                  {headerRight || <View className="w-10" />}
                </View>
              )}

              {/* Content */}
              <ContentWrapper
                className={`flex-1 ${className}`}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ContentWrapper>
            </KeyboardAvoidingView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default BottomSheet;
