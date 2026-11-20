import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTabBar } from './src/components/BottomTabBar';
import { FullPlayerModal } from './src/components/FullPlayerModal';
import { MiniPlayer } from './src/components/MiniPlayer';
import {
  RadioPlayerProvider,
  useRadioPlayer,
} from './src/context/RadioPlayerContext';
import { CountriesScreen } from './src/screens/CountriesScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { StationsScreen } from './src/screens/StationsScreen';
import { COLORS } from './src/theme/colors';
import type { TabKey } from './src/types/radio';

function MainShell() {
  const [activeTab, setActiveTab] = useState<TabKey>('stations');
  const { favoriteIds } = useRadioPlayer();

  const shell = (
    <View style={[styles.root, Platform.OS === 'web' && styles.webShell]}>
      <View style={styles.content}>
        {activeTab === 'stations' && <StationsScreen />}
        {activeTab === 'countries' && <CountriesScreen />}
        {activeTab === 'favorites' && <FavoritesScreen />}
      </View>

      <MiniPlayer />
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        favoritesCount={favoriteIds.length}
      />
      <FullPlayerModal />
    </View>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.webOuter}>{shell}</View>;
  }

  return shell;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RadioPlayerProvider>
        <MainShell />
      </RadioPlayerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: '#06070B',
  },
  webShell: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E2538',
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
  },
});
