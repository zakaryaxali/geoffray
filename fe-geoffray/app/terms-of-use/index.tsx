import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BrandColors } from '@/src/constants/Colors';

export default function TermsOfUseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  const themeColors = {
    background: theme === 'dark' ? '#121212' : '#FFFFFF',
    surface: theme === 'dark' ? '#1E1E1E' : '#F9F9F9',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: theme === 'dark' ? '#AAAAAA' : '#666666',
    border: theme === 'dark' ? '#333333' : '#DDDDDD',
    primary: theme === 'dark' ? BrandColors.coral : BrandColors.peach,
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const renderContent = () => {
    return (
      <>
        {/* Title and Date */}
        <Text style={[styles.title, { color: themeColors.text }]}>
          {t('termsOfUse.title')}
        </Text>
        <Text style={[styles.lastUpdated, { color: themeColors.textSecondary }]}>
          {t('termsOfUse.lastUpdated')}
        </Text>

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

        {/* Legal Notice */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.intro')}
          </Text>

          <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.publisherTitle')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.publisherIntro')}
          </Text>
          <Text style={[styles.bulletPoint, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.publisherCompany')}
          </Text>
          <Text style={[styles.bulletPoint, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.publisherAddress')}
          </Text>
          <Text style={[styles.bulletPoint, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.publisherVAT')}
          </Text>
          <Text style={[styles.bulletPoint, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.publisherContact')}
          </Text>

          <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.directorTitle')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.directorContent')}
          </Text>

          <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.hostingTitle')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.hostingContent')}
          </Text>
          <Text style={[styles.bulletPoint, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.hostingAddress')}
          </Text>
          <Text style={[styles.bulletPoint, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.hostingContact')}
          </Text>

          <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.businessModelTitle')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.legalNotice.businessModelContent')}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

        {/* CGU Section Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.cguTitle')}
          </Text>
        </View>

        {/* Articles 1-6 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.article1.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.article1.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.article2.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.article2.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.article3.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.article3.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.article4.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.article4.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.article5.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.article5.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('termsOfUse.article6.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('termsOfUse.article6.content')}
          </Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {t('auth.termsOfUseLink')}
        </Text>
        <TouchableOpacity onPress={toggleLanguage} style={styles.languageToggle}>
          <Text style={[styles.languageToggleText, { color: themeColors.primary }]}>
            {language === 'en' ? 'FR' : 'EN'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.policyContainer, { backgroundColor: themeColors.surface }]}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  languageToggle: {
    padding: 8,
  },
  languageToggleText: {
    fontWeight: 'bold',
  },
  policyContainer: {
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 12,
    marginTop: 4,
  },
});
