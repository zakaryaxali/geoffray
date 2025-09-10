/**
 * Design system for the Rendez-Vous app.
 * This file contains all design tokens used throughout the app.
 */

// Primary brand colors - peach/coral gradient from logo
const tintColorLight = '#f5a78b';
const tintColorDark = '#e88a7c';

/**
 * Brand-specific colors
 */
export const BrandColors = {
  peach: '#f5a78b',
  coral: '#e88a7c',
};

/**
 * Color palette for both light and dark modes
 */
export const Colors = {
  light: {
    // Base colors
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Surface colors
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    surfaceDisabled: '#EEEEEE',
    
    // State colors
    primary: tintColorLight,
    secondary: '#4F6C7A',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    
    // Text variants
    textSecondary: '#687076',
    textDisabled: '#9E9E9E',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#E0E0E0',
    borderFocus: tintColorLight,
    divider: '#EEEEEE',
    
    // Input colors
    inputBackground: '#F5F5F5',
    inputText: '#11181C',
    inputPlaceholder: '#9E9E9E',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    // Base colors
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Surface colors
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    surfaceDisabled: '#333333',
    
    // State colors
    primary: tintColorDark,
    secondary: '#607D8B',
    error: '#CF6679',
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
    
    // Text variants
    textSecondary: '#9BA1A6',
    textDisabled: '#757575',
    textInverse: '#151718',
    
    // Border colors
    border: '#2C2C2C',
    borderFocus: tintColorDark,
    divider: '#333333',
    
    // Input colors
    inputBackground: '#2C2C2C',
    inputText: '#ECEDEE',
    inputPlaceholder: '#757575',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

/**
 * Typography scale for the app
 */
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 42,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
};

/**
 * Spacing scale for consistent layout
 */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

/**
 * Border radius scale
 */
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

/**
 * Shadow styles for elevation
 */
export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.0,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.34,
      shadowRadius: 3.27,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.40,
      shadowRadius: 5.46,
      elevation: 10,
    },
  },
};
