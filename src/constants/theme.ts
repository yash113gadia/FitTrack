/**
 * FitTrack Theme Configuration
 * Comprehensive theming system for NativeWind (Tailwind CSS)
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    50: '#e6f2ff',
    100: '#cce5ff',
    200: '#99cbff',
    300: '#66b0ff',
    400: '#3396ff',
    500: '#007bff', // Main brand color
    600: '#0062cc',
    700: '#004a99',
    800: '#003166',
    900: '#001933',
    DEFAULT: '#007bff',
  },

  // Success (for met goals)
  success: {
    50: '#e6f9f0',
    100: '#ccf3e1',
    200: '#99e7c3',
    300: '#66dba5',
    400: '#33cf87',
    500: '#00c853', // Main success
    600: '#00a043',
    700: '#009624',
    800: '#005018',
    900: '#00280c',
    DEFAULT: '#00c853',
  },

  // Warning
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107', // Main warning
    600: '#ffb300',
    700: '#f57c00',
    800: '#e65100',
    900: '#bf360c',
    DEFAULT: '#ffc107',
  },

  // Error
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336', // Main error
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
    DEFAULT: '#f44336',
  },

  // Macro colors (for nutrition tracking)
  macros: {
    calories: '#FF6B6B',
    protein: '#4ECDC4',
    fats: '#FFE66D',
    carbs: '#95E1D3',
    fiber: '#A78BFA',
    sugar: '#FB7185',
  },

  // Individual macro exports for convenience
  calories: '#FF6B6B',
  protein: '#4ECDC4',
  fats: '#FFE66D',
  carbs: '#95E1D3',

  // Neutrals / Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F5',
    dark: '#1A1A1A',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    muted: '#F3F4F6',
  },

  // Text colors
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#007bff',
  },

  // Border colors
  border: {
    light: '#E5E7EB',
    default: '#D1D5DB',
    dark: '#9CA3AF',
    focus: '#007bff',
  },

  // Transparent variants
  transparent: {
    black10: 'rgba(0, 0, 0, 0.1)',
    black20: 'rgba(0, 0, 0, 0.2)',
    black50: 'rgba(0, 0, 0, 0.5)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white50: 'rgba(255, 255, 255, 0.5)',
  },

  // Common
  white: '#FFFFFF',
  black: '#000000',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  // Semantic aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  default: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 0, // Inner shadows don't translate well to Android
  },
} as const;

// =============================================================================
// ANIMATIONS
// =============================================================================

export const animations = {
  // Spring animations (react-native-reanimated)
  spring: {
    gentle: {
      damping: 20,
      stiffness: 100,
      mass: 1,
    },
    default: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
    bouncy: {
      damping: 10,
      stiffness: 300,
      mass: 0.8,
    },
    stiff: {
      damping: 30,
      stiffness: 400,
      mass: 1,
    },
    slow: {
      damping: 25,
      stiffness: 150,
      mass: 1.2,
    },
  },
  // Timing animations
  timing: {
    fast: {
      duration: 150,
    },
    default: {
      duration: 300,
    },
    slow: {
      duration: 500,
    },
    verySlow: {
      duration: 800,
    },
  },
  // Easing presets (for Animated API)
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 9999,
} as const;

// =============================================================================
// COMPONENT PRESETS
// =============================================================================

export const componentPresets = {
  // Button variants
  button: {
    base: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    },
    primary: {
      backgroundColor: colors.primary[500],
    },
    secondary: {
      backgroundColor: colors.gray[200],
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary[500],
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.error[500],
    },
    success: {
      backgroundColor: colors.success[500],
    },
    disabled: {
      backgroundColor: colors.gray[300],
      opacity: 0.6,
    },
    // Size variants
    sm: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      minHeight: 32,
    },
    md: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 44,
    },
    lg: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 56,
    },
  },

  // Card variants
  card: {
    base: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.md,
    },
    flat: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    elevated: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.lg,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
  },

  // Input variants
  input: {
    base: {
      backgroundColor: colors.background.primary,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      minHeight: 48,
    },
    focused: {
      borderColor: colors.primary[500],
      borderWidth: 2,
    },
    error: {
      borderColor: colors.error[500],
      borderWidth: 1,
    },
    disabled: {
      backgroundColor: colors.gray[100],
      color: colors.text.muted,
    },
    filled: {
      backgroundColor: colors.gray[100],
      borderWidth: 0,
    },
  },

  // Badge variants
  badge: {
    base: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start' as const,
    },
    primary: {
      backgroundColor: colors.primary[100],
    },
    success: {
      backgroundColor: colors.success[50],
    },
    warning: {
      backgroundColor: colors.warning[50],
    },
    error: {
      backgroundColor: colors.error[50],
    },
    neutral: {
      backgroundColor: colors.gray[100],
    },
  },

  // Progress bar
  progressBar: {
    container: {
      height: 8,
      backgroundColor: colors.gray[200],
      borderRadius: borderRadius.full,
      overflow: 'hidden' as const,
    },
    fill: {
      height: '100%',
      borderRadius: borderRadius.full,
    },
    calories: {
      backgroundColor: colors.macros.calories,
    },
    protein: {
      backgroundColor: colors.macros.protein,
    },
    fats: {
      backgroundColor: colors.macros.fats,
    },
    carbs: {
      backgroundColor: colors.macros.carbs,
    },
  },

  // Divider
  divider: {
    horizontal: {
      height: 1,
      backgroundColor: colors.border.light,
      width: '100%',
    },
    vertical: {
      width: 1,
      backgroundColor: colors.border.light,
      height: '100%',
    },
  },

  // Avatar
  avatar: {
    base: {
      borderRadius: borderRadius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.gray[200],
    },
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  },

  // Chip / Tag
  chip: {
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.gray[100],
    },
    selected: {
      backgroundColor: colors.primary[100],
      borderColor: colors.primary[500],
      borderWidth: 1,
    },
  },

  // List item
  listItem: {
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    pressable: {
      activeOpacity: 0.7,
    },
  },

  // Modal
  modal: {
    backdrop: {
      flex: 1,
      backgroundColor: colors.transparent.black50,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    content: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      maxWidth: '90%',
      maxHeight: '80%',
      ...shadows.xl,
    },
  },

  // Toast / Snackbar
  toast: {
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      ...shadows.lg,
    },
    success: {
      backgroundColor: colors.success[700],
    },
    error: {
      backgroundColor: colors.error[700],
    },
    warning: {
      backgroundColor: colors.warning[700],
    },
    info: {
      backgroundColor: colors.primary[700],
    },
  },
} as const;

// =============================================================================
// TAILWIND CLASS HELPERS
// =============================================================================

/**
 * Pre-defined Tailwind class combinations for common patterns
 */
export const twPresets = {
  // Layout
  screenContainer: 'flex-1 bg-white',
  centeredContainer: 'flex-1 items-center justify-center',
  rowCenter: 'flex-row items-center',
  rowBetween: 'flex-row items-center justify-between',
  rowAround: 'flex-row items-center justify-around',

  // Cards
  card: 'bg-white rounded-xl p-4 shadow-md',
  cardFlat: 'bg-white rounded-xl p-4 border border-gray-200',
  cardElevated: 'bg-white rounded-xl p-4 shadow-lg',

  // Buttons
  btnPrimary: 'bg-primary-500 rounded-lg py-3 px-4 items-center',
  btnSecondary: 'bg-gray-200 rounded-lg py-3 px-4 items-center',
  btnOutline: 'border border-primary-500 rounded-lg py-3 px-4 items-center',
  btnGhost: 'rounded-lg py-3 px-4 items-center',

  // Text
  heading1: 'text-4xl font-bold text-gray-900',
  heading2: 'text-3xl font-bold text-gray-900',
  heading3: 'text-2xl font-semibold text-gray-900',
  heading4: 'text-xl font-semibold text-gray-800',
  bodyLarge: 'text-lg text-gray-700',
  body: 'text-base text-gray-700',
  bodySmall: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',
  link: 'text-primary-500 underline',

  // Inputs
  input: 'bg-white border border-gray-300 rounded-lg py-3 px-4 text-base',
  inputFocused: 'border-primary-500 border-2',
  inputError: 'border-red-500',

  // Badges
  badgeSuccess: 'bg-green-100 px-2 py-1 rounded-full',
  badgeWarning: 'bg-yellow-100 px-2 py-1 rounded-full',
  badgeError: 'bg-red-100 px-2 py-1 rounded-full',
  badgeInfo: 'bg-blue-100 px-2 py-1 rounded-full',

  // Macro-specific
  macroCalories: 'text-[#FF6B6B]',
  macroProtein: 'text-[#4ECDC4]',
  macroFats: 'text-[#FFE66D]',
  macroCarbs: 'text-[#95E1D3]',
  macroBgCalories: 'bg-[#FF6B6B]',
  macroBgProtein: 'bg-[#4ECDC4]',
  macroBgFats: 'bg-[#FFE66D]',
  macroBgCarbs: 'bg-[#95E1D3]',
} as const;

// =============================================================================
// THEME OBJECT (combined export)
// =============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  zIndex,
  componentPresets,
  twPresets,
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Animations = typeof animations;
export type ZIndex = typeof zIndex;
export type ComponentPresets = typeof componentPresets;
export type TwPresets = typeof twPresets;
export type Theme = typeof theme;

export default theme;
