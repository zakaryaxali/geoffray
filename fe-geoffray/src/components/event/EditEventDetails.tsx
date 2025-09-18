import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View, TextInput, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/src/components/ThemedText';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { EventResponse, UpdateEventRequest } from '@/src/api/eventApi';
import { eventStyles } from './EventStyles';
import { Colors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';
import { formatDate } from './EventUtils';
import { NativeDateTimePicker } from '@/src/components/DateTimePickers/NativeDateTimePicker';
import { TimeInput } from '@/src/components/TimeInput';

interface EditEventDetailsProps {
  event: EventResponse;
  onSave: (updateData: UpdateEventRequest) => Promise<boolean>;
  onCancel: () => void;
}

export const EditEventDetails: React.FC<EditEventDetailsProps> = ({ 
  event, 
  onSave,
  onCancel
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  // State for form fields
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [location, setLocation] = useState(event.location || '');
  
  // Separate date and time state (matching create event approach)
  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  
  const [startDateStr, setStartDateStr] = useState(startDate.toISOString().substring(0, 10));
  const [startHours, setStartHours] = useState(startDate.getHours());
  const [startMinutes, setStartMinutes] = useState(startDate.getMinutes());
  
  // End date state with checkbox control
  const [hasEndDate, setHasEndDate] = useState(!!event.end_date);
  const [endDateStr, setEndDateStr] = useState(endDate ? endDate.toISOString().substring(0, 10) : '');
  const [endHours, setEndHours] = useState(endDate ? endDate.getHours() : 0);
  const [endMinutes, setEndMinutes] = useState(endDate ? endDate.getMinutes() : 0);
  
  // Date picker visibility (only for native)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Check if we're on web platform
  const isWeb = Platform.OS === 'web';
  
  // Loading state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Helper function to combine date and time into ISO string
  const combineDateTime = (dateStr: string, hours: number, minutes: number): string => {
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  // Helper function to get combined start date time
  const getStartDateTime = (): string => {
    return combineDateTime(startDateStr, startHours, startMinutes);
  };

  // Helper function to get combined end date time
  const getEndDateTime = (): string => {
    if (!hasEndDate || !endDateStr) return '';
    return combineDateTime(endDateStr, endHours, endMinutes);
  };

  // Handle checkbox toggle with smart defaults
  const handleEndDateToggle = (checked: boolean) => {
    setHasEndDate(checked);
    
    if (checked) {
      // When enabling end date, set smart defaults
      setEndDateStr(startDateStr); // Same day as start
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
      setEndDateStr('');
      setEndHours(0);
      setEndMinutes(0);
    }
  };


  // Handle form submission
  const handleSave = async () => {
    // Validate form
    if (!title.trim()) {
      setError(t('event.titleRequired'));
      return;
    }

    // Validate dates
    const startDateTime = new Date(getStartDateTime());
    const endDateTime = hasEndDate && endDateStr ? new Date(getEndDateTime()) : null;
    
    if (endDateTime && endDateTime < startDateTime) {
      setError(t('event.endDateBeforeStart'));
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Prepare update data using our new date/time approach
      const updateData: UpdateEventRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_date: getStartDateTime(),
      };
      
      // Handle end date based on checkbox state
      if (hasEndDate && endDateStr) {
        updateData.end_date = getEndDateTime();
        console.log('Setting end_date to:', updateData.end_date);
      } else {
        // Add a special field to signal that end_date should be removed
        // This works around the Go backend's handling of null values
        updateData.remove_end_date = true;
        console.log('Setting remove_end_date to true, end date checkbox is unchecked');
      }
      
      // Debug log the full update data
      console.log('Full update data being sent:', JSON.stringify(updateData));

      // Call the save function
      const success = await onSave(updateData);
      
      if (!success) {
        setError(t('event.updateFailed'));
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setError(t('event.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView 
      style={eventStyles.contentContainer}
      contentContainerStyle={eventStyles.scrollContent}
    >
      {/* Title */}
      <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text }]}>
        {t('event.title')}
      </ThemedText>
      <TextInput
        style={[
          eventStyles.formInput, 
          { 
            color: themeColors.text,
            backgroundColor: themeColors.background,
            borderColor: themeColors.border 
          }
        ]}
        value={title}
        onChangeText={setTitle}
        placeholder={t('event.titlePlaceholder')}
        placeholderTextColor={themeColors.textSecondary}
        maxLength={100}
      />

      {/* Date and Time */}
      <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text, marginTop: 16 }]}>
        {t('event.dateAndTime')}
      </ThemedText>
      
      {/* Start Date Section */}
      <View style={[eventStyles.dateTimeSection, { borderColor: themeColors.border }]}>
        <ThemedText style={[eventStyles.subSectionTitle, { color: themeColors.text }]}>
          {t('event.startDate')}
        </ThemedText>
        
        {isWeb ? (
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            style={{
              padding: '12px 15px',
              fontSize: '16px',
              borderRadius: '8px',
              backgroundColor: themeColors.inputBackground,
              color: themeColors.text,
              width: '100%',
              border: `1px solid ${themeColors.border}`,
              cursor: 'pointer',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
          />
        ) : (
          <TouchableOpacity
            style={[eventStyles.datePickerButton, { borderColor: themeColors.border }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol 
                name="calendar" 
                size={24} 
                color={themeColors.primary} 
                style={eventStyles.detailIcon} 
              />
              <ThemedText style={[eventStyles.detailText, { color: themeColors.text }]}>
                {formatDate(getStartDateTime(), i18n.language)}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}

        {!isWeb && showStartDatePicker && (
          <NativeDateTimePicker
            value={new Date(startDateStr)}
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              if (date) {
                setStartDateStr(date.toISOString().substring(0, 10));
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
      <View style={[eventStyles.dateTimeSection, { borderColor: themeColors.border, marginTop: 16 }]}>
        {/* Checkbox to enable/disable end date */}
        <View style={eventStyles.checkboxContainer}>
          {isWeb ? (
            <label style={eventStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => handleEndDateToggle(e.target.checked)}
                style={eventStyles.webCheckbox}
              />
              <ThemedText style={[eventStyles.checkboxText, { color: themeColors.text }]}>
                {t('event.includeEndTime')}
              </ThemedText>
            </label>
          ) : (
            <TouchableOpacity
              style={eventStyles.nativeCheckboxContainer}
              onPress={() => handleEndDateToggle(!hasEndDate)}
            >
              <IconSymbol 
                name={hasEndDate ? "checkmark.square.fill" : "square"} 
                size={24} 
                color={themeColors.primary} 
              />
              <ThemedText style={[eventStyles.checkboxText, { color: themeColors.text }]}>
                {t('event.includeEndTime')}
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
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                style={{
                  padding: '12px 15px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  backgroundColor: themeColors.inputBackground,
                  color: themeColors.text,
                  width: '100%',
                  border: `1px solid ${themeColors.border}`,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}
              />
            ) : (
              <TouchableOpacity
                style={[eventStyles.datePickerButton, { borderColor: themeColors.border }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol 
                    name="calendar" 
                    size={24} 
                    color={themeColors.primary} 
                    style={eventStyles.detailIcon} 
                  />
                  <ThemedText style={[eventStyles.detailText, { color: themeColors.text }]}>
                    {endDateStr ? formatDate(getEndDateTime(), i18n.language) : 'Select date'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}

            {!isWeb && showEndDatePicker && (
              <NativeDateTimePicker
                value={new Date(endDateStr || startDateStr)}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (date) {
                    setEndDateStr(date.toISOString().substring(0, 10));
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

      {/* Location */}
      <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text, marginTop: 16 }]}>
        {t('event.location')}
      </ThemedText>
      <TextInput
        style={[
          eventStyles.formInput, 
          { 
            color: themeColors.text,
            backgroundColor: themeColors.background,
            borderColor: themeColors.border 
          }
        ]}
        value={location}
        onChangeText={setLocation}
        placeholder={t('event.locationPlaceholder')}
        placeholderTextColor={themeColors.textSecondary}
      />

      {/* Description */}
      <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text, marginTop: 16 }]}>
        {t('event.description')}
      </ThemedText>
      <TextInput
        style={[
          eventStyles.textArea, 
          { 
            color: themeColors.text,
            backgroundColor: themeColors.background,
            borderColor: themeColors.border,
            textAlignVertical: 'top'
          }
        ]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('event.descriptionPlaceholder')}
        placeholderTextColor={themeColors.textSecondary}
        multiline
        numberOfLines={6}
      />

      {/* Error message */}
      {error ? (
        <ThemedText style={[eventStyles.formErrorText, { color: themeColors.error }]}>
          {error}
        </ThemedText>
      ) : null}

      {/* Action buttons */}
      <View style={eventStyles.buttonContainer}>
        <TouchableOpacity 
          style={[
            eventStyles.actionButton, 
            eventStyles.cancelButton,
            { borderColor: themeColors.border }
          ]}
          onPress={onCancel}
          disabled={isSaving}
        >
          <ThemedText style={[eventStyles.buttonText, { color: themeColors.text }]}>
            {t('common.cancel')}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            eventStyles.actionButton, 
            eventStyles.saveButton,
            { backgroundColor: themeColors.primary },
            isSaving && { opacity: 0.7 }
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <ThemedText style={[eventStyles.buttonText, { color: '#FFFFFF' }]}>
            {isSaving ? t('common.saving') : t('common.save')}
          </ThemedText>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};
