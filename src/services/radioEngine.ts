import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as ExpoAudio from 'expo-audio';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import type { Station } from '../types/radio';

export interface RadioEngineState {
  playing: boolean;
  isBuffering: boolean;
  error: string | null;
  play: (station: Station) => void;
  pause: () => void;
  stop: () => void;
}

export function useRadioEngine(): RadioEngineState {
  const askedAndroidNotifRef = useRef(false);

  const player = useAudioPlayer(null, {
    updateInterval: 500,
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});

    return () => {
      try {
        player.pause();
        player.clearLockScreenControls();
      } catch {
        // Ignore cleanup errors on unmount
      }
    };
  }, [player]);

  const play = useCallback(
    (station: Station) => {
      if (Platform.OS === 'android' && !askedAndroidNotifRef.current) {
        askedAndroidNotifRef.current = true;
        const reqNotif = (
          ExpoAudio as {
            requestNotificationPermissionsAsync?: () => Promise<unknown>;
          }
        ).requestNotificationPermissionsAsync;
        reqNotif?.().catch(() => {});
      }

      player.pause();
      player.replace({
        uri: station.streamUrl,
        name: station.name,
      });
      player.setActiveForLockScreen(
        true,
        {
          title: station.name,
          artist: `${station.flag} ${station.country} • iTarab Radio`,
          albumTitle: 'iTarab Radio',
          artworkUrl: station.logoUrl ?? undefined,
        },
        {
          showSeekForward: false,
          showSeekBackward: false,
          isLiveStream: true,
        }
      );
      player.play();
    },
    [player]
  );

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const stop = useCallback(() => {
    player.pause();
    player.clearLockScreenControls();
  }, [player]);

  return {
    playing: status.playing,
    isBuffering: status.isBuffering,
    error: status.error,
    play,
    pause,
    stop,
  };
}
