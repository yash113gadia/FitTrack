/**
 * App Store Tests
 * 
 * Comprehensive tests for Zustand state management
 */

import { renderHook, act } from '@testing-library/react-native';
import { 
  useAppStore,
  useUser,
  useGoals,
  useDailySummary,
  useFoodLogs,
  useStreakData,
  useCurrentStreak,
  useLongestStreak,
  useReminders,
  useTheme,
  useIsOnline,
  useSyncStatus,
} from '../appStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock database service
jest.mock('../../services/database', () => ({
  databaseService: {
    initDatabase: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getUserGoals: jest.fn(),
    getFoodLogsWithDetailsForDate: jest.fn(() => []),
    getDailySummary: jest.fn(),
    getCurrentStreak: jest.fn(() => ({ currentStreak: 0, longestStreak: 0, lastLogDate: null, streakHistory: [] })),
    getReminders: jest.fn(() => []),
    logFood: jest.fn(),
    updateFoodLog: jest.fn(),
    deleteFoodLog: jest.fn(),
    createReminder: jest.fn(),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
  },
}));

describe('App Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAppStore.setState({
      // User slice
      user: null,
      goals: { calories: 2000, protein: 150, fats: 70, carbs: 200 },
      userLoading: false,
      userError: null,
      
      // Daily log slice
      currentDate: new Date().toISOString().split('T')[0],
      dailySummary: null,
      foodLogs: [],
      dailyLogLoading: false,
      
      // Streak slice
      streakData: null,
      streakLoading: false,
      
      // Reminder slice
      reminders: [],
      remindersLoading: false,
      
      // UI slice
      theme: 'system',
      isOnline: true,
      syncStatus: 'idle',
      isHydrated: false,
    });
  });

  describe('User Slice', () => {
    describe('Initial State', () => {
      it('should have null user initially', () => {
        expect(useAppStore.getState().user).toBeNull();
      });

      it('should have default goals', () => {
        const goals = useAppStore.getState().goals;
        expect(goals.calories).toBe(2000);
        expect(goals.protein).toBe(150);
        expect(goals.fats).toBe(70);
        expect(goals.carbs).toBe(200);
      });

      it('should not be loading initially', () => {
        expect(useAppStore.getState().userLoading).toBe(false);
      });

      it('should have no error initially', () => {
        expect(useAppStore.getState().userError).toBeNull();
      });
    });

    describe('resetUser', () => {
      it('should reset user to null', () => {
        // First set a user
        useAppStore.setState({
          user: {
            id: 1,
            name: 'Test',
            gender: 'male',
            activityLevel: 'moderate',
            goal: 'maintain',
            dailyCalorieGoal: 2000,
            dailyProteinGoal: 150,
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15',
          },
        });

        act(() => {
          useAppStore.getState().resetUser();
        });

        expect(useAppStore.getState().user).toBeNull();
      });
    });
  });

  describe('Daily Log Slice', () => {
    describe('Initial State', () => {
      it('should have empty food logs initially', () => {
        expect(useAppStore.getState().foodLogs).toEqual([]);
      });

      it('should have null daily summary initially', () => {
        expect(useAppStore.getState().dailySummary).toBeNull();
      });

      it('should have current date set', () => {
        expect(useAppStore.getState().currentDate).toBeDefined();
      });
    });

    describe('setDate', () => {
      it('should update current date', () => {
        act(() => {
          useAppStore.getState().setDate('2024-01-20');
        });

        expect(useAppStore.getState().currentDate).toBe('2024-01-20');
      });
    });
  });

  describe('Streak Slice', () => {
    describe('Initial State', () => {
      it('should have null streak data initially', () => {
        expect(useAppStore.getState().streakData).toBeNull();
      });

      it('should not be loading initially', () => {
        expect(useAppStore.getState().streakLoading).toBe(false);
      });
    });
  });

  describe('Reminder Slice', () => {
    describe('Initial State', () => {
      it('should have empty reminders array initially', () => {
        expect(useAppStore.getState().reminders).toEqual([]);
      });

      it('should not be loading initially', () => {
        expect(useAppStore.getState().remindersLoading).toBe(false);
      });
    });
  });

  describe('UI Slice', () => {
    describe('Initial State', () => {
      it('should have system theme initially', () => {
        expect(useAppStore.getState().theme).toBe('system');
      });

      it('should be online initially', () => {
        expect(useAppStore.getState().isOnline).toBe(true);
      });

      it('should have idle sync status initially', () => {
        expect(useAppStore.getState().syncStatus).toBe('idle');
      });
    });

    describe('setTheme', () => {
      it('should update theme', () => {
        act(() => {
          useAppStore.getState().setTheme('dark');
        });

        expect(useAppStore.getState().theme).toBe('dark');
      });

      it('should accept light theme', () => {
        act(() => {
          useAppStore.getState().setTheme('light');
        });

        expect(useAppStore.getState().theme).toBe('light');
      });
    });

    describe('setOnlineStatus', () => {
      it('should update online status', () => {
        act(() => {
          useAppStore.getState().setOnlineStatus(false);
        });

        expect(useAppStore.getState().isOnline).toBe(false);
      });
    });

    describe('setSyncStatus', () => {
      it('should update sync status to syncing', () => {
        act(() => {
          useAppStore.getState().setSyncStatus('syncing');
        });

        expect(useAppStore.getState().syncStatus).toBe('syncing');
      });

      it('should update sync status to error', () => {
        act(() => {
          useAppStore.getState().setSyncStatus('error');
        });

        expect(useAppStore.getState().syncStatus).toBe('error');
      });
    });

    describe('setHydrated', () => {
      it('should update hydrated status', () => {
        act(() => {
          useAppStore.getState().setHydrated(true);
        });

        expect(useAppStore.getState().isHydrated).toBe(true);
      });
    });
  });
});

describe('Selector Hooks', () => {
  beforeEach(() => {
    useAppStore.setState({
      user: {
        id: 1,
        name: 'Test',
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'maintain',
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 150,
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      },
      goals: { calories: 2000, protein: 150, fats: 65, carbs: 250 },
      userLoading: false,
      userError: null,
      currentDate: '2024-01-15',
      dailySummary: {
        date: '2024-01-15',
        totalCalories: 1500,
        totalProtein: 100,
        totalFats: 50,
        totalCarbs: 150,
        goalsMetCalories: false,
        goalsMetProtein: false,
        completionPercentage: 75,
      },
      foodLogs: [],
      dailyLogLoading: false,
      streakData: {
        currentStreak: 5,
        longestStreak: 10,
        lastLogDate: '2024-01-15',
        streakHistory: [],
      },
      streakLoading: false,
      reminders: [
        {
          id: 1,
          userId: 1,
          type: 'meal',
          title: 'Breakfast',
          time: '08:00',
          days: [1, 2, 3, 4, 5],
          enabled: true,
        },
      ],
      remindersLoading: false,
      theme: 'dark',
      isOnline: true,
      syncStatus: 'idle',
      isHydrated: true,
    });
  });

  describe('useUser', () => {
    it('should return user data', () => {
      const { result } = renderHook(() => useUser());
      expect(result.current?.name).toBe('Test');
    });

    it('should return null when no user', () => {
      useAppStore.setState({ user: null });
      const { result } = renderHook(() => useUser());
      expect(result.current).toBeNull();
    });
  });

  describe('useGoals', () => {
    it('should return goals', () => {
      const { result } = renderHook(() => useGoals());
      expect(result.current.calories).toBe(2000);
      expect(result.current.protein).toBe(150);
    });
  });

  describe('useDailySummary', () => {
    it('should return daily summary', () => {
      const { result } = renderHook(() => useDailySummary());
      expect(result.current?.totalCalories).toBe(1500);
      expect(result.current?.completionPercentage).toBe(75);
    });

    it('should return null when no summary', () => {
      useAppStore.setState({ dailySummary: null });
      const { result } = renderHook(() => useDailySummary());
      expect(result.current).toBeNull();
    });
  });

  describe('useFoodLogs', () => {
    it('should return food logs array', () => {
      const { result } = renderHook(() => useFoodLogs());
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  describe('useStreakData', () => {
    it('should return streak data', () => {
      const { result } = renderHook(() => useStreakData());
      expect(result.current?.currentStreak).toBe(5);
      expect(result.current?.longestStreak).toBe(10);
    });
  });

  describe('useCurrentStreak', () => {
    it('should return current streak number', () => {
      const { result } = renderHook(() => useCurrentStreak());
      expect(result.current).toBe(5);
    });

    it('should return 0 when no streak data', () => {
      useAppStore.setState({ streakData: null });
      const { result } = renderHook(() => useCurrentStreak());
      expect(result.current).toBe(0);
    });
  });

  describe('useLongestStreak', () => {
    it('should return longest streak number', () => {
      const { result } = renderHook(() => useLongestStreak());
      expect(result.current).toBe(10);
    });

    it('should return 0 when no streak data', () => {
      useAppStore.setState({ streakData: null });
      const { result } = renderHook(() => useLongestStreak());
      expect(result.current).toBe(0);
    });
  });

  describe('useReminders', () => {
    it('should return reminders array', () => {
      const { result } = renderHook(() => useReminders());
      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe('Breakfast');
    });
  });

  describe('useTheme', () => {
    it('should return current theme', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current).toBe('dark');
    });
  });

  describe('useIsOnline', () => {
    it('should return online status', () => {
      const { result } = renderHook(() => useIsOnline());
      expect(result.current).toBe(true);
    });
  });

  describe('useSyncStatus', () => {
    it('should return sync status', () => {
      const { result } = renderHook(() => useSyncStatus());
      expect(result.current).toBe('idle');
    });
  });
});

describe('Store Persistence', () => {
  it('should have persist configuration', () => {
    // The store should be created with persist middleware
    expect(useAppStore).toBeDefined();
  });
});

describe('Store Actions Integration', () => {
  it('should have loadUser action', () => {
    expect(typeof useAppStore.getState().loadUser).toBe('function');
  });

  it('should have updateUser action', () => {
    expect(typeof useAppStore.getState().updateUser).toBe('function');
  });

  it('should have updateGoals action', () => {
    expect(typeof useAppStore.getState().updateGoals).toBe('function');
  });

  it('should have setDate action', () => {
    expect(typeof useAppStore.getState().setDate).toBe('function');
  });

  it('should have loadDayData action', () => {
    expect(typeof useAppStore.getState().loadDayData).toBe('function');
  });

  it('should have addFoodLog action', () => {
    expect(typeof useAppStore.getState().addFoodLog).toBe('function');
  });

  it('should have deleteFoodLog action', () => {
    expect(typeof useAppStore.getState().deleteFoodLog).toBe('function');
  });

  it('should have loadStreak action', () => {
    expect(typeof useAppStore.getState().loadStreak).toBe('function');
  });

  it('should have loadReminders action', () => {
    expect(typeof useAppStore.getState().loadReminders).toBe('function');
  });

  it('should have addReminder action', () => {
    expect(typeof useAppStore.getState().addReminder).toBe('function');
  });

  it('should have toggleReminder action', () => {
    expect(typeof useAppStore.getState().toggleReminder).toBe('function');
  });
});
