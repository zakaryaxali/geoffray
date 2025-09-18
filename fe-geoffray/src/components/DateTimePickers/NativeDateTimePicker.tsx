import React, { useState } from 'react';
import { Colors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';
import { View, Platform, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface NativeDateTimePickerProps {
  value: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}

// Simple number pad for entering hours/minutes
const NumberPad = ({ onSelect, min = 0, max = 59, current }: { onSelect: (value: number) => void, min: number, max: number, current: number }) => {
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  const numbers = [];
  for (let i = min; i <= max; i++) {
    numbers.push(i);
  }
  
  return (
    <ScrollView style={styles.numberPadContainer}>
      {numbers.map((num) => (
        <TouchableOpacity 
          key={num} 
          style={[styles.numberButton, 
            { borderColor: themeColors.border },
            current === num ? { backgroundColor: themeColors.primary } : null
          ]}
          onPress={() => onSelect(num)}
        >
          <ThemedText style={[styles.numberText, current === num ? { color: '#fff' } : null]}>
            {num < 10 ? `0${num}` : num}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export const NativeDateTimePicker: React.FC<NativeDateTimePickerProps> = ({
  value,
  onChange,
}) => {
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  // State for our custom date picker
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(value));
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Time state
  const [hours, setHours] = useState(value.getHours());
  const [minutes, setMinutes] = useState(value.getMinutes());
  
  // Handle direct date selection
  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setShowModal(false);
      return;
    }
    
    if (date) {
      // Preserve the current time
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      
      setSelectedDate(newDate);
      setShowTimePicker(true); // Show time picker next
    }
  };
  
  // Handle time selection
  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    
    if (date) {
      // Only extract time from the date
      const newHours = date.getHours();
      const newMinutes = date.getMinutes();
      
      setHours(newHours);
      setMinutes(newMinutes);
      
      // Update the selected date with the new time
      const finalDate = new Date(selectedDate);
      finalDate.setHours(newHours);
      finalDate.setMinutes(newMinutes);
      
      // Close the picker and update the value
      setShowTimePicker(false);
      setShowModal(false);
      
      // Create a synthetic event to match the expected format
      const syntheticEvent: DateTimePickerEvent = {
        type: 'set',
        nativeEvent: {
          timestamp: finalDate.getTime(),
          utcOffset: 0
        }
      };
      
      onChange(syntheticEvent, finalDate);
    }
  };
  
  // Format the date for display
  const formatDateTime = (date: Date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };
  
  if (Platform.OS === 'android') {
    return (
      <View style={{ marginBottom: 16 }}>
        {/* Button to open the date picker */}
        <TouchableOpacity 
          style={[styles.dateButton, { borderColor: themeColors.border }]}
          onPress={() => {
            setSelectedDate(new Date(value));
            setHours(value.getHours());
            setMinutes(value.getMinutes());
            setShowModal(true);
          }}
        >
          <ThemedText style={{ color: themeColors.text }}>
            {formatDateTime(value)}
          </ThemedText>
        </TouchableOpacity>
        
        {/* Date Picker */}
        {showModal && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            testID="androidDatePicker"
          />
        )}
        
        {/* Time Picker - shows after date is selected */}
        {showTimePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            testID="androidTimePicker"
          />
        )}
      </View>
    );
  }
  
  // iOS implementation remains unchanged
  return (
    <View style={{ marginBottom: 16 }}>
      <DateTimePicker
        testID="iOSDateTimePicker"
        value={value}
        mode="datetime"
        display="default"
        onChange={onChange}
        themeVariant={theme}
        textColor={themeColors.text}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dateButton: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff', // Ensure background is visible
    elevation: 5, // Add elevation for Android
    zIndex: 1000, // Ensure it's above other elements
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 15,
  },
  timePickerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  timeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeColumn: {
    alignItems: 'center',
    width: 120,
  },
  timeLabel: {
    marginBottom: 10,
    fontSize: 16,
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 10,
    marginTop: 20,
  },
  numberPadContainer: {
    height: 200,
    width: '100%',
  },
  numberButton: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
  },
  numberText: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
});
