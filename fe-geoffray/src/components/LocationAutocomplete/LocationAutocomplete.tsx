import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Colors} from '@/src/constants/Colors';
import {useTheme} from '@/src/contexts/ThemeContext';

// OpenStreetMap Nominatim search function
const searchPlaces = async (query: string, language: string): Promise<Array<{ id: string; name: string; address: string }>> => {
  if (!query || query.length < 2) return [];
  
  try {
    // Use OpenStreetMap's Nominatim service for geocoding
    // Documentation: https://nominatim.org/release-docs/develop/api/Search/
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          // Adding a user-agent is required by Nominatim's usage policy
          'User-Agent': 'RendezVousApp',
          'Accept-Language': language // Use the user's current language
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Transform the response to match our expected format
    return data.map((item: any) => ({
      id: item.place_id.toString(),
      name: item.display_name.split(',')[0], // First part of display_name as the place name
      address: item.display_name // Full address
    }));
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
};

interface LocationAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChangeText,
  placeholder
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; address: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Update local query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2 && isFocused) {
        // Get the current language from i18n
        const currentLanguage = i18n.language || 'en';
        const results = await searchPlaces(query, currentLanguage);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [query, i18n.language, isFocused]);

  const handleSelectPlace = (place: { id: string; name: string; address: string }) => {
    // Update both the local query state and parent component's state with the full address
    setQuery(place.address);
    onChangeText(place.address);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.inputBackground,
            borderColor: themeColors.border,
            color: themeColors.text,
          }
        ]}
        placeholder={placeholder || t('event.location')}
        placeholderTextColor={themeColors.textSecondary}
        value={query}
        onChangeText={text => {
          setQuery(text);
          onChangeText(text);
        }}
        onFocus={() => {
          setIsFocused(true);
          if (query.length >= 2) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          // Add a small delay before hiding suggestions to allow for selection
          setTimeout(() => {
            setIsFocused(false);
          }, 150);
        }}
      />
      
      {showSuggestions && (
        <View style={[
          styles.suggestionsContainer,
          {
            backgroundColor: themeColors.background,
            borderColor: themeColors.border,
          }
        ]}>
          <FlatList
            data={suggestions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectPlace(item)}
              >
                <Text style={[{ fontWeight: 'bold', color: themeColors.text }]}>
                  {item.name}
                </Text>
                <Text style={[{ fontSize: 12, color: themeColors.textSecondary }]}>
                  {item.address}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  }
});
