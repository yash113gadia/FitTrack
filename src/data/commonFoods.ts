/**
 * Common Foods Database
 * 
 * Nutritional values for 600 most commonly eaten foods
 * All values are per 100g unless otherwise specified
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_SCANNED_FOODS_KEY = '@fittrack_user_scanned_foods';

export interface CommonFood {
  id: number;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
  servingUnit: string;
  barcode?: string;
  isUserAdded?: boolean;
}

export const COMMON_FOODS: CommonFood[] = [
  // PROTEINS - Meat & Poultry
  { id: 1, name: 'Chicken Breast (grilled)', category: 'Protein', calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: 100, servingUnit: 'g' },
  { id: 2, name: 'Chicken Thigh (grilled)', category: 'Protein', calories: 209, protein: 26, carbs: 0, fats: 10.9, servingSize: 100, servingUnit: 'g' },
  { id: 3, name: 'Ground Beef (lean)', category: 'Protein', calories: 250, protein: 26, carbs: 0, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 4, name: 'Steak (sirloin)', category: 'Protein', calories: 271, protein: 27, carbs: 0, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 5, name: 'Pork Chop (grilled)', category: 'Protein', calories: 231, protein: 25, carbs: 0, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 6, name: 'Turkey Breast (roasted)', category: 'Protein', calories: 135, protein: 30, carbs: 0, fats: 0.7, servingSize: 100, servingUnit: 'g' },
  { id: 7, name: 'Bacon (cooked)', category: 'Protein', calories: 541, protein: 37, carbs: 1.4, fats: 42, servingSize: 100, servingUnit: 'g' },
  
  // PROTEINS - Seafood
  { id: 8, name: 'Salmon (grilled)', category: 'Protein', calories: 206, protein: 22, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 9, name: 'Tuna (canned in water)', category: 'Protein', calories: 116, protein: 26, carbs: 0, fats: 0.8, servingSize: 100, servingUnit: 'g' },
  { id: 10, name: 'Shrimp (cooked)', category: 'Protein', calories: 99, protein: 24, carbs: 0.2, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 11, name: 'Tilapia (grilled)', category: 'Protein', calories: 128, protein: 26, carbs: 0, fats: 2.7, servingSize: 100, servingUnit: 'g' },
  { id: 12, name: 'Cod (baked)', category: 'Protein', calories: 105, protein: 23, carbs: 0, fats: 0.9, servingSize: 100, servingUnit: 'g' },
  
  // PROTEINS - Eggs & Dairy
  { id: 13, name: 'Egg (whole, boiled)', category: 'Protein', calories: 155, protein: 13, carbs: 1.1, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 14, name: 'Egg White (cooked)', category: 'Protein', calories: 52, protein: 11, carbs: 0.7, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 15, name: 'Greek Yogurt (non-fat)', category: 'Dairy', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 16, name: 'Cottage Cheese (low-fat)', category: 'Dairy', calories: 72, protein: 12, carbs: 3.4, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 17, name: 'Milk (whole)', category: 'Dairy', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, servingSize: 100, servingUnit: 'ml' },
  { id: 18, name: 'Milk (skim)', category: 'Dairy', calories: 34, protein: 3.4, carbs: 5, fats: 0.1, servingSize: 100, servingUnit: 'ml' },
  { id: 19, name: 'Cheddar Cheese', category: 'Dairy', calories: 403, protein: 25, carbs: 1.3, fats: 33, servingSize: 100, servingUnit: 'g' },
  { id: 20, name: 'Mozzarella Cheese', category: 'Dairy', calories: 280, protein: 28, carbs: 2.2, fats: 17, servingSize: 100, servingUnit: 'g' },
  
  // PROTEINS - Plant-based
  { id: 21, name: 'Tofu (firm)', category: 'Protein', calories: 76, protein: 8, carbs: 1.9, fats: 4.8, servingSize: 100, servingUnit: 'g' },
  { id: 22, name: 'Lentils (cooked)', category: 'Legumes', calories: 116, protein: 9, carbs: 20, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 23, name: 'Chickpeas (cooked)', category: 'Legumes', calories: 164, protein: 9, carbs: 27, fats: 2.6, servingSize: 100, servingUnit: 'g' },
  { id: 24, name: 'Black Beans (cooked)', category: 'Legumes', calories: 132, protein: 9, carbs: 24, fats: 0.5, servingSize: 100, servingUnit: 'g' },
  { id: 25, name: 'Peanut Butter', category: 'Nuts', calories: 588, protein: 25, carbs: 20, fats: 50, servingSize: 100, servingUnit: 'g' },
  
  // CARBS - Grains
  { id: 26, name: 'White Rice (cooked)', category: 'Grains', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 27, name: 'Brown Rice (cooked)', category: 'Grains', calories: 112, protein: 2.6, carbs: 24, fats: 0.9, servingSize: 100, servingUnit: 'g' },
  { id: 28, name: 'Quinoa (cooked)', category: 'Grains', calories: 120, protein: 4.4, carbs: 21, fats: 1.9, servingSize: 100, servingUnit: 'g' },
  { id: 29, name: 'Oatmeal (cooked)', category: 'Grains', calories: 71, protein: 2.5, carbs: 12, fats: 1.5, servingSize: 100, servingUnit: 'g' },
  { id: 30, name: 'Whole Wheat Bread', category: 'Grains', calories: 247, protein: 13, carbs: 41, fats: 3.4, servingSize: 100, servingUnit: 'g' },
  { id: 31, name: 'White Bread', category: 'Grains', calories: 265, protein: 9, carbs: 49, fats: 3.2, servingSize: 100, servingUnit: 'g' },
  { id: 32, name: 'Pasta (cooked)', category: 'Grains', calories: 131, protein: 5, carbs: 25, fats: 1.1, servingSize: 100, servingUnit: 'g' },
  { id: 33, name: 'Whole Wheat Pasta (cooked)', category: 'Grains', calories: 124, protein: 5.3, carbs: 26, fats: 0.5, servingSize: 100, servingUnit: 'g' },
  
  // CARBS - Starchy Vegetables
  { id: 34, name: 'Potato (baked)', category: 'Vegetables', calories: 93, protein: 2.5, carbs: 21, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 35, name: 'Sweet Potato (baked)', category: 'Vegetables', calories: 90, protein: 2, carbs: 21, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 36, name: 'Corn (cooked)', category: 'Vegetables', calories: 96, protein: 3.4, carbs: 21, fats: 1.5, servingSize: 100, servingUnit: 'g' },
  
  // VEGETABLES - Non-starchy
  { id: 37, name: 'Broccoli (cooked)', category: 'Vegetables', calories: 35, protein: 2.4, carbs: 7, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 38, name: 'Spinach (cooked)', category: 'Vegetables', calories: 23, protein: 3, carbs: 3.8, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 39, name: 'Carrots (raw)', category: 'Vegetables', calories: 41, protein: 0.9, carbs: 10, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 40, name: 'Tomato (raw)', category: 'Vegetables', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 41, name: 'Cucumber (raw)', category: 'Vegetables', calories: 16, protein: 0.7, carbs: 3.6, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 42, name: 'Lettuce (raw)', category: 'Vegetables', calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 43, name: 'Bell Pepper (raw)', category: 'Vegetables', calories: 31, protein: 1, carbs: 6, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 44, name: 'Onion (raw)', category: 'Vegetables', calories: 40, protein: 1.1, carbs: 9, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 45, name: 'Mushrooms (raw)', category: 'Vegetables', calories: 22, protein: 3.1, carbs: 3.3, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 46, name: 'Green Beans (cooked)', category: 'Vegetables', calories: 35, protein: 1.8, carbs: 8, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  
  // FRUITS
  { id: 47, name: 'Apple', category: 'Fruits', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 48, name: 'Banana', category: 'Fruits', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 49, name: 'Orange', category: 'Fruits', calories: 47, protein: 0.9, carbs: 12, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 50, name: 'Strawberries', category: 'Fruits', calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 51, name: 'Blueberries', category: 'Fruits', calories: 57, protein: 0.7, carbs: 14, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 52, name: 'Grapes', category: 'Fruits', calories: 69, protein: 0.7, carbs: 18, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 53, name: 'Watermelon', category: 'Fruits', calories: 30, protein: 0.6, carbs: 8, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 54, name: 'Mango', category: 'Fruits', calories: 60, protein: 0.8, carbs: 15, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 55, name: 'Pineapple', category: 'Fruits', calories: 50, protein: 0.5, carbs: 13, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 56, name: 'Avocado', category: 'Fruits', calories: 160, protein: 2, carbs: 9, fats: 15, servingSize: 100, servingUnit: 'g' },
  
  // NUTS & SEEDS
  { id: 57, name: 'Almonds', category: 'Nuts', calories: 579, protein: 21, carbs: 22, fats: 50, servingSize: 100, servingUnit: 'g' },
  { id: 58, name: 'Cashews', category: 'Nuts', calories: 553, protein: 18, carbs: 30, fats: 44, servingSize: 100, servingUnit: 'g' },
  { id: 59, name: 'Walnuts', category: 'Nuts', calories: 654, protein: 15, carbs: 14, fats: 65, servingSize: 100, servingUnit: 'g' },
  { id: 60, name: 'Peanuts', category: 'Nuts', calories: 567, protein: 26, carbs: 16, fats: 49, servingSize: 100, servingUnit: 'g' },
  { id: 61, name: 'Chia Seeds', category: 'Seeds', calories: 486, protein: 17, carbs: 42, fats: 31, servingSize: 100, servingUnit: 'g' },
  { id: 62, name: 'Pumpkin Seeds', category: 'Seeds', calories: 559, protein: 30, carbs: 14, fats: 49, servingSize: 100, servingUnit: 'g' },
  
  // FAST FOOD & COMMON MEALS
  { id: 63, name: 'Pizza (cheese, thin crust)', category: 'Fast Food', calories: 239, protein: 10, carbs: 26, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 64, name: 'Hamburger (regular)', category: 'Fast Food', calories: 295, protein: 17, carbs: 24, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 65, name: 'French Fries', category: 'Fast Food', calories: 312, protein: 3.4, carbs: 41, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 66, name: 'Fried Chicken', category: 'Fast Food', calories: 246, protein: 19, carbs: 12, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 67, name: 'Sushi (California Roll)', category: 'Asian', calories: 119, protein: 2.9, carbs: 19, fats: 3.6, servingSize: 100, servingUnit: 'g' },
  { id: 68, name: 'Burrito (chicken)', category: 'Mexican', calories: 206, protein: 9.7, carbs: 26, fats: 7.1, servingSize: 100, servingUnit: 'g' },
  { id: 69, name: 'Tacos (beef)', category: 'Mexican', calories: 226, protein: 9.5, carbs: 18, fats: 13, servingSize: 100, servingUnit: 'g' },
  
  // SNACKS & SWEETS
  { id: 70, name: 'Dark Chocolate (70-85%)', category: 'Sweets', calories: 598, protein: 7.8, carbs: 46, fats: 43, servingSize: 100, servingUnit: 'g' },
  { id: 71, name: 'Milk Chocolate', category: 'Sweets', calories: 535, protein: 8, carbs: 59, fats: 30, servingSize: 100, servingUnit: 'g' },
  { id: 72, name: 'Potato Chips', category: 'Snacks', calories: 536, protein: 6.6, carbs: 53, fats: 34, servingSize: 100, servingUnit: 'g' },
  { id: 73, name: 'Popcorn (plain)', category: 'Snacks', calories: 375, protein: 12, carbs: 74, fats: 4.5, servingSize: 100, servingUnit: 'g' },
  { id: 74, name: 'Granola Bar', category: 'Snacks', calories: 471, protein: 10, carbs: 64, fats: 20, servingSize: 100, servingUnit: 'g' },
  { id: 75, name: 'Pretzels', category: 'Snacks', calories: 380, protein: 10, carbs: 80, fats: 2.6, servingSize: 100, servingUnit: 'g' },
  
  // BEVERAGES & LIQUIDS
  { id: 76, name: 'Orange Juice (100%)', category: 'Beverages', calories: 45, protein: 0.7, carbs: 10, fats: 0.2, servingSize: 100, servingUnit: 'ml' },
  { id: 77, name: 'Apple Juice (100%)', category: 'Beverages', calories: 46, protein: 0.1, carbs: 11, fats: 0.1, servingSize: 100, servingUnit: 'ml' },
  { id: 78, name: 'Coca Cola', category: 'Beverages', calories: 41, protein: 0, carbs: 11, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 79, name: 'Coffee (black)', category: 'Beverages', calories: 2, protein: 0.3, carbs: 0, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 80, name: 'Tea (unsweetened)', category: 'Beverages', calories: 1, protein: 0, carbs: 0.3, fats: 0, servingSize: 100, servingUnit: 'ml' },
  
  // CONDIMENTS & OILS
  { id: 81, name: 'Olive Oil', category: 'Oils', calories: 884, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'ml' },
  { id: 82, name: 'Butter', category: 'Dairy', calories: 717, protein: 0.9, carbs: 0.1, fats: 81, servingSize: 100, servingUnit: 'g' },
  { id: 83, name: 'Mayonnaise', category: 'Condiments', calories: 680, protein: 1.1, carbs: 0.6, fats: 75, servingSize: 100, servingUnit: 'g' },
  { id: 84, name: 'Ketchup', category: 'Condiments', calories: 101, protein: 1.2, carbs: 25, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 85, name: 'Mustard', category: 'Condiments', calories: 66, protein: 3.7, carbs: 5.3, fats: 3.3, servingSize: 100, servingUnit: 'g' },
  { id: 86, name: 'Honey', category: 'Sweeteners', calories: 304, protein: 0.3, carbs: 82, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 87, name: 'Sugar (white)', category: 'Sweeteners', calories: 387, protein: 0, carbs: 100, fats: 0, servingSize: 100, servingUnit: 'g' },
  
  // PREPARED FOODS
  { id: 88, name: 'Caesar Salad (with dressing)', category: 'Salads', calories: 184, protein: 4.3, carbs: 6.9, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 89, name: 'Greek Salad', category: 'Salads', calories: 96, protein: 2.8, carbs: 4.6, fats: 7.5, servingSize: 100, servingUnit: 'g' },
  { id: 90, name: 'Lasagna (meat)', category: 'Pasta', calories: 135, protein: 7.4, carbs: 13, fats: 5.8, servingSize: 100, servingUnit: 'g' },
  { id: 91, name: 'Mac and Cheese', category: 'Pasta', calories: 164, protein: 6.4, carbs: 18, fats: 6.6, servingSize: 100, servingUnit: 'g' },
  { id: 92, name: 'Chicken Noodle Soup', category: 'Soups', calories: 31, protein: 1.6, carbs: 4.4, fats: 0.8, servingSize: 100, servingUnit: 'ml' },
  { id: 93, name: 'Tomato Soup', category: 'Soups', calories: 37, protein: 0.9, carbs: 7.3, fats: 0.6, servingSize: 100, servingUnit: 'ml' },
  
  // BREAKFAST FOODS
  { id: 94, name: 'Pancakes (plain)', category: 'Breakfast', calories: 227, protein: 6.4, carbs: 28, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 95, name: 'Waffles', category: 'Breakfast', calories: 291, protein: 7.4, carbs: 37, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 96, name: 'Cereal (corn flakes)', category: 'Breakfast', calories: 357, protein: 7.5, carbs: 84, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 97, name: 'Granola', category: 'Breakfast', calories: 471, protein: 13, carbs: 64, fats: 18, servingSize: 100, servingUnit: 'g' },
  { id: 98, name: 'Bagel (plain)', category: 'Breakfast', calories: 257, protein: 10, carbs: 50, fats: 1.7, servingSize: 100, servingUnit: 'g' },
  { id: 99, name: 'Croissant', category: 'Breakfast', calories: 406, protein: 8.2, carbs: 46, fats: 21, servingSize: 100, servingUnit: 'g' },
  { id: 100, name: 'Yogurt (low-fat, flavored)', category: 'Dairy', calories: 63, protein: 5.3, carbs: 7, fats: 1.6, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // MCDONALD'S
  // ============================================================================
  { id: 101, name: "McDonald's Big Mac", category: 'Fast Food', calories: 257, protein: 13, carbs: 20, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 102, name: "McDonald's Quarter Pounder", category: 'Fast Food', calories: 254, protein: 15, carbs: 17, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 103, name: "McDonald's McChicken", category: 'Fast Food', calories: 247, protein: 11, carbs: 23, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 104, name: "McDonald's Filet-O-Fish", category: 'Fast Food', calories: 250, protein: 10, carbs: 24, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 105, name: "McDonald's Chicken McNuggets (6pc)", category: 'Fast Food', calories: 286, protein: 15, carbs: 18, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 106, name: "McDonald's Egg McMuffin", category: 'Fast Food', calories: 196, protein: 12, carbs: 18, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 107, name: "McDonald's Hash Brown", category: 'Fast Food', calories: 323, protein: 3, carbs: 30, fats: 21, servingSize: 100, servingUnit: 'g' },
  { id: 108, name: "McDonald's McFlurry (Oreo)", category: 'Fast Food', calories: 192, protein: 4, carbs: 30, fats: 6, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // BURGER KING
  // ============================================================================
  { id: 109, name: "Burger King Whopper", category: 'Fast Food', calories: 234, protein: 11, carbs: 15, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 110, name: "Burger King Chicken Royale", category: 'Fast Food', calories: 245, protein: 12, carbs: 22, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 111, name: "Burger King Onion Rings", category: 'Fast Food', calories: 350, protein: 4, carbs: 40, fats: 19, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // KFC
  // ============================================================================
  { id: 112, name: "KFC Original Recipe Chicken", category: 'Fast Food', calories: 260, protein: 20, carbs: 10, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 113, name: "KFC Crispy Strips", category: 'Fast Food', calories: 272, protein: 18, carbs: 16, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 114, name: "KFC Popcorn Chicken", category: 'Fast Food', calories: 295, protein: 16, carbs: 19, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 115, name: "KFC Coleslaw", category: 'Fast Food', calories: 135, protein: 1, carbs: 13, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 116, name: "KFC Mashed Potatoes with Gravy", category: 'Fast Food', calories: 87, protein: 2, carbs: 14, fats: 3, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // SUBWAY
  // ============================================================================
  { id: 117, name: "Subway Italian BMT", category: 'Fast Food', calories: 185, protein: 10, carbs: 17, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 118, name: "Subway Turkey Breast Sub", category: 'Fast Food', calories: 135, protein: 9, carbs: 17, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 119, name: "Subway Meatball Marinara", category: 'Fast Food', calories: 195, protein: 10, carbs: 20, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 120, name: "Subway Chicken Teriyaki", category: 'Fast Food', calories: 155, protein: 11, carbs: 19, fats: 3, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // PIZZA CHAINS
  // ============================================================================
  { id: 121, name: "Domino's Pepperoni Pizza", category: 'Fast Food', calories: 270, protein: 12, carbs: 28, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 122, name: "Domino's Margherita Pizza", category: 'Fast Food', calories: 240, protein: 10, carbs: 27, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 123, name: "Pizza Hut Meat Lovers", category: 'Fast Food', calories: 295, protein: 14, carbs: 26, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 124, name: "Pizza Hut Supreme", category: 'Fast Food', calories: 265, protein: 12, carbs: 27, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 125, name: "Papa John's Cheese Pizza", category: 'Fast Food', calories: 255, protein: 11, carbs: 29, fats: 10, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // TACO BELL & MEXICAN FAST FOOD
  // ============================================================================
  { id: 126, name: "Taco Bell Crunchy Taco", category: 'Fast Food', calories: 235, protein: 10, carbs: 19, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 127, name: "Taco Bell Burrito Supreme", category: 'Fast Food', calories: 175, protein: 8, carbs: 20, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 128, name: "Taco Bell Quesadilla", category: 'Fast Food', calories: 270, protein: 12, carbs: 23, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 129, name: "Taco Bell Nachos Supreme", category: 'Fast Food', calories: 220, protein: 7, carbs: 22, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 130, name: "Chipotle Chicken Bowl", category: 'Fast Food', calories: 130, protein: 10, carbs: 12, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 131, name: "Chipotle Carnitas Burrito", category: 'Fast Food', calories: 180, protein: 9, carbs: 22, fats: 6, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // STARBUCKS
  // ============================================================================
  { id: 132, name: "Starbucks Caramel Frappuccino", category: 'Beverages', calories: 86, protein: 1, carbs: 17, fats: 1.5, servingSize: 100, servingUnit: 'ml' },
  { id: 133, name: "Starbucks Latte", category: 'Beverages', calories: 42, protein: 2.5, carbs: 4, fats: 1.5, servingSize: 100, servingUnit: 'ml' },
  { id: 134, name: "Starbucks Mocha", category: 'Beverages', calories: 65, protein: 2, carbs: 10, fats: 2, servingSize: 100, servingUnit: 'ml' },
  { id: 135, name: "Starbucks Blueberry Muffin", category: 'Bakery', calories: 380, protein: 5, carbs: 52, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 136, name: "Starbucks Chocolate Croissant", category: 'Bakery', calories: 420, protein: 7, carbs: 42, fats: 25, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // WENDY'S
  // ============================================================================
  { id: 137, name: "Wendy's Baconator", category: 'Fast Food', calories: 280, protein: 16, carbs: 12, fats: 19, servingSize: 100, servingUnit: 'g' },
  { id: 138, name: "Wendy's Dave's Single", category: 'Fast Food', calories: 250, protein: 14, carbs: 16, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 139, name: "Wendy's Spicy Chicken Sandwich", category: 'Fast Food', calories: 225, protein: 12, carbs: 22, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 140, name: "Wendy's Frosty", category: 'Fast Food', calories: 160, protein: 4, carbs: 26, fats: 4, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // CHICK-FIL-A
  // ============================================================================
  { id: 141, name: "Chick-fil-A Chicken Sandwich", category: 'Fast Food', calories: 265, protein: 18, carbs: 22, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 142, name: "Chick-fil-A Nuggets", category: 'Fast Food', calories: 245, protein: 20, carbs: 11, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 143, name: "Chick-fil-A Waffle Fries", category: 'Fast Food', calories: 310, protein: 4, carbs: 38, fats: 16, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // POPEYES
  // ============================================================================
  { id: 144, name: "Popeyes Chicken Sandwich", category: 'Fast Food', calories: 260, protein: 14, carbs: 22, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 145, name: "Popeyes Spicy Chicken", category: 'Fast Food', calories: 275, protein: 18, carbs: 12, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 146, name: "Popeyes Cajun Fries", category: 'Fast Food', calories: 320, protein: 4, carbs: 40, fats: 16, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // DUNKIN'
  // ============================================================================
  { id: 147, name: "Dunkin' Glazed Donut", category: 'Bakery', calories: 350, protein: 4, carbs: 48, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 148, name: "Dunkin' Boston Kreme Donut", category: 'Bakery', calories: 370, protein: 4, carbs: 52, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 149, name: "Dunkin' Iced Coffee", category: 'Beverages', calories: 25, protein: 1, carbs: 5, fats: 0, servingSize: 100, servingUnit: 'ml' },
  
  // ============================================================================
  // CHINESE FOOD
  // ============================================================================
  { id: 150, name: "General Tso's Chicken", category: 'Chinese', calories: 210, protein: 12, carbs: 18, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 151, name: "Orange Chicken", category: 'Chinese', calories: 220, protein: 11, carbs: 22, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 152, name: "Kung Pao Chicken", category: 'Chinese', calories: 180, protein: 15, carbs: 12, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 153, name: "Sweet and Sour Pork", category: 'Chinese', calories: 195, protein: 10, carbs: 22, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 154, name: "Beef and Broccoli", category: 'Chinese', calories: 150, protein: 13, carbs: 8, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 155, name: "Fried Rice", category: 'Chinese', calories: 168, protein: 5, carbs: 25, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 156, name: "Chow Mein", category: 'Chinese', calories: 180, protein: 6, carbs: 26, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 157, name: "Lo Mein", category: 'Chinese', calories: 165, protein: 5, carbs: 23, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 158, name: "Egg Drop Soup", category: 'Chinese', calories: 30, protein: 2, carbs: 3, fats: 1, servingSize: 100, servingUnit: 'ml' },
  { id: 159, name: "Hot and Sour Soup", category: 'Chinese', calories: 45, protein: 3, carbs: 5, fats: 2, servingSize: 100, servingUnit: 'ml' },
  { id: 160, name: "Spring Roll (fried)", category: 'Chinese', calories: 250, protein: 5, carbs: 28, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 161, name: "Dim Sum (Siu Mai)", category: 'Chinese', calories: 190, protein: 10, carbs: 14, fats: 10, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // JAPANESE FOOD
  // ============================================================================
  { id: 162, name: "Salmon Sashimi", category: 'Japanese', calories: 208, protein: 20, carbs: 0, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 163, name: "Tuna Sashimi", category: 'Japanese', calories: 144, protein: 23, carbs: 0, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 164, name: "Salmon Nigiri", category: 'Japanese', calories: 170, protein: 12, carbs: 18, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 165, name: "Spicy Tuna Roll", category: 'Japanese', calories: 145, protein: 8, carbs: 18, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 166, name: "Dragon Roll", category: 'Japanese', calories: 175, protein: 7, carbs: 22, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 167, name: "Tempura Shrimp", category: 'Japanese', calories: 225, protein: 10, carbs: 22, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 168, name: "Chicken Teriyaki", category: 'Japanese', calories: 175, protein: 18, carbs: 12, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 169, name: "Tonkatsu (Pork Cutlet)", category: 'Japanese', calories: 275, protein: 18, carbs: 15, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 170, name: "Ramen (Tonkotsu)", category: 'Japanese', calories: 95, protein: 5, carbs: 10, fats: 4, servingSize: 100, servingUnit: 'ml' },
  { id: 171, name: "Miso Soup", category: 'Japanese', calories: 25, protein: 2, carbs: 3, fats: 1, servingSize: 100, servingUnit: 'ml' },
  { id: 172, name: "Edamame", category: 'Japanese', calories: 122, protein: 11, carbs: 10, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 173, name: "Gyoza (Potstickers)", category: 'Japanese', calories: 220, protein: 8, carbs: 24, fats: 10, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // INDIAN FOOD
  // ============================================================================
  { id: 174, name: "Butter Chicken", category: 'Indian', calories: 175, protein: 14, carbs: 8, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 175, name: "Chicken Tikka Masala", category: 'Indian', calories: 165, protein: 15, carbs: 7, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 176, name: "Tandoori Chicken", category: 'Indian', calories: 150, protein: 22, carbs: 3, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 177, name: "Lamb Vindaloo", category: 'Indian', calories: 180, protein: 14, carbs: 6, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 178, name: "Palak Paneer", category: 'Indian', calories: 155, protein: 8, carbs: 6, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 179, name: "Chana Masala", category: 'Indian', calories: 130, protein: 6, carbs: 18, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 180, name: "Dal (Lentil Curry)", category: 'Indian', calories: 110, protein: 7, carbs: 15, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 181, name: "Biryani (Chicken)", category: 'Indian', calories: 160, protein: 10, carbs: 20, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 182, name: "Naan Bread", category: 'Indian', calories: 290, protein: 9, carbs: 50, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 183, name: "Samosa (vegetable)", category: 'Indian', calories: 260, protein: 4, carbs: 30, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 184, name: "Pakora", category: 'Indian', calories: 280, protein: 5, carbs: 28, fats: 16, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // ITALIAN FOOD
  // ============================================================================
  { id: 185, name: "Spaghetti Bolognese", category: 'Italian', calories: 135, protein: 7, carbs: 16, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 186, name: "Fettuccine Alfredo", category: 'Italian', calories: 185, protein: 6, carbs: 20, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 187, name: "Pasta Carbonara", category: 'Italian', calories: 190, protein: 9, carbs: 18, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 188, name: "Penne Arrabbiata", category: 'Italian', calories: 140, protein: 5, carbs: 22, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 189, name: "Risotto (mushroom)", category: 'Italian', calories: 145, protein: 4, carbs: 22, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 190, name: "Chicken Parmesan", category: 'Italian', calories: 210, protein: 18, carbs: 12, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 191, name: "Eggplant Parmesan", category: 'Italian', calories: 165, protein: 6, carbs: 14, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 192, name: "Caprese Salad", category: 'Italian', calories: 145, protein: 7, carbs: 3, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 193, name: "Minestrone Soup", category: 'Italian', calories: 50, protein: 2, carbs: 9, fats: 1, servingSize: 100, servingUnit: 'ml' },
  { id: 194, name: "Bruschetta", category: 'Italian', calories: 170, protein: 4, carbs: 22, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 195, name: "Tiramisu", category: 'Italian', calories: 295, protein: 5, carbs: 32, fats: 16, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // MEXICAN FOOD
  // ============================================================================
  { id: 196, name: "Chicken Enchiladas", category: 'Mexican', calories: 175, protein: 10, carbs: 18, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 197, name: "Beef Enchiladas", category: 'Mexican', calories: 190, protein: 11, carbs: 17, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 198, name: "Chicken Fajitas", category: 'Mexican', calories: 135, protein: 14, carbs: 8, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 199, name: "Carne Asada", category: 'Mexican', calories: 220, protein: 24, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 200, name: "Carnitas", category: 'Mexican', calories: 245, protein: 22, carbs: 1, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 201, name: "Guacamole", category: 'Mexican', calories: 160, protein: 2, carbs: 9, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 202, name: "Pico de Gallo", category: 'Mexican', calories: 25, protein: 1, carbs: 5, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 203, name: "Refried Beans", category: 'Mexican', calories: 105, protein: 6, carbs: 14, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 204, name: "Mexican Rice", category: 'Mexican', calories: 140, protein: 3, carbs: 26, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 205, name: "Churros", category: 'Mexican', calories: 380, protein: 4, carbs: 45, fats: 20, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // THAI FOOD
  // ============================================================================
  { id: 206, name: "Pad Thai", category: 'Thai', calories: 165, protein: 8, carbs: 22, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 207, name: "Green Curry (chicken)", category: 'Thai', calories: 135, protein: 10, carbs: 6, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 208, name: "Red Curry (chicken)", category: 'Thai', calories: 140, protein: 10, carbs: 7, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 209, name: "Massaman Curry", category: 'Thai', calories: 155, protein: 9, carbs: 10, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 210, name: "Tom Yum Soup", category: 'Thai', calories: 35, protein: 3, carbs: 3, fats: 1, servingSize: 100, servingUnit: 'ml' },
  { id: 211, name: "Tom Kha Gai", category: 'Thai', calories: 85, protein: 4, carbs: 4, fats: 6, servingSize: 100, servingUnit: 'ml' },
  { id: 212, name: "Thai Fried Rice", category: 'Thai', calories: 175, protein: 6, carbs: 25, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 213, name: "Satay Chicken", category: 'Thai', calories: 195, protein: 18, carbs: 6, fats: 11, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // KOREAN FOOD
  // ============================================================================
  { id: 214, name: "Bibimbap", category: 'Korean', calories: 145, protein: 8, carbs: 20, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 215, name: "Bulgogi (Beef)", category: 'Korean', calories: 185, protein: 18, carbs: 8, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 216, name: "Korean Fried Chicken", category: 'Korean', calories: 265, protein: 17, carbs: 14, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 217, name: "Kimchi", category: 'Korean', calories: 23, protein: 1.5, carbs: 4, fats: 0.5, servingSize: 100, servingUnit: 'g' },
  { id: 218, name: "Japchae (Glass Noodles)", category: 'Korean', calories: 155, protein: 3, carbs: 28, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 219, name: "Tteokbokki (Rice Cakes)", category: 'Korean', calories: 180, protein: 4, carbs: 35, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 220, name: "Korean BBQ Pork Belly", category: 'Korean', calories: 395, protein: 14, carbs: 2, fats: 37, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // MEDITERRANEAN & MIDDLE EASTERN
  // ============================================================================
  { id: 221, name: "Falafel", category: 'Mediterranean', calories: 330, protein: 13, carbs: 32, fats: 18, servingSize: 100, servingUnit: 'g' },
  { id: 222, name: "Hummus", category: 'Mediterranean', calories: 166, protein: 8, carbs: 14, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 223, name: "Baba Ganoush", category: 'Mediterranean', calories: 85, protein: 2, carbs: 8, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 224, name: "Shawarma (Chicken)", category: 'Mediterranean', calories: 190, protein: 18, carbs: 5, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 225, name: "Gyro (Lamb)", category: 'Mediterranean', calories: 220, protein: 14, carbs: 8, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 226, name: "Kebab (Mixed Grill)", category: 'Mediterranean', calories: 235, protein: 20, carbs: 3, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 227, name: "Tabbouleh", category: 'Mediterranean', calories: 85, protein: 2, carbs: 12, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 228, name: "Fattoush Salad", category: 'Mediterranean', calories: 95, protein: 2, carbs: 10, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 229, name: "Pita Bread", category: 'Mediterranean', calories: 275, protein: 9, carbs: 55, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 230, name: "Baklava", category: 'Mediterranean', calories: 430, protein: 6, carbs: 50, fats: 24, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // AMERICAN CLASSICS
  // ============================================================================
  { id: 231, name: "BBQ Ribs", category: 'American', calories: 290, protein: 20, carbs: 8, fats: 20, servingSize: 100, servingUnit: 'g' },
  { id: 232, name: "Pulled Pork", category: 'American', calories: 220, protein: 22, carbs: 4, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 233, name: "Buffalo Wings", category: 'American', calories: 245, protein: 19, carbs: 4, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 234, name: "Corn Dog", category: 'American', calories: 262, protein: 7, carbs: 26, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 235, name: "Hot Dog (with bun)", category: 'American', calories: 290, protein: 10, carbs: 24, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 236, name: "Philly Cheesesteak", category: 'American', calories: 235, protein: 14, carbs: 18, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 237, name: "BLT Sandwich", category: 'American', calories: 245, protein: 10, carbs: 20, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 238, name: "Club Sandwich", category: 'American', calories: 230, protein: 14, carbs: 18, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 239, name: "Reuben Sandwich", category: 'American', calories: 250, protein: 14, carbs: 18, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 240, name: "Grilled Cheese Sandwich", category: 'American', calories: 305, protein: 11, carbs: 28, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 241, name: "Meatloaf", category: 'American', calories: 185, protein: 13, carbs: 8, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 242, name: "Pot Roast", category: 'American', calories: 165, protein: 18, carbs: 5, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 243, name: "Clam Chowder", category: 'American', calories: 95, protein: 4, carbs: 10, fats: 4, servingSize: 100, servingUnit: 'ml' },
  { id: 244, name: "Jambalaya", category: 'American', calories: 145, protein: 9, carbs: 17, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 245, name: "Gumbo", category: 'American', calories: 85, protein: 6, carbs: 8, fats: 3, servingSize: 100, servingUnit: 'ml' },
  
  // ============================================================================
  // BREAKFAST ITEMS
  // ============================================================================
  { id: 246, name: "French Toast", category: 'Breakfast', calories: 230, protein: 8, carbs: 28, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 247, name: "Eggs Benedict", category: 'Breakfast', calories: 235, protein: 12, carbs: 14, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 248, name: "Omelette (cheese)", category: 'Breakfast', calories: 185, protein: 13, carbs: 2, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 249, name: "Breakfast Burrito", category: 'Breakfast', calories: 195, protein: 10, carbs: 18, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 250, name: "Sausage Links", category: 'Breakfast', calories: 340, protein: 14, carbs: 2, fats: 31, servingSize: 100, servingUnit: 'g' },
  { id: 251, name: "Hash Browns", category: 'Breakfast', calories: 265, protein: 3, carbs: 32, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 252, name: "Biscuits and Gravy", category: 'Breakfast', calories: 210, protein: 5, carbs: 22, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 253, name: "Cinnamon Roll", category: 'Breakfast', calories: 350, protein: 5, carbs: 50, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 254, name: "English Muffin", category: 'Breakfast', calories: 235, protein: 8, carbs: 46, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 255, name: "Avocado Toast", category: 'Breakfast', calories: 210, protein: 5, carbs: 22, fats: 12, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // DESSERTS
  // ============================================================================
  { id: 256, name: "Cheesecake", category: 'Desserts', calories: 320, protein: 6, carbs: 26, fats: 22, servingSize: 100, servingUnit: 'g' },
  { id: 257, name: "Chocolate Cake", category: 'Desserts', calories: 370, protein: 5, carbs: 50, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 258, name: "Carrot Cake", category: 'Desserts', calories: 355, protein: 4, carbs: 45, fats: 18, servingSize: 100, servingUnit: 'g' },
  { id: 259, name: "Apple Pie", category: 'Desserts', calories: 265, protein: 2, carbs: 40, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 260, name: "Pecan Pie", category: 'Desserts', calories: 410, protein: 5, carbs: 52, fats: 21, servingSize: 100, servingUnit: 'g' },
  { id: 261, name: "Brownies", category: 'Desserts', calories: 405, protein: 5, carbs: 55, fats: 19, servingSize: 100, servingUnit: 'g' },
  { id: 262, name: "Ice Cream (vanilla)", category: 'Desserts', calories: 207, protein: 4, carbs: 24, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 263, name: "Ice Cream (chocolate)", category: 'Desserts', calories: 216, protein: 4, carbs: 28, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 264, name: "Frozen Yogurt", category: 'Desserts', calories: 127, protein: 3, carbs: 24, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 265, name: "Creme Brulee", category: 'Desserts', calories: 285, protein: 4, carbs: 26, fats: 18, servingSize: 100, servingUnit: 'g' },
  { id: 266, name: "Panna Cotta", category: 'Desserts', calories: 240, protein: 3, carbs: 22, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 267, name: "Chocolate Mousse", category: 'Desserts', calories: 270, protein: 5, carbs: 24, fats: 17, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // HEALTHY BOWLS & SALADS
  // ============================================================================
  { id: 268, name: "Açaí Bowl", category: 'Healthy', calories: 165, protein: 3, carbs: 30, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 269, name: "Poke Bowl (tuna)", category: 'Healthy', calories: 135, protein: 12, carbs: 14, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 270, name: "Buddha Bowl", category: 'Healthy', calories: 125, protein: 6, carbs: 18, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 271, name: "Quinoa Salad", category: 'Healthy', calories: 110, protein: 4, carbs: 17, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 272, name: "Kale Salad", category: 'Healthy', calories: 85, protein: 3, carbs: 10, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 273, name: "Cobb Salad", category: 'Salads', calories: 145, protein: 10, carbs: 5, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 274, name: "Chicken Caesar Wrap", category: 'Healthy', calories: 185, protein: 12, carbs: 16, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 275, name: "Grilled Chicken Salad", category: 'Salads', calories: 120, protein: 15, carbs: 5, fats: 5, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // PROTEIN BARS & SUPPLEMENTS
  // ============================================================================
  { id: 276, name: "Protein Bar (average)", category: 'Supplements', calories: 350, protein: 20, carbs: 35, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 277, name: "Protein Shake (whey)", category: 'Supplements', calories: 120, protein: 24, carbs: 3, fats: 2, servingSize: 100, servingUnit: 'ml' },
  { id: 278, name: "Mass Gainer Shake", category: 'Supplements', calories: 185, protein: 12, carbs: 30, fats: 3, servingSize: 100, servingUnit: 'ml' },
  { id: 279, name: "Energy Bar", category: 'Supplements', calories: 380, protein: 8, carbs: 55, fats: 14, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // SMOOTHIES
  // ============================================================================
  { id: 280, name: "Green Smoothie", category: 'Beverages', calories: 65, protein: 2, carbs: 14, fats: 0.5, servingSize: 100, servingUnit: 'ml' },
  { id: 281, name: "Banana Smoothie", category: 'Beverages', calories: 85, protein: 3, carbs: 18, fats: 1, servingSize: 100, servingUnit: 'ml' },
  { id: 282, name: "Berry Smoothie", category: 'Beverages', calories: 70, protein: 2, carbs: 15, fats: 0.5, servingSize: 100, servingUnit: 'ml' },
  { id: 283, name: "Mango Smoothie", category: 'Beverages', calories: 75, protein: 1, carbs: 18, fats: 0.5, servingSize: 100, servingUnit: 'ml' },
  { id: 284, name: "Peanut Butter Smoothie", category: 'Beverages', calories: 130, protein: 5, carbs: 15, fats: 6, servingSize: 100, servingUnit: 'ml' },
  
  // ============================================================================
  // VIETNAMESE FOOD
  // ============================================================================
  { id: 285, name: "Pho (Beef)", category: 'Vietnamese', calories: 45, protein: 4, carbs: 5, fats: 1.5, servingSize: 100, servingUnit: 'ml' },
  { id: 286, name: "Banh Mi Sandwich", category: 'Vietnamese', calories: 230, protein: 12, carbs: 28, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 287, name: "Spring Rolls (fresh)", category: 'Vietnamese', calories: 110, protein: 4, carbs: 18, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 288, name: "Bun Cha", category: 'Vietnamese', calories: 155, protein: 12, carbs: 15, fats: 6, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // BRITISH FOOD
  // ============================================================================
  { id: 289, name: "Fish and Chips", category: 'British', calories: 235, protein: 10, carbs: 25, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 290, name: "Shepherd's Pie", category: 'British', calories: 145, protein: 8, carbs: 14, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 291, name: "Bangers and Mash", category: 'British', calories: 175, protein: 8, carbs: 16, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 292, name: "Beef Wellington", category: 'British', calories: 265, protein: 14, carbs: 18, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 293, name: "Full English Breakfast", category: 'British', calories: 195, protein: 12, carbs: 10, fats: 12, servingSize: 100, servingUnit: 'g' },
  
  // ============================================================================
  // SNACKS & APPETIZERS
  // ============================================================================
  { id: 294, name: "Mozzarella Sticks", category: 'Appetizers', calories: 310, protein: 12, carbs: 24, fats: 18, servingSize: 100, servingUnit: 'g' },
  { id: 295, name: "Jalapeño Poppers", category: 'Appetizers', calories: 275, protein: 8, carbs: 20, fats: 18, servingSize: 100, servingUnit: 'g' },
  { id: 296, name: "Loaded Nachos", category: 'Appetizers', calories: 245, protein: 9, carbs: 24, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 297, name: "Spinach Artichoke Dip", category: 'Appetizers', calories: 195, protein: 5, carbs: 8, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 298, name: "Stuffed Mushrooms", category: 'Appetizers', calories: 145, protein: 6, carbs: 10, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 299, name: "Chicken Wings (plain)", category: 'Appetizers', calories: 225, protein: 19, carbs: 0, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 300, name: "Shrimp Cocktail", category: 'Appetizers', calories: 110, protein: 20, carbs: 5, fats: 1, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // MORE FAST FOOD CHAINS
  // ============================================================================
  // Five Guys
  { id: 301, name: "Five Guys Hamburger", category: 'Fast Food', calories: 265, protein: 13, carbs: 18, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 302, name: "Five Guys Fries", category: 'Fast Food', calories: 285, protein: 4, carbs: 38, fats: 13, servingSize: 100, servingUnit: 'g' },
  // In-N-Out
  { id: 303, name: "In-N-Out Double-Double", category: 'Fast Food', calories: 270, protein: 13, carbs: 14, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 304, name: "Animal Style Fries", category: 'Fast Food', calories: 290, protein: 5, carbs: 28, fats: 18, servingSize: 100, servingUnit: 'g' },
  // Popeyes
  { id: 305, name: "Popeyes Chicken Sandwich", category: 'Fast Food', calories: 295, protein: 12, carbs: 22, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 306, name: "Popeyes Biscuit", category: 'Fast Food', calories: 360, protein: 6, carbs: 38, fats: 20, servingSize: 100, servingUnit: 'g' },
  // Chipotle
  { id: 307, name: "Chipotle Burrito Bowl (Chicken)", category: 'Fast Food', calories: 165, protein: 14, carbs: 16, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 308, name: "Chipotle Guacamole", category: 'Fast Food', calories: 230, protein: 3, carbs: 12, fats: 22, servingSize: 100, servingUnit: 'g' },
  // Panda Express
  { id: 309, name: "Panda Express Orange Chicken", category: 'Fast Food', calories: 260, protein: 11, carbs: 28, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 310, name: "Panda Express Chow Mein", category: 'Fast Food', calories: 180, protein: 5, carbs: 25, fats: 7, servingSize: 100, servingUnit: 'g' },
  // Arby's
  { id: 311, name: "Arby's Roast Beef Classic", category: 'Fast Food', calories: 235, protein: 14, carbs: 24, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 312, name: "Arby's Curly Fries", category: 'Fast Food', calories: 310, protein: 3, carbs: 38, fats: 16, servingSize: 100, servingUnit: 'g' },
  // Sonic
  { id: 313, name: "Sonic Corn Dog", category: 'Fast Food', calories: 280, protein: 7, carbs: 26, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 314, name: "Sonic Tater Tots", category: 'Fast Food', calories: 290, protein: 2, carbs: 32, fats: 17, servingSize: 100, servingUnit: 'g' },
  // Dairy Queen
  { id: 315, name: "DQ Blizzard (Oreo)", category: 'Fast Food', calories: 210, protein: 4, carbs: 30, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 316, name: "DQ Chicken Strip Basket", category: 'Fast Food', calories: 260, protein: 12, carbs: 22, fats: 14, servingSize: 100, servingUnit: 'g' },
  // Shake Shack
  { id: 317, name: "ShackBurger", category: 'Fast Food', calories: 275, protein: 14, carbs: 16, fats: 17, servingSize: 100, servingUnit: 'g' },
  { id: 318, name: "Crinkle Cut Fries", category: 'Fast Food', calories: 295, protein: 3, carbs: 38, fats: 14, servingSize: 100, servingUnit: 'g' },
  // Jack in the Box
  { id: 319, name: "Jack in the Box Tacos", category: 'Fast Food', calories: 240, protein: 8, carbs: 22, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 320, name: "Sourdough Jack", category: 'Fast Food', calories: 285, protein: 13, carbs: 24, fats: 16, servingSize: 100, servingUnit: 'g' },
  // Panera Bread
  { id: 321, name: "Panera Broccoli Cheddar Soup", category: 'Fast Food', calories: 150, protein: 6, carbs: 12, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 322, name: "Panera Mac & Cheese", category: 'Fast Food', calories: 210, protein: 9, carbs: 18, fats: 11, servingSize: 100, servingUnit: 'g' },
  // Krispy Kreme
  { id: 323, name: "Krispy Kreme Glazed Donut", category: 'Fast Food', calories: 380, protein: 4, carbs: 45, fats: 21, servingSize: 100, servingUnit: 'g' },
  // Cinnabon
  { id: 324, name: "Cinnabon Classic Roll", category: 'Fast Food', calories: 390, protein: 5, carbs: 55, fats: 17, servingSize: 100, servingUnit: 'g' },
  // Little Caesars
  { id: 325, name: "Crazy Bread", category: 'Fast Food', calories: 290, protein: 8, carbs: 48, fats: 7, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // GLOBAL CUISINE EXPANSION
  // ============================================================================
  // Korean
  { id: 326, name: "Bibimbap", category: 'Korean', calories: 145, protein: 6, carbs: 22, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 327, name: "Bulgogi (Beef)", category: 'Korean', calories: 230, protein: 18, carbs: 12, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 328, name: "Kimchi", category: 'Korean', calories: 15, protein: 1, carbs: 3, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 329, name: "Tteokbokki (Spicy Rice Cakes)", category: 'Korean', calories: 210, protein: 4, carbs: 45, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 330, name: "Japchae", category: 'Korean', calories: 165, protein: 3, carbs: 32, fats: 4, servingSize: 100, servingUnit: 'g' },
  // Vietnamese
  { id: 331, name: "Pho (Beef Noodle Soup)", category: 'Vietnamese', calories: 85, protein: 6, carbs: 12, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 332, name: "Banh Mi (Pork)", category: 'Vietnamese', calories: 245, protein: 11, carbs: 28, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 333, name: "Fresh Spring Rolls (Goi Cuon)", category: 'Vietnamese', calories: 120, protein: 5, carbs: 22, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 334, name: "Bun Cha (Grilled Pork & Noodles)", category: 'Vietnamese', calories: 160, protein: 9, carbs: 20, fats: 5, servingSize: 100, servingUnit: 'g' },
  // Greek
  { id: 335, name: "Moussaka", category: 'Greek', calories: 185, protein: 8, carbs: 10, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 336, name: "Souvlaki (Pork)", category: 'Greek', calories: 210, protein: 22, carbs: 2, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 337, name: "Spanakopita (Spinach Pie)", category: 'Greek', calories: 260, protein: 7, carbs: 22, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 338, name: "Tzatziki Sauce", category: 'Greek', calories: 110, protein: 4, carbs: 4, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 339, name: "Greek Salad (Horiatiki)", category: 'Greek', calories: 130, protein: 4, carbs: 5, fats: 10, servingSize: 100, servingUnit: 'g' },
  // Middle Eastern
  { id: 340, name: "Baba Ganoush", category: 'Middle Eastern', calories: 160, protein: 3, carbs: 10, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 341, name: "Tabouleh", category: 'Middle Eastern', calories: 140, protein: 3, carbs: 15, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 342, name: "Dolma (Stuffed Grape Leaves)", category: 'Middle Eastern', calories: 175, protein: 3, carbs: 22, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 343, name: "Shakshuka", category: 'Middle Eastern', calories: 110, protein: 6, carbs: 8, fats: 6, servingSize: 100, servingUnit: 'g' },
  // French
  { id: 344, name: "Croissant", category: 'French', calories: 406, protein: 8, carbs: 46, fats: 21, servingSize: 100, servingUnit: 'g' },
  { id: 345, name: "Quiche Lorraine", category: 'French', calories: 285, protein: 11, carbs: 18, fats: 19, servingSize: 100, servingUnit: 'g' },
  { id: 346, name: "French Onion Soup", category: 'French', calories: 65, protein: 3, carbs: 8, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 347, name: "Ratatouille", category: 'French', calories: 75, protein: 2, carbs: 9, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 348, name: "Coq au Vin", category: 'French', calories: 145, protein: 14, carbs: 4, fats: 8, servingSize: 100, servingUnit: 'g' },
  // Spanish
  { id: 349, name: "Paella (Seafood)", category: 'Spanish', calories: 160, protein: 9, carbs: 22, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 350, name: "Gazpacho", category: 'Spanish', calories: 45, protein: 1, carbs: 6, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 351, name: "Patatas Bravas", category: 'Spanish', calories: 195, protein: 3, carbs: 28, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 352, name: "Jamón Serrano", category: 'Spanish', calories: 240, protein: 30, carbs: 0, fats: 13, servingSize: 100, servingUnit: 'g' },
  // German
  { id: 353, name: "Bratwurst", category: 'German', calories: 297, protein: 12, carbs: 2, fats: 27, servingSize: 100, servingUnit: 'g' },
  { id: 354, name: "Sauerkraut", category: 'German', calories: 19, protein: 1, carbs: 4, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 355, name: "Soft Pretzel", category: 'German', calories: 338, protein: 9, carbs: 70, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 356, name: "Schnitzel (Pork)", category: 'German', calories: 265, protein: 18, carbs: 16, fats: 14, servingSize: 100, servingUnit: 'g' },
  // Brazilian
  { id: 357, name: "Feijoada", category: 'Brazilian', calories: 165, protein: 12, carbs: 14, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 358, name: "Pão de Queijo", category: 'Brazilian', calories: 320, protein: 6, carbs: 35, fats: 18, servingSize: 100, servingUnit: 'g' },
  { id: 359, name: "Açaí Bowl (Traditional)", category: 'Brazilian', calories: 120, protein: 2, carbs: 16, fats: 5, servingSize: 100, servingUnit: 'g' },
  // Caribbean
  { id: 360, name: "Jerk Chicken", category: 'Caribbean', calories: 195, protein: 24, carbs: 2, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 361, name: "Rice and Peas", category: 'Caribbean', calories: 180, protein: 5, carbs: 32, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 362, name: "Plantains (Fried)", category: 'Caribbean', calories: 285, protein: 2, carbs: 48, fats: 10, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // SNACKS, SWEETS & DESSERTS
  // ============================================================================
  // Candy Bars
  { id: 363, name: "Snickers Bar", category: 'Sweets', calories: 488, protein: 9, carbs: 60, fats: 24, servingSize: 100, servingUnit: 'g' },
  { id: 364, name: "KitKat", category: 'Sweets', calories: 518, protein: 7, carbs: 64, fats: 26, servingSize: 100, servingUnit: 'g' },
  { id: 365, name: "Reese's Peanut Butter Cups", category: 'Sweets', calories: 515, protein: 11, carbs: 54, fats: 29, servingSize: 100, servingUnit: 'g' },
  { id: 366, name: "M&Ms (Peanut)", category: 'Sweets', calories: 513, protein: 10, carbs: 59, fats: 26, servingSize: 100, servingUnit: 'g' },
  { id: 367, name: "Twix", category: 'Sweets', calories: 495, protein: 5, carbs: 65, fats: 24, servingSize: 100, servingUnit: 'g' },
  { id: 368, name: "Hershey's Milk Chocolate", category: 'Sweets', calories: 535, protein: 8, carbs: 60, fats: 30, servingSize: 100, servingUnit: 'g' },
  // Chips & Crackers
  { id: 369, name: "Doritos (Nacho Cheese)", category: 'Snacks', calories: 505, protein: 7, carbs: 60, fats: 26, servingSize: 100, servingUnit: 'g' },
  { id: 370, name: "Cheetos (Crunchy)", category: 'Snacks', calories: 560, protein: 6, carbs: 54, fats: 36, servingSize: 100, servingUnit: 'g' },
  { id: 371, name: "Pringles (Original)", category: 'Snacks', calories: 535, protein: 4, carbs: 55, fats: 33, servingSize: 100, servingUnit: 'g' },
  { id: 372, name: "Lay's Potato Chips", category: 'Snacks', calories: 536, protein: 7, carbs: 53, fats: 34, servingSize: 100, servingUnit: 'g' },
  { id: 373, name: "Goldfish Crackers", category: 'Snacks', calories: 445, protein: 11, carbs: 66, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 374, name: "Ritz Crackers", category: 'Snacks', calories: 495, protein: 7, carbs: 64, fats: 24, servingSize: 100, servingUnit: 'g' },
  { id: 375, name: "Pretzels (Hard)", category: 'Snacks', calories: 380, protein: 10, carbs: 80, fats: 3, servingSize: 100, servingUnit: 'g' },
  // Cookies
  { id: 376, name: "Oreo Cookies", category: 'Sweets', calories: 480, protein: 5, carbs: 70, fats: 20, servingSize: 100, servingUnit: 'g' },
  { id: 377, name: "Chips Ahoy Cookies", category: 'Sweets', calories: 490, protein: 5, carbs: 66, fats: 24, servingSize: 100, servingUnit: 'g' },
  { id: 378, name: "Girl Scout Thin Mints", category: 'Sweets', calories: 500, protein: 5, carbs: 65, fats: 25, servingSize: 100, servingUnit: 'g' },
  // Other Sweets
  { id: 379, name: "Gummy Bears", category: 'Sweets', calories: 340, protein: 5, carbs: 80, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 380, name: "Marshmallows", category: 'Sweets', calories: 318, protein: 2, carbs: 81, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 381, name: "Jelly Beans", category: 'Sweets', calories: 375, protein: 0, carbs: 93, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 382, name: "Popcorn (Movie Theater)", category: 'Snacks', calories: 550, protein: 8, carbs: 50, fats: 35, servingSize: 100, servingUnit: 'g' },
  { id: 383, name: "Beef Jerky", category: 'Snacks', calories: 410, protein: 33, carbs: 11, fats: 26, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // BEVERAGES (ALCOHOLIC & NON-ALCOHOLIC)
  // ============================================================================
  // Alcohol
  { id: 384, name: "Beer (Lager)", category: 'Beverages', calories: 43, protein: 0.5, carbs: 3.6, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 385, name: "Beer (IPA)", category: 'Beverages', calories: 55, protein: 0.6, carbs: 4.5, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 386, name: "Red Wine", category: 'Beverages', calories: 85, protein: 0.1, carbs: 2.6, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 387, name: "White Wine", category: 'Beverages', calories: 82, protein: 0.1, carbs: 2.6, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 388, name: "Vodka (40%)", category: 'Beverages', calories: 231, protein: 0, carbs: 0, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 389, name: "Whiskey (40%)", category: 'Beverages', calories: 250, protein: 0, carbs: 0.1, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 390, name: "Margarita", category: 'Beverages', calories: 160, protein: 0.1, carbs: 12, fats: 0.1, servingSize: 100, servingUnit: 'ml' },
  // Sodas & Energy
  { id: 391, name: "Coca-Cola", category: 'Beverages', calories: 42, protein: 0, carbs: 10.6, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 392, name: "Diet Coke", category: 'Beverages', calories: 0, protein: 0, carbs: 0, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 393, name: "Sprite", category: 'Beverages', calories: 40, protein: 0, carbs: 10, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 394, name: "Dr Pepper", category: 'Beverages', calories: 42, protein: 0, carbs: 11, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 395, name: "Mountain Dew", category: 'Beverages', calories: 48, protein: 0, carbs: 13, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 396, name: "Red Bull", category: 'Beverages', calories: 46, protein: 0, carbs: 11, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 397, name: "Monster Energy", category: 'Beverages', calories: 42, protein: 0, carbs: 11, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 398, name: "Gatorade", category: 'Beverages', calories: 25, protein: 0, carbs: 6, fats: 0, servingSize: 100, servingUnit: 'ml' },
  { id: 399, name: "Coconut Water", category: 'Beverages', calories: 19, protein: 0.7, carbs: 3.7, fats: 0.2, servingSize: 100, servingUnit: 'ml' },
  { id: 400, name: "Kombucha", category: 'Beverages', calories: 18, protein: 0, carbs: 4, fats: 0, servingSize: 100, servingUnit: 'ml' },

  // ============================================================================
  // HEALTHY & SUPERFOODS
  // ============================================================================
  { id: 401, name: "Kale Chips", category: 'Healthy', calories: 50, protein: 3, carbs: 6, fats: 2, servingSize: 100, servingUnit: 'g' },
  { id: 402, name: "Chia Pudding", category: 'Healthy', calories: 120, protein: 4, carbs: 10, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 403, name: "Matcha Latte (Almond Milk)", category: 'Healthy', calories: 45, protein: 1, carbs: 4, fats: 2, servingSize: 100, servingUnit: 'ml' },
  { id: 404, name: "Quinoa Salad", category: 'Healthy', calories: 140, protein: 5, carbs: 18, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 405, name: "Edamame (Steamed)", category: 'Healthy', calories: 122, protein: 11, carbs: 10, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 406, name: "Seaweed Salad", category: 'Healthy', calories: 45, protein: 3, carbs: 8, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 407, name: "Kimchi Fried Rice (Cauliflower)", category: 'Healthy', calories: 85, protein: 4, carbs: 8, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 408, name: "Zucchini Noodles (Zoodles)", category: 'Healthy', calories: 17, protein: 1, carbs: 3, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 409, name: "Acai Puree (Unsweetened)", category: 'Healthy', calories: 70, protein: 1, carbs: 4, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 410, name: "Goji Berries", category: 'Healthy', calories: 349, protein: 14, carbs: 77, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 411, name: "Hemp Seeds", category: 'Healthy', calories: 553, protein: 32, carbs: 9, fats: 49, servingSize: 100, servingUnit: 'g' },
  { id: 412, name: "Flax Seeds", category: 'Healthy', calories: 534, protein: 18, carbs: 29, fats: 42, servingSize: 100, servingUnit: 'g' },
  { id: 413, name: "Spirulina Powder", category: 'Healthy', calories: 290, protein: 57, carbs: 24, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 414, name: "Nutritional Yeast", category: 'Healthy', calories: 335, protein: 45, carbs: 38, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 415, name: "Bone Broth", category: 'Healthy', calories: 15, protein: 3, carbs: 0, fats: 0, servingSize: 100, servingUnit: 'ml' },

  // ============================================================================
  // CONDIMENTS, SAUCES & OILS
  // ============================================================================
  { id: 416, name: "Ranch Dressing", category: 'Condiments', calories: 450, protein: 1, carbs: 6, fats: 48, servingSize: 100, servingUnit: 'g' },
  { id: 417, name: "BBQ Sauce", category: 'Condiments', calories: 172, protein: 0, carbs: 41, fats: 0.6, servingSize: 100, servingUnit: 'g' },
  { id: 418, name: "Sriracha", category: 'Condiments', calories: 100, protein: 2, carbs: 20, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 419, name: "Soy Sauce", category: 'Condiments', calories: 53, protein: 8, carbs: 5, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 420, name: "Balsamic Glaze", category: 'Condiments', calories: 240, protein: 0, carbs: 60, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 421, name: "Pesto Sauce", category: 'Condiments', calories: 530, protein: 5, carbs: 6, fats: 55, servingSize: 100, servingUnit: 'g' },
  { id: 422, name: "Hummus (Classic)", category: 'Condiments', calories: 166, protein: 8, carbs: 14, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 423, name: "Guacamole", category: 'Condiments', calories: 160, protein: 2, carbs: 9, fats: 15, servingSize: 100, servingUnit: 'g' },
  { id: 424, name: "Salsa (Tomato)", category: 'Condiments', calories: 36, protein: 1, carbs: 7, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 425, name: "Maple Syrup", category: 'Condiments', calories: 260, protein: 0, carbs: 67, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 426, name: "Honey", category: 'Condiments', calories: 304, protein: 0.3, carbs: 82, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 427, name: "Peanut Butter", category: 'Condiments', calories: 588, protein: 25, carbs: 20, fats: 50, servingSize: 100, servingUnit: 'g' },
  { id: 428, name: "Almond Butter", category: 'Condiments', calories: 614, protein: 21, carbs: 19, fats: 56, servingSize: 100, servingUnit: 'g' },
  { id: 429, name: "Nutella", category: 'Condiments', calories: 546, protein: 6, carbs: 57, fats: 31, servingSize: 100, servingUnit: 'g' },
  { id: 430, name: "Cream Cheese", category: 'Condiments', calories: 342, protein: 6, carbs: 4, fats: 34, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // MORE PREPARED FOODS & MEALS
  // ============================================================================
  { id: 431, name: "Chicken Pot Pie", category: 'Prepared', calories: 210, protein: 9, carbs: 18, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 432, name: "Beef Stew", category: 'Prepared', calories: 95, protein: 8, carbs: 7, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 433, name: "Chili con Carne", category: 'Prepared', calories: 130, protein: 9, carbs: 10, fats: 6, servingSize: 100, servingUnit: 'g' },
  { id: 434, name: "Macaroni and Cheese", category: 'Prepared', calories: 164, protein: 7, carbs: 19, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 435, name: "Lasagna (Meat)", category: 'Prepared', calories: 135, protein: 9, carbs: 10, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 436, name: "Shepherd's Pie", category: 'Prepared', calories: 140, protein: 7, carbs: 12, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 437, name: "Meatloaf", category: 'Prepared', calories: 220, protein: 15, carbs: 8, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 438, name: "Stuffed Peppers", category: 'Prepared', calories: 110, protein: 6, carbs: 12, fats: 4, servingSize: 100, servingUnit: 'g' },
  { id: 439, name: "Cobb Salad", category: 'Prepared', calories: 140, protein: 12, carbs: 3, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 440, name: "Caesar Salad (with Chicken)", category: 'Prepared', calories: 160, protein: 12, carbs: 6, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 441, name: "Clam Chowder (New England)", category: 'Prepared', calories: 115, protein: 5, carbs: 9, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 442, name: "Tomato Soup", category: 'Prepared', calories: 45, protein: 1, carbs: 7, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 443, name: "Chicken Noodle Soup", category: 'Prepared', calories: 40, protein: 3, carbs: 4, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 444, name: "Minestrone Soup", category: 'Prepared', calories: 50, protein: 2, carbs: 8, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 445, name: "Miso Soup", category: 'Prepared', calories: 35, protein: 2, carbs: 4, fats: 1, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // FRUITS & VEGETABLES EXPANSION
  // ============================================================================
  { id: 446, name: "Dragon Fruit", category: 'Fruits', calories: 60, protein: 1, carbs: 13, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 447, name: "Passion Fruit", category: 'Fruits', calories: 97, protein: 2, carbs: 23, fats: 0.7, servingSize: 100, servingUnit: 'g' },
  { id: 448, name: "Lychee", category: 'Fruits', calories: 66, protein: 0.8, carbs: 17, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 449, name: "Persimmon", category: 'Fruits', calories: 70, protein: 0.6, carbs: 19, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 450, name: "Jackfruit", category: 'Fruits', calories: 95, protein: 1.7, carbs: 23, fats: 0.6, servingSize: 100, servingUnit: 'g' },
  { id: 451, name: "Durian", category: 'Fruits', calories: 147, protein: 1.5, carbs: 27, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 452, name: "Guava", category: 'Fruits', calories: 68, protein: 2.6, carbs: 14, fats: 1, servingSize: 100, servingUnit: 'g' },
  { id: 453, name: "Pomegranate Seeds", category: 'Fruits', calories: 83, protein: 1.7, carbs: 19, fats: 1.2, servingSize: 100, servingUnit: 'g' },
  { id: 454, name: "Figs (Fresh)", category: 'Fruits', calories: 74, protein: 0.8, carbs: 19, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 455, name: "Dates (Dried)", category: 'Fruits', calories: 282, protein: 2.5, carbs: 75, fats: 0.4, servingSize: 100, servingUnit: 'g' },
  { id: 456, name: "Artichoke", category: 'Vegetables', calories: 47, protein: 3.3, carbs: 11, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 457, name: "Okra", category: 'Vegetables', calories: 33, protein: 1.9, carbs: 7, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 458, name: "Bok Choy", category: 'Vegetables', calories: 13, protein: 1.5, carbs: 2, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 459, name: "Brussels Sprouts", category: 'Vegetables', calories: 43, protein: 3.4, carbs: 9, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 460, name: "Parsnips", category: 'Vegetables', calories: 75, protein: 1.2, carbs: 18, fats: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: 461, name: "Turnips", category: 'Vegetables', calories: 28, protein: 0.9, carbs: 6, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 462, name: "Beets", category: 'Vegetables', calories: 43, protein: 1.6, carbs: 10, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 463, name: "Radish", category: 'Vegetables', calories: 16, protein: 0.7, carbs: 3.4, fats: 0.1, servingSize: 100, servingUnit: 'g' },
  { id: 464, name: "Fennel", category: 'Vegetables', calories: 31, protein: 1.2, carbs: 7, fats: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 465, name: "Leeks", category: 'Vegetables', calories: 61, protein: 1.5, carbs: 14, fats: 0.3, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // BAKERY & BREAKFAST
  // ============================================================================
  { id: 466, name: "Bagel (Plain)", category: 'Bakery', calories: 250, protein: 10, carbs: 49, fats: 1.5, servingSize: 100, servingUnit: 'g' },
  { id: 467, name: "English Muffin", category: 'Bakery', calories: 235, protein: 8, carbs: 45, fats: 1.8, servingSize: 100, servingUnit: 'g' },
  { id: 468, name: "Sourdough Bread", category: 'Bakery', calories: 260, protein: 9, carbs: 50, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 469, name: "Rye Bread", category: 'Bakery', calories: 259, protein: 9, carbs: 48, fats: 3.3, servingSize: 100, servingUnit: 'g' },
  { id: 470, name: "Pita Bread", category: 'Bakery', calories: 275, protein: 9, carbs: 56, fats: 1.2, servingSize: 100, servingUnit: 'g' },
  { id: 471, name: "Tortilla (Flour)", category: 'Bakery', calories: 300, protein: 8, carbs: 50, fats: 7, servingSize: 100, servingUnit: 'g' },
  { id: 472, name: "Tortilla (Corn)", category: 'Bakery', calories: 218, protein: 6, carbs: 45, fats: 2.5, servingSize: 100, servingUnit: 'g' },
  { id: 473, name: "Naan Bread", category: 'Bakery', calories: 310, protein: 9, carbs: 50, fats: 8, servingSize: 100, servingUnit: 'g' },
  { id: 474, name: "Focaccia", category: 'Bakery', calories: 290, protein: 8, carbs: 45, fats: 9, servingSize: 100, servingUnit: 'g' },
  { id: 475, name: "Brioche", category: 'Bakery', calories: 340, protein: 9, carbs: 48, fats: 13, servingSize: 100, servingUnit: 'g' },
  { id: 476, name: "Pancakes (Plain)", category: 'Breakfast', calories: 227, protein: 6, carbs: 28, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 477, name: "Waffles (Plain)", category: 'Breakfast', calories: 291, protein: 8, carbs: 33, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 478, name: "French Toast", category: 'Breakfast', calories: 229, protein: 7, carbs: 26, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 479, name: "Hash Browns", category: 'Breakfast', calories: 270, protein: 3, carbs: 30, fats: 16, servingSize: 100, servingUnit: 'g' },
  { id: 480, name: "Sausage (Pork)", category: 'Breakfast', calories: 340, protein: 14, carbs: 1, fats: 31, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // MORE MEAT & SEAFOOD
  // ============================================================================
  { id: 481, name: "Duck Breast (Roasted)", category: 'Protein', calories: 337, protein: 19, carbs: 0, fats: 28, servingSize: 100, servingUnit: 'g' },
  { id: 482, name: "Lamb Chops", category: 'Protein', calories: 294, protein: 25, carbs: 0, fats: 21, servingSize: 100, servingUnit: 'g' },
  { id: 483, name: "Venison", category: 'Protein', calories: 158, protein: 30, carbs: 0, fats: 3, servingSize: 100, servingUnit: 'g' },
  { id: 484, name: "Bison", category: 'Protein', calories: 143, protein: 28, carbs: 0, fats: 2.4, servingSize: 100, servingUnit: 'g' },
  { id: 485, name: "Liver (Beef)", category: 'Protein', calories: 135, protein: 20, carbs: 4, fats: 3.6, servingSize: 100, servingUnit: 'g' },
  { id: 486, name: "Scallops", category: 'Protein', calories: 111, protein: 20, carbs: 5, fats: 0.8, servingSize: 100, servingUnit: 'g' },
  { id: 487, name: "Mussels", category: 'Protein', calories: 172, protein: 24, carbs: 7, fats: 4.5, servingSize: 100, servingUnit: 'g' },
  { id: 488, name: "Oysters", category: 'Protein', calories: 68, protein: 7, carbs: 4, fats: 2.5, servingSize: 100, servingUnit: 'g' },
  { id: 489, name: "Crab Meat", category: 'Protein', calories: 83, protein: 18, carbs: 0, fats: 0.7, servingSize: 100, servingUnit: 'g' },
  { id: 490, name: "Lobster", category: 'Protein', calories: 89, protein: 19, carbs: 0, fats: 0.9, servingSize: 100, servingUnit: 'g' },
  { id: 491, name: "Sardines (Canned)", category: 'Protein', calories: 208, protein: 25, carbs: 0, fats: 11, servingSize: 100, servingUnit: 'g' },
  { id: 492, name: "Anchovies", category: 'Protein', calories: 210, protein: 29, carbs: 0, fats: 10, servingSize: 100, servingUnit: 'g' },
  { id: 493, name: "Herring", category: 'Protein', calories: 203, protein: 23, carbs: 0, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 494, name: "Mackerel", category: 'Protein', calories: 205, protein: 19, carbs: 0, fats: 14, servingSize: 100, servingUnit: 'g' },
  { id: 495, name: "Trout", category: 'Protein', calories: 148, protein: 21, carbs: 0, fats: 6.6, servingSize: 100, servingUnit: 'g' },

  // ============================================================================
  // FINAL ADDITIONS
  // ============================================================================
  { id: 496, name: "Protein Powder (Whey)", category: 'Supplements', calories: 370, protein: 75, carbs: 6, fats: 5, servingSize: 100, servingUnit: 'g' },
  { id: 497, name: "Protein Bar (High)", category: 'Supplements', calories: 350, protein: 33, carbs: 30, fats: 12, servingSize: 100, servingUnit: 'g' },
  { id: 498, name: "Creatine Monohydrate", category: 'Supplements', calories: 0, protein: 0, carbs: 0, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 499, name: "Multivitamin Gummy", category: 'Supplements', calories: 300, protein: 5, carbs: 70, fats: 0, servingSize: 100, servingUnit: 'g' },
  { id: 500, name: "Fish Oil Capsule", category: 'Supplements', calories: 900, protein: 0, carbs: 0, fats: 100, servingSize: 100, servingUnit: 'g' },
];

/**
 * Search common foods by name
 */
export function searchCommonFoods(query: string): CommonFood[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  return COMMON_FOODS.filter(food => 
    food.name.toLowerCase().includes(lowerQuery) ||
    food.category.toLowerCase().includes(lowerQuery)
  ).slice(0, 20); // Return top 20 matches
}

/**
 * Get food by exact ID
 */
export function getCommonFoodById(id: number): CommonFood | undefined {
  return COMMON_FOODS.find(food => food.id === id);
}

/**
 * Get foods by category
 */
export function getCommonFoodsByCategory(category: string): CommonFood[] {
  return COMMON_FOODS.filter(food => 
    food.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Calculate nutrition for a specific serving
 */
export function calculateNutrition(
  food: CommonFood,
  servingSize: number,
  servingUnit: string
): { calories: number; protein: number; carbs: number; fats: number } {
  // All values in database are per 100g/ml
  // Calculate multiplier based on serving size
  const multiplier = servingSize / 100;
  
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fats: Math.round(food.fats * multiplier * 10) / 10,
  };
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(COMMON_FOODS.map(food => food.category));
  return Array.from(categories).sort();
}

/**
 * Load user-scanned foods from AsyncStorage
 */
export async function loadUserScannedFoods(): Promise<CommonFood[]> {
  try {
    const data = await AsyncStorage.getItem(USER_SCANNED_FOODS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading user scanned foods:', error);
    return [];
  }
}

/**
 * Save a scanned food item to offline list
 */
export async function addScannedFoodToOfflineList(food: {
  name: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
  servingUnit: string;
  category?: string;
}): Promise<void> {
  try {
    const userFoods = await loadUserScannedFoods();
    
    // Check if food with same barcode already exists
    if (food.barcode) {
      const existingIndex = userFoods.findIndex(f => f.barcode === food.barcode);
      if (existingIndex >= 0) {
        // Update existing item
        userFoods[existingIndex] = {
          ...userFoods[existingIndex],
          ...food,
          id: userFoods[existingIndex].id,
          isUserAdded: true,
        };
        await AsyncStorage.setItem(USER_SCANNED_FOODS_KEY, JSON.stringify(userFoods));
        return;
      }
    }
    
    // Add new food
    const maxId = Math.max(...COMMON_FOODS.map(f => f.id), ...userFoods.map(f => f.id), 0);
    const newFood: CommonFood = {
      id: maxId + 1,
      name: food.name,
      category: food.category || 'Scanned Items',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      barcode: food.barcode,
      isUserAdded: true,
    };
    
    userFoods.push(newFood);
    await AsyncStorage.setItem(USER_SCANNED_FOODS_KEY, JSON.stringify(userFoods));
  } catch (error) {
    console.error('Error saving scanned food:', error);
    throw error;
  }
}

/**
 * Get all foods (built-in + user-scanned)
 */
export async function getAllFoods(): Promise<CommonFood[]> {
  const userFoods = await loadUserScannedFoods();
  return [...COMMON_FOODS, ...userFoods];
}

/**
 * Search all foods (built-in + user-scanned)
 */
export async function searchAllFoods(query: string): Promise<CommonFood[]> {
  const allFoods = await getAllFoods();
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) return [];
  
  return allFoods.filter(food => 
    food.name.toLowerCase().includes(lowerQuery) ||
    food.category.toLowerCase().includes(lowerQuery)
  ).slice(0, 20);
}
