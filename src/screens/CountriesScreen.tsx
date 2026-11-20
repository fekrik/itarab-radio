import React, { useMemo, useState } from 'react';
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
import { filterStations, groupByCountry } from '../services/catalogService';
import { COLORS } from '../theme/colors';
import type { CountrySummary } from '../types/radio';

export function CountriesScreen() {
  const insets = useSafeAreaInsets();
  const {
    stations,
    currentStation,
    playbackState,
    playStation,
    isFavorite,
    toggleFavorite,
  } = useRadioPlayer();

  const [selectedCountry, setSelectedCountry] = useState<CountrySummary | null>(null);

  const countries = useMemo(() => groupByCountry(stations), [stations]);

  const countryStations = useMemo(() => {
    if (!selectedCountry) return [];
    return filterStations(stations, { countryCode: selectedCountry.code });
  }, [selectedCountry, stations]);

  if (selectedCountry) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            onPress={() => setSelectedCountry(null)}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
            <Text style={styles.backText}>Countries</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.countryBanner}>
          <Text style={styles.bannerFlag}>{selectedCountry.flag}</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>{selectedCountry.name}</Text>
            <Text style={styles.bannerSubtitle}>
              {selectedCountry.nameAr} • {countryStations.length}{' '}
              {countryStations.length === 1 ? 'station' : 'stations'}
            </Text>
          </View>
          {countryStations.length > 0 && (
            <TouchableOpacity
              onPress={() => playStation(countryStations[0], countryStations)}
              style={styles.playAllBtn}
            >
              <Ionicons name="play" size={16} color={COLORS.bg} />
              <Text style={styles.playAllText}>Play</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={countryStations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <StationRow
              station={item}
              isSelected={currentStation?.id === item.id}
              playbackState={playbackState}
              isFavorite={isFavorite(item.id)}
              onPress={() => playStation(item, countryStations)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse by Country</Text>
        <Text style={styles.subtitle}>
          {countries.length} Arab regions & pan-Arab stations
        </Text>
      </View>

      <FlatList
        data={countries}
        numColumns={2}
        keyExtractor={(item) => item.code}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setSelectedCountry(item)}
            style={styles.countryCard}
          >
            <Text style={styles.cardFlag}>{item.flag}</Text>
            <Text numberOfLines={1} style={styles.cardName}>
              {item.name}
            </Text>
            <Text numberOfLines={1} style={styles.cardNameAr}>
              {item.nameAr}
            </Text>
            <View style={styles.cardCountBadge}>
              <Text style={styles.cardCountText}>
                {item.stationCount} {item.stationCount === 1 ? 'station' : 'stations'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  countryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  cardFlag: {
    fontSize: 30,
    marginBottom: 8,
  },
  cardName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardNameAr: {
    color: COLORS.goldText,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  cardCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardCountText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  detailHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  countryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerFlag: {
    fontSize: 34,
    marginRight: 12,
  },
  bannerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
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
});
