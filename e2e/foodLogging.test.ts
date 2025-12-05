/**
 * Food Logging E2E Tests
 * 
 * Tests for food logging functionality including manual entry, search, and barcode scanning
 */

import { device, element, by, waitFor, expect } from 'detox';
import { 
  TIMEOUTS, 
  TEST_FOOD,
  completeOnboarding,
  navigateTo,
  logFoodManually,
  dismissKeyboard,
  searchAndSelectFood,
  resetAppState,
} from './utils/testHelpers';

describe('Food Logging', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
    await completeOnboarding();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await navigateTo.dashboard();
  });

  describe('Manual Food Entry', () => {
    it('should open manual entry form from FAB', async () => {
      await element(by.id('quick-add-fab')).tap();
      
      await waitFor(element(by.text('Manual Entry')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.SHORT);
      
      await element(by.text('Manual Entry')).tap();
      
      await waitFor(element(by.id('manual-entry-form')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should log food manually and update dashboard', async () => {
      // Open manual entry
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      await waitFor(element(by.id('manual-entry-form')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Fill in food details
      await element(by.id('food-name-input')).typeText(TEST_FOOD.name);
      await element(by.id('calories-input')).typeText(TEST_FOOD.calories);
      await element(by.id('protein-input')).typeText(TEST_FOOD.protein);
      await element(by.id('carbs-input')).typeText(TEST_FOOD.carbs);
      await element(by.id('fats-input')).typeText(TEST_FOOD.fats);
      await dismissKeyboard();

      // Select meal type
      await element(by.id('meal-type-selector')).tap();
      await element(by.text('Lunch')).tap();

      // Save food
      await element(by.id('save-food-btn')).tap();

      // Verify success message
      await waitFor(element(by.text('Food logged successfully')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Verify dashboard updated
      await waitFor(element(by.id('calorie-progress')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should validate required fields in manual entry', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      await waitFor(element(by.id('manual-entry-form')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Try to save without filling fields
      await element(by.id('save-food-btn')).tap();

      // Should show validation error
      await expect(element(by.text('Food name is required'))).toBeVisible();
    });

    it('should allow editing serving size', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      await waitFor(element(by.id('manual-entry-form')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Fill in basic details
      await element(by.id('food-name-input')).typeText(TEST_FOOD.name);
      await element(by.id('calories-input')).typeText(TEST_FOOD.calories);
      
      // Edit serving size
      await element(by.id('serving-size-input')).clearText();
      await element(by.id('serving-size-input')).typeText('150');
      
      // Verify serving unit selector is available
      await expect(element(by.id('serving-unit-selector'))).toBeVisible();
    });

    it('should show all meal type options', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      await waitFor(element(by.id('manual-entry-form')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await element(by.id('meal-type-selector')).tap();

      // All meal types should be visible
      await expect(element(by.text('Breakfast'))).toBeVisible();
      await expect(element(by.text('Lunch'))).toBeVisible();
      await expect(element(by.text('Dinner'))).toBeVisible();
      await expect(element(by.text('Snack'))).toBeVisible();
    });
  });

  describe('Food Search', () => {
    it('should search for food items', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Search Food')).tap();
      
      await waitFor(element(by.id('food-search-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Type search query
      await element(by.id('food-search-input')).typeText('chicken');
      
      // Wait for results
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should show empty state for no results', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Search Food')).tap();
      
      await waitFor(element(by.id('food-search-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Type nonsense query
      await element(by.id('food-search-input')).typeText('xyzabc123nonsense');
      await dismissKeyboard();
      
      // Wait for no results state
      await waitFor(element(by.id('no-results')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should select food from search results', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Search Food')).tap();
      
      await waitFor(element(by.id('food-search-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      await element(by.id('food-search-input')).typeText('apple');
      
      await waitFor(element(by.id('search-result-0')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      // Tap first result
      await element(by.id('search-result-0')).tap();
      
      // Should show food detail/add form
      await waitFor(element(by.id('food-detail-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should add food from search to log', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Search Food')).tap();
      
      await element(by.id('food-search-input')).typeText('banana');
      
      await waitFor(element(by.id('search-result-0')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      await element(by.id('search-result-0')).tap();
      
      await waitFor(element(by.id('food-detail-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Add to log
      await element(by.id('add-to-log-btn')).tap();
      
      // Verify success
      await waitFor(element(by.text('Food logged successfully')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });
  });

  describe('Quick Add Options', () => {
    it('should show all quick add options', async () => {
      await element(by.id('quick-add-fab')).tap();
      
      await expect(element(by.text('Manual Entry'))).toBeVisible();
      await expect(element(by.text('Search Food'))).toBeVisible();
      await expect(element(by.text('Scan Barcode'))).toBeVisible();
      await expect(element(by.text('Photo Estimate'))).toBeVisible();
    });

    it('should close quick add menu on backdrop tap', async () => {
      await element(by.id('quick-add-fab')).tap();
      
      await expect(element(by.text('Manual Entry'))).toBeVisible();
      
      // Tap backdrop to close
      await element(by.id('quick-add-backdrop')).tap();
      
      await expect(element(by.text('Manual Entry'))).not.toBeVisible();
    });
  });

  describe('Food Log Display', () => {
    it('should show logged food in today\'s list', async () => {
      // Log a food item first
      await logFoodManually();
      
      // Navigate to log food tab
      await navigateTo.logFood();
      
      // Should see the logged food
      await waitFor(element(by.text(TEST_FOOD.name)))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should allow editing a logged food item', async () => {
      await logFoodManually();
      await navigateTo.logFood();
      
      // Tap on the logged food
      await element(by.text(TEST_FOOD.name)).tap();
      
      // Edit modal should appear
      await waitFor(element(by.id('edit-food-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should allow deleting a logged food item', async () => {
      await logFoodManually();
      await navigateTo.logFood();
      
      // Long press or swipe to delete
      await element(by.text(TEST_FOOD.name)).longPress();
      
      // Tap delete option
      await element(by.text('Delete')).tap();
      
      // Confirm deletion
      await element(by.text('Confirm')).tap();
      
      // Food should no longer be visible
      await expect(element(by.text(TEST_FOOD.name))).not.toBeVisible();
    });
  });

  describe('Meal Grouping', () => {
    it('should group foods by meal type', async () => {
      await navigateTo.logFood();
      
      // Meal type headers should be visible
      await expect(element(by.id('meal-section-breakfast'))).toBeVisible();
      await expect(element(by.id('meal-section-lunch'))).toBeVisible();
      await expect(element(by.id('meal-section-dinner'))).toBeVisible();
      await expect(element(by.id('meal-section-snack'))).toBeVisible();
    });

    it('should show meal totals', async () => {
      // Log food for lunch
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      await element(by.id('food-name-input')).typeText('Lunch Item');
      await element(by.id('calories-input')).typeText('500');
      await element(by.id('protein-input')).typeText('25');
      
      await element(by.id('meal-type-selector')).tap();
      await element(by.text('Lunch')).tap();
      
      await element(by.id('save-food-btn')).tap();
      
      await navigateTo.logFood();
      
      // Should show lunch total
      await expect(element(by.id('lunch-calories-total'))).toBeVisible();
    });
  });
});
