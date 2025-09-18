import React, {useState} from 'react';
import {Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {format} from 'date-fns';

import {ThemedText} from '@/src/components/ThemedText';
import {ThemedView} from '@/src/components/ThemedView';
import {BrandColors, Colors} from '@/src/constants/Colors';
import {useTheme} from '@/src/contexts/ThemeContext';
import {eventApi, EventCreateRequest} from '@/src/api/eventApi';
import {NativeDateTimePicker} from '@/src/components/DateTimePickers/NativeDateTimePicker';
import {LocationAutocomplete} from '@/src/components/LocationAutocomplete/LocationAutocomplete';
import {TimeInput} from '@/src/components/TimeInput';


export default function CreateEventScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  // Get theme from the app's ThemeContext
  const { theme } = useTheme();
  const isWeb = Platform.OS === 'web';
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<EventCreateRequest>({
    title: '',
    description: '',
    start_date: new Date().toISOString(),
    end_date: '',
    location: '',
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

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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
      // When enabling end date, set smart defaults
      setEndDate(startDate); // Same day as start
      // Set end time to 1 hour after start time
      const endHour = startHours + 1;
      if (endHour < 24) {
        setEndHours(endHour);
        setEndMinutes(startMinutes);
      } else {
        // If start + 1 hour exceeds midnight, just set to 23:59
        setEndHours(23);
        setEndMinutes(59);
      }
    } else {
      // When disabling, clear all end date/time
      setEndDate('');
      setEndHours(0);
      setEndMinutes(0);
    }
  };

  const handleCreateEvent = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error(t('event.errors.titleRequired'));
      }

      if (!startDate) {
        throw new Error(t('event.errors.startDateRequired'));
      }

      // Create a copy of the form data for submission with combined date-time
      const eventDataToSubmit: EventCreateRequest = {
        ...formData,
        start_date: getStartDateTime(),
      };

      // Only include end_date if checkbox is checked and we have valid data
      if (hasEndDate && endDate) {
        eventDataToSubmit.end_date = getEndDateTime();
      }

      // Log the data being sent (for debugging)
      console.log('Submitting event data:', eventDataToSubmit);

      // Send the request and get the created event
      const createdEvent = await eventApi.createEvent(eventDataToSubmit);

      // Redirect to the event details page
      router.push(`/event/${createdEvent.id}`);

      // Show success message (optional)
      console.log('Event created successfully:', createdEvent.title);
    } catch (err: unknown) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };


  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView style={styles.form}>
          <TextInput
            style={[styles.input, {
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
              color: themeColors.text
            }]}
            placeholder={t('event.title')}
            placeholderTextColor={themeColors.textSecondary}
            value={formData.title}
            onChangeText={(text) => setFormData((prev: EventCreateRequest) => ({ ...prev, title: text }))}
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
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={{ color: themeColors.text }}>
                  {format(new Date(startDate), 'PP')}
                </Text>
              </TouchableOpacity>
            )}

            {!isWeb && showStartDatePicker && (
              <NativeDateTimePicker
                value={new Date(startDate)}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (date) {
                    setStartDate(date.toISOString().substring(0, 10));
                  }
                  setShowStartDatePicker(false);
                }}
              />
            )}

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

          {/* End Date Section */}
          <View style={styles.dateTimeSection}>
            {/* Checkbox to enable/disable end date */}
            <View style={styles.checkboxContainer}>
              {isWeb ? (
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => handleEndDateToggle(e.target.checked)}
                    style={styles.webCheckbox}
                  />
                  <ThemedText style={[styles.checkboxText, { color: themeColors.text }]}>
                    Set end date and time
                  </ThemedText>
                </label>
              ) : (
                <TouchableOpacity
                  style={styles.nativeCheckboxContainer}
                  onPress={() => handleEndDateToggle(!hasEndDate)}
                >
                  <View style={[
                    styles.nativeCheckbox,
                    { borderColor: themeColors.border },
                    hasEndDate && { backgroundColor: BrandColors.coral }
                  ]}>
                    {hasEndDate && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <ThemedText style={[styles.checkboxText, { color: themeColors.text }]}>
                    Set end date and time
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* End Date Controls - Always show both date and time when enabled */}
            {hasEndDate && (
              <>
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
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={{ color: themeColors.text }}>
                      {endDate ? format(new Date(endDate), 'PP') : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                )}

                {!isWeb && showEndDatePicker && (
                  <NativeDateTimePicker
                    value={new Date(endDate || startDate)}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      if (date) {
                        setEndDate(date.toISOString().substring(0, 10));
                      }
                      setShowEndDatePicker(false);
                    }}
                  />
                )}

                <TimeInput
                  hours={endHours}
                  minutes={endMinutes}
                  onTimeChange={(hours, minutes) => {
                    setEndHours(hours);
                    setEndMinutes(minutes);
                  }}
                  label={t('event.time')}
                />
              </>
            )}
          </View>

          <LocationAutocomplete
            value={formData.location || ''}
            onChangeText={(text) => setFormData((prev: EventCreateRequest) => ({ ...prev, location: text }))}
            placeholder={t('event.location')}
          />

          <TextInput
            style={[styles.input, styles.multilineInput, {
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border,
              color: themeColors.text
            }]}
            placeholder={t('event.description')}
            placeholderTextColor={themeColors.textSecondary}
            value={formData.description}
            onChangeText={(text) => setFormData((prev: EventCreateRequest) => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
          />

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateEvent}
            disabled={loading || !formData.title || !startDate}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? t('common.loading') : t('event.create')}
            </ThemedText>
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
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: BrandColors.coral,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 16,
  },
  dateTimeSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  webDateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    boxSizing: 'border-box',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    padding: 8,
    borderRadius: 6,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  webCheckbox: {
    marginRight: 8,
    cursor: 'pointer',
  },
  nativeCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nativeCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
