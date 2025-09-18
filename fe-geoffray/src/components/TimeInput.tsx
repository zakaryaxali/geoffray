import React, { useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Colors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface TimeInputProps {
  hours: number;
  minutes: number;
  onTimeChange: (hours: number, minutes: number) => void;
  label?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  hours,
  minutes,
  onTimeChange,
  label
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  const isWeb = Platform.OS === 'web';

  const handleHoursChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(23, numValue));
    onTimeChange(clampedValue, minutes);
  };

  const handleMinutesChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(59, numValue));
    onTimeChange(hours, clampedValue);
  };

  const formatValue = (value: number): string => {
    return value.toString().padStart(2, '0');
  };

  if (isWeb) {
    return (
      <View style={styles.container}>
        {label && (
          <ThemedText style={[styles.label, { color: themeColors.text }]}>
            {label}
          </ThemedText>
        )}
        <View style={styles.timeContainer}>
          <input
            type="number"
            min="0"
            max="23"
            value={formatValue(hours)}
            onChange={(e) => handleHoursChange(e.target.value)}
            style={{
              ...styles.webInput,
              backgroundColor: themeColors.inputBackground,
              color: themeColors.text,
              borderColor: themeColors.border,
            }}
            placeholder="00"
          />
          <ThemedText style={[styles.separator, { color: themeColors.text }]}>:</ThemedText>
          <input
            type="number"
            min="0"
            max="59"
            value={formatValue(minutes)}
            onChange={(e) => handleMinutesChange(e.target.value)}
            style={{
              ...styles.webInput,
              backgroundColor: themeColors.inputBackground,
              color: themeColors.text,
              borderColor: themeColors.border,
            }}
            placeholder="00"
          />
          <ThemedText style={[styles.timeFormat, { color: themeColors.textSecondary }]}>
            (24h)
          </ThemedText>
        </View>
      </View>
    );
  }

  // For native platforms, we'll use simple numeric inputs (can be enhanced later)
  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={[styles.label, { color: themeColors.text }]}>
          {label}
        </ThemedText>
      )}
      <View style={styles.timeContainer}>
        <ThemedText style={[styles.timeDisplay, { color: themeColors.text }]}>
          {formatValue(hours)}:{formatValue(minutes)}
        </ThemedText>
        <ThemedText style={[styles.timeFormat, { color: themeColors.textSecondary }]}>
          (24h)
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webInput: {
    width: 60,
    height: 40,
    textAlign: 'center' as const,
    fontSize: 16,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    boxSizing: 'border-box' as const,
  },
  separator: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timeDisplay: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  timeFormat: {
    fontSize: 12,
    marginLeft: 8,
  },
});