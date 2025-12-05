import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PremiumFeature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  feature?: string;
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: 'camera',
    title: 'AI Food Scanner',
    description: 'Instantly identify foods and get nutrition info with your camera',
  },
  {
    icon: 'chatbubbles',
    title: 'AI Health Coach',
    description: 'Get personalized nutrition advice and meal recommendations',
  },
  {
    icon: 'analytics',
    title: 'Advanced Analytics',
    description: 'Deep insights into your eating patterns and progress',
  },
  {
    icon: 'restaurant',
    title: 'AI Meal Plans',
    description: 'Personalized weekly meal plans based on your goals',
  },
  {
    icon: 'notifications',
    title: 'Smart Reminders',
    description: 'AI-powered reminders that adapt to your schedule',
  },
];

export const PremiumModal: React.FC<PremiumModalProps> = ({
  visible,
  onClose,
  onSubscribe,
  feature = 'AI Features',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-t-[32px] pt-6 pb-8 px-6">
          {/* Handle bar */}
          <View className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-6" />
          
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 items-center justify-center mb-4">
              <Ionicons name="diamond" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Unlock {feature}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
              Upgrade to Premium for unlimited access
            </Text>
          </View>

          {/* Features List */}
          <View className="mb-6">
            {PREMIUM_FEATURES.slice(0, 3).map((item, index) => (
              <View key={index} className="flex-row items-center py-3">
                <View 
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primary[500] + '15' }}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary[500]} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 mb-6">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Monthly</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-3xl font-bold text-gray-900 dark:text-white">$4.99</Text>
                  <Text className="text-gray-500 dark:text-gray-400 ml-1">/month</Text>
                </View>
              </View>
              <View className="bg-primary-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">7 DAY FREE TRIAL</Text>
              </View>
            </View>
          </View>

          {/* CTA Buttons */}
          <TouchableOpacity
            onPress={onSubscribe}
            className="bg-primary-500 py-4 rounded-2xl items-center mb-3"
            style={{
              shadowColor: colors.primary[500],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="text-white font-bold text-lg">Start Free Trial</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="py-3 items-center">
            <Text className="text-gray-500 dark:text-gray-400 font-medium">Maybe Later</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text className="text-xs text-gray-400 text-center mt-4">
            Cancel anytime. Subscription auto-renews after trial.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// Simple banner for subtle upsell
export const PremiumBanner: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="mx-4 mb-4 p-4 rounded-2xl overflow-hidden"
    style={{ backgroundColor: colors.primary[500] }}
  >
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Ionicons name="diamond" size={24} color="white" />
        <View className="ml-3 flex-1">
          <Text className="text-white font-bold">Unlock Premium</Text>
          <Text className="text-white/80 text-xs">Get unlimited AI features</Text>
        </View>
      </View>
      <View className="bg-white/20 px-3 py-1.5 rounded-full">
        <Text className="text-white text-sm font-semibold">Try Free</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default PremiumModal;
