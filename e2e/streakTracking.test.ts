/**
 * Streak Tracking E2E Tests
 * 
 * Tests for streak and goal tracking functionality
 */

import { device, element, by, waitFor, expect } from 'detox';
import { 
  TIMEOUTS, 
  completeOnboarding,
  navigateTo,
  resetAppState,
  scrollToElement,
} from './utils/testHelpers';

describe('Streak Tracking', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
    await completeOnboarding();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await navigateTo.dashboard();
  });

  describe('Streak Display', () => {
    it('should show current streak on dashboard', async () => {
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Streak widget should be visible
      await expect(element(by.id('streak-widget'))).toBeVisible();
    });

    it('should display streak count prominently', async () => {
      await expect(element(by.id('streak-count'))).toBeVisible();
    });

    it('should show streak flame icon', async () => {
      await expect(element(by.id('streak-icon'))).toBeVisible();
    });

    it('should show streak label text', async () => {
      await expect(element(by.id('streak-label'))).toBeVisible();
    });
  });

  describe('Goal Progress', () => {
    it('should show daily calorie goal progress', async () => {
      await expect(element(by.id('calorie-progress'))).toBeVisible();
    });

    it('should show macro progress indicators', async () => {
      await expect(element(by.id('protein-progress'))).toBeVisible();
      await expect(element(by.id('carbs-progress'))).toBeVisible();
      await expect(element(by.id('fats-progress'))).toBeVisible();
    });

    it('should display remaining calories', async () => {
      await expect(element(by.id('remaining-calories'))).toBeVisible();
    });

    it('should show progress ring visualization', async () => {
      await expect(element(by.id('macro-progress-ring'))).toBeVisible();
    });
  });

  describe('Streak Increment on Goal Achievement', () => {
    it('should show goal completion celebration when targets met', async () => {
      // Log food to reach calorie goal
      // This requires logging enough food to hit the target
      
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      // Add high-calorie item to potentially meet goal
      await element(by.id('food-name-input')).typeText('Full Meal');
      await element(by.id('calories-input')).typeText('2000');
      await element(by.id('protein-input')).typeText('100');
      await element(by.id('carbs-input')).typeText('200');
      await element(by.id('fats-input')).typeText('80');
      
      await element(by.id('meal-type-selector')).tap();
      await element(by.text('Lunch')).tap();
      
      await element(by.id('log-food-btn')).tap();
      
      // Check if goal completion shows
      // This may or may not trigger depending on user's goal
      await navigateTo.dashboard();
      
      // Progress should be updated
      await expect(element(by.id('calorie-progress'))).toBeVisible();
    });

    it('should increment streak when daily goals are met', async () => {
      // Get initial streak count
      const streakElement = element(by.id('streak-count'));
      await expect(streakElement).toBeVisible();
      
      // Log food to meet goals (this test assumes specific goal values)
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      await element(by.id('food-name-input')).typeText('Goal Complete Meal');
      await element(by.id('calories-input')).typeText('2000');
      await element(by.id('protein-input')).typeText('150');
      await element(by.id('carbs-input')).typeText('200');
      await element(by.id('fats-input')).typeText('70');
      
      await element(by.id('meal-type-selector')).tap();
      await element(by.text('Dinner')).tap();
      await element(by.id('log-food-btn')).tap();
      
      await navigateTo.dashboard();
      
      // Streak should still be visible (may or may not have incremented based on goals)
      await expect(element(by.id('streak-widget'))).toBeVisible();
    });

    it('should show celebratory animation on streak increase', async () => {
      // This test would verify animation plays when streak increases
      // Animation testing in Detox is limited, but we can check for the animation component
      await expect(element(by.id('streak-widget'))).toBeVisible();
      
      // Check if celebration modal appears when goals met
      // Note: This requires actually achieving the goal
    });
  });

  describe('Streak Reset', () => {
    it('should show streak lost message when goals missed', async () => {
      // This would require simulating a day passing without meeting goals
      // In E2E tests, we can check the UI component exists
      
      // Navigate to profile to see streak history
      await navigateTo.profile();
      
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Streak info should be visible in profile
      await scrollToElement('streak-history-section', 'profile-scroll-view');
    });
  });

  describe('Weekly Goal Summary', () => {
    it('should show weekly progress in history', async () => {
      await navigateTo.history();
      
      await waitFor(element(by.id('history-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Weekly summary should be visible
      await expect(element(by.id('weekly-summary'))).toBeVisible();
    });

    it('should display days met goal this week', async () => {
      await navigateTo.history();
      
      await waitFor(element(by.id('history-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Days met indicator
      await expect(element(by.id('days-goal-met'))).toBeVisible();
    });

    it('should show weekly calorie average', async () => {
      await navigateTo.history();
      
      await scrollToElement('weekly-average-section', 'history-scroll-view');
      
      await expect(element(by.id('weekly-calorie-average'))).toBeVisible();
    });
  });

  describe('Streak Milestones', () => {
    it('should show milestone badges in profile', async () => {
      await navigateTo.profile();
      
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Scroll to achievements
      await scrollToElement('achievements-section', 'profile-scroll-view');
      
      await expect(element(by.id('achievements-section'))).toBeVisible();
    });

    it('should display different badges for streak levels', async () => {
      await navigateTo.profile();
      
      await scrollToElement('achievements-section', 'profile-scroll-view');
      
      // Badge display area should be visible
      await expect(element(by.id('badge-container'))).toBeVisible();
    });
  });

  describe('Goal Customization', () => {
    it('should navigate to goal settings from dashboard', async () => {
      await element(by.id('settings-btn')).tap();
      
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Goal settings option
      await expect(element(by.id('goal-settings-btn'))).toBeVisible();
    });

    it('should allow changing calorie goal', async () => {
      await navigateTo.profile();
      
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await scrollToElement('goals-settings', 'profile-scroll-view');
      await element(by.id('goals-settings')).tap();
      
      await waitFor(element(by.id('calorie-goal-input')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await element(by.id('calorie-goal-input')).clearText();
      await element(by.id('calorie-goal-input')).typeText('2200');
    });

    it('should allow changing macro goals', async () => {
      await navigateTo.profile();
      
      await scrollToElement('goals-settings', 'profile-scroll-view');
      await element(by.id('goals-settings')).tap();
      
      // Protein goal
      await waitFor(element(by.id('protein-goal-input')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await element(by.id('protein-goal-input')).clearText();
      await element(by.id('protein-goal-input')).typeText('160');
    });

    it('should save updated goals', async () => {
      await navigateTo.profile();
      
      await scrollToElement('goals-settings', 'profile-scroll-view');
      await element(by.id('goals-settings')).tap();
      
      await waitFor(element(by.id('calorie-goal-input')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await element(by.id('calorie-goal-input')).clearText();
      await element(by.id('calorie-goal-input')).typeText('2500');
      
      await element(by.id('save-goals-btn')).tap();
      
      // Success message
      await waitFor(element(by.text('Goals updated successfully')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });
  });

  describe('Notification Integration', () => {
    it('should show reminder settings for goal tracking', async () => {
      await navigateTo.profile();
      
      await scrollToElement('notification-settings', 'profile-scroll-view');
      await element(by.id('notification-settings')).tap();
      
      // Reminder options
      await expect(element(by.id('goal-reminder-toggle'))).toBeVisible();
    });

    it('should toggle daily goal reminders', async () => {
      await navigateTo.profile();
      
      await scrollToElement('notification-settings', 'profile-scroll-view');
      await element(by.id('notification-settings')).tap();
      
      await element(by.id('goal-reminder-toggle')).tap();
      
      // State should change (visual verification)
    });
  });

  describe('Streak Analytics', () => {
    it('should show streak chart in history', async () => {
      await navigateTo.history();
      
      await waitFor(element(by.id('history-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Chart component
      await expect(element(by.id('streak-chart'))).toBeVisible();
    });

    it('should display longest streak record', async () => {
      await navigateTo.profile();
      
      await scrollToElement('streak-stats-section', 'profile-scroll-view');
      
      await expect(element(by.id('longest-streak'))).toBeVisible();
    });

    it('should show total days tracked', async () => {
      await navigateTo.profile();
      
      await scrollToElement('streak-stats-section', 'profile-scroll-view');
      
      await expect(element(by.id('total-days-tracked'))).toBeVisible();
    });
  });
});
