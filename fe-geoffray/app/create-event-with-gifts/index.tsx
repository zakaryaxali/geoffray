import React from 'react';
import {SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/src/contexts/ThemeContext';

// Giftee personas with their colors (renamed from gift categories)
const gifteePersonas = [
  { id: 'gourmet', key: 'giftEvent.personas.gourmet', color: '#e88a7c' },
  { id: 'adventurer', key: 'giftEvent.personas.adventurer', color: '#FFA726' },
  { id: 'geek', key: 'giftEvent.personas.geek', color: '#e88a7c' },
  { id: 'parent', key: 'giftEvent.personas.parent', color: '#888888' },
  { id: 'artist', key: 'giftEvent.personas.artist', color: '#FFA726' },
  { id: 'trendy', key: 'giftEvent.personas.trendy', color: '#888888' },
];

export default function GifteePersonaSelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  
  const themeColors = {
    background: theme === 'dark' ? '#121212' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: theme === 'dark' ? '#AAAAAA' : '#666666',
  };

  const handlePersonaPress = (personaId: string) => {
    router.push(`/create-event-with-gifts/occasions/${personaId}`);
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
        <Text style={[styles.title, { color: themeColors.text }]}>{t('giftEvent.personaTitle')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Personas Grid */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.personasGrid}>
          {gifteePersonas.map((persona) => (
            <TouchableOpacity
              key={persona.id}
              onPress={() => handlePersonaPress(persona.id)}
              style={styles.personaContainer}
              activeOpacity={0.7}
            >
              <View style={[styles.personaCircle, { backgroundColor: persona.color }]}>
                <Text style={styles.personaText}>
                  {t(persona.key)}
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
  personasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  personaContainer: {
    width: '45%',
    aspectRatio: 1,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaCircle: {
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
  personaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
});