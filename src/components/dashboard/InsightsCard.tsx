/**
 * InsightsCard Component
 *
 * AI-powered suggestions based on current progress,
 * historical patterns, and time of day.
 *
 * @example
 * <InsightsCard
 *   insights={[
 *     { type: 'tip', message: 'Try adding more protein to dinner' },
 *     { type: 'achievement', message: 'You hit your protein goal 3 days in a row!' },
 *     { type: 'suggestion', message: 'Based on your patterns, a snack around 3pm helps you stay on track' }
 *   ]}
 *   onInsightPress={(insight) => handleInsight(insight)}
 *   onRefresh={() => refreshInsights()}
 * />
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  FadeInRight,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export type InsightType =
  | 'tip'           // General nutrition tip
  | 'suggestion'    // Personalized suggestion
  | 'achievement'   // Celebration/milestone
  | 'warning'       // Warning about patterns
  | 'reminder'      // Time-based reminder
  | 'ai';           // AI-generated insight

export interface Insight {
  id: string;
  type: InsightType;
  title?: string;
  message: string;
  timestamp?: Date | string;
  actionLabel?: string;
  actionData?: any;
  dismissed?: boolean;
}

export interface InsightsCardProps {
  /** List of insights to display */
  insights: Insight[];
  /** Handler when insight is pressed */
  onInsightPress?: (insight: Insight) => void;
  /** Handler when insight is dismissed */
  onDismiss?: (id: string) => void;
  /** Handler for refresh button */
  onRefresh?: () => void;
  /** Whether insights are loading */
  isLoading?: boolean;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
  /** Maximum insights to show */
  maxInsights?: number;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INSIGHT_CONFIG: Record<InsightType, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}> = {
  tip: {
    icon: 'bulb-outline',
    color: '#FF9500',
    bgColor: '#FFF7E6',
    label: 'Tip',
  },
  suggestion: {
    icon: 'compass-outline',
    color: colors.primary[500],
    bgColor: colors.primary[50],
    label: 'Suggestion',
  },
  achievement: {
    icon: 'trophy-outline',
    color: colors.success[500],
    bgColor: colors.success[50],
    label: 'Achievement',
  },
  warning: {
    icon: 'alert-circle-outline',
    color: colors.warning[600],
    bgColor: colors.warning[50],
    label: 'Heads up',
  },
  reminder: {
    icon: 'time-outline',
    color: '#5856D6',
    bgColor: '#F3F0FF',
    label: 'Reminder',
  },
  ai: {
    icon: 'sparkles',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    label: 'AI Insight',
  },
};

// ============================================================================
// SKELETON LOADER
// ============================================================================

export const InsightsCardSkeleton: React.FC = memo(() => (
  <View className="bg-white rounded-2xl p-4 shadow-sm">
    {/* Header skeleton */}
    <View className="flex-row justify-between items-center mb-4">
      <View className="flex-row items-center">
        <View className="w-5 h-5 bg-gray-200 rounded mr-2" />
        <View className="w-24 h-6 bg-gray-200 rounded-lg" />
      </View>
      <View className="w-8 h-8 bg-gray-200 rounded-full" />
    </View>

    {/* Insights skeleton */}
    {[1, 2].map((i) => (
      <View key={i} className="mb-3 p-3 bg-gray-50 rounded-xl">
        <View className="flex-row items-start">
          <View className="w-10 h-10 bg-gray-200 rounded-full mr-3" />
          <View className="flex-1">
            <View className="w-16 h-3 bg-gray-200 rounded mb-2" />
            <View className="w-full h-4 bg-gray-200 rounded mb-1" />
            <View className="w-3/4 h-4 bg-gray-200 rounded" />
          </View>
        </View>
      </View>
    ))}
  </View>
));

InsightsCardSkeleton.displayName = 'InsightsCardSkeleton';

// ============================================================================
// INSIGHT ITEM COMPONENT
// ============================================================================

interface InsightItemProps {
  insight: Insight;
  onPress?: () => void;
  onDismiss?: () => void;
  index: number;
}

const InsightItem: React.FC<InsightItemProps> = memo(({
  insight,
  onPress,
  onDismiss,
  index,
}) => {
  const config = INSIGHT_CONFIG[insight.type];

  // Animation for achievements
  const celebrationScale = useSharedValue(1);

  useEffect(() => {
    if (insight.type === 'achievement') {
      celebrationScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        3,
        true
      );
    }
  }, [insight.type, celebrationScale]);

  const itemStyle = useAnimatedStyle(() => ({
    transform: insight.type === 'achievement'
      ? [{ scale: celebrationScale.value }]
      : [],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(300)}
      style={itemStyle}
    >
      <Pressable
        onPress={onPress}
        className="mb-3 last:mb-0"
        accessibilityRole="button"
        accessibilityLabel={`${config.label}: ${insight.message}`}
      >
        <View
          className="p-3 rounded-xl flex-row"
          style={{ backgroundColor: config.bgColor }}
        >
          {/* Icon */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Ionicons
              name={config.icon as any}
              size={20}
              color={config.color}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            {/* Type label */}
            <Text
              className="text-xs font-semibold mb-1"
              style={{ color: config.color }}
            >
              {insight.title || config.label}
            </Text>

            {/* Message */}
            <Text className="text-gray-800 text-sm leading-5">
              {insight.message}
            </Text>

            {/* Action button */}
            {insight.actionLabel && (
              <Pressable
                onPress={onPress}
                className="flex-row items-center mt-2"
                accessibilityRole="button"
              >
                <Text
                  className="text-sm font-medium mr-1"
                  style={{ color: config.color }}
                >
                  {insight.actionLabel}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={config.color}
                />
              </Pressable>
            )}
          </View>

          {/* Dismiss button */}
          {onDismiss && (
            <Pressable
              onPress={onDismiss}
              className="p-1 ml-2"
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Dismiss insight"
            >
              <Ionicons
                name="close"
                size={16}
                color={colors.gray[400]}
              />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

InsightItem.displayName = 'InsightItem';

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC<{ onRefresh?: () => void }> = memo(({ onRefresh }) => (
  <View className="items-center py-6">
    <View className="w-14 h-14 rounded-full bg-primary-50 items-center justify-center mb-3">
      <Ionicons name="sparkles" size={24} color={colors.primary[500]} />
    </View>
    <Text className="text-gray-600 font-medium mb-1">All caught up!</Text>
    <Text className="text-gray-400 text-sm text-center mb-3">
      No new insights right now.{'\n'}Check back later!
    </Text>
    {onRefresh && (
      <Pressable
        onPress={onRefresh}
        className="px-4 py-2 bg-primary-50 rounded-lg active:bg-primary-100"
        accessibilityRole="button"
        accessibilityLabel="Generate new insights"
      >
        <Text className="text-primary-600 font-medium">Generate Insights</Text>
      </Pressable>
    )}
  </View>
));

EmptyState.displayName = 'EmptyState';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const InsightsCard: React.FC<InsightsCardProps> = memo(({
  insights,
  onInsightPress,
  onDismiss,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  maxInsights = 3,
  className = '',
}) => {
  // Filter out dismissed insights
  const activeInsights = insights
    .filter(i => !i.dismissed)
    .slice(0, maxInsights);

  // Refresh animation
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      );
    } else {
      rotation.value = withTiming(0);
    }
  }, [isRefreshing, rotation]);

  const refreshIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleInsightPress = useCallback((insight: Insight) => {
    onInsightPress?.(insight);
  }, [onInsightPress]);

  const handleDismiss = useCallback((id: string) => {
    onDismiss?.(id);
  }, [onDismiss]);

  if (isLoading) {
    return <InsightsCardSkeleton />;
  }

  return (
    <View className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons
            name="sparkles"
            size={18}
            color={colors.primary[500]}
            style={{ marginRight: 6 }}
          />
          <Text className="text-gray-900 font-semibold text-lg">
            Insights
          </Text>
          {activeInsights.length > 0 && (
            <View className="bg-primary-500 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-xs font-semibold">
                {activeInsights.length}
              </Text>
            </View>
          )}
        </View>

        {/* Refresh button */}
        {onRefresh && (
          <Pressable
            onPress={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
            accessibilityRole="button"
            accessibilityLabel="Refresh insights"
          >
            <Animated.View style={refreshIconStyle}>
              <Ionicons
                name="refresh"
                size={18}
                color={isRefreshing ? colors.primary[500] : colors.gray[600]}
              />
            </Animated.View>
          </Pressable>
        )}
      </View>

      {/* Insights list */}
      {activeInsights.length > 0 ? (
        <View>
          {activeInsights.map((insight, index) => (
            <InsightItem
              key={insight.id}
              insight={insight}
              onPress={() => handleInsightPress(insight)}
              onDismiss={onDismiss ? () => handleDismiss(insight.id) : undefined}
              index={index}
            />
          ))}
        </View>
      ) : (
        <EmptyState onRefresh={onRefresh} />
      )}

      {/* More insights indicator */}
      {insights.filter(i => !i.dismissed).length > maxInsights && (
        <Pressable
          onPress={() => {/* Navigate to all insights */}}
          className="mt-2 py-2 items-center"
          accessibilityRole="button"
        >
          <Text className="text-primary-500 text-sm font-medium">
            +{insights.filter(i => !i.dismissed).length - maxInsights} more insight{insights.filter(i => !i.dismissed).length - maxInsights > 1 ? 's' : ''}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

InsightsCard.displayName = 'InsightsCard';

export default InsightsCard;
