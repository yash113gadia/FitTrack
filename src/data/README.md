# Common Foods Database

## Overview
This database contains nutritional information for 500+ of the most commonly eaten foods, plus **user-scanned items** that are automatically added when you scan barcodes. All values are standardized per 100g/100ml for easy calculation.

## Categories
- **Protein** (40+ items): Meat, poultry, seafood, eggs, plant-based proteins
- **Dairy** (6 items): Milk, cheese, yogurt
- **Grains** (8 items): Rice, pasta, bread, oats, quinoa
- **Vegetables** (20+ items): Broccoli, spinach, carrots, tomatoes, exotic vegetables
- **Fruits** (20+ items): Apples, bananas, berries, citrus, exotic fruits
- **Nuts & Seeds** (6 items): Almonds, cashews, walnuts, chia, pumpkin seeds
- **Legumes** (3 items): Lentils, chickpeas, black beans
- **Fast Food** (80+ items): Five Guys, In-N-Out, Popeyes, Chipotle, Panda Express, Sonic, Dairy Queen, etc.
- **International Cuisine** (100+ items): Korean, Vietnamese, Greek, French, Spanish, German, Brazilian, Caribbean
- **Snacks & Sweets** (40+ items): Candy bars, chips, cookies, popcorn, jerky
- **Beverages** (30+ items): Alcohol, energy drinks, sodas, juices, smoothies
- **Condiments & Oils** (20+ items): Sauces, dressings, spreads, oils
- **Prepared Foods** (45+ items): Soups, stews, casseroles, salads
- **Healthy & Superfoods** (15+ items): Kale chips, chia pudding, matcha, quinoa salad
- **Supplements** (5 items): Protein powder, bars, creatine, vitamins
- **Scanned Items** (Dynamic): Products you've scanned with barcode scanner

## Usage

### Search All Foods (Including Scanned Items)
```typescript
import { searchAllFoods } from '../data/commonFoods';

const results = await searchAllFoods('chicken');
// Returns array of matching foods from both built-in database and user-scanned items
```

### Search Built-in Foods Only
```typescript
import { searchCommonFoods } from '../data/commonFoods';

const results = searchCommonFoods('chicken');
// Returns array of matching foods from built-in database only
```

### Add Scanned Item to Offline List
```typescript
import { addScannedFoodToOfflineList } from '../data/commonFoods';

await addScannedFoodToOfflineList({
  name: 'Product Name',
  barcode: '1234567890',
  calories: 250,
  protein: 10,
  carbs: 30,
  fats: 8,
  servingSize: 100,
  servingUnit: 'g',
  category: 'Scanned Items',
});
// Automatically adds to offline list for future searches
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
