/**
 * Common Foods Database
 * 
 * Nutritional values for 100 most commonly eaten foods
 * All values are per 100g unless otherwise specified
 */

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
