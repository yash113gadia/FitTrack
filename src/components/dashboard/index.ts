/**
 * Dashboard Components
 *
 * Specialized components for the Dashboard screen.
 * Each component is designed for a specific dashboard feature.
 */

// Macro overview with circular progress rings
export { MacroOverview, MacroOverviewSkeleton } from './MacroOverview';
export type { MacroOverviewProps } from './MacroOverview';

// Streak counter with calendar view
export { StreakCounter, StreakCounterSkeleton } from './StreakCounter';
export type { StreakCounterProps } from './StreakCounter';

// Quick add floating action button
export { QuickAddFAB } from './QuickAddFAB';
export type { QuickAddFABProps } from './QuickAddFAB';

// Daily summary with date navigation
export { DailySummary, DailySummarySkeleton } from './DailySummary';
export type { DailySummaryProps } from './DailySummary';

// Recent meals list with swipe-to-delete
export { RecentMealsList, RecentMealsListSkeleton } from './RecentMealsList';
export type { RecentMealsListProps, RecentMeal } from './RecentMealsList';

// AI-powered insights card
export { InsightsCard, InsightsCardSkeleton } from './InsightsCard';
export type { InsightsCardProps, Insight, InsightType } from './InsightsCard';
