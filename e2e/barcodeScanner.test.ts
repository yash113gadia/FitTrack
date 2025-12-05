/**
 * Barcode Scanner E2E Tests
 * 
 * Tests for barcode scanning functionality
 */

import { device, element, by, waitFor, expect } from 'detox';
import { 
  TIMEOUTS, 
  completeOnboarding,
  navigateTo,
  resetAppState,
} from './utils/testHelpers';

describe('Barcode Scanner', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
    await completeOnboarding();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await navigateTo.dashboard();
  });

  describe('Scanner Access', () => {
    it('should open barcode scanner from FAB', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      // Should navigate to scanner screen or request permissions
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should request camera permission if not granted', async () => {
      // This test depends on device permission state
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      // Either scanner shows or permission request shows
      // Check for scanner screen first
      try {
        await waitFor(element(by.id('barcode-scanner-screen')))
          .toBeVisible()
          .withTimeout(TIMEOUTS.SHORT);
      } catch {
        // If scanner not visible, check for permission request
        await waitFor(element(by.id('camera-permission-request')))
          .toBeVisible()
          .withTimeout(TIMEOUTS.MEDIUM);
      }
    });

    it('should show camera preview when scanner opens', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Camera view should be visible
      await expect(element(by.id('barcode-camera'))).toBeVisible();
    });
  });

  describe('Barcode Detection', () => {
    // Note: These tests require a physical barcode or mock
    // In CI, you would mock the camera/barcode detection
    
    it('should show scanning indicator while active', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Scanning indicator should be visible
      await expect(element(by.id('scanning-indicator'))).toBeVisible();
    });

    it('should show manual entry option on scanner screen', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Manual barcode entry option
      await expect(element(by.id('manual-barcode-btn'))).toBeVisible();
    });

    it('should allow manual barcode entry', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Tap manual entry
      await element(by.id('manual-barcode-btn')).tap();
      
      // Enter barcode manually
      await waitFor(element(by.id('barcode-input')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.SHORT);
      
      await element(by.id('barcode-input')).typeText('5901234123457');
      await element(by.id('lookup-barcode-btn')).tap();
      
      // Should attempt to look up the barcode
      await waitFor(element(by.id('barcode-lookup-loading')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.SHORT);
    });
  });

  describe('Product Details', () => {
    it('should show product details after successful scan', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Use manual entry to test flow
      await element(by.id('manual-barcode-btn')).tap();
      
      // Enter a known test barcode (in real tests, use a valid one from Open Food Facts)
      await element(by.id('barcode-input')).typeText('3017620422003'); // Nutella
      await element(by.id('lookup-barcode-btn')).tap();
      
      // Wait for product modal
      await waitFor(element(by.id('product-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      // Product name should be visible
      await expect(element(by.id('product-name'))).toBeVisible();
    });

    it('should show nutritional info in product modal', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await element(by.id('manual-barcode-btn')).tap();
      await element(by.id('barcode-input')).typeText('3017620422003');
      await element(by.id('lookup-barcode-btn')).tap();
      
      await waitFor(element(by.id('product-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      // Check for nutritional fields
      await expect(element(by.id('product-calories'))).toBeVisible();
      await expect(element(by.id('product-protein'))).toBeVisible();
      await expect(element(by.id('product-carbs'))).toBeVisible();
      await expect(element(by.id('product-fats'))).toBeVisible();
    });

    it('should allow adjusting serving size', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await element(by.id('manual-barcode-btn')).tap();
      await element(by.id('barcode-input')).typeText('3017620422003');
      await element(by.id('lookup-barcode-btn')).tap();
      
      await waitFor(element(by.id('product-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      // Serving size input should be editable
      await expect(element(by.id('serving-size-input'))).toBeVisible();
      
      await element(by.id('serving-size-input')).clearText();
      await element(by.id('serving-size-input')).typeText('50');
      
      // Values should update (visual verification in real test)
    });

    it('should add scanned product to food log', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await element(by.id('manual-barcode-btn')).tap();
      await element(by.id('barcode-input')).typeText('3017620422003');
      await element(by.id('lookup-barcode-btn')).tap();
      
      await waitFor(element(by.id('product-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      // Select meal type
      await element(by.id('meal-type-selector')).tap();
      await element(by.text('Snack')).tap();

      // Add to log
      await element(by.id('add-to-log-btn')).tap();
      
      // Verify success
      await waitFor(element(by.text('Food logged successfully')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });
  });

  describe('Product Not Found', () => {
    it('should show not found message for unknown barcode', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await element(by.id('manual-barcode-btn')).tap();
      
      // Enter invalid barcode
      await element(by.id('barcode-input')).typeText('0000000000000');
      await element(by.id('lookup-barcode-btn')).tap();
      
      // Should show not found message
      await waitFor(element(by.id('product-not-found')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should offer manual entry when product not found', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await element(by.id('manual-barcode-btn')).tap();
      await element(by.id('barcode-input')).typeText('0000000000000');
      await element(by.id('lookup-barcode-btn')).tap();
      
      await waitFor(element(by.id('product-not-found')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      // Manual entry option should be available
      await expect(element(by.id('manual-entry-fallback-btn'))).toBeVisible();
    });
  });

  describe('Scanner Controls', () => {
    it('should have torch toggle button', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Torch button should be visible
      await expect(element(by.id('torch-toggle-btn'))).toBeVisible();
    });

    it('should have close button to exit scanner', async () => {
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await waitFor(element(by.id('barcode-scanner-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);

      // Close button should be visible
      await expect(element(by.id('close-scanner-btn'))).toBeVisible();
      
      // Tap to close
      await element(by.id('close-scanner-btn')).tap();
      
      // Should return to dashboard
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });
  });

  describe('Recent Scans', () => {
    it('should show recently scanned items', async () => {
      // First scan a product
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      await element(by.id('manual-barcode-btn')).tap();
      await element(by.id('barcode-input')).typeText('3017620422003');
      await element(by.id('lookup-barcode-btn')).tap();
      
      await waitFor(element(by.id('product-modal')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);

      await element(by.id('add-to-log-btn')).tap();
      
      // Open scanner again
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Scan Barcode')).tap();
      
      // Recent scans section should show the item
      await expect(element(by.id('recent-scans-section'))).toBeVisible();
    });
  });
});
