/**
 * Analytics Dashboard Component
 *
 * Displays privacy-focused analytics metrics for app administrators
 * Shows aggregated, anonymized data only
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { Analytics, AnalyticsEvent, AnalyticsEventType } from '../../services/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface UsageMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  totalEvents: number;
  uniqueScreens: number;
  topScreens: { screen: string; views: number }[];
  topEvents: { event: string; count: number }[];
  averageApiLatency: number;
  errorRate: number;
  featureUsage: { feature: string; usage: number }[];
}

interface TimeRange {
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Today', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: 'All Time', days: -1 },
];

// MetricCard Component
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}) => (
  <View style={[styles.metricCard, { borderLeftColor: color }]}>
    <View style={styles.metricIconContainer}>
      <View style={[styles.metricIconBg, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
    </View>
    <View style={styles.metricContent}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.isPositive ? colors.success[500] : colors.error[500]}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? colors.success[500] : colors.error[500] },
            ]}
          >
            {Math.abs(trend.value)}%
          </Text>
        </View>
      )}
    </View>
  </View>
);

// BarChart Component (Simple implementation)
interface BarChartProps {
  data: { label: string; value: number }[];
  color: string;
  maxBars?: number;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ data, color, maxBars = 5 }) => {
  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map((d) => d.value), 1);

  return (
    <View style={styles.barChartContainer}>
      {displayData.map((item, index) => (
        <View key={index} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={styles.barValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

// Time Range Selector
interface TimeRangeSelectorProps {
  selected: number;
  onSelect: (days: number) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ selected, onSelect }) => (
  <View style={styles.timeRangeContainer}>
    {TIME_RANGES.map((range) => (
      <View
        key={range.days}
        style={[
          styles.timeRangeButton,
          selected === range.days && styles.timeRangeButtonSelected,
        ]}
        onTouchEnd={() => onSelect(range.days)}
      >
        <Text
          style={[
            styles.timeRangeText,
            selected === range.days && styles.timeRangeTextSelected,
          ]}
        >
          {range.label}
        </Text>
      </View>
    ))}
  </View>
);

// Main Dashboard Component
export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const calculateMetrics = useCallback(async () => {
    try {
      // Get events from Analytics (this would typically come from a backend)
      const events = await getLocalEvents();
      const now = Date.now();
      const rangeMs = timeRange === -1 ? Infinity : timeRange * 24 * 60 * 60 * 1000;

      const filteredEvents = events.filter(
        (e) => timeRange === -1 || now - e.timestamp < rangeMs
      );

      // Calculate session metrics
      const sessionEvents = filteredEvents.filter(
        (e) => e.type === 'app_open' || e.type === 'app_close'
      );
      const sessionStarts = sessionEvents.filter((e) => e.type === 'app_open');
      const totalSessions = sessionStarts.length;

      // Calculate average session duration
      let totalDuration = 0;
      let completeSessions = 0;
      sessionStarts.forEach((start) => {
        const end = sessionEvents.find(
          (e) =>
            e.type === 'app_close' &&
            e.sessionId === start.sessionId
        );
        if (end) {
          totalDuration += end.timestamp - start.timestamp;
          completeSessions++;
        }
      });
      const averageSessionDuration =
        completeSessions > 0 ? totalDuration / completeSessions / 1000 / 60 : 0;

      // Calculate screen views
      const screenViews = filteredEvents.filter((e) => e.type === 'screen_view');
      const screenCounts: Record<string, number> = {};
      screenViews.forEach((e) => {
        const screen = e.properties?.screenName || 'Unknown';
        screenCounts[screen] = (screenCounts[screen] || 0) + 1;
      });
      const topScreens = Object.entries(screenCounts)
        .map(([screen, views]) => ({ screen, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Calculate top events (excluding screen_view and session events)
      const userEvents = filteredEvents.filter(
        (e) =>
          !['screen_view', 'app_open', 'app_close', 'performance_metric'].includes(e.type)
      );
      const eventCounts: Record<string, number> = {};
      userEvents.forEach((e) => {
        eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
      });
      const topEvents = Object.entries(eventCounts)
        .map(([event, count]) => ({ event, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate average API latency
      const timingEvents = filteredEvents.filter(
        (e) => e.type === 'performance_metric' && e.properties?.category === 'api_response'
      );
      const avgLatency =
        timingEvents.length > 0
          ? timingEvents.reduce((sum, e) => sum + (e.properties?.duration || 0), 0) /
            timingEvents.length
          : 0;

      // Calculate error rate
      const errorEvents = filteredEvents.filter(
        (e) => e.type === 'error_occurred' || e.type === 'crash_detected'
      );
      const errorRate =
        filteredEvents.length > 0 ? (errorEvents.length / filteredEvents.length) * 100 : 0;

      // Calculate feature usage
      const featureTypes: AnalyticsEventType[] = [
        'food_logged',
        'barcode_scanned',
        'goal_achieved',
        'chatbot_message_sent',
        'ai_scan_used',
      ];
      const featureEvents = filteredEvents.filter((e) =>
        featureTypes.includes(e.type)
      );
      const featureCounts: Record<string, number> = {};
      featureEvents.forEach((e) => {
        featureCounts[e.type] = (featureCounts[e.type] || 0) + 1;
      });
      const featureUsage = Object.entries(featureCounts)
        .map(([feature, usage]) => ({ feature: formatFeatureName(feature), usage }))
        .sort((a, b) => b.usage - a.usage);

      setMetrics({
        totalSessions,
        averageSessionDuration,
        totalEvents: filteredEvents.length,
        uniqueScreens: Object.keys(screenCounts).length,
        topScreens,
        topEvents,
        averageApiLatency: avgLatency,
        errorRate,
        featureUsage,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    }
  }, [timeRange]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await calculateMetrics();
      setLoading(false);
    };
    loadData();
  }, [calculateMetrics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await calculateMetrics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error[500]} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary[500]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Privacy-focused usage insights</Text>
      </View>

      {/* Time Range Selector */}
      <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Ionicons name="shield-checkmark" size={16} color={colors.success[600]} />
        <Text style={styles.privacyText}>
          All data is anonymized and stored locally on your device
        </Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Total Sessions"
          value={metrics?.totalSessions || 0}
          icon="people-outline"
          color={colors.primary[500]}
        />
        <MetricCard
          title="Avg Session"
          value={`${(metrics?.averageSessionDuration || 0).toFixed(1)}m`}
          icon="time-outline"
          color={colors.warning[500]}
        />
        <MetricCard
          title="Total Events"
          value={metrics?.totalEvents || 0}
          icon="analytics-outline"
          color={colors.success[500]}
        />
        <MetricCard
          title="Error Rate"
          value={`${(metrics?.errorRate || 0).toFixed(1)}%`}
          icon="bug-outline"
          color={metrics?.errorRate && metrics.errorRate > 5 ? colors.error[500] : colors.success[500]}
        />
      </View>

      {/* Top Screens */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.gray[700]} />
          <Text style={styles.sectionTitle}>Top Screens</Text>
        </View>
        <SimpleBarChart
          data={
            metrics?.topScreens.map((s) => ({
              label: formatScreenName(s.screen),
              value: s.views,
            })) || []
          }
          color={colors.primary[500]}
        />
      </View>

      {/* Top Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={20} color={colors.gray[700]} />
          <Text style={styles.sectionTitle}>Top Events</Text>
        </View>
        <SimpleBarChart
          data={
            metrics?.topEvents.map((e) => ({
              label: formatEventName(e.event),
              value: e.count,
            })) || []
          }
          color={colors.warning[500]}
        />
      </View>

      {/* Feature Usage */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="apps-outline" size={20} color={colors.gray[700]} />
          <Text style={styles.sectionTitle}>Feature Usage</Text>
        </View>
        <SimpleBarChart
          data={
            metrics?.featureUsage.map((f) => ({
              label: f.feature,
              value: f.usage,
            })) || []
          }
          color={colors.macros.protein}
        />
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="speedometer-outline" size={20} color={colors.gray[700]} />
          <Text style={styles.sectionTitle}>Performance</Text>
        </View>
        <View style={styles.performanceCard}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Avg API Latency</Text>
            <Text
              style={[
                styles.performanceValue,
                {
                  color:
                    (metrics?.averageApiLatency || 0) > 1000
                      ? colors.error[500]
                      : colors.success[500],
                },
              ]}
            >
              {(metrics?.averageApiLatency || 0).toFixed(0)}ms
            </Text>
          </View>
          <View style={styles.performanceDivider} />
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Unique Screens</Text>
            <Text style={styles.performanceValue}>{metrics?.uniqueScreens || 0}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data collected with user consent. No personal information is tracked.
        </Text>
      </View>
    </ScrollView>
  );
};

// Helper functions
const formatScreenName = (screen: string): string => {
  return screen
    .replace(/Screen$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
};

const formatEventName = (event: string): string => {
  return event
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatFeatureName = (feature: string): string => {
  const featureNames: Record<string, string> = {
    food_logged: 'Food Logging',
    barcode_scanned: 'Barcode Scanner',
    goal_achieved: 'Goals Achieved',
    chatbot_message_sent: 'AI Chatbot',
    ai_scan_used: 'AI Food Scan',
  };
  return featureNames[feature] || formatEventName(feature);
};

// Get local events from Analytics export
const getLocalEvents = async (): Promise<AnalyticsEvent[]> => {
  try {
    const userData = await Analytics.exportUserData() as { events?: AnalyticsEvent[] };
    return userData.events || [];
  } catch {
    return [];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.error[600],
    textAlign: 'center',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeButtonSelected: {
    backgroundColor: colors.primary[500],
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  timeRangeTextSelected: {
    color: colors.white,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  privacyText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.success[700],
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconContainer: {
    marginBottom: 8,
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricContent: {},
  metricTitle: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricSubtitle: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginLeft: 8,
  },
  barChartContainer: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    color: colors.gray[700],
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4,
  },
  barValue: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'right',
  },
  performanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  performanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AnalyticsDashboard;
