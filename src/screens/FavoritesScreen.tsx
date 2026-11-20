import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StationRow } from '../components/StationRow';
import { useRadioPlayer } from '../context/RadioPlayerContext';
import { COLORS } from '../theme/colors';

export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const {
    favoriteStations,
    currentStation,
    playbackState,
    playStation,
    isFavorite,
    toggleFavorite,
  } = useRadioPlayer();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>
            {favoriteStations.length === 0
              ? 'Your saved Arabic stations'
              : `${favoriteStations.length} saved ${
                  favoriteStations.length === 1 ? 'station' : 'stations'
                }`}
          </Text>
        </View>
        {favoriteStations.length > 0 && (
          <TouchableOpacity
            onPress={() => playStation(favoriteStations[0], favoriteStations)}
            style={styles.playAllBtn}
          >
            <Ionicons name="play" size={16} color={COLORS.bg} />
            <Text style={styles.playAllText}>Play</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={favoriteStations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          favoriteStations.length === 0 && styles.emptyContainer,
        ]}
        renderItem={({ item }) => (
          <StationRow
            station={item}
            isSelected={currentStation?.id === item.id}
            playbackState={playbackState}
            isFavorite={isFavorite(item.id)}
            onPress={() => playStation(item, favoriteStations)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-outline" size={34} color={COLORS.gold} />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart icon on any station to save it here for instant access.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playAllText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingBottom: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
