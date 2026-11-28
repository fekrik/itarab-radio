import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shareStation } from '../barqlab/share';
import { useRadioPlayer } from '../context/RadioPlayerContext';
import { CATEGORY_ACCENTS, COLORS } from '../theme/colors';
import { SleepTimerModal } from './SleepTimerModal';
import { StationArtwork } from './StationArtwork';

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function FullPlayerModal() {
  const insets = useSafeAreaInsets();
  const {
    currentStation,
    categories,
    playbackState,
    errorMessage,
    togglePlayPause,
    playStation,
    playNext,
    playPrevious,
    isFavorite,
    toggleFavorite,
    sleepTimerMinutes,
    sleepTimerRemainingSec,
    setSleepTimer,
    isFullPlayerOpen,
    setFullPlayerOpen,
  } = useRadioPlayer();

  const [sleepSheetVisible, setSleepSheetVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (playbackState !== 'playing') {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [playbackState, pulseAnim]);

  if (!currentStation) {
    return null;
  }

  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const isError = playbackState === 'error';
  const fav = isFavorite(currentStation.id);
  const catMeta = categories.find((c) => c.id === currentStation.category);
  const accentColor = CATEGORY_ACCENTS[currentStation.category] ?? COLORS.gold;

  return (
    <Modal
      visible={isFullPlayerOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setFullPlayerOpen(false)}
    >
      <LinearGradient
        colors={['#171D30', COLORS.bg, '#07080D']}
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setFullPlayerOpen(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
            accessibilityLabel="Minimize player"
          >
            <Ionicons name="chevron-down" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>NOW PLAYING</Text>
            <Text style={styles.headerBrand}>iTarab Radio</Text>
          </View>

          <TouchableOpacity
            onPress={() => setSleepSheetVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[
              styles.timerBadgeBtn,
              sleepTimerRemainingSec !== null && styles.timerBadgeBtnActive,
            ]}
            accessibilityLabel="Sleep timer"
          >
            <Ionicons
              name="moon-outline"
              size={18}
              color={sleepTimerRemainingSec !== null ? COLORS.gold : COLORS.textPrimary}
            />
            {sleepTimerRemainingSec !== null && (
              <Text style={styles.timerBadgeText}>
                {formatCountdown(sleepTimerRemainingSec)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Center Artwork & Metadata */}
        <View style={styles.centerSection}>
          <View style={styles.artworkShadow}>
            <StationArtwork
              name={currentStation.name}
              category={currentStation.category}
              logoUrl={currentStation.logoUrl}
              size={216}
              borderRadius={28}
            />
          </View>

          <View style={styles.statusPillRow}>
            {isPlaying && (
              <View style={styles.liveBadge}>
                <Animated.View
                  style={[styles.liveDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.liveBadgeText}>LIVE BROADCAST</Text>
              </View>
            )}
            {isLoading && (
              <View style={styles.connectingBadge}>
                <ActivityIndicator size="small" color={COLORS.gold} />
                <Text style={styles.connectingText}>Connecting...</Text>
              </View>
            )}
            {!isPlaying && !isLoading && !isError && (
              <View style={styles.pausedBadge}>
                <Text style={styles.pausedText}>PAUSED</Text>
              </View>
            )}
          </View>

          <Text numberOfLines={2} style={styles.stationName}>
            {currentStation.name}
          </Text>

          <Text style={styles.countryLine}>
            {currentStation.flag} {currentStation.country} • {currentStation.countryAr}
          </Text>

          <View style={styles.pillsRow}>
            <View style={[styles.metaPill, { borderColor: `${accentColor}66` }]}>
              <Text style={[styles.metaPillText, { color: accentColor }]}>
                {catMeta ? `${catMeta.label} • ${catMeta.labelAr}` : currentStation.category}
              </Text>
            </View>
          </View>

          {isError && errorMessage && (
            <TouchableOpacity
              onPress={() => playStation(currentStation)}
              style={styles.errorBanner}
            >
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.live} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <View style={styles.transportRow}>
            <TouchableOpacity
              onPress={() => toggleFavorite(currentStation.id)}
              style={styles.sideActionBtn}
              accessibilityLabel={fav ? 'Remove favorite' : 'Add favorite'}
            >
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={24}
                color={fav ? COLORS.gold : COLORS.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playPrevious}
              style={styles.skipBtn}
              accessibilityLabel="Previous station"
            >
              <Ionicons name="play-skip-back" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              activeOpacity={0.85}
              style={styles.mainPlayBtn}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.bg} />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : isError ? 'refresh' : 'play'}
                  size={36}
                  color={COLORS.bg}
                  style={!isPlaying && !isError ? { marginLeft: 4 } : undefined}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playNext}
              style={styles.skipBtn}
              accessibilityLabel="Next station"
            >
              <Ionicons name="play-skip-forward" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => shareStation(currentStation)}
              style={styles.sideActionBtn}
              accessibilityLabel={`Share ${currentStation.name}`}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
                size={24}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formatBadge}>
            <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />
            <Text style={styles.formatText}>
              {currentStation.isHls
                ? 'HTTPS • HLS ADAPTIVE STREAM'
                : `HTTPS • ${currentStation.codec} • ${currentStation.bitrate} kbps`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <SleepTimerModal
        visible={sleepSheetVisible}
        activeMinutes={sleepTimerMinutes}
        onSelect={setSleepTimer}
        onClose={() => setSleepSheetVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  headerBrand: {
    color: COLORS.goldText,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  timerBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 42,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 21,
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  timerBadgeBtnActive: {
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  timerBadgeText: {
    color: COLORS.goldText,
    fontSize: 12,
    fontWeight: '700',
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  artworkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
    marginBottom: 24,
  },
  statusPillRow: {
    minHeight: 30,
    justifyContent: 'center',
    marginBottom: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.liveSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.live,
  },
  liveBadgeText: {
    color: COLORS.live,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  connectingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 8,
  },
  connectingText: {
    color: COLORS.goldText,
    fontSize: 12,
    fontWeight: '600',
  },
  pausedBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pausedText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stationName: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  countryLine: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: COLORS.liveSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorText: {
    color: COLORS.live,
    fontSize: 13,
    fontWeight: '600',
  },
  controlsSection: {
    alignItems: 'center',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  sideActionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  mainPlayBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formatText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
