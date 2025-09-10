import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type SettingItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  toggle?: boolean;
  onPress: () => void;
};

interface SettingsSectionProps {
  settingsSections: SettingItem[];
  themeColors: any;
}

export const SettingsSection = ({ settingsSections, themeColors }: SettingsSectionProps) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('profile.settings')}</Text>
      {settingsSections.map((item, index) => (
        <TouchableOpacity 
          key={index}
          style={[
            styles.settingItem, 
            index < settingsSections.length - 1 && [styles.settingItemBorder, { borderBottomColor: themeColors.border }]
          ]}
          onPress={item.onPress}
        >
          <View style={styles.settingItemLeft}>
            <Ionicons name={item.icon} size={24} color={themeColors.primary} style={styles.settingItemIcon} />
            <Text style={[styles.settingItemTitle, { color: themeColors.text }]}>{item.title}</Text>
          </View>
          <View style={styles.settingItemRight}>
            {item.value ? (
              <Text style={[styles.settingItemValue, { color: themeColors.textSecondary }]}>{item.value}</Text>
            ) : null}
            {item.toggle !== undefined ? (
              <Switch
                value={item.toggle}
                onValueChange={item.onPress}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor="#FFFFFF"
              />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemIcon: {
    marginRight: 15,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemValue: {
    fontSize: 14,
    marginRight: 10,
  },
});
