/**
 * QuickAddFAB Component
 *
 * Floating action button with expandable menu for quick food logging.
 * Sub-buttons: Manual Entry, Scan Barcode, AI Scan, Voice Log
 *
 * @example
 * <QuickAddFAB
 *   onManualEntry={() => navigate('ManualEntry')}
 *   onScanBarcode={() => navigate('BarcodeScanner')}
 *   onAIScan={() => navigate('AIScan')}
 *   onVoiceLog={() => openVoiceModal()}
 * />
 */

import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAddFABProps {
  /** Handler for manual entry */
  onManualEntry: () => void;
  /** Handler for barcode scanning */
  onScanBarcode: () => void;
  /** Handler for AI food recognition */
  onAIScan: () => void;
  /** Handler for voice logging */
  onVoiceLog: () => void;
  /** Position from bottom */
  bottomOffset?: number;
  /** Position from right */
  rightOffset?: number;
  /** Whether FAB is visible */
  visible?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// SUB-BUTTON CONFIG
// ============================================================================

interface SubButtonConfig {
  id: string;
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

// ============================================================================
// SUB-BUTTON COMPONENT
// ============================================================================

interface SubButtonProps {
  config: SubButtonConfig;
  index: number;
  expanded: SharedValue<number>;
  totalButtons: number;
  onPress: () => void;
}

const SubButton: React.FC<SubButtonProps> = memo(({
  config,
  index,
  expanded,
  totalButtons,
  onPress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Calculate position in arc
    const angle = interpolate(
      index,
      [0, totalButtons - 1],
      [-135, -45], // Arc from left to top
      Extrapolation.CLAMP
    );
    const angleRad = (angle * Math.PI) / 180;
    const radius = 80;

    const translateX = interpolate(
      expanded.value,
      [0, 1],
      [0, Math.cos(angleRad) * radius],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      expanded.value,
      [0, 1],
      [0, Math.sin(angleRad) * radius],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      expanded.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      expanded.value,
      [0, 0.3, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      expanded.value,
      [0, 0.7, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );
    const translateX = interpolate(
      expanded.value,
      [0, 1],
      [20, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View
      style={[styles.subButtonContainer, animatedStyle]}
    >
      <View className="flex-row items-center">
        <Animated.View style={labelStyle}>
          <View className="bg-gray-900/80 px-3 py-1.5 rounded-lg mr-2">
            <Text className="text-white text-sm font-medium">
              {config.label}
            </Text>
          </View>
        </Animated.View>
        <Pressable
          onPress={onPress}
          className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
          style={{ backgroundColor: config.color }}
          accessibilityRole="button"
          accessibilityLabel={config.label}
        >
          <Ionicons name={config.icon as any} size={24} color="white" />
        </Pressable>
      </View>
    </Animated.View>
  );
});

SubButton.displayName = 'SubButton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const QuickAddFAB: React.FC<QuickAddFABProps> = memo(({
  onManualEntry,
  onScanBarcode,
  onAIScan,
  onVoiceLog,
  bottomOffset = 90,
  rightOffset = 20,
  visible = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const expanded = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Sub-button configurations
  const subButtons: SubButtonConfig[] = [
    {
      id: 'manual',
      icon: 'create-outline',
      label: 'Manual Entry',
      color: colors.primary[500],
      onPress: onManualEntry,
    },
    {
      id: 'barcode',
      icon: 'barcode-outline',
      label: 'Scan Barcode',
      color: colors.success[500],
      onPress: onScanBarcode,
    },
    {
      id: 'ai',
      icon: 'camera-outline',
      label: 'AI Scan',
      color: colors.warning[600],
      onPress: onAIScan,
    },
    {
      id: 'voice',
      icon: 'mic-outline',
      label: 'Voice Log',
      color: '#9333EA', // Purple
      onPress: onVoiceLog,
    },
  ];

  // Toggle menu
  const toggleMenu = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    expanded.value = withSpring(newExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
    rotation.value = withSpring(newExpanded ? 45 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isExpanded, expanded, rotation]);

  // Handle sub-button press
  const handleSubButtonPress = useCallback((callback: () => void) => {
    toggleMenu();
    // Small delay to allow animation to start
    setTimeout(callback, 100);
  }, [toggleMenu]);

  // Main button animation
  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Backdrop animation
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.value, [0, 1], [0, 1]),
    pointerEvents: expanded.value > 0.5 ? 'auto' : 'none',
  }));

  // FAB visibility animation
  const fabVisibility = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    fabVisibility.value = withSpring(visible ? 1 : 0);
  }, [visible, fabVisibility]);

  const fabContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabVisibility.value },
      { translateY: interpolate(fabVisibility.value, [0, 1], [100, 0]) },
    ],
    opacity: fabVisibility.value,
  }));

  return (
    <>
      {/* Backdrop */}
      <AnimatedPressable
        style={[styles.backdrop, backdropStyle]}
        onPress={toggleMenu}
      />

      {/* FAB Container */}
      <Animated.View
        style={[
          styles.container,
          { bottom: bottomOffset, right: rightOffset },
          fabContainerStyle,
        ]}
        className={className}
      >
        {/* Sub Buttons */}
        {subButtons.map((config, index) => (
          <SubButton
            key={config.id}
            config={config}
            index={index}
            expanded={expanded}
            totalButtons={subButtons.length}
            onPress={() => handleSubButtonPress(config.onPress)}
          />
        ))}

        {/* Main FAB Button */}
        <AnimatedPressable
          style={[styles.mainButton, mainButtonStyle]}
          onPress={toggleMenu}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Close menu' : 'Quick add food'}
          accessibilityHint="Opens quick add options"
          accessibilityState={{ expanded: isExpanded }}
        >
          <Ionicons name="add" size={32} color="white" />
        </AnimatedPressable>
      </Animated.View>
    </>
  );
});

QuickAddFAB.displayName = 'QuickAddFAB';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  subButtonContainer: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default QuickAddFAB;
