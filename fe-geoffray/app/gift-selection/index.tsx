import React from 'react';
import {SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/src/contexts/ThemeContext';

// Gift categories with their colors
const giftCategories = [
  { id: 'gourmet', key: 'gift.categories.gourmet', color: '#e88a7c' },
  { id: 'adventurer', key: 'gift.categories.adventurer', color: '#FFA726' },
  { id: 'geek', key: 'gift.categories.geek', color: '#e88a7c' },
  { id: 'parent', key: 'gift.categories.parent', color: '#888888' },
  { id: 'artist', key: 'gift.categories.artist', color: '#FFA726' },
  { id: 'trendy', key: 'gift.categories.trendy', color: '#888888' },
];

export default function GiftSelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  
  const themeColors = {
    background: theme === 'dark' ? '#121212' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: theme === 'dark' ? '#AAAAAA' : '#666666',
  };

  const handleCategoryPress = (categoryId: string) => {
    // TODO: Navigate to gift suggestions page with category
    console.log('Selected category:', categoryId);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>{t('gift.pageTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Categories Grid */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesGrid}>
          {giftCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryPress(category.id)}
              style={styles.categoryContainer}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryCircle, { backgroundColor: category.color }]}>
                <Text style={styles.categoryText}>
                  {t(category.key)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  categoryContainer: {
    width: '45%',
    aspectRatio: 1,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
});