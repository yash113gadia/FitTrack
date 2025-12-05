# Common Foods Database

## Overview
This database contains nutritional information for 100 of the most commonly eaten foods. All values are standardized per 100g/100ml for easy calculation.

## Categories
- **Protein** (27 items): Meat, poultry, seafood, eggs, plant-based proteins
- **Dairy** (6 items): Milk, cheese, yogurt
- **Grains** (8 items): Rice, pasta, bread, oats, quinoa
- **Vegetables** (10 items): Broccoli, spinach, carrots, tomatoes, etc.
- **Fruits** (10 items): Apples, bananas, berries, citrus, etc.
- **Nuts & Seeds** (6 items): Almonds, cashews, walnuts, chia, pumpkin seeds
- **Legumes** (3 items): Lentils, chickpeas, black beans
- **Fast Food** (6 items): Pizza, burgers, fries, fried chicken
- **Snacks & Sweets** (6 items): Chocolate, chips, popcorn, granola bars
- **Beverages** (5 items): Juices, soda, coffee, tea
- **Condiments & Oils** (7 items): Olive oil, butter, mayo, ketchup, honey
- **Prepared Foods** (6 items): Salads, pasta dishes, soups

## Usage

### Search for Foods
```typescript
import { searchCommonFoods } from '../data/commonFoods';

const results = searchCommonFoods('chicken');
// Returns array of matching foods
```

### Calculate Nutrition for Serving
```typescript
import { calculateNutrition, getCommonFoodById } from '../data/commonFoods';

const food = getCommonFoodById(1); // Chicken Breast
const nutrition = calculateNutrition(food, 150, 'g');
// Returns: { calories: 248, protein: 46.5, carbs: 0, fats: 5.4 }
```

### Get Foods by Category
```typescript
import { getCommonFoodsByCategory } from '../data/commonFoods';

const fruits = getCommonFoodsByCategory('Fruits');
// Returns all fruit items
```

## Features

### 1. Offline Calculator
- Works without internet connection
- Instant nutrition calculation
- Uses fuzzy search to find best matches
- Automatically fills in all nutrition values

### 2. Autocomplete Suggestions
- Shows suggestions as you type (min 2 characters)
- Displays food name, category, and calories
- Click to auto-fill all fields
- Supports partial name matching

### 3. Smart Serving Size Calculation
- All values stored per 100g/ml
- Automatically scales nutrition based on serving size
- Supports different units (g, ml)
- Rounds to realistic precision

## Data Sources
Nutritional data compiled from:
- USDA FoodData Central
- Common food packaging labels
- Restaurant nutrition guides
- Verified nutrition databases

## Adding New Foods

To add more foods to the database:

1. Open `src/data/commonFoods.ts`
2. Add to the `COMMON_FOODS` array:
```typescript
{
  id: 101, // Next sequential ID
  name: 'Your Food Name',
  category: 'Category',
  calories: 100, // per 100g/ml
  protein: 10,   // grams per 100g/ml
  carbs: 20,     // grams per 100g/ml
  fats: 5,       // grams per 100g/ml
  servingSize: 100,
  servingUnit: 'g'
}
```

## Benefits

✅ **Offline First**: No internet required for common foods
✅ **Fast**: Instant calculations, no API delays
✅ **Accurate**: Based on verified nutrition data
✅ **User-Friendly**: Autocomplete makes logging effortless
✅ **Fallback**: AI calculator available for uncommon foods
