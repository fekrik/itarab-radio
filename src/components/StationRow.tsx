import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ACCENTS, COLORS } from '../theme/colors';
import type { PlaybackState, Station } from '../types/radio';
import { StationArtwork } from './StationArtwork';

interface StationRowProps {
  station: Station;
  isSelected: boolean;
  playbackState: PlaybackState;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

const CATEGORY_SHORT_LABEL: Record<Station['category'], string> = {
  tarab: 'Tarab',
  music: 'Music',
  quran: 'Quran',
  news: 'News',
  variety: 'FM',
};

export function StationRow({
  station,
  isSelected,
  playbackState,
  isFavorite,
  onPress,
  onToggleFavorite,
}: StationRowProps) {
  const isPlaying = isSelected && playbackState === 'playing';
  const isLoading = isSelected && playbackState === 'loading';
  const accentColor = CATEGORY_ACCENTS[station.category] ?? COLORS.gold;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[styles.row, isSelected && styles.rowActive]}
    >
      <View style={styles.artworkWrap}>
        <StationArtwork
          name={station.name}
          category={station.category}
          logoUrl={station.logoUrl}
          size={52}
          borderRadius={12}
        />
        {isSelected && (
          <View style={styles.activeOverlay}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <Ionicons
                name={isPlaying ? 'radio' : 'play'}
                size={18}
                color={COLORS.gold}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={[styles.name, isSelected && styles.nameActive]}
          >
            {station.name}
          </Text>
          {isPlaying && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.countryText}>
            {station.flag} {station.country}
          </Text>
          <View style={styles.dotSep} />
          <View style={[styles.catBadge, { borderColor: `${accentColor}55` }]}>
            <Text style={[styles.catText, { color: accentColor }]}>
              {CATEGORY_SHORT_LABEL[station.category]}
            </Text>
          </View>
          <Text style={styles.codecText}>
            {station.isHls ? 'HLS' : `${station.codec} ${station.bitrate}k`}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onToggleFavorite}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.favButton}
        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={21}
          color={isFavorite ? COLORS.gold : COLORS.textMuted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.gold,
  },
  artworkWrap: {
    position: 'relative',
    marginRight: 12,
  },
  activeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 13, 20, 0.56)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  name: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  nameActive: {
    color: COLORS.goldText,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.liveSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.live,
  },
  liveText: {
    color: COLORS.live,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
  },
  catBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  catText: {
    fontSize: 10,
    fontWeight: '700',
  },
  codecText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  favButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
});
