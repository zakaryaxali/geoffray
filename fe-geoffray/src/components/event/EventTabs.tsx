import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedText';
import { eventStyles } from './EventStyles';
import { Colors } from '@/src/constants/Colors';

export type TabType = 'details' | 'gifts' | 'discussion';

interface EventTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const EventTabs: React.FC<EventTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={[eventStyles.tabContainer, { borderBottomColor: themeColors.border }]}>
      <TouchableOpacity 
        style={[
          eventStyles.tab, 
          activeTab === 'details' && [
            eventStyles.activeTab, 
            { borderBottomColor: themeColors.primary }
          ]
        ]}
        onPress={() => onTabChange('details')}
      >
        <ThemedText 
          style={[
            eventStyles.tabText, 
            { color: themeColors.textSecondary }, 
            activeTab === 'details' && { 
              color: themeColors.primary, 
              fontWeight: 'bold' 
            }
          ]}
        >
          {t('event.details')}
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          eventStyles.tab, 
          activeTab === 'gifts' && [
            eventStyles.activeTab, 
            { borderBottomColor: themeColors.primary }
          ]
        ]}
        onPress={() => onTabChange('gifts')}
      >
        <ThemedText 
          style={[
            eventStyles.tabText, 
            { color: themeColors.textSecondary }, 
            activeTab === 'gifts' && { 
              color: themeColors.primary, 
              fontWeight: 'bold' 
            }
          ]}
        >
          {t('event.gifts')}
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          eventStyles.tab, 
          activeTab === 'discussion' && [
            eventStyles.activeTab, 
            { borderBottomColor: themeColors.primary }
          ]
        ]}
        onPress={() => onTabChange('discussion')}
      >
        <ThemedText 
          style={[
            eventStyles.tabText, 
            { color: themeColors.textSecondary }, 
            activeTab === 'discussion' && { 
              color: themeColors.primary, 
              fontWeight: 'bold' 
            }
          ]}
        >
          {t('event.discussion')}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};
