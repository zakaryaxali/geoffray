import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BrandColors } from '@/src/constants/Colors';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  // Get theme colors based on current theme
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

  // Privacy policy content is now in translation files

  const renderFormattedPolicy = () => {
    // Create structured content for the policy using translation keys
    return (
      <>
        {/* Title and Date */}
        <Text style={[styles.title, { color: themeColors.text }]}>
          {t('privacyPolicy.title')}
        </Text>
        <Text style={[styles.lastUpdated, { color: themeColors.textSecondary }]}>
          {t('privacyPolicy.lastUpdated')}
        </Text>
        
        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        
        {/* Introduction */}
        <Text style={[styles.introText, { color: themeColors.text }]}>
          {t('privacyPolicy.introduction')}
        </Text>
        
        {/* Section 1: Data Collected */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('privacyPolicy.dataCollected.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('privacyPolicy.dataCollected.intro')}
          </Text>
          
          <View style={styles.bulletSection}>
            <Text style={[styles.bulletHeader, { color: themeColors.text }]}>
              {t('privacyPolicy.dataCollected.personalInfo')}
            </Text>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: themeColors.text }]}>
                {t('privacyPolicy.dataCollected.name')}
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: themeColors.text }]}>
                {t('privacyPolicy.dataCollected.email')}
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: themeColors.text }]}>
                {t('privacyPolicy.dataCollected.phone')}
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
              <Text style={[styles.bulletText, { color: themeColors.text }]}>
                {t('privacyPolicy.dataCollected.messages')}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.sectionContent, { color: themeColors.text, marginTop: 12 }]}>
            {t('privacyPolicy.dataCollected.sensitive')}
          </Text>
        </View>
        
        {/* Section 2: Use of Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('privacyPolicy.useOfData.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('privacyPolicy.useOfData.intro')}
          </Text>
          
          <View style={styles.bulletItem}>
            <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
            <Text style={[styles.bulletText, { color: themeColors.text }]}>
              {t('privacyPolicy.useOfData.operation')}
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
            <Text style={[styles.bulletText, { color: themeColors.text }]}>
              {t('privacyPolicy.useOfData.management')}
            </Text>
          </View>
        </View>
        
        {/* Section 3: Data Sharing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('privacyPolicy.dataSharing.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('privacyPolicy.dataSharing.intro')}
          </Text>
          
          <View style={styles.bulletItem}>
            <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
            <Text style={[styles.bulletText, { color: themeColors.text }]}>
              {t('privacyPolicy.dataSharing.legal')}
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={[styles.bullet, { color: themeColors.text }]}>•</Text>
            <Text style={[styles.bulletText, { color: themeColors.text }]}>
              {t('privacyPolicy.dataSharing.security')}
            </Text>
          </View>
        </View>
        
        {/* Section 4: Data Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('privacyPolicy.dataSecurity.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('privacyPolicy.dataSecurity.content')}
          </Text>
        </View>
        
        {/* Section 5: User Control */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('privacyPolicy.userControl.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('privacyPolicy.userControl.content')}
          </Text>
        </View>
        
        {/* Contact section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {t('privacyPolicy.contact.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: themeColors.text }]}>
            {t('privacyPolicy.contact.content')}
          </Text>
        </View>
        
        {/* Footer */}
        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        
        <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
          {t('privacyPolicy.footer')}
        </Text>
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
          {t('settings.privacyPolicy')}
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
          {renderFormattedPolicy()}
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
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  // New styles for formatted content
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
  introText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Bullet styles
  bulletSection: {
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 8,
  },
  bulletHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  bulletText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
});
