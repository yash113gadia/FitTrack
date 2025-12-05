/**
 * OpenFoodFacts API Service
 *
 * Integrates with the OpenFoodFacts database to fetch product information
 * by barcode. Handles API responses, rate limiting, and data parsing.
 *
 * @example
 * const result = await openFoodFactsService.getProductByBarcode('3017620422003');
 * if (result.success) {
 *   console.log(result.data); // FoodItem
 * }
 */

import { FoodItem } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface OpenFoodFactsProduct {
  code: string;
  status: number;
  status_verbose: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    brands?: string;
    quantity?: string;
    serving_size?: string;
    serving_quantity?: number;
    image_url?: string;
    image_front_url?: string;
    image_front_small_url?: string;
    nutriments?: {
      'energy-kcal'?: number;
      'energy-kcal_100g'?: number;
      'energy-kcal_serving'?: number;
      proteins?: number;
      proteins_100g?: number;
      proteins_serving?: number;
      fat?: number;
      fat_100g?: number;
      fat_serving?: number;
      carbohydrates?: number;
      carbohydrates_100g?: number;
      carbohydrates_serving?: number;
      fiber?: number;
      fiber_100g?: number;
      fiber_serving?: number;
      sugars?: number;
      sugars_100g?: number;
      sugars_serving?: number;
    };
    nutrition_data_per?: string; // '100g' or 'serving'
    categories_tags?: string[];
  };
}

export interface OpenFoodFactsResult {
  success: boolean;
  data?: Omit<FoodItem, 'id' | 'createdAt'>;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'NETWORK_ERROR' | 'RATE_LIMITED' | 'INVALID_BARCODE' | 'PARSE_ERROR' | 'TIMEOUT';
  rawProduct?: OpenFoodFactsProduct['product'];
}

export interface ServingSizeOption {
  label: string;
  size: number;
  unit: 'g' | 'ml';
  isDefault?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BASE_URL = 'https://world.openfoodfacts.org/api/v0';
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests (rate limiting)
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Barcode format validation patterns
const BARCODE_PATTERNS = {
  EAN13: /^\d{13}$/,
  EAN8: /^\d{8}$/,
  UPC_A: /^\d{12}$/,
  UPC_E: /^\d{6,8}$/,
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class OpenFoodFactsService {
  private lastRequestTime: number = 0;
  private pendingRequest: AbortController | null = null;

  /**
   * Validates barcode format
   */
  validateBarcode(barcode: string): { valid: boolean; format?: string; error?: string } {
    const cleaned = barcode.replace(/\s/g, '');

    if (!cleaned) {
      return { valid: false, error: 'Barcode is empty' };
    }

    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, error: 'Barcode must contain only digits' };
    }

    if (BARCODE_PATTERNS.EAN13.test(cleaned)) {
      return { valid: true, format: 'EAN-13' };
    }
    if (BARCODE_PATTERNS.EAN8.test(cleaned)) {
      return { valid: true, format: 'EAN-8' };
    }
    if (BARCODE_PATTERNS.UPC_A.test(cleaned)) {
      return { valid: true, format: 'UPC-A' };
    }
    if (BARCODE_PATTERNS.UPC_E.test(cleaned)) {
      return { valid: true, format: 'UPC-E' };
    }

    // Allow other formats but mark as unknown
    if (cleaned.length >= 6 && cleaned.length <= 14) {
      return { valid: true, format: 'Unknown' };
    }

    return { valid: false, error: 'Invalid barcode length' };
  }

  /**
   * Rate limiting: wait if needed before making a request
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Cancel any pending requests
   */
  cancelPendingRequests(): void {
    if (this.pendingRequest) {
      this.pendingRequest.abort();
      this.pendingRequest = null;
    }
  }

  /**
   * Fetch product from OpenFoodFacts API
   */
  async getProductByBarcode(barcode: string): Promise<OpenFoodFactsResult> {
    // Validate barcode
    const validation = this.validateBarcode(barcode);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid barcode format',
        errorCode: 'INVALID_BARCODE',
      };
    }

    const cleanedBarcode = barcode.replace(/\s/g, '');

    // Cancel any pending requests
    this.cancelPendingRequests();

    // Rate limiting
    await this.waitForRateLimit();

    // Create abort controller for this request
    const abortController = new AbortController();
    this.pendingRequest = abortController;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${BASE_URL}/product/${cleanedBarcode}.json`,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'FitTrack-App/1.0 (contact@fittrack.app)',
              'Accept': 'application/json',
            },
            signal: abortController.signal,
          }
        );

        // Handle rate limiting
        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
            continue;
          }
          return {
            success: false,
            error: 'Rate limited. Please try again later.',
            errorCode: 'RATE_LIMITED',
          };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: OpenFoodFactsProduct = await response.json();

        // Check if product was found
        if (data.status === 0 || !data.product) {
          return {
            success: false,
            error: 'Product not found in database',
            errorCode: 'NOT_FOUND',
          };
        }

        // Parse product data
        const parsedFood = this.parseProductToFoodItem(data.product, cleanedBarcode);

        this.pendingRequest = null;
        return {
          success: true,
          data: parsedFood,
          rawProduct: data.product,
        };
      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request cancelled',
            errorCode: 'TIMEOUT',
          };
        }

        // Network error - retry if we have attempts left
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
      }
    }

    this.pendingRequest = null;

    // Determine error type
    const errorMessage = lastError?.message || 'Unknown error';
    const isNetworkError =
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch');

    return {
      success: false,
      error: isNetworkError
        ? 'Network error. Please check your connection.'
        : `Failed to fetch product: ${errorMessage}`,
      errorCode: isNetworkError ? 'NETWORK_ERROR' : 'PARSE_ERROR',
    };
  }

  /**
   * Parse OpenFoodFacts product to FoodItem format
   */
  private parseProductToFoodItem(
    product: NonNullable<OpenFoodFactsProduct['product']>,
    barcode: string
  ): Omit<FoodItem, 'id' | 'createdAt'> {
    const nutriments = product.nutriments || {};

    // Get product name (try multiple fields)
    const name =
      product.product_name ||
      product.product_name_en ||
      product.generic_name ||
      (product.brands ? `${product.brands} Product` : 'Unknown Product');

    // Determine serving size
    let servingSize = 100;
    let servingUnit: 'g' | 'ml' = 'g';

    if (product.serving_quantity && product.serving_quantity > 0) {
      servingSize = product.serving_quantity;
    } else if (product.serving_size) {
      const match = product.serving_size.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz)?/i);
      if (match) {
        servingSize = parseFloat(match[1]);
        if (match[2]?.toLowerCase() === 'ml') {
          servingUnit = 'ml';
        }
      }
    }

    // Get nutrition data (prefer per 100g, then per serving)
    const isPer100g = product.nutrition_data_per !== 'serving';

    let calories = 0;
    let protein = 0;
    let fats = 0;
    let carbs = 0;
    let fiber: number | undefined;
    let sugar: number | undefined;

    if (isPer100g) {
      // Data is per 100g - use directly
      calories = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
      protein = nutriments.proteins_100g || nutriments.proteins || 0;
      fats = nutriments.fat_100g || nutriments.fat || 0;
      carbs = nutriments.carbohydrates_100g || nutriments.carbohydrates || 0;
      fiber = nutriments.fiber_100g || nutriments.fiber;
      sugar = nutriments.sugars_100g || nutriments.sugars;

      // Normalize to serving size if not 100g
      if (servingSize !== 100) {
        const factor = servingSize / 100;
        calories = Math.round(calories * factor);
        protein = Math.round(protein * factor * 10) / 10;
        fats = Math.round(fats * factor * 10) / 10;
        carbs = Math.round(carbs * factor * 10) / 10;
        if (fiber !== undefined) fiber = Math.round(fiber * factor * 10) / 10;
        if (sugar !== undefined) sugar = Math.round(sugar * factor * 10) / 10;
      }
    } else {
      // Data is per serving - use serving values
      calories = nutriments['energy-kcal_serving'] || nutriments['energy-kcal'] || 0;
      protein = nutriments.proteins_serving || nutriments.proteins || 0;
      fats = nutriments.fat_serving || nutriments.fat || 0;
      carbs = nutriments.carbohydrates_serving || nutriments.carbohydrates || 0;
      fiber = nutriments.fiber_serving || nutriments.fiber;
      sugar = nutriments.sugars_serving || nutriments.sugars;
    }

    // Get image URL
    const imageUri =
      product.image_front_url ||
      product.image_front_small_url ||
      product.image_url;

    return {
      name: name.trim(),
      servingSize,
      servingUnit,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      fats: Math.round(fats * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fiber: fiber !== undefined ? Math.round(fiber * 10) / 10 : undefined,
      sugar: sugar !== undefined ? Math.round(sugar * 10) / 10 : undefined,
      barcode,
      source: 'barcode',
      imageUri,
    };
  }

  /**
   * Get available serving size options for a product
   */
  getServingSizeOptions(
    product: NonNullable<OpenFoodFactsProduct['product']>
  ): ServingSizeOption[] {
    const options: ServingSizeOption[] = [];

    // Default 100g option
    options.push({
      label: '100g',
      size: 100,
      unit: 'g',
    });

    // Serving size from product
    if (product.serving_quantity && product.serving_quantity > 0) {
      options.push({
        label: product.serving_size || `${product.serving_quantity}g serving`,
        size: product.serving_quantity,
        unit: 'g',
        isDefault: true,
      });
    } else if (product.serving_size) {
      const match = product.serving_size.match(/(\d+(?:\.\d+)?)\s*(g|ml)?/i);
      if (match) {
        const size = parseFloat(match[1]);
        const unit = match[2]?.toLowerCase() === 'ml' ? 'ml' : 'g';
        if (size !== 100) {
          options.push({
            label: product.serving_size,
            size,
            unit,
            isDefault: true,
          });
        }
      }
    }

    // Common portion sizes
    if (!options.some((o) => o.size === 50)) {
      options.push({ label: '50g', size: 50, unit: 'g' });
    }
    if (!options.some((o) => o.size === 200)) {
      options.push({ label: '200g', size: 200, unit: 'g' });
    }

    // Sort by size
    options.sort((a, b) => a.size - b.size);

    return options;
  }

  /**
   * Recalculate macros for a different serving size
   */
  recalculateMacros(
    baseFoodItem: Omit<FoodItem, 'id' | 'createdAt'>,
    baseServingSize: number,
    newServingSize: number
  ): Omit<FoodItem, 'id' | 'createdAt'> {
    if (baseServingSize === 0) return baseFoodItem;

    const factor = newServingSize / baseServingSize;

    return {
      ...baseFoodItem,
      servingSize: newServingSize,
      calories: Math.round(baseFoodItem.calories * factor),
      protein: Math.round(baseFoodItem.protein * factor * 10) / 10,
      fats: Math.round(baseFoodItem.fats * factor * 10) / 10,
      carbs: Math.round(baseFoodItem.carbs * factor * 10) / 10,
      fiber: baseFoodItem.fiber !== undefined
        ? Math.round(baseFoodItem.fiber * factor * 10) / 10
        : undefined,
      sugar: baseFoodItem.sugar !== undefined
        ? Math.round(baseFoodItem.sugar * factor * 10) / 10
        : undefined,
    };
  }
}

export const openFoodFactsService = new OpenFoodFactsService();
