import React, {useState} from 'react';
import {Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {Ionicons} from '@expo/vector-icons';

import {ThemedText} from '@/src/components/ThemedText';
import {ThemedView} from '@/src/components/ThemedView';
import {BrandColors, Colors} from '@/src/constants/Colors';
import {useTheme} from '@/src/contexts/ThemeContext';
import {eventApi, EventCreateRequest, GiftEventCreateRequest} from '@/src/api/eventApi';
import {LocationAutocomplete} from '@/src/components/LocationAutocomplete/LocationAutocomplete';
import {TimeInput} from '@/src/components/TimeInput';


export default function EventDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { persona, occasion } = useLocalSearchParams<{ persona: string; occasion: string }>();
  const { theme } = useTheme();
  const isWeb = Platform.OS === 'web';
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<GiftEventCreateRequest>({
    title: '',
    description: '',
    start_date: new Date().toISOString(),
    end_date: '',
    location: '',
    giftee_persona: persona || '',
    event_occasion: occasion || '',
  });

  // Separate date and time state
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [startHours, setStartHours] = useState(0);
  const [startMinutes, setStartMinutes] = useState(0);
  
  // End date state with checkbox control
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [endHours, setEndHours] = useState(0);
  const [endMinutes, setEndMinutes] = useState(0);

  // Helper function to combine date and time into ISO string
  const combineDateTime = (dateStr: string, hours: number, minutes: number): string => {
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  // Helper function to get combined start date time
  const getStartDateTime = (): string => {
    return combineDateTime(startDate, startHours, startMinutes);
  };

  // Helper function to get combined end date time
  const getEndDateTime = (): string => {
    if (!hasEndDate || !endDate) return '';
    return combineDateTime(endDate, endHours, endMinutes);
  };

  // Handle checkbox toggle with smart defaults
  const handleEndDateToggle = (checked: boolean) => {
    setHasEndDate(checked);
    
    if (checked) {
      setEndDate(startDate);
      const endHour = startHours + 1;
      if (endHour < 24) {
        setEndHours(endHour);
        setEndMinutes(startMinutes);
      } else {
        setEndHours(23);
        setEndMinutes(59);
      }
    } else {
      setEndDate('');
      setEndHours(0);
      setEndMinutes(0);
    }
  };

  const handleCreateEventWithGifts = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!startDate) {
        throw new Error('Start date is required');
      }

      // Create a copy of the form data for submission with combined date-time
      const eventDataToSubmit: GiftEventCreateRequest = {
        ...formData,
        start_date: getStartDateTime(),
        giftee_persona: persona || '',
        event_occasion: occasion || '',
      };

      // Only include end_date if checkbox is checked and we have valid data
      if (hasEndDate && endDate) {
        eventDataToSubmit.end_date = getEndDateTime();
      }

      console.log('Submitting event with gifts data:', eventDataToSubmit);

      const createdEvent = await eventApi.createEventWithGifts(eventDataToSubmit);

      // Redirect to the event details page
      router.push(`/event/${createdEvent.id}`);

    } catch (err: unknown) {
      console.error('Error creating event with gifts:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {t('giftEvent.detailsTitle')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Selected Persona and Occasion Summary */}
          <View style={[styles.summarySection, { backgroundColor: themeColors.surfaceVariant }]}>
            <ThemedText style={[styles.summaryTitle, { color: themeColors.text }]}>
              {t('giftEvent.personaTitle')} {t(`giftEvent.personas.${persona}`)}
            </ThemedText>
            <ThemedText style={[styles.summarySubtitle, { color: themeColors.textSecondary }]}>
              {t('giftEvent.occasionTitle')} {t(`giftEvent.occasions.${occasion}`)}
            </ThemedText>
          </View>

          {/* Event Title */}
          <TextInput
            style={[styles.input, {
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
              color: themeColors.text
            }]}
            placeholder={t('event.title')}
            placeholderTextColor={themeColors.textSecondary}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          />

          {/* Event Description */}
          <TextInput
            style={[styles.input, styles.descriptionInput, {
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
              color: themeColors.text
            }]}
            placeholder={`${t('event.description')} (${t('event.optional')})`}
            placeholderTextColor={themeColors.textSecondary}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />

          {/* Start Date Section */}
          <View style={styles.dateTimeSection}>
            <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
              {t('event.startDate')}
            </ThemedText>
            
            {isWeb ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  ...styles.webDateInput,
                  backgroundColor: themeColors.inputBackground,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                }}
              />
            ) : (
              <TouchableOpacity
                style={[styles.dateButton, {
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.border
                }]}
              >
                <ThemedText style={{ color: themeColors.text }}>
                  {startDate || t('event.selectDate')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Start Time Section */}
          <View style={styles.dateTimeSection}>
            <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
              {t('event.time')}
            </ThemedText>
            <TimeInput
              hours={startHours}
              minutes={startMinutes}
              onTimeChange={(hours, minutes) => {
                setStartHours(hours);
                setStartMinutes(minutes);
              }}
              label={t('event.time')}
            />
          </View>

          {/* End Date Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, hasEndDate && styles.checkboxChecked]}
              onPress={() => handleEndDateToggle(!hasEndDate)}
            >
              {hasEndDate && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
            <ThemedText style={[styles.checkboxLabel, { color: themeColors.text }]}>
              {t('event.includeEndTime')}
            </ThemedText>
          </View>

          {/* End Date/Time Section (conditional) */}
          {hasEndDate && (
            <>
              <View style={styles.dateTimeSection}>
                <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
                  {t('event.endDate')}
                </ThemedText>
                
                {isWeb ? (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      ...styles.webDateInput,
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.text,
                      borderColor: themeColors.border,
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    style={[styles.dateButton, {
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.border
                    }]}
                  >
                    <ThemedText style={{ color: themeColors.text }}>
                      {endDate || t('event.selectDate')}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.dateTimeSection}>
                <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
                  {t('event.time')}
                </ThemedText>
                <TimeInput
                  hours={endHours}
                  minutes={endMinutes}
                  onTimeChange={(hours, minutes) => {
                    setEndHours(hours);
                    setEndMinutes(minutes);
                  }}
                  label={t('event.time')}
                />
              </View>
            </>
          )}

          {/* Location Section */}
          <View style={styles.dateTimeSection}>
            <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
              {t('event.location')} ({t('event.optional')})
            </ThemedText>
            <LocationAutocomplete
              value={formData.location}
              onLocationChange={(location) => setFormData(prev => ({ ...prev, location }))}
              placeholder={t('event.locationPlaceholder')}
            />
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleCreateEventWithGifts}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.createButtonText}>
                {t('giftEvent.createEvent')}
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  descriptionInput: {
    height: 80,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  dateTimeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  webDateInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dateButton: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: BrandColors.peach,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BrandColors.peach,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c33',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: BrandColors.peach,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});