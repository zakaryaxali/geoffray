import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabChatScreen() {
  return (
    <ParallaxScrollView headerImage={undefined} headerBackgroundColor={{
          dark: '',
          light: ''
      }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">What is the ideal gift for...</ThemedText>
      </ThemedView>
          <ThemedText type="link">Learn more</ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
