/**
 * Analytics Module Exports
 * 
 * Centralized exports for all analytics functionality
 */

// Core Analytics Service
export {
  Analytics,
  type AnalyticsEventType,
  type AnalyticsEvent,
  type ScreenViewEvent,
  type PerformanceMetric,
  type ConsentSettings,
  type UserProperties,
} from '../services/analytics';

// React Hooks
export {
  useAnalytics,
  useScreenTracking,
  usePerformanceTracking,
  useEventTracking,
  useNavigationTracking,
} from '../hooks/useAnalytics';
export { default as AnalyticsProvider } from '../hooks/useAnalytics';

// Components
export { AnalyticsDashboard } from '../components/dashboard/AnalyticsDashboard';
