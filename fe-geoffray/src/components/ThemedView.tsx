import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Shadows, BorderRadius } from '@/src/constants/Colors';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  surface?: boolean;
  variant?: 'default' | 'variant';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  radius?: keyof typeof BorderRadius;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  surface = false,
  variant = 'default',
  elevation = 'none',
  radius,
  ...otherProps 
}: ThemedViewProps) {
  const { theme, colors } = useTheme();
  
  // Determine background color based on props and theme
  let backgroundColor;
  
  if (lightColor && theme === 'light') {
    backgroundColor = lightColor;
  } else if (darkColor && theme === 'dark') {
    backgroundColor = darkColor;
  } else if (surface) {
    backgroundColor = variant === 'variant' ? colors.surfaceVariant : colors.surface;
  } else {
    backgroundColor = colors.background;
  }
  
  // Get shadow styles if elevation is specified
  const shadowStyles = elevation !== 'none' ? Shadows[theme][elevation] : {};
  
  // Get border radius if specified
  const borderRadius = radius ? BorderRadius[radius] : undefined;

  return (
    <View 
      style={[
        { backgroundColor },
        borderRadius !== undefined ? { borderRadius } : undefined,
        elevation !== 'none' ? shadowStyles : undefined,
        style
      ]} 
      {...otherProps} 
    />
  );
}
