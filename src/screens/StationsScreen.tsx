import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StationArtwork } from '../components/StationArtwork';
import { StationRow } from '../components/StationRow';
import { useRadioPlayer } from '../context/RadioPlayerContext';
import {
  filterStations,
  getFeaturedStations,
} from '../services/catalogService';
import { COLORS } from '../theme/colors';
import type { CategoryId, Station } from '../types/radio';

export function StationsScreen() {
  const insets = useSafeAreaInsets();
  const {
    stations,
    categories,
    isRefreshingCatalog,
    refreshCatalog,
    currentStation,
    playbackState,
    playStation,
    isFavorite,
    toggleFavorite,
    recentStations,
  } = useRadioPlayer();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');

  const filteredStations = useMemo(
    () =>
      filterStations(stations, {
        query,
        category: selectedCategory,
      }),
    [stations, query, selectedCategory]
  );

  const featuredStations = useMemo(
    () => getFeaturedStations(stations, 10),
    [stations]
  );

  const isUnfiltered = selectedCategory === 'all' && query.trim().length === 0;

  const renderRailCard = (station: Station, queue: Station[]) => {
    const isSelected = currentStation?.id === station.id;
    return (
      <TouchableOpacity
        key={station.id}
        activeOpacity={0.82}
        onPress={() => playStation(station, queue)}
        style={[styles.railCard, isSelected && styles.railCardActive]}
      >
        <StationArtwork
          name={station.name}
          category={station.category}
          logoUrl={station.logoUrl}
          size={68}
          borderRadius={16}
        />
        <Text numberOfLines={1} style={styles.railName}>
          {station.name}
        </Text>
        <Text numberOfLines={1} style={styles.railCountry}>
          {station.flag} {station.country}
        </Text>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View>
      {/* Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>iTarab Radio</Text>
          <Text style={styles.brandSubtitle}>إذاعات عربية مباشرة</Text>
        </View>
        <View style={styles.countPill}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>{stations.length} Live</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Arabic stations, Fairuz, Quran, Egypt..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory('all')}
          style={[
            styles.chip,
            selectedCategory === 'all' && styles.chipActive,
          ]}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'all' && styles.chipTextActive,
            ]}
          >
            All ({stations.length})
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Recently Played */}
      {isUnfiltered && recentStations.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railScroll}
          >
            {recentStations.map((st) => renderRailCard(st, recentStations))}
          </ScrollView>
        </View>
      )}

      {/* Featured Tarab & Classics */}
      {isUnfiltered && featuredStations.length > 0 && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Tarab & Classics</Text>
            <Text style={styles.sectionTitleAr}>طرب وكلاسيكيات</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railScroll}
          >
            {featuredStations.map((st) => renderRailCard(st, featuredStations))}
          </ScrollView>
        </View>
      )}

      <View style={styles.listSectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'all'
            ? 'All Stations'
            : categories.find((c) => c.id === selectedCategory)?.label ?? 'Stations'}
        </Text>
        <Text style={styles.resultCount}>
          {filteredStations.length} {filteredStations.length === 1 ? 'station' : 'stations'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingCatalog}
            onRefresh={refreshCatalog}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <StationRow
            station={item}
            isSelected={currentStation?.id === item.id}
            playbackState={playbackState}
            isFavorite={isFavorite(item.id)}
            onPress={() => playStation(item, filteredStations)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="radio-outline" size={38} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No matching stations</Text>
            <Text style={styles.emptyText}>
              Try another keyword in Arabic or English, or switch categories.
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
  listContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    color: COLORS.goldText,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.live,
  },
  countText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.goldSoft,
    borderColor: COLORS.gold,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.goldText,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitleAr: {
    color: COLORS.goldText,
    fontSize: 12,
    fontWeight: '600',
  },
  railScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  railCard: {
    width: 110,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  railCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.surfaceElevated,
  },
  railName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  railCountry: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: 16,
    marginBottom: 4,
  },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
