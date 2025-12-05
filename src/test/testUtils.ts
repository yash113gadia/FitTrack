/**
 * Test Utilities and Helpers
 * 
 * Provides mock data factories and test helpers for FitTrack tests.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import {
  UserProfile,
  FoodItem,
  FoodLog,
  DailySummary,
  DailyGoals,
  Reminder,
  StreakData,
} from '../types';

// ============================================
// MOCK DATA FACTORIES
// ============================================

let mockIdCounter = 1;

/**
 * Create a mock user profile
 */
export const createMockUser = (overrides?: Partial<UserProfile>): UserProfile => ({
  id: mockIdCounter++,
  name: 'Test User',
  gender: 'male',
  age: 30,
  weight: 75,
  height: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  dailyCalorieGoal: 2200,
  dailyProteinGoal: 150,
  dailyFatGoal: 73,
  dailyCarbGoal: 220,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock food item
 */
export const createMockFoodItem = (overrides?: Partial<FoodItem>): FoodItem => ({
  id: mockIdCounter++,
  name: 'Test Food',
  servingSize: 100,
  servingUnit: 'g',
  calories: 200,
  protein: 20,
  fats: 10,
  carbs: 15,
  fiber: 3,
  sugar: 5,
  source: 'manual',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock food log
 */
export const createMockFoodLog = (overrides?: Partial<FoodLog>): FoodLog => ({
  id: mockIdCounter++,
  userId: 1,
  foodItemId: 1,
  quantity: 1,
  mealType: 'lunch',
  loggedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock daily summary
 */
export const createMockDailySummary = (overrides?: Partial<DailySummary>): DailySummary => ({
  date: new Date().toISOString().split('T')[0],
  totalCalories: 1500,
  totalProtein: 100,
  totalFats: 50,
  totalCarbs: 150,
  goalsMetCalories: false,
  goalsMetProtein: false,
  completionPercentage: 68,
  ...overrides,
});

/**
 * Create mock daily goals
 */
export const createMockDailyGoals = (overrides?: Partial<DailyGoals>): DailyGoals => ({
  calories: 2200,
  protein: 150,
  fats: 73,
  carbs: 220,
  ...overrides,
});

/**
 * Create a mock reminder
 */
export const createMockReminder = (overrides?: Partial<Reminder>): Reminder => ({
  id: mockIdCounter++,
  userId: 1,
  type: 'meal',
  title: 'Lunch Reminder',
  time: '12:00',
  days: [1, 2, 3, 4, 5],
  enabled: true,
  ...overrides,
});

/**
 * Create mock streak data
 */
export const createMockStreakData = (overrides?: Partial<StreakData>): StreakData => ({
  currentStreak: 5,
  longestStreak: 10,
  lastLogDate: new Date().toISOString().split('T')[0],
  streakHistory: [],
  ...overrides,
});

// ============================================
// DATE HELPERS
// ============================================

/**
 * Get a date string for N days ago
 */
export const getDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * Get today's date string
 */
export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get a date string for N days from now
 */
export const getDaysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// ============================================
// RENDER HELPERS
// ============================================

/**
 * Custom render function that wraps components with necessary providers
 */
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add providers here as needed (e.g., ThemeProvider, StoreProvider)
  return React.createElement(React.Fragment, null, children);
};

export const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';
export { customRender as render };

// ============================================
// ASYNC HELPERS
// ============================================

/**
 * Wait for a specified amount of time
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Flush all promises in the queue
 */
export const flushPromises = (): Promise<void> => {
  return new Promise((resolve) => setImmediate(resolve));
};

// ============================================
// MOCK FUNCTION HELPERS
// ============================================

/**
 * Create a mock function that resolves after a delay
 */
export const createDelayedMock = <T>(value: T, delay: number = 100) => {
  return jest.fn().mockImplementation(() => 
    new Promise((resolve) => setTimeout(() => resolve(value), delay))
  );
};

/**
 * Create a mock function that rejects with an error
 */
export const createErrorMock = (message: string = 'Mock error') => {
  return jest.fn().mockRejectedValue(new Error(message));
};

// ============================================
// RESET HELPERS
// ============================================

/**
 * Reset the mock ID counter (call in beforeEach)
 */
export const resetMockIds = (): void => {
  mockIdCounter = 1;
};
