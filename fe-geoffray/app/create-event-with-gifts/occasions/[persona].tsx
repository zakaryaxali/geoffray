import React from 'react';
import {SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/src/contexts/ThemeContext';

// Event occasions with their colors matching the wireframe
const eventOccasions = [
  { id: 'birthday', key: 'giftEvent.occasions.birthday', color: '#FFA726' },
  { id: 'retirement', key: 'giftEvent.occasions.retirement', color: '#e88a7c' },
  { id: 'barbecue', key: 'giftEvent.occasions.barbecue', color: '#e88a7c' },
  { id: 'christmas', key: 'giftEvent.occasions.christmas', color: '#888888' },
  { id: 'wedding', key: 'giftEvent.occasions.wedding', color: '#FFA726' },
  { id: 'justForFun', key: 'giftEvent.occasions.justForFun', color: '#888888' },
];

export default function OccasionSelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { persona } = useLocalSearchParams<{ persona: string }>();
  const { theme } = useTheme();
  
  const themeColors = {
    background: theme === 'dark' ? '#121212' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: theme === 'dark' ? '#AAAAAA' : '#666666',
  };

  const handleOccasionPress = (occasionId: string) => {
    router.push(`/create-event-with-gifts/details/${persona}/${occasionId}`);
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
        <Text style={[styles.title, { color: themeColors.text }]}>{t('giftEvent.occasionTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Occasions Grid */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.occasionsGrid}>
          {eventOccasions.map((occasion) => (
            <TouchableOpacity
              key={occasion.id}
              onPress={() => handleOccasionPress(occasion.id)}
              style={styles.occasionContainer}
              activeOpacity={0.7}
            >
              <View style={[styles.occasionCircle, { backgroundColor: occasion.color }]}>
                <Text style={styles.occasionText}>
                  {t(occasion.key)}
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
  occasionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  occasionContainer: {
    width: '45%',
    aspectRatio: 1,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occasionCircle: {
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
  occasionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
});