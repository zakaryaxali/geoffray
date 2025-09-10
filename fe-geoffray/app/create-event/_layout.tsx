import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';

export default function CreateEventLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, colors } = useTheme();
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: "Create Your Event",
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? colors.textInverse : colors.text} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
