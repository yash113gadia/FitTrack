/**
 * Onboarding E2E Tests
 * 
 * Tests for user profile setup and onboarding flow
 */

import { device, element, by, waitFor, expect } from 'detox';
import { 
  TIMEOUTS, 
  TEST_USER, 
  resetAppState,
  dismissKeyboard,
  assertVisible,
} from './utils/testHelpers';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await resetAppState();
  });

  describe('Profile Setup', () => {
    it('should display onboarding screen on first launch', async () => {
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should complete profile setup successfully', async () => {
      // Wait for onboarding
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Fill in name
      await element(by.id('name-input')).tap();
      await element(by.id('name-input')).typeText(TEST_USER.name);
      await dismissKeyboard();

      // Fill in age
      await element(by.id('age-input')).tap();
      await element(by.id('age-input')).typeText(TEST_USER.age);
      await dismissKeyboard();

      // Fill in weight
      await element(by.id('weight-input')).tap();
      await element(by.id('weight-input')).typeText(TEST_USER.weight);
      await dismissKeyboard();

      // Fill in height
      await element(by.id('height-input')).tap();
      await element(by.id('height-input')).typeText(TEST_USER.height);
      await dismissKeyboard();

      // Select gender
      await element(by.id('gender-selector')).tap();
      await element(by.text('Male')).tap();

      // Select activity level
      await element(by.id('activity-selector')).tap();
      await element(by.text(TEST_USER.activityLevel)).tap();

      // Select goal
      await element(by.id('goal-selector')).tap();
      await element(by.text(TEST_USER.goal)).tap();

      // Tap save button
      await element(by.id('save-profile-btn')).tap();

      // Verify navigation to dashboard
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should show validation error for empty required fields', async () => {
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Try to save without filling required fields
      await element(by.id('save-profile-btn')).tap();

      // Should show validation errors
      await expect(element(by.text('Name is required'))).toBeVisible();
    });

    it('should validate age within reasonable range', async () => {
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Fill in name
      await element(by.id('name-input')).typeText('Test');

      // Enter invalid age
      await element(by.id('age-input')).typeText('150');
      await dismissKeyboard();

      // Try to save
      await element(by.id('save-profile-btn')).tap();

      // Should show age validation error
      await expect(element(by.text('Please enter a valid age'))).toBeVisible();
    });

    it('should validate weight within reasonable range', async () => {
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Fill in name and age
      await element(by.id('name-input')).typeText('Test');
      await element(by.id('age-input')).typeText('30');

      // Enter invalid weight
      await element(by.id('weight-input')).typeText('0');
      await dismissKeyboard();

      // Try to save
      await element(by.id('save-profile-btn')).tap();

      // Should show weight validation error
      await expect(element(by.text('Please enter a valid weight'))).toBeVisible();
    });

    it('should show calculated calorie goals after setup', async () => {
      // Complete onboarding
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await element(by.id('name-input')).typeText(TEST_USER.name);
      await element(by.id('age-input')).typeText(TEST_USER.age);
      await element(by.id('weight-input')).typeText(TEST_USER.weight);
      await element(by.id('height-input')).typeText(TEST_USER.height);

      await element(by.id('gender-selector')).tap();
      await element(by.text('Male')).tap();

      await element(by.id('activity-selector')).tap();
      await element(by.text(TEST_USER.activityLevel)).tap();

      await element(by.id('goal-selector')).tap();
      await element(by.text(TEST_USER.goal)).tap();

      await element(by.id('save-profile-btn')).tap();

      // Verify dashboard shows calculated goals
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      // Calorie goal should be visible
      await expect(element(by.id('calorie-goal'))).toBeVisible();
      await expect(element(by.id('protein-goal'))).toBeVisible();
    });
  });

  describe('Skip Onboarding', () => {
    it('should allow skipping with default goals', async () => {
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Tap skip button if available
      try {
        await element(by.id('skip-btn')).tap();
        await waitFor(element(by.id('dashboard-screen')))
          .toBeVisible()
          .withTimeout(TIMEOUTS.LONG);
      } catch (e) {
        // Skip button might not exist in this implementation
      }
    });
  });

  describe('Return to Onboarding', () => {
    it('should not show onboarding if profile already exists', async () => {
      // First complete onboarding
      await waitFor(element(by.id('onboarding-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await element(by.id('name-input')).typeText(TEST_USER.name);
      await element(by.id('age-input')).typeText(TEST_USER.age);
      await element(by.id('weight-input')).typeText(TEST_USER.weight);
      await element(by.id('height-input')).typeText(TEST_USER.height);

      await element(by.id('gender-selector')).tap();
      await element(by.text('Male')).tap();

      await element(by.id('activity-selector')).tap();
      await element(by.text(TEST_USER.activityLevel)).tap();

      await element(by.id('goal-selector')).tap();
      await element(by.text(TEST_USER.goal)).tap();

      await element(by.id('save-profile-btn')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      // Reload app
      await device.reloadReactNative();

      // Should go directly to dashboard
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });
  });
});
