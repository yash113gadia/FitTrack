/**
 * E2E Test Utilities
 * 
 * Helper functions and utilities for Detox E2E tests
 */

import { device, element, by, waitFor, expect } from 'detox';

// ============================================
// CONSTANTS
// ============================================

export const TIMEOUTS = {
  SHORT: 2000,
  MEDIUM: 5000,
  LONG: 10000,
  VERY_LONG: 30000,
};

export const TEST_USER = {
  name: 'Test User',
  age: '30',
  weight: '75',
  height: '175',
  activityLevel: 'Moderately Active',
  goal: 'Maintain Weight',
};

export const TEST_FOOD = {
  name: 'Chicken Breast',
  calories: '165',
  protein: '31',
  carbs: '0',
  fats: '3.6',
  servingSize: '100',
  servingUnit: 'g',
};

// ============================================
// NAVIGATION HELPERS
// ============================================

export const navigateTo = {
  dashboard: async () => {
    await element(by.id('dashboard-tab')).tap();
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUTS.MEDIUM);
  },

  logFood: async () => {
    await element(by.id('log-food-tab')).tap();
    await waitFor(element(by.id('log-food-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUTS.MEDIUM);
  },

  history: async () => {
    await element(by.id('history-tab')).tap();
    await waitFor(element(by.id('history-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUTS.MEDIUM);
  },

  chatbot: async () => {
    await element(by.id('chatbot-tab')).tap();
    await waitFor(element(by.id('chatbot-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUTS.MEDIUM);
  },

  profile: async () => {
    await element(by.id('profile-tab')).tap();
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUTS.MEDIUM);
  },
};

// ============================================
// ACTION HELPERS
// ============================================

/**
 * Complete the onboarding flow with test user data
 */
export const completeOnboarding = async (user = TEST_USER) => {
  // Wait for onboarding screen
  await waitFor(element(by.id('onboarding-screen')))
    .toBeVisible()
    .withTimeout(TIMEOUTS.MEDIUM);

  // Fill in user details
  await element(by.id('name-input')).typeText(user.name);
  await element(by.id('age-input')).typeText(user.age);
  await element(by.id('weight-input')).typeText(user.weight);
  await element(by.id('height-input')).typeText(user.height);

  // Select activity level
  await element(by.id('activity-selector')).tap();
  await element(by.text(user.activityLevel)).tap();

  // Select goal
  await element(by.id('goal-selector')).tap();
  await element(by.text(user.goal)).tap();

  // Save profile
  await element(by.id('save-profile-btn')).tap();

  // Wait for dashboard
  await waitFor(element(by.id('dashboard-screen')))
    .toBeVisible()
    .withTimeout(TIMEOUTS.LONG);
};

/**
 * Log a food item manually
 */
export const logFoodManually = async (food = TEST_FOOD) => {
  // Open quick add menu
  await element(by.id('quick-add-fab')).tap();
  await element(by.text('Manual Entry')).tap();

  // Wait for manual entry form
  await waitFor(element(by.id('manual-entry-form')))
    .toBeVisible()
    .withTimeout(TIMEOUTS.MEDIUM);

  // Fill in food details
  await element(by.id('food-name-input')).typeText(food.name);
  await element(by.id('calories-input')).typeText(food.calories);
  await element(by.id('protein-input')).typeText(food.protein);
  await element(by.id('carbs-input')).typeText(food.carbs);
  await element(by.id('fats-input')).typeText(food.fats);

  // Select meal type
  await element(by.id('meal-type-selector')).tap();
  await element(by.text('Lunch')).tap();

  // Save food
  await element(by.id('save-food-btn')).tap();

  // Wait for success
  await waitFor(element(by.text('Food logged successfully')))
    .toBeVisible()
    .withTimeout(TIMEOUTS.MEDIUM);
};

/**
 * Search and select a food item
 */
export const searchAndSelectFood = async (searchTerm: string) => {
  await element(by.id('food-search-input')).typeText(searchTerm);
  await waitFor(element(by.id('search-results')))
    .toBeVisible()
    .withTimeout(TIMEOUTS.MEDIUM);
  
  // Tap first result
  await element(by.id('search-result-0')).tap();
};

/**
 * Dismiss keyboard if visible
 */
export const dismissKeyboard = async () => {
  try {
    if (device.getPlatform() === 'ios') {
      await element(by.id('keyboard-dismiss-area')).tap();
    } else {
      await device.pressBack();
    }
  } catch (e) {
    // Keyboard might not be visible
  }
};

/**
 * Scroll to element
 */
export const scrollToElement = async (elementId: string, scrollViewId: string, direction: 'up' | 'down' = 'down') => {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(200, direction);
};

/**
 * Take a screenshot for debugging
 */
export const takeScreenshot = async (name: string) => {
  await device.takeScreenshot(name);
};

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Assert element is visible
 */
export const assertVisible = async (elementId: string, timeout = TIMEOUTS.MEDIUM) => {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout);
};

/**
 * Assert element is not visible
 */
export const assertNotVisible = async (elementId: string) => {
  await expect(element(by.id(elementId))).not.toBeVisible();
};

/**
 * Assert element has text
 */
export const assertHasText = async (elementId: string, text: string) => {
  await expect(element(by.id(elementId))).toHaveText(text);
};

/**
 * Assert element contains text
 */
export const assertContainsText = async (text: string, timeout = TIMEOUTS.MEDIUM) => {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
};

// ============================================
// SETUP / TEARDOWN HELPERS
// ============================================

/**
 * Reset app state before test
 */
export const resetAppState = async () => {
  await device.launchApp({ delete: true });
};

/**
 * Reload app without deleting data
 */
export const reloadApp = async () => {
  await device.reloadReactNative();
};

/**
 * Clear async storage (if needed)
 */
export const clearStorage = async () => {
  await device.launchApp({ delete: true, newInstance: true });
};

// ============================================
// MOCK HELPERS
// ============================================

/**
 * Mock successful API response
 */
export const mockAPISuccess = async () => {
  // This would integrate with a mock server or MSW
  // For now, this is a placeholder
};

/**
 * Mock API failure
 */
export const mockAPIFailure = async () => {
  // This would integrate with a mock server or MSW
  // For now, this is a placeholder
};

/**
 * Simulate network offline
 */
export const goOffline = async () => {
  await device.setStatusBar({
    dataNetwork: 'hide',
  });
  // Note: Actual network disconnection would require additional setup
};

/**
 * Simulate network online
 */
export const goOnline = async () => {
  await device.setStatusBar({
    dataNetwork: 'wifi',
  });
};
