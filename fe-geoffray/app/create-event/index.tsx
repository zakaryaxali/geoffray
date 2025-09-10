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
import {WebDateTimePicker} from '@/src/components/DateTimePickers/WebDateTimePicker';
import {NativeDateTimePicker} from '@/src/components/DateTimePickers/NativeDateTimePicker';
import {LocationAutocomplete} from '@/src/components/LocationAutocomplete/LocationAutocomplete';


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

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartDatePickerModal, setShowStartDatePickerModal] = useState(false);
  const [showEndDatePickerModal, setShowEndDatePickerModal] = useState(false);

  const handleCreateEvent = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error(t('event.errors.titleRequired'));
      }

      if (!formData.start_date) {
        throw new Error(t('event.errors.startDateRequired'));
      }

      // Create a copy of the form data for submission
      const eventDataToSubmit = {...formData};

      // If end_date is empty string, set it to null or remove it
      if (eventDataToSubmit.end_date === '') {
        delete eventDataToSubmit.end_date;
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

  const handleDateChange = (field: 'start_date' | 'end_date', date?: Date) => {
    if (date) {
      setFormData((prev: EventCreateRequest) => ({
        ...prev,
        [field]: date.toISOString(),
      }));
    }
    // Only close the pickers for native platforms or when explicitly confirmed
    if (field === 'start_date') {
      setShowStartDatePicker(false);
      if (!isWeb) setShowStartDatePickerModal(false);
    } else {
      setShowEndDatePicker(false);
      if (!isWeb) setShowEndDatePickerModal(false);
    }
  };

  const handleDateButtonPress = (type: 'start_date' | 'end_date') => {
    if (isWeb) {
      if (type === 'start_date') {
        setShowStartDatePickerModal(true);
      } else {
        setShowEndDatePickerModal(true);
      }
    } else {
      if (type === 'start_date') {
        setShowStartDatePicker(true);
      } else {
        setShowEndDatePicker(true);
      }
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

          <TouchableOpacity
            style={[styles.dateButton, {
              backgroundColor: theme === 'dark' ? '#FFFFFF' : themeColors.inputBackground,
              borderColor: themeColors.border
            }]}
            onPress={() => handleDateButtonPress('start_date')}
          >
            <Text style={{
              color: theme === 'dark' ? '#000000' : themeColors.text
            }}>{t('event.startDate')}: {format(new Date(formData.start_date), 'PPp')}</Text>
          </TouchableOpacity>

          {!isWeb && showStartDatePicker && (
            <NativeDateTimePicker
              value={new Date(formData.start_date)}
              onChange={(event: DateTimePickerEvent, date?: Date) => handleDateChange('start_date', date)}
            />
          )}

          {isWeb && showStartDatePickerModal && (
            <WebDateTimePicker
              visible={showStartDatePickerModal}
              onClose={() => setShowStartDatePickerModal(false)}
              onConfirm={() => setShowStartDatePickerModal(false)}
              title={t('event.startDate')}
              dateValue={formData.start_date.substring(0, 10)}
              timeValue={formData.start_date.substring(11, 16)}
              onDateChange={(dateStr) => {
                try {
                  // Get the current time part
                  const currentDate = new Date(formData.start_date);
                  const hours = currentDate.getHours();
                  const minutes = currentDate.getMinutes();

                  // Create new date with the selected date and current time
                  const newDate = new Date(dateStr);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);

                  if (!isNaN(newDate.getTime())) {
                    setFormData((prev: EventCreateRequest) => ({
                      ...prev,
                      start_date: newDate.toISOString()
                    }));
                  }
                } catch (error) {
                  console.log('Invalid date input');
                }
              }}
              onTimeChange={(timeStr) => {
                try {
                  // Get the current date part
                  const currentDate = new Date(formData.start_date);
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const day = currentDate.getDate();

                  // Parse the time string (HH:MM)
                  const [hours, minutes] = timeStr.split(':').map(Number);

                  // Create new date with the current date and selected time
                  const newDate = new Date(year, month, day, hours, minutes);

                  if (!isNaN(newDate.getTime())) {
                    setFormData((prev: EventCreateRequest) => ({
                      ...prev,
                      start_date: newDate.toISOString()
                    }));
                  }
                } catch (error) {
                  console.log('Invalid time input');
                }
              }}
            />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity
              style={[styles.dateButton, {
                backgroundColor: theme === 'dark' ? '#FFFFFF' : themeColors.inputBackground,
                borderColor: themeColors.border,
                flex: 1,
                marginBottom: 0
              }]}
              onPress={() => handleDateButtonPress('end_date')}
            >
              <Text style={{
                color: theme === 'dark' ? '#000000' : themeColors.text
              }}>{t('event.endDate')}: {formData.end_date ? format(new Date(formData.end_date), 'PPp') : t('event.optional')}</Text>
            </TouchableOpacity>

            {formData.end_date && (
              <TouchableOpacity
                style={[{
                  backgroundColor: '#ff6b6b',
                  padding: 12,
                  borderRadius: 8,
                  marginLeft: 8,
                  justifyContent: 'center',
                  alignItems: 'center'
                }]}
                onPress={() => {
                  setFormData((prev: EventCreateRequest) => ({
                    ...prev,
                    end_date: ''
                  }));
                }}
              >
                <Text style={{ color: '#FFFFFF' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isWeb && showEndDatePicker && (
            <NativeDateTimePicker
              value={new Date(formData.end_date || formData.start_date)}
              onChange={(event: DateTimePickerEvent, date?: Date) => handleDateChange('end_date', date)}
            />
          )}

          {isWeb && showEndDatePickerModal && (
            <WebDateTimePicker
              visible={showEndDatePickerModal}
              onClose={() => setShowEndDatePickerModal(false)}
              onConfirm={() => setShowEndDatePickerModal(false)}
              title={t('event.endDate')}
              dateValue={(formData.end_date || formData.start_date).substring(0, 10)}
              timeValue={(formData.end_date || formData.start_date).substring(11, 16)}
              onDateChange={(dateStr) => {
                try {
                  // Get the current time part or use start date's time
                  const currentDate = new Date(formData.end_date || formData.start_date);
                  const hours = currentDate.getHours();
                  const minutes = currentDate.getMinutes();

                  // Create new date with the selected date and current time
                  const newDate = new Date(dateStr);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);

                  if (!isNaN(newDate.getTime())) {
                    setFormData((prev: EventCreateRequest) => ({
                      ...prev,
                      end_date: newDate.toISOString()
                    }));
                  }
                } catch (error) {
                  console.log('Invalid date input');
                }
              }}
              onTimeChange={(timeStr) => {
                try {
                  // Get the current date part
                  const currentDate = new Date(formData.end_date || formData.start_date);
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const day = currentDate.getDate();

                  // Parse the time string (HH:MM)
                  const [hours, minutes] = timeStr.split(':').map(Number);

                  // Create new date with the current date and selected time
                  const newDate = new Date(year, month, day, hours, minutes);

                  if (!isNaN(newDate.getTime())) {
                    setFormData((prev: EventCreateRequest) => ({
                      ...prev,
                      end_date: newDate.toISOString()
                    }));
                  }
                } catch (error) {
                  console.log('Invalid time input');
                }
              }}
            />
          )}

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
            disabled={loading || !formData.title || !formData.start_date}
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
  }
});
