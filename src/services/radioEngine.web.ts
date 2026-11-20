import { useCallback, useEffect, useRef, useState } from 'react';
import type { Station } from '../types/radio';
import type { RadioEngineState } from './radioEngine';

const CHANNEL_NAME = 'itarab-radio-playback';

interface GlobalAudioStore {
  __itarabAudioRegistry?: Set<HTMLAudioElement>;
  __itarabPlayGen?: number;
}

function getStore(): GlobalAudioStore {
  return globalThis as typeof globalThis & GlobalAudioStore;
}

function getRegistry(): Set<HTMLAudioElement> {
  const store = getStore();
  if (!store.__itarabAudioRegistry) {
    store.__itarabAudioRegistry = new Set<HTMLAudioElement>();
  }
  return store.__itarabAudioRegistry;
}

function nextGeneration(): number {
  const store = getStore();
  store.__itarabPlayGen = (store.__itarabPlayGen ?? 0) + 1;
  return store.__itarabPlayGen;
}

function currentGeneration(): number {
  return getStore().__itarabPlayGen ?? 0;
}

function teardownAudioElement(audio: HTMLAudioElement): void {
  audio.onplaying = null;
  audio.onwaiting = null;
  audio.onstalled = null;
  audio.onpause = null;
  audio.onerror = null;
  audio.muted = true;
  try {
    audio.pause();
  } catch {
    // Ignore pause errors on torn-down elements
  }
  audio.src = '';
  audio.removeAttribute('src');
  try {
    audio.load();
  } catch {
    // Ignore load errors after clearing src
  }
}

export function stopAllWebAudio(): void {
  nextGeneration();
  const registry = getRegistry();
  for (const el of Array.from(registry)) {
    teardownAudioElement(el);
    registry.delete(el);
  }
}

function updateWebMediaSession(station: Station | null, state: 'playing' | 'paused' | 'none'): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  try {
    if (!station) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }
    if (typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: `${station.flag} ${station.country} • iTarab Radio`,
        album: 'iTarab Radio',
        artwork: station.logoUrl ? [{ src: station.logoUrl }] : [],
      });
    }
    navigator.mediaSession.playbackState = state;
  } catch {
    // Ignore unsupported MediaSession operations
  }
}

export function useRadioEngine(): RadioEngineState {
  const [playing, setPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabIdRef = useRef(
    `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`
  );
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentStationRef = useRef<Station | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;
      channel.onmessage = (event: MessageEvent<{ type?: string; tabId?: string }>) => {
        const msg = event.data;
        if (msg?.type === 'PLAY_STARTED' && msg.tabId && msg.tabId !== tabIdRef.current) {
          stopAllWebAudio();
          setPlaying(false);
          setIsBuffering(false);
          updateWebMediaSession(currentStationRef.current, 'paused');
        }
      };
    }

    const handleBeforeUnload = () => {
      stopAllWebAudio();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      stopAllWebAudio();
    };
  }, []);

  const play = useCallback((station: Station) => {
    stopAllWebAudio();
    currentStationRef.current = station;

    channelRef.current?.postMessage({
      type: 'PLAY_STARTED',
      tabId: tabIdRef.current,
    });

    const gen = nextGeneration();
    const registry = getRegistry();
    const audio = new Audio();
    audio.preload = 'none';
    audio.src = station.streamUrl;
    registry.add(audio);

    setPlaying(false);
    setIsBuffering(true);
    setError(null);
    updateWebMediaSession(station, 'playing');

    audio.onplaying = () => {
      if (gen !== currentGeneration()) return;
      setPlaying(true);
      setIsBuffering(false);
      setError(null);
      updateWebMediaSession(station, 'playing');
    };

    audio.onwaiting = () => {
      if (gen !== currentGeneration()) return;
      setIsBuffering(true);
    };

    audio.onstalled = () => {
      if (gen !== currentGeneration()) return;
      setIsBuffering(true);
    };

    audio.onpause = () => {
      if (gen !== currentGeneration()) return;
      setPlaying(false);
      setIsBuffering(false);
      updateWebMediaSession(station, 'paused');
    };

    audio.onerror = () => {
      if (gen !== currentGeneration()) return;
      teardownAudioElement(audio);
      registry.delete(audio);
      setPlaying(false);
      setIsBuffering(false);
      setError('Stream unavailable right now.');
    };

    audio
      .play()
      .then(() => {
        if (gen !== currentGeneration()) {
          teardownAudioElement(audio);
          registry.delete(audio);
        }
      })
      .catch((err: unknown) => {
        if (gen !== currentGeneration()) {
          teardownAudioElement(audio);
          registry.delete(audio);
          return;
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        teardownAudioElement(audio);
        registry.delete(audio);
        setPlaying(false);
        setIsBuffering(false);
        setError(err instanceof Error ? err.message : 'Unable to play stream.');
      });
  }, []);

  const pause = useCallback(() => {
    stopAllWebAudio();
    setPlaying(false);
    setIsBuffering(false);
    setError(null);
    updateWebMediaSession(currentStationRef.current, 'paused');
  }, []);

  const stop = useCallback(() => {
    stopAllWebAudio();
    currentStationRef.current = null;
    setPlaying(false);
    setIsBuffering(false);
    setError(null);
    updateWebMediaSession(null, 'none');
  }, []);

  return {
    playing,
    isBuffering,
    error,
    play,
    pause,
    stop,
  };
}
