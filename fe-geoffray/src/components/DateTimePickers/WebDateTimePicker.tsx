import React, { useEffect } from 'react';
import { View, Modal, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Colors, BrandColors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

interface WebDateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  dateValue: string;
  onDateChange: (date: string) => void;
  timeValue: string;
  onTimeChange: (time: string) => void;
}

export const WebDateTimePicker: React.FC<WebDateTimePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  dateValue,
  onDateChange,
  timeValue,
  onTimeChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  // Add custom CSS for date and time inputs when component mounts
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Create a style element if it doesn't exist
      let style = document.getElementById('date-time-picker-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'date-time-picker-style';
        document.head.appendChild(style);
      }
      
      // Add CSS rules to hide the browser's default calendar and time picker icons
      style.innerHTML = `
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        input[type="date"],
        input[type="time"] {
          position: relative;
        }
        
        input[type="date"]:after,
        input[type="time"]:after {
          content: '';
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${themeColors.text};
          pointer-events: none;
        }
      `;
    }
    
    // Clean up on unmount
    return () => {
      if (Platform.OS === 'web') {
        const style = document.getElementById('date-time-picker-style');
        if (style) {
          style.remove();
        }
      }
    };
  }, [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
          <ThemedText style={styles.modalTitle}>{title}</ThemedText>
          
          <View style={{ marginBottom: 15 }}>
            <ThemedText style={{ marginBottom: 5 }}>{t('event.date')}</ThemedText>
            <input 
              type="date" 
              value={dateValue}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              style={{
                padding: '12px 15px',
                fontSize: '16px',
                borderRadius: '8px',
                backgroundColor: themeColors.inputBackground,
                color: themeColors.text,
                width: '100%',
                border: `1px solid ${themeColors.border}`,
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                // Custom styles for the inputs will be applied via className
                // Add a custom dropdown arrow
                backgroundImage: 'none',
                position: 'relative',
              }}
            />
          </View>
          
          <View style={{ marginBottom: 15 }}>
            <ThemedText style={{ marginBottom: 5 }}>{t('event.time')}</ThemedText>
            <input 
              type="time" 
              value={timeValue}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.value) {
                  onTimeChange(e.target.value);
                }
              }}
              style={{
                padding: '12px 15px',
                fontSize: '16px',
                borderRadius: '8px',
                backgroundColor: themeColors.inputBackground,
                color: themeColors.text,
                width: '100%',
                border: `1px solid ${themeColors.border}`,
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                // Custom styles for the inputs will be applied via className
                // Add a custom dropdown arrow
                backgroundImage: 'none',
                position: 'relative',
              }}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, {
                borderColor: themeColors.border
              }]}
              onPress={onClose}
            >
              <ThemedText>{t('common.cancel')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.confirmButtonText}>{t('common.confirm')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: BrandColors.coral,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
