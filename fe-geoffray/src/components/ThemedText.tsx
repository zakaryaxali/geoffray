import { Text, type TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Typography } from '@/src/constants/Colors';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  variant?: keyof typeof Typography.fontSize;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  variant,
  ...rest
}: ThemedTextProps) {
  const { theme, colors } = useTheme();
  
  // Determine text color: prop overrides take precedence over theme colors
  const color = theme === 'light' ? lightColor : darkColor || colors.text;
  
  // Get font size from variant if provided
  const fontSize = variant ? Typography.fontSize[variant] : undefined;

  return (
    <Text
      style={[
        { color },
        fontSize ? { fontSize } : undefined,
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
