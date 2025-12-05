/**
 * SwipeableRow Component
 *
 * A list item with swipe-to-reveal actions (delete, edit, etc.).
 *
 * @example
 * // Basic usage with delete action
 * <SwipeableRow
 *   onDelete={() => handleDelete(item.id)}
 * >
 *   <ListItem title={item.name} />
 * </SwipeableRow>
 *
 * @example
 * // With multiple actions
 * <SwipeableRow
 *   leftActions={[
 *     { icon: 'archive', color: '#4ECDC4', onPress: handleArchive },
 *   ]}
 *   rightActions={[
 *     { icon: 'pencil', color: '#FFE66D', onPress: handleEdit },
 *     { icon: 'trash', color: '#FF6B6B', onPress: handleDelete },
 *   ]}
 * >
 *   <ListItem title="Swipe me" />
 * </SwipeableRow>
 *
 * Props:
 * - children: ReactNode - Row content
 * - leftActions: SwipeAction[] - Left swipe actions
 * - rightActions: SwipeAction[] - Right swipe actions
 * - onDelete: () => void - Quick delete action
 * - onEdit: () => void - Quick edit action
 */

import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface SwipeAction {
  /** Icon name (Ionicons) */
  icon: string;
  /** Action label (for accessibility) */
  label?: string;
  /** Background color */
  color: string;
  /** Press handler */
  onPress: () => void;
}

export interface SwipeableRowProps {
  /** Row content */
  children: React.ReactNode;
  /** Left swipe actions */
  leftActions?: SwipeAction[];
  /** Right swipe actions */
  rightActions?: SwipeAction[];
  /** Quick delete handler (adds delete to right) */
  onDelete?: () => void;
  /** Quick edit handler (adds edit to right) */
  onEdit?: () => void;
  /** Action button width */
  actionWidth?: number;
  /** Friction for swipe */
  friction?: number;
  /** Threshold to trigger full swipe */
  fullSwipeThreshold?: number;
  /** Enable full swipe to delete */
  enableFullSwipeDelete?: boolean;
  /** Additional class names */
  className?: string;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// ACTION BUTTON COMPONENT
// ============================================================================

interface ActionButtonProps {
  action: SwipeAction;
  width: number;
  progress: Animated.AnimatedInterpolation<number>;
  x: number;
  direction: 'left' | 'right';
}

const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  width,
  progress,
  x,
  direction,
}) => {
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: direction === 'left' ? [-x, 0] : [x, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.9, 1],
  });

  return (
    <Animated.View
      style={[
        styles.actionButton,
        {
          width,
          backgroundColor: action.color,
          transform: [{ translateX }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={action.onPress}
        className="flex-1 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={action.label || action.icon}
      >
        <Ionicons
          name={action.icon as any}
          size={24}
          color={colors.white}
        />
        {action.label && (
          <Text className="text-white text-xs mt-1 font-medium">
            {action.label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onDelete,
  onEdit,
  actionWidth = 72,
  friction = 2,
  fullSwipeThreshold = 0.5,
  enableFullSwipeDelete = false,
  className = '',
  testID,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  // Build right actions array
  const allRightActions: SwipeAction[] = [
    ...rightActions,
    ...(onEdit ? [{ icon: 'pencil', label: 'Edit', color: colors.warning[500], onPress: onEdit }] : []),
    ...(onDelete ? [{ icon: 'trash', label: 'Delete', color: colors.error[500], onPress: onDelete }] : []),
  ];

  // Close swipeable
  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  // Handle action press with close
  const handleActionPress = useCallback((action: SwipeAction) => {
    close();
    setTimeout(action.onPress, 200);
  }, [close]);

  // Render left actions
  const renderLeftActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      if (leftActions.length === 0) return null;

      return (
        <View className="flex-row">
          {leftActions.map((action, index) => (
            <ActionButton
              key={index}
              action={{ ...action, onPress: () => handleActionPress(action) }}
              width={actionWidth}
              progress={progress}
              x={actionWidth * (leftActions.length - index)}
              direction="left"
            />
          ))}
        </View>
      );
    },
    [leftActions, actionWidth, handleActionPress]
  );

  // Render right actions
  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      if (allRightActions.length === 0) return null;

      return (
        <View className="flex-row">
          {allRightActions.map((action, index) => (
            <ActionButton
              key={index}
              action={{ ...action, onPress: () => handleActionPress(action) }}
              width={actionWidth}
              progress={progress}
              x={actionWidth * (index + 1)}
              direction="right"
            />
          ))}
        </View>
      );
    },
    [allRightActions, actionWidth, handleActionPress]
  );

  // Handle full swipe
  const handleFullSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right' && enableFullSwipeDelete && onDelete) {
      onDelete();
    }
  }, [enableFullSwipeDelete, onDelete]);

  return (
    <Swipeable
      ref={swipeableRef}
      friction={friction}
      leftThreshold={actionWidth * leftActions.length * fullSwipeThreshold}
      rightThreshold={actionWidth * allRightActions.length * fullSwipeThreshold}
      renderLeftActions={leftActions.length > 0 ? renderLeftActions : undefined}
      renderRightActions={allRightActions.length > 0 ? renderRightActions : undefined}
      onSwipeableOpen={handleFullSwipe}
      overshootLeft={false}
      overshootRight={false}
      containerStyle={[styles.container, className ? {} : {}]}
      testID={testID}
    >
      <View className="bg-white">
        {children}
      </View>
    </Swipeable>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SwipeableRow;
