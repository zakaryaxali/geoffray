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
import { formatDate, formatTime } from './EventUtils';
import { NativeDateTimePicker } from '@/src/components/DateTimePickers/NativeDateTimePicker';
import { WebDateTimePicker } from '@/src/components/DateTimePickers/WebDateTimePicker';

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
  
  // Date handling
  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  
  const [selectedStartDate, setSelectedStartDate] = useState(startDate);
  const [selectedEndDate, setSelectedEndDate] = useState(endDate);
  
  // Date picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Modal visibility for web date pickers
  const [showStartDatePickerModal, setShowStartDatePickerModal] = useState(false);
  const [showEndDatePickerModal, setShowEndDatePickerModal] = useState(false);
  
  // Check if we're on web platform
  const isWeb = Platform.OS === 'web';
  
  // Loading state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle date changes
  const handleDateChange = (field: 'start_date' | 'end_date', date?: Date) => {
    if (!date) return;
    
    if (field === 'start_date') {
      setSelectedStartDate(date);
      setShowStartDatePicker(false);
    } else {
      setSelectedEndDate(date);
      setShowEndDatePicker(false);
    }
  };
  
  // Handle date button press
  const handleDateButtonPress = (field: 'start_date' | 'end_date') => {
    if (isWeb) {
      // For web, show the modal
      if (field === 'start_date') {
        setShowStartDatePickerModal(true);
      } else {
        setShowEndDatePickerModal(true);
      }
    } else {
      // For native, show the picker
      if (field === 'start_date') {
        setShowStartDatePicker(true);
      } else {
        setShowEndDatePicker(true);
      }
    }
  };

  // Toggle end date (enable/disable)
  const toggleEndDate = () => {
    if (selectedEndDate) {
      // When unchecking the box, remove the end date
      setSelectedEndDate(null);
    } else {
      // Initialize end date as 1 hour after start date
      const newEndDate = new Date(selectedStartDate);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setSelectedEndDate(newEndDate);
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
    if (selectedEndDate && selectedEndDate < selectedStartDate) {
      setError(t('event.endDateBeforeStart'));
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Prepare update data
      const updateData: UpdateEventRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_date: selectedStartDate.toISOString(),
      };
      
      // Handle end date based on whether it's enabled
      if (selectedEndDate) {
        updateData.end_date = selectedEndDate.toISOString();
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
      
      {/* Start Date and Time */}
      <View>
        <TouchableOpacity 
          style={[eventStyles.datePickerButton, { borderColor: themeColors.border }]}
          onPress={() => handleDateButtonPress('start_date')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconSymbol 
              name="calendar" 
              size={24} 
              color={themeColors.primary} 
              style={eventStyles.detailIcon} 
            />
            <ThemedText style={[eventStyles.detailText, { color: themeColors.text }]}>
              {formatDate(selectedStartDate.toISOString(), i18n.language)} {formatTime(selectedStartDate.toISOString(), i18n.language)}
            </ThemedText>
          </View>
        </TouchableOpacity>
        
        {!isWeb && showStartDatePicker && (
          <NativeDateTimePicker
            value={selectedStartDate}
            onChange={(event: DateTimePickerEvent, date?: Date) => handleDateChange('start_date', date)}
          />
        )}
      </View>

      {/* End Date Toggle */}
      <View style={[eventStyles.toggleRow, { marginTop: 16 }]}>
        <TouchableOpacity 
          style={[eventStyles.toggleButton, { borderColor: themeColors.border }]}
          onPress={toggleEndDate}
        >
          <IconSymbol 
            name={selectedEndDate ? "checkmark.square.fill" : "square"} 
            size={24} 
            color={themeColors.primary} 
          />
          <ThemedText style={[eventStyles.toggleText, { color: themeColors.text }]}>
            {t('event.includeEndTime')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* End Date and Time (if enabled) */}
      {selectedEndDate && (
        <>
          <View>
            <TouchableOpacity 
              style={[eventStyles.datePickerButton, { borderColor: themeColors.border, marginTop: 8 }]}
              onPress={() => handleDateButtonPress('end_date')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconSymbol 
                  name="calendar" 
                  size={24} 
                  color={themeColors.primary} 
                  style={eventStyles.detailIcon} 
                />
                <ThemedText style={[eventStyles.detailText, { color: themeColors.text }]}>
                  {formatDate(selectedEndDate.toISOString(), i18n.language)} {formatTime(selectedEndDate.toISOString(), i18n.language)}
                </ThemedText>
              </View>
            </TouchableOpacity>
            
            {!isWeb && showEndDatePicker && (
              <NativeDateTimePicker
                value={selectedEndDate}
                onChange={(event: DateTimePickerEvent, date?: Date) => handleDateChange('end_date', date)}
              />
            )}
          </View>
        </>
      )}

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

      {/* Web Date/Time Pickers are rendered as modals */}
      
      {/* Web Date/Time Pickers */}
      {isWeb && showStartDatePickerModal && (
        <WebDateTimePicker
          visible={showStartDatePickerModal}
          onClose={() => setShowStartDatePickerModal(false)}
          onConfirm={() => setShowStartDatePickerModal(false)}
          title={t('event.startDateTime')}
          dateValue={selectedStartDate.toISOString().substring(0, 10)}
          timeValue={selectedStartDate.toISOString().substring(11, 16)}
          onDateChange={(dateStr) => {
            try {
              const currentDate = new Date(selectedStartDate);
              const hours = currentDate.getHours();
              const minutes = currentDate.getMinutes();
              
              const newDate = new Date(dateStr);
              newDate.setHours(hours);
              newDate.setMinutes(minutes);
              
              if (!isNaN(newDate.getTime())) {
                setSelectedStartDate(newDate);
              }
            } catch (error) {
              console.log('Invalid date input');
            }
          }}
          onTimeChange={(timeStr) => {
            try {
              const currentDate = new Date(selectedStartDate);
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const day = currentDate.getDate();
              
              const [hours, minutes] = timeStr.split(':').map(Number);
              
              const newDate = new Date(year, month, day, hours, minutes);
              
              if (!isNaN(newDate.getTime())) {
                setSelectedStartDate(newDate);
              }
            } catch (error) {
              console.log('Invalid time input');
            }
          }}
        />
      )}
      
      {isWeb && showEndDatePickerModal && selectedEndDate && (
        <WebDateTimePicker
          visible={showEndDatePickerModal}
          onClose={() => setShowEndDatePickerModal(false)}
          onConfirm={() => setShowEndDatePickerModal(false)}
          title={t('event.endDateTime')}
          dateValue={selectedEndDate.toISOString().substring(0, 10)}
          timeValue={selectedEndDate.toISOString().substring(11, 16)}
          onDateChange={(dateStr) => {
            try {
              const currentDate = new Date(selectedEndDate);
              const hours = currentDate.getHours();
              const minutes = currentDate.getMinutes();
              
              const newDate = new Date(dateStr);
              newDate.setHours(hours);
              newDate.setMinutes(minutes);
              
              if (!isNaN(newDate.getTime())) {
                setSelectedEndDate(newDate);
              }
            } catch (error) {
              console.log('Invalid date input');
            }
          }}
          onTimeChange={(timeStr) => {
            try {
              const currentDate = new Date(selectedEndDate);
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const day = currentDate.getDate();
              
              const [hours, minutes] = timeStr.split(':').map(Number);
              
              const newDate = new Date(year, month, day, hours, minutes);
              
              if (!isNaN(newDate.getTime())) {
                setSelectedEndDate(newDate);
              }
            } catch (error) {
              console.log('Invalid time input');
            }
          }}
        />
      )}
    </ScrollView>
  );
};
