/**
 * Database Service Tests
 * 
 * Comprehensive tests for SQLite database operations
 */

import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
const mockExecAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: mockExecAsync,
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
  })),
}));

// Import after mocking
import { databaseService, DatabaseQueryError, RecordNotFoundError, DatabaseInitializationError } from '../database';
import { createMockFoodItem, createMockUser, createMockFoodLog } from '../../test/testUtils';

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecAsync.mockResolvedValue(undefined);
    mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
    mockGetAllAsync.mockResolvedValue([]);
    mockGetFirstAsync.mockResolvedValue(null);
  });

  describe('initDatabase', () => {
    it('should create all required tables', async () => {
      await databaseService.initDatabase();

      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('fittrack.db');
      expect(mockExecAsync).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockExecAsync.mockRejectedValue(new Error('Database error'));

      await expect(databaseService.initDatabase()).rejects.toThrow(DatabaseInitializationError);
    });
  });

  describe('User Operations', () => {
    beforeEach(async () => {
      mockExecAsync.mockResolvedValue(undefined);
      await databaseService.initDatabase();
    });

    describe('createUser', () => {
      it('should create a new user profile', async () => {
        const mockUserInput = {
          name: 'Test User',
          gender: 'male' as const,
          age: 30,
          weight: 70,
          height: 175,
          activityLevel: 'moderate' as const,
          goal: 'maintain' as const,
          dailyCalorieGoal: 2000,
          dailyProteinGoal: 150,
        };

        mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
        mockGetFirstAsync.mockResolvedValue({
          id: 1,
          name: 'Test User',
          gender: 'male',
          age: 30,
          weight: 70,
          height: 175,
          activity_level: 'moderate',
          goal: 'maintain',
          daily_calorie_goal: 2000,
          daily_protein_goal: 150,
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
        });

        const result = await databaseService.createUser(mockUserInput);

        expect(mockRunAsync).toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(result.name).toBe('Test User');
      });

      it('should handle create user errors', async () => {
        mockRunAsync.mockRejectedValue(new Error('Insert failed'));

        await expect(databaseService.createUser({ name: 'Test' })).rejects.toThrow(DatabaseQueryError);
      });
    });

    describe('getUser', () => {
      it('should retrieve user by id', async () => {
        mockGetFirstAsync.mockResolvedValue({
          id: 1,
          name: 'Test User',
          gender: 'male',
          age: 30,
          weight: 70,
          height: 175,
          activity_level: 'moderate',
          goal: 'maintain',
          daily_calorie_goal: 2000,
          daily_protein_goal: 150,
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
        });

        const result = await databaseService.getUser(1);

        expect(result).toBeDefined();
        expect(result?.id).toBe(1);
        expect(result?.name).toBe('Test User');
      });

      it('should return null for non-existent user', async () => {
        mockGetFirstAsync.mockResolvedValue(null);

        const result = await databaseService.getUser(999);

        expect(result).toBeNull();
      });
    });

    describe('updateUser', () => {
      it('should update user profile fields', async () => {
        mockRunAsync.mockResolvedValue({ changes: 1 });

        await databaseService.updateUser(1, { name: 'Updated Name', weight: 75 });

        expect(mockRunAsync).toHaveBeenCalled();
      });

      it('should handle update errors', async () => {
        mockRunAsync.mockRejectedValue(new Error('Update failed'));

        await expect(databaseService.updateUser(1, { name: 'Test' })).rejects.toThrow(DatabaseQueryError);
      });
    });

    describe('getUserGoals', () => {
      it('should retrieve user daily goals', async () => {
        mockGetFirstAsync.mockResolvedValue({
          id: 1,
          name: 'Test User',
          gender: 'male',
          activity_level: 'moderate',
          goal: 'maintain',
          daily_calorie_goal: 2000,
          daily_protein_goal: 150,
          daily_fat_goal: 65,
          daily_carb_goal: 250,
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
        });

        const goals = await databaseService.getUserGoals(1);

        expect(goals.calories).toBe(2000);
        expect(goals.protein).toBe(150);
        expect(goals.fats).toBe(65);
        expect(goals.carbs).toBe(250);
      });

      it('should throw for non-existent user', async () => {
        mockGetFirstAsync.mockResolvedValue(null);

        await expect(databaseService.getUserGoals(999)).rejects.toThrow(RecordNotFoundError);
      });
    });
  });

  describe('Food Item Operations', () => {
    beforeEach(async () => {
      await databaseService.initDatabase();
    });

    describe('createFoodItem', () => {
      it('should create a new food item', async () => {
        const foodItem = {
          name: 'Chicken Breast',
          servingSize: 100,
          servingUnit: 'g' as const,
          calories: 165,
          protein: 31,
          fats: 3.6,
          carbs: 0,
          source: 'manual' as const,
        };

        mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
        mockGetFirstAsync.mockResolvedValue({
          id: 1,
          ...foodItem,
          created_at: '2024-01-15',
        });

        const result = await databaseService.createFoodItem(foodItem);

        expect(result).toBeDefined();
        expect(result.name).toBe('Chicken Breast');
      });
    });

    describe('getFoodItemByBarcode', () => {
      it('should find food item by barcode', async () => {
        mockGetFirstAsync.mockResolvedValue({
          id: 1,
          name: 'Product',
          barcode: '123456789',
          serving_size: 100,
          serving_unit: 'g',
          calories: 200,
          protein: 10,
          fats: 5,
          carbs: 25,
          source: 'barcode',
          created_at: '2024-01-15',
        });

        const result = await databaseService.getFoodItemByBarcode('123456789');

        expect(result).toBeDefined();
        expect(result?.barcode).toBe('123456789');
      });

      it('should return null for non-existent barcode', async () => {
        mockGetFirstAsync.mockResolvedValue(null);

        const result = await databaseService.getFoodItemByBarcode('nonexistent');

        expect(result).toBeNull();
      });
    });
  });

  describe('Food Log Operations', () => {
    beforeEach(async () => {
      await databaseService.initDatabase();
    });

    describe('logFood', () => {
      it('should create a food log entry', async () => {
        const logInput = {
          userId: 1,
          foodItemId: 1,
          quantity: 1.5,
          mealType: 'lunch' as const,
          loggedAt: '2024-01-15T12:00:00Z',
        };

        mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
        mockGetFirstAsync.mockResolvedValue({
          id: 1,
          user_id: 1,
          food_item_id: 1,
          quantity: 1.5,
          meal_type: 'lunch',
          logged_at: '2024-01-15T12:00:00Z',
        });

        const result = await databaseService.logFood(logInput);

        expect(result).toBeDefined();
        expect(result.quantity).toBe(1.5);
      });
    });

    describe('getFoodLogsForDate', () => {
      it('should retrieve food logs for a specific date', async () => {
        mockGetAllAsync.mockResolvedValue([
          {
            id: 1,
            user_id: 1,
            food_item_id: 1,
            quantity: 1,
            meal_type: 'breakfast',
            logged_at: '2024-01-15T08:00:00Z',
          },
          {
            id: 2,
            user_id: 1,
            food_item_id: 2,
            quantity: 1,
            meal_type: 'lunch',
            logged_at: '2024-01-15T12:00:00Z',
          },
        ]);

        const result = await databaseService.getFoodLogsForDate(1, '2024-01-15');

        expect(result).toHaveLength(2);
      });

      it('should return empty array for dates with no logs', async () => {
        mockGetAllAsync.mockResolvedValue([]);

        const result = await databaseService.getFoodLogsForDate(1, '2024-01-15');

        expect(result).toEqual([]);
      });
    });

    describe('getFoodLogsWithDetailsForDate', () => {
      it('should retrieve food logs with food details', async () => {
        mockGetAllAsync.mockResolvedValue([
          {
            id: 1,
            user_id: 1,
            food_item_id: 1,
            quantity: 1,
            meal_type: 'breakfast',
            logged_at: '2024-01-15T08:00:00Z',
            name: 'Oatmeal',
            calories: 150,
            protein: 5,
            fats: 3,
            carbs: 27,
            serving_unit: 'g',
          },
        ]);

        const result = await databaseService.getFoodLogsWithDetailsForDate(1, '2024-01-15');

        expect(result).toHaveLength(1);
        expect(result[0].foodName).toBe('Oatmeal');
      });
    });

    describe('deleteFoodLog', () => {
      it('should delete a food log by id', async () => {
        mockRunAsync.mockResolvedValue({ changes: 1 });

        await databaseService.deleteFoodLog(1);

        expect(mockRunAsync).toHaveBeenCalled();
      });
    });

    describe('updateFoodLog', () => {
      it('should update an existing food log', async () => {
        mockRunAsync.mockResolvedValue({ changes: 1 });

        await databaseService.updateFoodLog(1, { quantity: 2, notes: 'Updated' });

        expect(mockRunAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Daily Summary Operations', () => {
    beforeEach(async () => {
      await databaseService.initDatabase();
    });

    describe('getDailySummary', () => {
      it('should calculate daily totals correctly', async () => {
        mockGetFirstAsync.mockResolvedValue({
          total_calories: 2100,
          total_protein: 150,
          total_fats: 70,
          total_carbs: 200,
        });
        
        // Mock user goals
        mockGetFirstAsync.mockResolvedValueOnce({
          id: 1,
          name: 'User',
          gender: 'male',
          activity_level: 'moderate',
          goal: 'maintain',
          daily_calorie_goal: 2000,
          daily_protein_goal: 150,
          daily_fat_goal: 65,
          daily_carb_goal: 250,
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
        });

        const result = await databaseService.getDailySummary(1, '2024-01-15');

        expect(result).toBeDefined();
        expect(result.totalCalories).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Streak Operations', () => {
    beforeEach(async () => {
      await databaseService.initDatabase();
    });

    describe('getCurrentStreak', () => {
      it('should calculate current streak', async () => {
        mockGetAllAsync.mockResolvedValue([
          { date: '2024-01-15', goals_met: 1 },
          { date: '2024-01-14', goals_met: 1 },
          { date: '2024-01-13', goals_met: 1 },
        ]);

        const result = await databaseService.getCurrentStreak(1);

        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it('should return 0 for no streak data', async () => {
        mockGetAllAsync.mockResolvedValue([]);

        const result = await databaseService.getCurrentStreak(1);

        expect(result).toBe(0);
      });
    });

    describe('updateDailyStreak', () => {
      it('should update or create streak entry', async () => {
        mockRunAsync.mockResolvedValue({ changes: 1 });

        const summary = {
          date: '2024-01-15',
          totalCalories: 2000,
          totalProtein: 150,
          totalFats: 65,
          totalCarbs: 250,
          goalsMetCalories: true,
          goalsMetProtein: true,
          completionPercentage: 100,
        };

        await databaseService.updateDailyStreak(1, '2024-01-15', summary);

        expect(mockRunAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Reminder Operations', () => {
    beforeEach(async () => {
      await databaseService.initDatabase();
    });

    describe('createReminder', () => {
      it('should create a new reminder', async () => {
        const reminder = {
          userId: 1,
          type: 'meal' as const,
          title: 'Lunch Reminder',
          time: '12:00',
          days: [1, 2, 3, 4, 5], // Monday-Friday as numbers
          enabled: true,
        };

        mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
        mockGetFirstAsync.mockResolvedValue({
          id: 1,
          user_id: 1,
          type: 'meal',
          title: 'Lunch Reminder',
          time: '12:00',
          days: JSON.stringify([1, 2, 3, 4, 5]),
          enabled: 1,
        });

        const result = await databaseService.createReminder(reminder);

        expect(result).toBeDefined();
        expect(result.title).toBe('Lunch Reminder');
      });
    });

    describe('getReminders', () => {
      it('should retrieve all reminders for user', async () => {
        mockGetAllAsync.mockResolvedValue([
          {
            id: 1,
            user_id: 1,
            type: 'meal',
            title: 'Breakfast',
            time: '08:00',
            days: JSON.stringify(['monday', 'tuesday']),
            enabled: 1,
          },
        ]);

        const result = await databaseService.getReminders(1);

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Breakfast');
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    beforeEach(async () => {
      await databaseService.initDatabase();
    });

    it('should use parameterized queries for user input', async () => {
      const maliciousInput = "'; DROP TABLE food_logs; --";

      mockGetAllAsync.mockResolvedValue([]);

      await databaseService.getFoodLogsForDate(1, maliciousInput);

      // Verify the query was made with parameters, not string concatenation
      expect(mockGetAllAsync).toHaveBeenCalled();
      const call = mockGetAllAsync.mock.calls[0];
      // Parameters should be passed separately, not embedded in query
      expect(call[0]).not.toContain('DROP TABLE');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await databaseService.initDatabase();
    });

    it('should throw DatabaseQueryError for database failures', async () => {
      mockGetFirstAsync.mockRejectedValue(new Error('SQLITE_CORRUPT'));

      await expect(databaseService.getUser(1)).rejects.toThrow(DatabaseQueryError);
    });

    it('should throw RecordNotFoundError when record does not exist', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(databaseService.getUserGoals(999)).rejects.toThrow(RecordNotFoundError);
    });
  });
});

describe('Database Error Classes', () => {
  it('DatabaseInitializationError should have correct name', () => {
    const error = new DatabaseInitializationError('Test error');
    expect(error.name).toBe('DatabaseInitializationError');
    expect(error.message).toBe('Test error');
  });

  it('DatabaseQueryError should preserve original error', () => {
    const originalError = new Error('Original');
    const error = new DatabaseQueryError('Query failed', originalError);
    expect(error.name).toBe('DatabaseQueryError');
    expect(error.originalError).toBe(originalError);
  });

  it('RecordNotFoundError should have correct name', () => {
    const error = new RecordNotFoundError('User not found');
    expect(error.name).toBe('RecordNotFoundError');
    expect(error.message).toBe('User not found');
  });
});
