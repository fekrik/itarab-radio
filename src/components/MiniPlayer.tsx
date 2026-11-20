import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRadioPlayer } from '../context/RadioPlayerContext';
import { COLORS } from '../theme/colors';
import { StationArtwork } from './StationArtwork';

export function MiniPlayer() {
  const {
    currentStation,
    playbackState,
    errorMessage,
    togglePlayPause,
    setFullPlayerOpen,
  } = useRadioPlayer();

  if (!currentStation) {
    return null;
  }

  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const isError = playbackState === 'error';

  let statusLabel = `${currentStation.flag} ${currentStation.country}`;
  if (isLoading) {
    statusLabel = 'Connecting to live stream...';
  } else if (isError && errorMessage) {
    statusLabel = errorMessage;
  } else if (isPlaying) {
    statusLabel = `LIVE • ${currentStation.flag} ${currentStation.country}`;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setFullPlayerOpen(true)}
      style={styles.container}
    >
      <StationArtwork
        name={currentStation.name}
        category={currentStation.category}
        logoUrl={currentStation.logoUrl}
        size={44}
        borderRadius={10}
      />

      <View style={styles.textCol}>
        <Text numberOfLines={1} style={styles.title}>
          {currentStation.name}
        </Text>
        <View style={styles.statusRow}>
          {isPlaying && <View style={styles.liveDot} />}
          <Text
            numberOfLines={1}
            style={[styles.subtitle, isError && styles.subtitleError]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={togglePlayPause}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.playBtn}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.bg} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : isError ? 'refresh' : 'play'}
            size={20}
            color={COLORS.bg}
            style={!isPlaying && !isError ? { marginLeft: 2 } : undefined}
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.live,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
  subtitleError: {
    color: COLORS.live,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
