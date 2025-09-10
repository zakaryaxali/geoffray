import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';
type ActualTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ActualTheme;
  themePreference: ThemeType;
  setThemePreference: (theme: ThemeType) => void;
  colors: typeof Colors.light | typeof Colors.dark;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_PREFERENCE_KEY = '@rendez-vous/theme-preference';

type ThemeProviderProps = {
  children: ReactNode | ((themeContext: ThemeContextType) => ReactNode);
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const deviceTheme = useDeviceColorScheme() || 'light';
  const [themePreference, setThemePreferenceState] = useState<ThemeType>('system');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference && (savedPreference === 'light' || savedPreference === 'dark' || savedPreference === 'system')) {
          setThemePreferenceState(savedPreference as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Save theme preference when it changes
  const setThemePreference = async (newPreference: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newPreference);
      setThemePreferenceState(newPreference);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };
  
  // Calculate the actual theme based on preference
  const actualTheme: ActualTheme = themePreference === 'system' 
    ? (deviceTheme as ActualTheme) 
    : (themePreference as ActualTheme);
  
  // Don't render until we've loaded the saved preference
  if (isLoading) {
    return null;
  }
  
  const themeContextValue: ThemeContextType = {
    theme: actualTheme,
    themePreference,
    setThemePreference,
    colors: Colors[actualTheme]
  };
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {typeof children === 'function' ? children(themeContextValue) : children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
