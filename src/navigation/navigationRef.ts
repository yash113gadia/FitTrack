/**
 * Navigation Reference
 * 
 * Provides navigation utilities that can be used outside of React components.
 * Useful for navigation from services, utilities, or other non-component code.
 */

import { createNavigationContainerRef, StackActions, CommonActions } from '@react-navigation/native';
import type { RootStackParamList, MainTabParamList } from './types';

// ============================================================================
// NAVIGATION REF
// ============================================================================

/**
 * Navigation container ref for programmatic navigation
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Ref to track if navigation is ready
 */
export const isReadyRef: { current: boolean } = { current: false };

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to a screen
 * @param name - Screen name
 * @param params - Screen params
 */
export function navigate<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
): void {
  if (navigationRef.isReady()) {
    // @ts-expect-error - Navigation typing is complex, this is safe
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation not ready, cannot navigate to:', name);
  }
}

/**
 * Go back to previous screen
 */
export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Replace current screen with a new one
 * @param name - Screen name
 * @param params - Screen params
 */
export function replace<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name, params));
  }
}

/**
 * Push a new screen onto the stack
 * @param name - Screen name
 * @param params - Screen params
 */
export function push<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name, params));
  }
}

/**
 * Pop screens from the stack
 * @param count - Number of screens to pop (default: 1)
 */
export function pop(count: number = 1): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.pop(count));
  }
}

/**
 * Pop to the top of the stack
 */
export function popToTop(): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.popToTop());
  }
}

/**
 * Reset the navigation state
 * @param routes - New routes to set
 * @param index - Index of active route (default: last route)
 */
export function reset(
  routes: { name: keyof RootStackParamList; params?: any }[],
  index?: number
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: index ?? routes.length - 1,
        routes,
      })
    );
  }
}

/**
 * Navigate to a tab in MainTabs
 * @param tabName - Tab name
 */
export function navigateToTab(tabName: keyof MainTabParamList): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('MainTabs', { screen: tabName } as any);
  }
}

/**
 * Get current route name
 * @returns Current route name or undefined
 */
export function getCurrentRouteName(): string | undefined {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return undefined;
}

/**
 * Get current route params
 * @returns Current route params or undefined
 */
export function getCurrentRouteParams(): Record<string, any> | undefined {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.params as Record<string, any> | undefined;
  }
  return undefined;
}

/**
 * Check if can go back
 * @returns True if can go back
 */
export function canGoBack(): boolean {
  if (navigationRef.isReady()) {
    return navigationRef.canGoBack();
  }
  return false;
}

/**
 * Check if navigation is ready
 * @returns True if navigation is ready
 */
export function isNavigationReady(): boolean {
  return isReadyRef.current && navigationRef.isReady();
}

// ============================================================================
// TYPED NAVIGATION SHORTCUTS
// ============================================================================

/**
 * Navigation shortcuts for common screens
 */
export const NavigationShortcuts = {
  /** Navigate to Dashboard */
  toDashboard: () => navigateToTab('Dashboard'),
  
  /** Navigate to History */
  toHistory: () => navigateToTab('History'),
  
  /** Navigate to Chatbot */
  toChatbot: () => navigateToTab('Chatbot'),
  
  /** Navigate to Profile */
  toProfile: () => navigateToTab('Profile'),
  
  /** Navigate to Log Food */
  toLogFood: (params?: RootStackParamList['LogFood']) => navigate('LogFood', params),
  
  /** Navigate to Barcode Scanner */
  toBarcodeScanner: () => navigate('BarcodeScanner'),
  
  /** Navigate to AI Scanner */
  toAIScanner: () => navigate('AIScanner'),
  
  /** Navigate to Food Details */
  toFoodDetails: (foodId: number) => navigate('FoodDetails', { foodId }),
  
  /** Navigate to Settings */
  toSettings: () => navigate('Settings'),
  
  /** Navigate to Edit Reminder */
  toEditReminder: (reminderId?: number) => navigate('EditReminder', { reminderId }),
  
  /** Navigate to Reminder List */
  toReminderList: () => navigate('ReminderList'),
};
