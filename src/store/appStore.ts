import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserProfile, 
  DailyGoals, 
  DailySummary, 
  FoodLog, 
  StreakData, 
  Reminder 
} from '../types';
import { databaseService } from '../services/database';

// Premium feature limits
export const FREE_AI_MESSAGES_LIMIT = 10;

// ============================================
// SLICE INTERFACES
// ============================================

interface UserSlice {
  user: UserProfile | null;
  goals: DailyGoals;
  userLoading: boolean;
  userError: string | null;
}

interface UserActions {
  loadUser: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  updateGoals: (goals: Partial<DailyGoals>) => Promise<void>;
  resetUser: () => void;
}

interface DailyLogSlice {
  currentDate: string;
  dailySummary: DailySummary | null;
  foodLogs: FoodLog[];
  dailyLogLoading: boolean;
}

interface DailyLogActions {
  setDate: (date: string) => void;
  loadDayData: (date?: string) => Promise<void>;
  addFoodLog: (log: Omit<FoodLog, 'id'>) => Promise<void>;
  updateFoodLog: (id: number, updates: Partial<FoodLog>) => Promise<void>;
  deleteFoodLog: (id: number) => Promise<void>;
  refreshSummary: () => Promise<void>;
}

interface StreakSlice {
  streakData: StreakData | null;
  streakLoading: boolean;
}

interface StreakActions {
  loadStreak: () => Promise<void>;
  checkAndUpdateStreak: () => Promise<void>;
}

interface ReminderSlice {
  reminders: Reminder[];
  remindersLoading: boolean;
}

interface ReminderActions {
  loadReminders: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (id: number, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: number) => Promise<void>;
  toggleReminder: (id: number) => Promise<void>;
}

interface UISlice {
  theme: 'light' | 'dark' | 'system';
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  isHydrated: boolean;
  unreadMessages: number;
  isPremium: boolean;
  premiumTrialUsed: boolean;
  aiUsageCount: number; // Track free AI usage
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setOnlineStatus: (status: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  setHydrated: (status: boolean) => void;
  setUnreadMessages: (count: number) => void;
  setPremium: (isPremium: boolean) => void;
  incrementAiUsage: () => void;
  canUseAiFeature: () => boolean;
}

// Combined Store Type
type AppState = UserSlice & DailyLogSlice & StreakSlice & ReminderSlice & UISlice;
type AppActions = UserActions & DailyLogActions & StreakActions & ReminderActions & UIActions;
type AppStore = AppState & AppActions;

// ============================================
// INITIAL STATES
// ============================================

const initialUserState: UserSlice = {
  user: null,
  goals: { calories: 2000, protein: 150, fats: 70, carbs: 200 },
  userLoading: false,
  userError: null,
};

const initialDailyLogState: DailyLogSlice = {
  currentDate: new Date().toISOString().split('T')[0],
  dailySummary: null,
  foodLogs: [],
  dailyLogLoading: false,
};

const initialStreakState: StreakSlice = {
  streakData: null,
  streakLoading: false,
};

const initialReminderState: ReminderSlice = {
  reminders: [],
  remindersLoading: false,
};

const initialUIState: UISlice = {
  theme: 'system',
  isOnline: true,
  syncStatus: 'idle',
  isHydrated: false,
  unreadMessages: 0,
  isPremium: false,
  premiumTrialUsed: false,
  aiUsageCount: 0,
};

// ============================================
// STORE CREATION
// ============================================

const USER_ID = 1; // TODO: Replace with auth context

export const useAppStore = create<AppStore>()(
  persist(
    immer((set, get) => ({
      // ========== Initial States ==========
      ...initialUserState,
      ...initialDailyLogState,
      ...initialStreakState,
      ...initialReminderState,
      ...initialUIState,

      // ========== User Actions ==========
      loadUser: async () => {
        set((state) => { state.userLoading = true; state.userError = null; });
        try {
          const user = await databaseService.getUser(USER_ID);
          set((state) => {
            state.user = user;
            if (user) {
              state.goals = {
                calories: user.dailyCalorieGoal,
                protein: user.dailyProteinGoal,
                fats: user.dailyFatGoal || 0,
                carbs: user.dailyCarbGoal || 0,
              };
            }
            state.userLoading = false;
          });
        } catch (error) {
          set((state) => { 
            state.userError = (error as Error).message; 
            state.userLoading = false; 
          });
        }
      },

      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.userError = null;
        });
      },

      updateUser: async (updates) => {
        const prevUser = get().user;
        // Optimistic update
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates);
          }
        });
        try {
          await databaseService.updateUser(USER_ID, updates);
        } catch (error) {
          // Rollback on error
          set((state) => { state.user = prevUser; });
          throw error;
        }
      },

      updateGoals: async (goals) => {
        const prevGoals = get().goals;
        // Optimistic update
        set((state) => {
          Object.assign(state.goals, goals);
        });
        try {
          await databaseService.updateUser(USER_ID, {
            dailyCalorieGoal: goals.calories ?? prevGoals.calories,
            dailyProteinGoal: goals.protein ?? prevGoals.protein,
            dailyFatGoal: goals.fats ?? prevGoals.fats,
            dailyCarbGoal: goals.carbs ?? prevGoals.carbs,
          });
        } catch (error) {
          // Rollback
          set((state) => { state.goals = prevGoals; });
          throw error;
        }
      },

      resetUser: () => {
        set((state) => {
          state.user = null;
          state.goals = initialUserState.goals;
          state.userError = null;
        });
      },

      // ========== Daily Log Actions ==========
      setDate: (date) => {
        set((state) => { state.currentDate = date; });
      },

      loadDayData: async (date) => {
        const targetDate = date || get().currentDate;
        set((state) => { state.dailyLogLoading = true; });
        try {
          const [summary, logs] = await Promise.all([
            databaseService.getDailySummary(USER_ID, targetDate),
            databaseService.getFoodLogsForDate(USER_ID, targetDate),
          ]);
          set((state) => {
            state.currentDate = targetDate;
            state.dailySummary = summary;
            state.foodLogs = logs;
            state.dailyLogLoading = false;
          });
        } catch (error) {
          set((state) => { state.dailyLogLoading = false; });
          console.error('Failed to load day data:', error);
        }
      },

      addFoodLog: async (log) => {
        try {
          const newLog = await databaseService.logFood(log);
          set((state) => {
            state.foodLogs.push(newLog);
          });
          // Refresh summary after adding
          await get().refreshSummary();
        } catch (error) {
          console.error('Failed to add food log:', error);
          throw error;
        }
      },

      updateFoodLog: async (id, updates) => {
        const prevLogs = get().foodLogs;
        // Optimistic update
        set((state) => {
          const index = state.foodLogs.findIndex((l: FoodLog) => l.id === id);
          if (index !== -1) {
            Object.assign(state.foodLogs[index], updates);
          }
        });
        try {
          await databaseService.updateFoodLog(id, updates);
          await get().refreshSummary();
        } catch (error) {
          set((state) => { state.foodLogs = prevLogs; });
          throw error;
        }
      },

      deleteFoodLog: async (id) => {
        const prevLogs = get().foodLogs;
        // Optimistic update
        set((state) => {
          state.foodLogs = state.foodLogs.filter((l: FoodLog) => l.id !== id);
        });
        try {
          await databaseService.deleteFoodLog(id);
          await get().refreshSummary();
        } catch (error) {
          set((state) => { state.foodLogs = prevLogs; });
          throw error;
        }
      },

      refreshSummary: async () => {
        try {
          const summary = await databaseService.getDailySummary(USER_ID, get().currentDate);
          set((state) => { state.dailySummary = summary; });
        } catch (error) {
          console.error('Failed to refresh summary:', error);
        }
      },

      // ========== Streak Actions ==========
      loadStreak: async () => {
        set((state) => { state.streakLoading = true; });
        try {
          const streak = await databaseService.getCurrentStreak(USER_ID);
          set((state) => {
            state.streakData = streak;
            state.streakLoading = false;
          });
        } catch (error) {
          set((state) => { state.streakLoading = false; });
          console.error('Failed to load streak:', error);
        }
      },

      checkAndUpdateStreak: async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const summary = await databaseService.getDailySummary(USER_ID, today);
          await databaseService.updateDailyStreak(USER_ID, today, summary);
          await get().loadStreak();
        } catch (error) {
          console.error('Failed to update streak:', error);
        }
      },

      // ========== Reminder Actions ==========
      loadReminders: async () => {
        set((state) => { state.remindersLoading = true; });
        try {
          const reminders = await databaseService.getReminders(USER_ID);
          set((state) => {
            state.reminders = reminders;
            state.remindersLoading = false;
          });
        } catch (error) {
          set((state) => { state.remindersLoading = false; });
          console.error('Failed to load reminders:', error);
        }
      },

      addReminder: async (reminder) => {
        try {
          const newReminder = await databaseService.createReminder(reminder);
          set((state) => {
            state.reminders.push(newReminder);
          });
        } catch (error) {
          console.error('Failed to add reminder:', error);
          throw error;
        }
      },

      updateReminder: async (id, updates) => {
        const prevReminders = get().reminders;
        set((state) => {
          const index = state.reminders.findIndex((r: Reminder) => r.id === id);
          if (index !== -1) {
            Object.assign(state.reminders[index], updates);
          }
        });
        try {
          await databaseService.updateReminder(id, updates);
        } catch (error) {
          set((state) => { state.reminders = prevReminders; });
          throw error;
        }
      },

      deleteReminder: async (id) => {
        const prevReminders = get().reminders;
        set((state) => {
          state.reminders = state.reminders.filter((r: Reminder) => r.id !== id);
        });
        try {
          await databaseService.deleteReminder(id);
        } catch (error) {
          set((state) => { state.reminders = prevReminders; });
          throw error;
        }
      },

      toggleReminder: async (id) => {
        const reminder = get().reminders.find(r => r.id === id);
        if (reminder) {
          await get().updateReminder(id, { enabled: !reminder.enabled });
        }
      },

      // ========== UI Actions ==========
      setTheme: (theme) => {
        set((state) => { state.theme = theme; });
      },

      setOnlineStatus: (status) => {
        set((state) => { state.isOnline = status; });
      },

      setSyncStatus: (status) => {
        set((state) => { state.syncStatus = status; });
      },

      setHydrated: (status) => {
        set((state) => { state.isHydrated = status; });
      },

      setUnreadMessages: (count) => {
        set((state) => { state.unreadMessages = count; });
      },

      setPremium: (isPremium) => {
        set((state) => { state.isPremium = isPremium; });
      },

      incrementAiUsage: () => {
        set((state) => { state.aiUsageCount += 1; });
      },

      canUseAiFeature: () => {
        const state = get();
        // Premium users have unlimited access
        if (state.isPremium) return true;
        // Free users get 3 AI uses per day
        return state.aiUsageCount < 3;
      },
    })),
    {
      name: 'fittrack-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-loading states and user preferences
      partialize: (state) => ({
        theme: state.theme,
        goals: state.goals,
        currentDate: state.currentDate,
        isPremium: state.isPremium,
        premiumTrialUsed: state.premiumTrialUsed,
        aiUsageCount: state.aiUsageCount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// ============================================
// TYPED SELECTORS
// ============================================

// User selectors
export const useUser = () => useAppStore((state) => state.user);
export const useGoals = () => useAppStore((state) => state.goals);
export const useUserLoading = () => useAppStore((state) => state.userLoading);
export const useUserError = () => useAppStore((state) => state.userError);

// Daily log selectors
export const useCurrentDate = () => useAppStore((state) => state.currentDate);
export const useDailySummary = () => useAppStore((state) => state.dailySummary);
export const useFoodLogs = () => useAppStore((state) => state.foodLogs);
export const useDailyLogLoading = () => useAppStore((state) => state.dailyLogLoading);

// Streak selectors
export const useStreakData = () => useAppStore((state) => state.streakData);
export const useCurrentStreak = () => useAppStore((state) => state.streakData?.currentStreak ?? 0);
export const useLongestStreak = () => useAppStore((state) => state.streakData?.longestStreak ?? 0);

// Reminder selectors
export const useReminders = () => useAppStore((state) => state.reminders);
export const useActiveReminders = () => useAppStore((state) => state.reminders.filter(r => r.enabled));

// UI selectors
export const useTheme = () => useAppStore((state) => state.theme);
export const useIsOnline = () => useAppStore((state) => state.isOnline);
export const useSyncStatus = () => useAppStore((state) => state.syncStatus);
export const useIsHydrated = () => useAppStore((state) => state.isHydrated);

// Computed selectors
export const useCaloriesRemaining = () => useAppStore((state) => {
  const { goals, dailySummary } = state;
  return goals.calories - (dailySummary?.totalCalories ?? 0);
});

export const useProteinRemaining = () => useAppStore((state) => {
  const { goals, dailySummary } = state;
  return goals.protein - (dailySummary?.totalProtein ?? 0);
});

export const useMacroProgress = () => useAppStore((state) => {
  const { goals, dailySummary } = state;
  return {
    calories: Math.min(100, ((dailySummary?.totalCalories ?? 0) / goals.calories) * 100),
    protein: Math.min(100, ((dailySummary?.totalProtein ?? 0) / goals.protein) * 100),
    fats: Math.min(100, ((dailySummary?.totalFats ?? 0) / goals.fats) * 100),
    carbs: Math.min(100, ((dailySummary?.totalCarbs ?? 0) / goals.carbs) * 100),
  };
});

// ============================================
// ACTIONS HOOK (for components that need multiple actions)
// ============================================

export const useAppActions = () => useAppStore((state) => ({
  // User
  loadUser: state.loadUser,
  updateUser: state.updateUser,
  updateGoals: state.updateGoals,
  resetUser: state.resetUser,
  // Daily Log
  setDate: state.setDate,
  loadDayData: state.loadDayData,
  addFoodLog: state.addFoodLog,
  updateFoodLog: state.updateFoodLog,
  deleteFoodLog: state.deleteFoodLog,
  refreshSummary: state.refreshSummary,
  // Streak
  loadStreak: state.loadStreak,
  checkAndUpdateStreak: state.checkAndUpdateStreak,
  // Reminders
  loadReminders: state.loadReminders,
  addReminder: state.addReminder,
  updateReminder: state.updateReminder,
  deleteReminder: state.deleteReminder,
  toggleReminder: state.toggleReminder,
  // UI
  setTheme: state.setTheme,
  setOnlineStatus: state.setOnlineStatus,
  setSyncStatus: state.setSyncStatus,
}));

// ============================================
// HYDRATION HELPER
// ============================================

export const initializeStore = async () => {
  const { loadUser, loadDayData, loadStreak, loadReminders } = useAppStore.getState();
  
  try {
    await Promise.all([
      loadUser(),
      loadDayData(),
      loadStreak(),
      loadReminders(),
    ]);
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
};
