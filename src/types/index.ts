/**
 * Core User Profile information.
 */
export interface UserProfile {
  id: number;
  name: string;
  gender: 'male' | 'female'; // Added gender
  age?: number; // in years
  weight?: number; // in kg
  height?: number; // in cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyFatGoal?: number;
  dailyCarbGoal?: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Represents the daily nutritional goals for a user.
 */
export interface DailyGoals {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

/**
 * Represents a single food item with its nutritional information.
 */
export interface FoodItem {
  id: number;
  name: string;
  servingSize: number;
  servingUnit: 'g' | 'ml' | 'oz' | 'cup' | 'piece' | 'unit'; // Added 'unit' for flexibility
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  barcode?: string;
  source: 'manual' | 'barcode' | 'ai_estimate' | 'database';
  confidence?: number; // for AI estimates (0-100)
  imageUri?: string;
  createdAt: string; // ISO date string
}

/**
 * Represents an instance of a user logging a specific food item.
 */
export interface FoodLog {
  id: number;
  userId: number;
  foodItemId: number;
  quantity: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  loggedAt: string; // ISO date string
  notes?: string;
}

export interface FoodLogWithDetails extends FoodLog {
  foodName: string;
  calories: number; // Total calories for this log (unit calories * quantity)
  protein: number;
  fats: number;
  carbs: number;
  servingUnit: string;
}

/**
 * Summary of nutritional intake for a specific day.
 */
export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalCarbs: number;
  goalsMetCalories: boolean;
  goalsMetProtein: boolean;
  completionPercentage: number;
}

/**
 * Data related to user streaks for meeting goals.
 */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string; // YYYY-MM-DD
  streakHistory: StreakEntry[];
}

/**
 * An entry in the streak history, indicating goal completion for a day.
 */
export interface StreakEntry {
  date: string; // YYYY-MM-DD
  goalsMet: boolean;
  caloriesMet: boolean;
  proteinMet: boolean;
}

/**
 * Represents a user-defined reminder.
 */
export interface Reminder {
  id: number;
  userId: number;
  type: 'meal' | 'supplement' | 'water' | 'weigh_in' | 'custom'; // Added 'custom'
  title: string;
  time: string; // HH:mm format
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  notificationId?: string; // ID for the scheduled notification
}

/**
 * A single message within a chatbot session.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO date string
  context?: {
    currentMacros?: DailySummary;
    userGoals?: DailyGoals;
    // Add more context types as needed for the chatbot
  };
}

/**
 * Represents a complete chatbot session.
 */
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string; // ISO date string
  lastMessageAt: string; // ISO date string
}

/**
 * Estimated nutritional information for a food item from AI recognition.
 */
export interface AIFoodEstimate {
  foodName: string;
  estimatedMacros: {
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
  };
  servingSize: number;
  servingUnit: string;
  confidence: number; // 0-100
  alternatives?: AIFoodEstimate[];
  reasoning?: string; // Explanation from AI
}

// Utility Types for API Responses
/**
 * Generic API response structure for data retrieval.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/**
 * Standard error structure for API responses.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Custom Error Types
/**
 * Error for when a resource is not found.
 */
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Error for invalid input or validation failures.
 */
export class ValidationError extends Error {
  details: Record<string, any>;
  constructor(message: string = 'Validation failed', details: Record<string, any> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Error for authentication or authorization issues.
 */
export class AuthError extends Error {
  constructor(message: string = 'Authentication or authorization failed') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Generic API error for unhandled server issues.
 */
export class ApiConnectionError extends Error {
  constructor(message: string = 'Failed to connect to the API') {
    super(message);
    this.name = 'ApiConnectionError';
  }
}