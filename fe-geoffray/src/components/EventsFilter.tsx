import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './ThemedText';
import { Colors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';

export type FilterType = 'next' | 'past';

interface EventsFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const EventsFilter: React.FC<EventsFilterProps> = ({ activeFilter, onFilterChange }) => {
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  const { t } = useTranslation();
  
  const getFilterStyle = (filter: FilterType) => {
    if (filter === activeFilter) {
      return {
        backgroundColor: filter === 'next' ? themeColors.primary : 'transparent',
        borderWidth: filter !== 'next' ? 1 : 0,
        borderColor: themeColors.border,
      };
    }
    
    return {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'transparent',
    };
  };
  
  const getTextStyle = (filter: FilterType): TextStyle => {
    return {
      color: filter === activeFilter 
        ? (filter === 'next' ? '#fff' : themeColors.text) 
        : themeColors.tabIconDefault,
      fontWeight: filter === activeFilter ? '600' as TextStyle['fontWeight'] : 'normal' as TextStyle['fontWeight'],
    };
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.filterButton, getFilterStyle('next')]}
        onPress={() => onFilterChange('next')}
      >
        <ThemedText style={[styles.filterText, getTextStyle('next')]}>{t('home.next')}</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, getFilterStyle('past')]}
        onPress={() => onFilterChange('past')}
      >
        <ThemedText style={[styles.filterText, getTextStyle('past')]}>{t('home.past')}</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: {
    fontSize: 16,
  },
});
