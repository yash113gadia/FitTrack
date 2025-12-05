import * as SQLite from 'expo-sqlite';
import {
  UserProfile,
  DailyGoals,
  FoodItem,
  FoodLog,
  FoodLogWithDetails,
  DailySummary,
  StreakData,
  StreakEntry,
  Reminder,
} from '../types';

// Custom Error Classes
export class DatabaseInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseInitializationError';
  }
}

export class DatabaseQueryError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseQueryError';
  }
}

export class RecordNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecordNotFoundError';
  }
}

const DB_NAME = 'fittrack.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  // --- INITIALIZATION ---

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');

      // Create tables
      await this.db.execAsync(`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          gender TEXT CHECK(gender IN ('male', 'female')),
          age INTEGER,
          weight REAL,
          height REAL,
          activity_level TEXT CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
          goal TEXT CHECK(goal IN ('lose', 'maintain', 'gain')),
          daily_calorie_goal REAL NOT NULL,
          daily_protein_goal REAL NOT NULL,
          daily_fat_goal REAL,
          daily_carb_goal REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Food items table
        CREATE TABLE IF NOT EXISTS food_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          serving_size REAL NOT NULL,
          serving_unit TEXT NOT NULL,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          fats REAL NOT NULL,
          carbs REAL NOT NULL,
          fiber REAL,
          sugar REAL,
          barcode TEXT UNIQUE,
          source TEXT NOT NULL,
          confidence INTEGER,
          image_uri TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT check_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100))
        );

        -- Food logs table
        CREATE TABLE IF NOT EXISTS food_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          food_item_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
          logged_at TEXT NOT NULL,
          notes TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
        );

        -- Reminders table
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          time TEXT NOT NULL,
          days TEXT NOT NULL, -- JSON array
          enabled INTEGER DEFAULT 1,
          notification_id TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Streaks table
        CREATE TABLE IF NOT EXISTS daily_streaks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL UNIQUE,
          goals_met INTEGER DEFAULT 0,
          calories_met INTEGER DEFAULT 0,
          protein_met INTEGER DEFAULT 0,
          total_calories REAL,
          total_protein REAL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Water intake table
        CREATE TABLE IF NOT EXISTS water_intake (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          glasses INTEGER DEFAULT 0,
          logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_food_logs_date ON food_logs(logged_at);
        CREATE INDEX IF NOT EXISTS idx_food_logs_user ON food_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON food_items(barcode);
        CREATE INDEX IF NOT EXISTS idx_streaks_user_date ON daily_streaks(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_water_intake_user_date ON water_intake(user_id, date);
      `);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new DatabaseInitializationError('Failed to initialize database');
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) await this.initDatabase();
    try {
      await this.db!.execAsync(`
        DROP TABLE IF EXISTS water_intake;
        DROP TABLE IF EXISTS daily_streaks;
        DROP TABLE IF EXISTS reminders;
        DROP TABLE IF EXISTS food_logs;
        DROP TABLE IF EXISTS food_items;
        DROP TABLE IF EXISTS users;
      `);
      await this.initDatabase();
    } catch (error) {
      throw new DatabaseQueryError('Failed to reset database', error);
    }
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new DatabaseInitializationError('Database not initialized. Call initDatabase() first.');
    }
    return this.db;
  }

  // --- USER OPERATIONS ---

  async createUser(profile: Partial<UserProfile>): Promise<UserProfile> {
    const db = this.getDb();
    try {
      const result = await db.runAsync(
        `INSERT INTO users (
          name, gender, age, weight, height, activity_level, goal, 
          daily_calorie_goal, daily_protein_goal, daily_fat_goal, daily_carb_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.name || '',
          profile.gender || 'male', // Default to male if not provided
          profile.age || null,
          profile.weight || null,
          profile.height || null,
          profile.activityLevel || 'moderate',
          profile.goal || 'maintain',
          profile.dailyCalorieGoal || 2000,
          profile.dailyProteinGoal || 150,
          profile.dailyFatGoal || null,
          profile.dailyCarbGoal || null,
        ]
      );
      
      const user = await this.getUser(result.lastInsertRowId);
      if (!user) throw new Error('Failed to retrieve created user');
      return user;
    } catch (error) {
      throw new DatabaseQueryError('Failed to create user', error);
    }
  }

  async getUser(id: number): Promise<UserProfile | null> {
    const db = this.getDb();
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      
      if (!result) return null;

      return {
        id: result.id,
        name: result.name,
        gender: result.gender || 'male', // Default if missing
        age: result.age,
        weight: result.weight,
        height: result.height,
        activityLevel: result.activity_level,
        goal: result.goal,
        dailyCalorieGoal: result.daily_calorie_goal,
        dailyProteinGoal: result.daily_protein_goal,
        dailyFatGoal: result.daily_fat_goal,
        dailyCarbGoal: result.daily_carb_goal,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      throw new DatabaseQueryError('Failed to get user', error);
    }
  }

  async updateUser(id: number, updates: Partial<UserProfile>): Promise<void> {
    const db = this.getDb();
    try {
      // Construct dynamic update query
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
      if (updates.gender !== undefined) { fields.push('gender = ?'); values.push(updates.gender); }
      if (updates.age !== undefined) { fields.push('age = ?'); values.push(updates.age); }
      if (updates.weight !== undefined) { fields.push('weight = ?'); values.push(updates.weight); }
      if (updates.height !== undefined) { fields.push('height = ?'); values.push(updates.height); }
      if (updates.activityLevel !== undefined) { fields.push('activity_level = ?'); values.push(updates.activityLevel); }
      if (updates.goal !== undefined) { fields.push('goal = ?'); values.push(updates.goal); }
      if (updates.dailyCalorieGoal !== undefined) { fields.push('daily_calorie_goal = ?'); values.push(updates.dailyCalorieGoal); }
      if (updates.dailyProteinGoal !== undefined) { fields.push('daily_protein_goal = ?'); values.push(updates.dailyProteinGoal); }
      if (updates.dailyFatGoal !== undefined) { fields.push('daily_fat_goal = ?'); values.push(updates.dailyFatGoal); }
      if (updates.dailyCarbGoal !== undefined) { fields.push('daily_carb_goal = ?'); values.push(updates.dailyCarbGoal); }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) return; // Only updated_at, meaning no real updates

      values.push(id);
      
      await db.runAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      throw new DatabaseQueryError('Failed to update user', error);
    }
  }

  async getUserGoals(userId: number): Promise<DailyGoals> {
    const user = await this.getUser(userId);
    if (!user) throw new RecordNotFoundError(`User with ID ${userId} not found`);
    
    return {
      calories: user.dailyCalorieGoal,
      protein: user.dailyProteinGoal,
      fats: user.dailyFatGoal || 0,
      carbs: user.dailyCarbGoal || 0,
    };
  }

  // --- FOOD ITEM OPERATIONS ---

  async createFoodItem(food: Omit<FoodItem, 'id' | 'createdAt'>): Promise<FoodItem> {
    const db = this.getDb();
    try {
      const result = await db.runAsync(
        `INSERT INTO food_items (
          name, serving_size, serving_unit, calories, protein, fats, carbs, 
          fiber, sugar, barcode, source, confidence, image_uri
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          food.name,
          food.servingSize,
          food.servingUnit,
          food.calories,
          food.protein,
          food.fats,
          food.carbs,
          food.fiber || null,
          food.sugar || null,
          food.barcode || null,
          food.source,
          food.confidence || null,
          food.imageUri || null,
        ]
      );

      const newItem = await this.getFoodItemById(result.lastInsertRowId);
      if (!newItem) throw new Error('Failed to retrieve created food item');
      return newItem;
    } catch (error) {
      throw new DatabaseQueryError('Failed to create food item', error);
    }
  }

  async getFoodItemById(id: number): Promise<FoodItem | null> {
    const db = this.getDb();
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM food_items WHERE id = ?',
        [id]
      );
      
      if (!result) return null;
      return this.mapFoodItem(result);
    } catch (error) {
      throw new DatabaseQueryError('Failed to get food item', error);
    }
  }

  async searchFoodItems(query: string, limit: number = 20): Promise<FoodItem[]> {
    const db = this.getDb();
    try {
      const results = await db.getAllAsync<any>(
        `SELECT * FROM food_items 
         WHERE name LIKE ? 
         ORDER BY CASE WHEN name LIKE ? THEN 1 ELSE 2 END, name 
         LIMIT ?`,
        [`%${query}%`, `${query}%`, limit]
      );
      
      return results.map(this.mapFoodItem);
    } catch (error) {
      throw new DatabaseQueryError('Failed to search food items', error);
    }
  }

  async getFoodItemByBarcode(barcode: string): Promise<FoodItem | null> {
    const db = this.getDb();
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT * FROM food_items WHERE barcode = ?',
        [barcode]
      );
      
      if (!result) return null;
      return this.mapFoodItem(result);
    } catch (error) {
      throw new DatabaseQueryError('Failed to get food item by barcode', error);
    }
  }

  async updateFoodItem(id: number, updates: Partial<FoodItem>): Promise<void> {
    const db = this.getDb();
    try {
      const fields: string[] = [];
      const values: any[] = [];

      // Helper to add field if present
      const addField = (key: keyof FoodItem, col: string) => {
        if (updates[key] !== undefined) {
          fields.push(`${col} = ?`);
          values.push(updates[key]);
        }
      };

      addField('name', 'name');
      addField('servingSize', 'serving_size');
      addField('servingUnit', 'serving_unit');
      addField('calories', 'calories');
      addField('protein', 'protein');
      addField('fats', 'fats');
      addField('carbs', 'carbs');
      addField('fiber', 'fiber');
      addField('sugar', 'sugar');
      addField('barcode', 'barcode');
      addField('source', 'source');
      addField('confidence', 'confidence');
      addField('imageUri', 'image_uri');

      if (fields.length === 0) return;

      values.push(id);
      await db.runAsync(
        `UPDATE food_items SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      throw new DatabaseQueryError('Failed to update food item', error);
    }
  }

  async deleteFoodItem(id: number): Promise<void> {
    const db = this.getDb();
    try {
      await db.runAsync('DELETE FROM food_items WHERE id = ?', [id]);
    } catch (error) {
      throw new DatabaseQueryError('Failed to delete food item', error);
    }
  }

  private mapFoodItem(row: any): FoodItem {
    return {
      id: row.id,
      name: row.name,
      servingSize: row.serving_size,
      servingUnit: row.serving_unit,
      calories: row.calories,
      protein: row.protein,
      fats: row.fats,
      carbs: row.carbs,
      fiber: row.fiber,
      sugar: row.sugar,
      barcode: row.barcode,
      source: row.source,
      confidence: row.confidence,
      imageUri: row.image_uri,
      createdAt: row.created_at,
    };
  }

  // --- FOOD LOG OPERATIONS ---

  async logFood(log: Omit<FoodLog, 'id'>): Promise<FoodLog> {
    const db = this.getDb();
    try {
      const result = await db.runAsync(
        `INSERT INTO food_logs (user_id, food_item_id, quantity, meal_type, logged_at, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [log.userId, log.foodItemId, log.quantity, log.mealType, log.loggedAt, log.notes || null]
      );

      return {
        id: result.lastInsertRowId,
        ...log,
      };
    } catch (error) {
      throw new DatabaseQueryError('Failed to log food', error);
    }
  }

  async getFoodLogsForDate(userId: number, date: string): Promise<FoodLog[]> {
    // date string format YYYY-MM-DD expected, but logged_at might be ISO timestamp
    // We'll assume logged_at stores full ISO string, so we search with LIKE 'YYYY-MM-DD%'
    const db = this.getDb();
    try {
      const results = await db.getAllAsync<any>(
        `SELECT * FROM food_logs 
         WHERE user_id = ? AND logged_at LIKE ?
         ORDER BY logged_at DESC`,
        [userId, `${date}%`]
      );
      
      return results.map(this.mapFoodLog);
    } catch (error) {
      throw new DatabaseQueryError('Failed to get food logs', error);
    }
  }

  async getFoodLogsWithDetailsForDate(userId: number, date: string): Promise<FoodLogWithDetails[]> {
    const db = this.getDb();
    try {
      const results = await db.getAllAsync<any>(
        `SELECT 
           fl.*,
           fi.name as foodName,
           fi.calories as unitCalories,
           fi.protein as unitProtein,
           fi.fats as unitFats,
           fi.carbs as unitCarbs,
           fi.serving_unit as servingUnit
         FROM food_logs fl
         JOIN food_items fi ON fl.food_item_id = fi.id
         WHERE fl.user_id = ? AND fl.logged_at LIKE ?
         ORDER BY fl.logged_at DESC`,
        [userId, `${date}%`]
      );
      
      return results.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        foodItemId: row.food_item_id,
        quantity: row.quantity,
        mealType: row.meal_type,
        loggedAt: row.logged_at,
        notes: row.notes,
        foodName: row.foodName,
        calories: row.unitCalories * row.quantity,
        protein: row.unitProtein * row.quantity,
        fats: row.unitFats * row.quantity,
        carbs: row.unitCarbs * row.quantity,
        servingUnit: row.servingUnit,
      }));
    } catch (error) {
      throw new DatabaseQueryError('Failed to get food logs with details', error);
    }
  }

  async getFoodLogsForDateRange(userId: number, startDate: string, endDate: string): Promise<FoodLog[]> {
    const db = this.getDb();
    try {
      const results = await db.getAllAsync<any>(
        `SELECT * FROM food_logs 
         WHERE user_id = ? AND logged_at >= ? AND logged_at <= ?
         ORDER BY logged_at DESC`,
        [userId, startDate, endDate]
      );
      
      return results.map(this.mapFoodLog);
    } catch (error) {
      throw new DatabaseQueryError('Failed to get food logs range', error);
    }
  }

  async updateFoodLog(id: number, updates: Partial<FoodLog>): Promise<void> {
    const db = this.getDb();
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.quantity !== undefined) { fields.push('quantity = ?'); values.push(updates.quantity); }
      if (updates.mealType !== undefined) { fields.push('meal_type = ?'); values.push(updates.mealType); }
      if (updates.loggedAt !== undefined) { fields.push('logged_at = ?'); values.push(updates.loggedAt); }
      if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }

      if (fields.length === 0) return;

      values.push(id);
      await db.runAsync(
        `UPDATE food_logs SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      throw new DatabaseQueryError('Failed to update food log', error);
    }
  }

  async deleteFoodLog(id: number): Promise<void> {
    const db = this.getDb();
    try {
      await db.runAsync('DELETE FROM food_logs WHERE id = ?', [id]);
    } catch (error) {
      throw new DatabaseQueryError('Failed to delete food log', error);
    }
  }

  private mapFoodLog(row: any): FoodLog {
    return {
      id: row.id,
      userId: row.user_id,
      foodItemId: row.food_item_id,
      quantity: row.quantity,
      mealType: row.meal_type,
      loggedAt: row.logged_at,
      notes: row.notes,
    };
  }

  // --- DAILY SUMMARY OPERATIONS ---

  async getDailySummary(userId: number, date: string): Promise<DailySummary> {
    const db = this.getDb();
    try {
      // Join food_logs with food_items to calculate totals
      const result = await db.getFirstAsync<any>(
        `SELECT 
           SUM(fi.calories * fl.quantity) as totalCalories,
           SUM(fi.protein * fl.quantity) as totalProtein,
           SUM(fi.fats * fl.quantity) as totalFats,
           SUM(fi.carbs * fl.quantity) as totalCarbs
         FROM food_logs fl
         JOIN food_items fi ON fl.food_item_id = fi.id
         WHERE fl.user_id = ? AND fl.logged_at LIKE ?`,
        [userId, `${date}%`]
      );

      const goals = await this.getUserGoals(userId);
      
      const totalCalories = result?.totalCalories || 0;
      const totalProtein = result?.totalProtein || 0;
      const totalFats = result?.totalFats || 0;
      const totalCarbs = result?.totalCarbs || 0;

      // Simple logic for goals met (e.g., within 10% range or just greater/less depending on goal)
      // For simplicity, let's say met if within +/- 10% of goal
      const calorieDiff = Math.abs(totalCalories - goals.calories);
      const proteinDiff = Math.abs(totalProtein - goals.protein);
      
      const goalsMetCalories = calorieDiff <= (goals.calories * 0.1);
      const goalsMetProtein = proteinDiff <= (goals.protein * 0.1);

      // Completion percentage based on calories
      const completionPercentage = Math.min(100, (totalCalories / goals.calories) * 100);

      return {
        date,
        totalCalories,
        totalProtein,
        totalFats,
        totalCarbs,
        goalsMetCalories,
        goalsMetProtein,
        completionPercentage,
      };
    } catch (error) {
      throw new DatabaseQueryError('Failed to get daily summary', error);
    }
  }

  async getWeeklySummary(userId: number, startDate: string): Promise<DailySummary[]> {
    // Assuming startDate is YYYY-MM-DD
    // We need to generate 7 days
    const summaries: DailySummary[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      summaries.push(await this.getDailySummary(userId, dateStr));
    }
    return summaries;
  }

  async getMonthlyData(userId: number, year: number, month: number): Promise<DailySummary[]> {
    // month is 1-12
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const summaries: DailySummary[] = [];
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      summaries.push(await this.getDailySummary(userId, dateStr));
    }
    return summaries;
  }

  // --- STREAK OPERATIONS ---

  async updateDailyStreak(userId: number, date: string, summary: DailySummary): Promise<void> {
    const db = this.getDb();
    try {
      const goalsMet = (summary.goalsMetCalories && summary.goalsMetProtein) ? 1 : 0;
      
      await db.runAsync(
        `INSERT INTO daily_streaks (user_id, date, goals_met, calories_met, protein_met, total_calories, total_protein)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, date) DO UPDATE SET
           goals_met = excluded.goals_met,
           calories_met = excluded.calories_met,
           protein_met = excluded.protein_met,
           total_calories = excluded.total_calories,
           total_protein = excluded.total_protein`,
        [
          userId, 
          date, 
          goalsMet, 
          summary.goalsMetCalories ? 1 : 0, 
          summary.goalsMetProtein ? 1 : 0,
          summary.totalCalories,
          summary.totalProtein
        ]
      );
    } catch (error) {
      throw new DatabaseQueryError('Failed to update daily streak', error);
    }
  }

  async getCurrentStreak(userId: number): Promise<StreakData> {
    const db = this.getDb();
    try {
      // Get all streak entries ordered by date desc
      const entries = await db.getAllAsync<any>(
        `SELECT * FROM daily_streaks WHERE user_id = ? ORDER BY date DESC`,
        [userId]
      );

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Calculate streaks
      // This is a simple calculation assuming entries exist for every day. 
      // In reality, we might need to check for gaps.
      // Assuming the app calls updateDailyStreak every day or we fill gaps.
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if streak is active (entry for today or yesterday with goals met)
      let isStreakActive = false;
      if (entries.length > 0) {
        const lastEntry = entries[0];
        if ((lastEntry.date === today || lastEntry.date === yesterday) && lastEntry.goals_met) {
          isStreakActive = true;
        }
      }

      if (isStreakActive) {
        for (const entry of entries) {
          if (entry.goals_met) {
            currentStreak++;
          } else {
            break; // Streak broken
          }
          // Note: this simple loop assumes no missing dates in DB. 
          // A robust implementation would check date continuity.
        }
      }

      // Calculate longest streak
      for (const entry of entries) {
        if (entry.goals_met) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      const history = entries.slice(0, 30).map(e => ({
        date: e.date,
        goalsMet: !!e.goals_met,
        caloriesMet: !!e.calories_met,
        proteinMet: !!e.protein_met
      }));

      return {
        currentStreak,
        longestStreak,
        lastLogDate: entries[0]?.date || '',
        streakHistory: history
      };

    } catch (error) {
      throw new DatabaseQueryError('Failed to get current streak', error);
    }
  }

  async getStreakHistory(userId: number, days: number = 30): Promise<StreakEntry[]> {
    const db = this.getDb();
    try {
      const results = await db.getAllAsync<any>(
        `SELECT * FROM daily_streaks 
         WHERE user_id = ? 
         ORDER BY date DESC 
         LIMIT ?`,
        [userId, days]
      );

      return results.map(r => ({
        date: r.date,
        goalsMet: !!r.goals_met,
        caloriesMet: !!r.calories_met,
        proteinMet: !!r.protein_met
      }));
    } catch (error) {
      throw new DatabaseQueryError('Failed to get streak history', error);
    }
  }

  // --- REMINDER OPERATIONS ---

  async createReminder(reminder: Omit<Reminder, 'id'>): Promise<Reminder> {
    const db = this.getDb();
    try {
      const result = await db.runAsync(
        `INSERT INTO reminders (user_id, type, title, time, days, enabled, notification_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          reminder.userId,
          reminder.type,
          reminder.title,
          reminder.time,
          JSON.stringify(reminder.days),
          reminder.enabled ? 1 : 0,
          reminder.notificationId || null
        ]
      );

      return {
        id: result.lastInsertRowId,
        ...reminder
      };
    } catch (error) {
      throw new DatabaseQueryError('Failed to create reminder', error);
    }
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    const db = this.getDb();
    try {
      const results = await db.getAllAsync<any>(
        'SELECT * FROM reminders WHERE user_id = ?',
        [userId]
      );

      return results.map(r => ({
        id: r.id,
        userId: r.user_id,
        type: r.type,
        title: r.title,
        time: r.time,
        days: JSON.parse(r.days),
        enabled: !!r.enabled,
        notificationId: r.notification_id
      }));
    } catch (error) {
      throw new DatabaseQueryError('Failed to get reminders', error);
    }
  }

  async updateReminder(id: number, updates: Partial<Reminder>): Promise<void> {
    const db = this.getDb();
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
      if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
      if (updates.time !== undefined) { fields.push('time = ?'); values.push(updates.time); }
      if (updates.days !== undefined) { fields.push('days = ?'); values.push(JSON.stringify(updates.days)); }
      if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }
      if (updates.notificationId !== undefined) { fields.push('notification_id = ?'); values.push(updates.notificationId); }

      if (fields.length === 0) return;

      values.push(id);
      await db.runAsync(
        `UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      throw new DatabaseQueryError('Failed to update reminder', error);
    }
  }

  async deleteReminder(id: number): Promise<void> {
    const db = this.getDb();
    try {
      await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
    } catch (error) {
      throw new DatabaseQueryError('Failed to delete reminder', error);
    }
  }

  // --- ANALYTICS ---

  async getAverageCalories(userId: number, days: number): Promise<number> {
    const db = this.getDb();
    try {
      const result = await db.getFirstAsync<any>(
        `SELECT AVG(total_calories) as avgCal 
         FROM daily_streaks 
         WHERE user_id = ? 
         ORDER BY date DESC 
         LIMIT ?`,
        [userId, days]
      );
      return result?.avgCal || 0;
    } catch (error) {
      throw new DatabaseQueryError('Failed to get average calories', error);
    }
  }

  async getComplianceRate(userId: number, days: number): Promise<number> {
    const db = this.getDb();
    try {
      const result = await db.getFirstAsync<any>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN goals_met = 1 THEN 1 ELSE 0 END) as met
         FROM daily_streaks 
         WHERE user_id = ? 
         ORDER BY date DESC 
         LIMIT ?`,
        [userId, days]
      );
      
      if (!result || result.total === 0) return 0;
      return (result.met / result.total) * 100;
    } catch (error) {
      throw new DatabaseQueryError('Failed to get compliance rate', error);
    }
  }

  async getMostLoggedFoods(userId: number, limit: number): Promise<FoodItem[]> {
    const db = this.getDb();
    try {
      const results = await db.getAllAsync<any>(
        `SELECT fi.*, COUNT(fl.id) as log_count
         FROM food_logs fl
         JOIN food_items fi ON fl.food_item_id = fi.id
         WHERE fl.user_id = ?
         GROUP BY fi.id
         ORDER BY log_count DESC
         LIMIT ?`,
        [userId, limit]
      );
      
      return results.map(this.mapFoodItem);
    } catch (error) {
      throw new DatabaseQueryError('Failed to get most logged foods', error);
    }
  }

  // --- TESTING / UTILS ---

  // --- WATER INTAKE ---

  async logWaterIntake(userId: number, glasses: number, date?: string): Promise<void> {
    const db = this.getDb();
    const logDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Check if entry exists for this date
      const existing = await db.getFirstAsync<any>(
        'SELECT id, glasses FROM water_intake WHERE user_id = ? AND date = ?',
        [userId, logDate]
      );

      if (existing) {
        // Update existing entry
        await db.runAsync(
          'UPDATE water_intake SET glasses = ?, logged_at = CURRENT_TIMESTAMP WHERE id = ?',
          [glasses, existing.id]
        );
      } else {
        // Insert new entry
        await db.runAsync(
          'INSERT INTO water_intake (user_id, date, glasses) VALUES (?, ?, ?)',
          [userId, logDate, glasses]
        );
      }
    } catch (error) {
      throw new DatabaseQueryError('Failed to log water intake', error);
    }
  }

  async getWaterIntake(userId: number, date?: string): Promise<number> {
    const db = this.getDb();
    const logDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const result = await db.getFirstAsync<any>(
        'SELECT glasses FROM water_intake WHERE user_id = ? AND date = ?',
        [userId, logDate]
      );
      return result?.glasses || 0;
    } catch (error) {
      throw new DatabaseQueryError('Failed to get water intake', error);
    }
  }

  async incrementWaterIntake(userId: number, date?: string): Promise<number> {
    const db = this.getDb();
    const logDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const current = await this.getWaterIntake(userId, logDate);
      const newValue = Math.min(current + 1, 12); // Cap at 12 glasses
      await this.logWaterIntake(userId, newValue, logDate);
      return newValue;
    } catch (error) {
      throw new DatabaseQueryError('Failed to increment water intake', error);
    }
  }

  async decrementWaterIntake(userId: number, date?: string): Promise<number> {
    const db = this.getDb();
    const logDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const current = await this.getWaterIntake(userId, logDate);
      const newValue = Math.max(current - 1, 0); // Don't go below 0
      await this.logWaterIntake(userId, newValue, logDate);
      return newValue;
    } catch (error) {
      throw new DatabaseQueryError('Failed to decrement water intake', error);
    }
  }

  // --- TESTING / UTILS ---
  
  async generateMockData(userId: number): Promise<void> {
    // Helper to generate mock data for testing
    const db = this.getDb();
    // Implementation would go here - creating food items, logs, etc.
    // For brevity, leaving as placeholder or simple implementation
    console.log('Generating mock data for user', userId);
  }
}

export const databaseService = new DatabaseService();
