/**
 * Common UI Components
 *
 * A comprehensive library of reusable UI components for FitTrack.
 * All components support NativeWind styling, accessibility, and animations.
 *
 * @example
 * import {
 *   Button,
 *   Card,
 *   CircularProgress,
 *   TextInput,
 *   Modal,
 *   Toast,
 *   useToast,
 *   StoreProvider,
 * } from '@/components/common';
 */

// ============================================================================
// PROVIDERS
// ============================================================================
export { StoreProvider } from './StoreProvider';

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================
export { Button, IconButton } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps } from './Button';

// ============================================================================
// CARD COMPONENTS
// ============================================================================
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardVariant, CardPadding, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';

// ============================================================================
// PROGRESS COMPONENTS
// ============================================================================
export { CircularProgress } from './CircularProgress';
export type { CircularProgressProps, InnerRing } from './CircularProgress';

export { LinearProgress } from './LinearProgress';
export type { LinearProgressProps, LabelPosition } from './LinearProgress';

export { MacroProgressRing, MacroProgressBar } from './MacroProgressRing';
export type { MacroProgressRingProps, MacroProgressBarProps, MacroType } from './MacroProgressRing';

// ============================================================================
// INPUT COMPONENTS
// ============================================================================
export { TextInput } from './TextInput';
export type { TextInputProps, InputVariant } from './TextInput';

export { NumericInput } from './NumericInput';
export type { NumericInputProps } from './NumericInput';

export { Dropdown } from './Dropdown';
export type { DropdownProps, DropdownOption } from './Dropdown';

// ============================================================================
// MODAL COMPONENTS
// ============================================================================
export { BottomSheet } from './BottomSheet';
export type { BottomSheetProps } from './BottomSheet';

export { Modal, AlertModal, ConfirmModal } from './Modal';
export type { ModalProps, ModalAction, ModalSize } from './Modal';

export { Toast, ToastProvider, useToast } from './Toast';
export type { ToastProps, ToastVariant, ToastPosition, ToastAction } from './Toast';

// ============================================================================
// LIST COMPONENTS
// ============================================================================
export { ListItem, ListSection, ListSeparator } from './ListItem';
export type { ListItemProps, ListSectionProps } from './ListItem';

export { SwipeableRow } from './SwipeableRow';
export type { SwipeableRowProps, SwipeAction } from './SwipeableRow';

// ============================================================================
// EMPTY STATES
// ============================================================================
export {
  EmptyState,
  EmptyFoodLog,
  EmptySearchResults,
  EmptyHistory,
  ErrorState,
  OfflineState,
  emptyStatePresets,
} from './EmptyState';
export type { EmptyStateProps, EmptyStateVariant } from './EmptyState';

// ============================================================================
// DATE/TIME COMPONENTS
// ============================================================================
export { WeekdayPicker } from './WeekdayPicker';
export type { WeekdayPickerProps } from './WeekdayPicker';

export { TimePicker } from './TimePicker';
export type { TimePickerProps } from './TimePicker';

// ============================================================================
// ERROR HANDLING COMPONENTS
// ============================================================================
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ErrorFallbackScreen } from './ErrorFallbackScreen';
