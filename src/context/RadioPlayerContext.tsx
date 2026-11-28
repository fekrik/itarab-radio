import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { recordAppOpen, recordGoodMoment } from '../services/reviewPrompt';
import * as Haptics from 'expo-haptics';
import {
  getBundledCatalog,
  loadInitialCatalog,
  syncRemoteCatalog,
} from '../services/catalogService';
import { useRadioEngine } from '../services/radioEngine';
import {
  getFavoriteIds,
  getRecentIds,
  pushRecentId,
  saveFavoriteIds,
} from '../services/storageService';
import type { CategoryMeta, PlaybackState, Station } from '../types/radio';

const LONG_LISTEN_MS = 5 * 60 * 1000;

const CONNECTION_TIMEOUT_MS = 12000;

interface RadioPlayerContextValue {
  stations: Station[];
  categories: CategoryMeta[];
  catalogUpdatedAt: string;
  isRefreshingCatalog: boolean;
  refreshCatalog: () => Promise<void>;
  currentStation: Station | null;
  playbackState: PlaybackState;
  errorMessage: string | null;
  playStation: (station: Station, queue?: Station[]) => void;
  togglePlayPause: () => void;
  stop: () => void;
  playNext: () => void;
  playPrevious: () => void;
  favoriteIds: string[];
  favoriteStations: Station[];
  isFavorite: (stationId: string) => boolean;
  toggleFavorite: (stationId: string) => void;
  recentStations: Station[];
  sleepTimerMinutes: number | null;
  sleepTimerRemainingSec: number | null;
  setSleepTimer: (minutes: number | null) => void;
  isFullPlayerOpen: boolean;
  setFullPlayerOpen: (open: boolean) => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | null>(null);

export function RadioPlayerProvider({ children }: { children: React.ReactNode }) {
  const initialCatalog = useMemo(() => getBundledCatalog(), []);
  const [stations, setStations] = useState<Station[]>(initialCatalog.stations);
  const [categories, setCategories] = useState<CategoryMeta[]>(initialCatalog.categories);
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState<string>(initialCatalog.updatedAt);
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false);

  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [queue, setQueue] = useState<Station[]>(initialCatalog.stations);
  const [isConnecting, setIsConnecting] = useState(false);
  const [exhaustedError, setExhaustedError] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerEndAt, setSleepTimerEndAt] = useState<number | null>(null);
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number | null>(null);

  const [isFullPlayerOpen, setFullPlayerOpen] = useState(false);

  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeStationRef = useRef<Station | null>(null);
  const streamCandidatesRef = useRef<string[]>([]);
  const streamCandidateIdxRef = useRef<number>(0);

  const engine = useRadioEngine();

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const applyCatalogUpdate = useCallback(
    (nextStations: Station[], nextCategories: CategoryMeta[], nextUpdatedAt: string) => {
      setStations(nextStations);
      setCategories(nextCategories);
      setCatalogUpdatedAt(nextUpdatedAt);
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [loadedCatalog, favs, recents] = await Promise.all([
        loadInitialCatalog(),
        getFavoriteIds(),
        getRecentIds(),
      ]);
      if (!mounted) return;
      applyCatalogUpdate(loadedCatalog.stations, loadedCatalog.categories, loadedCatalog.updatedAt);
      setQueue(loadedCatalog.stations);
      setFavoriteIds(favs);
      setRecentIds(recents);

      const { catalog } = await syncRemoteCatalog({ force: false });
      if (mounted && catalog) {
        applyCatalogUpdate(catalog.stations, catalog.categories, catalog.updatedAt);
      }
    })();

    recordAppOpen();

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        recordAppOpen();
        syncRemoteCatalog({ force: false })
          .then(({ catalog }) => {
            if (mounted && catalog) {
              applyCatalogUpdate(catalog.stations, catalog.categories, catalog.updatedAt);
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      mounted = false;
      appStateSub.remove();
      clearWatchdog();
    };
  }, [applyCatalogUpdate, clearWatchdog]);

  const startCandidateStream = useCallback(
    (station: Station, candidateUrl: string) => {
      clearWatchdog();
      setExhaustedError(null);
      setIsConnecting(true);

      engine.play({
        ...station,
        streamUrl: candidateUrl,
      });

      watchdogRef.current = setTimeout(() => {
        const nextIdx = streamCandidateIdxRef.current + 1;
        if (nextIdx < streamCandidatesRef.current.length && activeStationRef.current) {
          streamCandidateIdxRef.current = nextIdx;
          startCandidateStream(activeStationRef.current, streamCandidatesRef.current[nextIdx]);
          return;
        }
        setIsConnecting(false);
        setExhaustedError('Could not connect to stream. Tap to retry.');
      }, CONNECTION_TIMEOUT_MS);
    },
    [clearWatchdog, engine]
  );

  // Clear loading/watchdog on play; auto-failover to fallbackUrls on error
  useEffect(() => {
    if (engine.playing) {
      setIsConnecting(false);
      setExhaustedError(null);
      clearWatchdog();
      return;
    }

    if (engine.error && activeStationRef.current) {
      const nextIdx = streamCandidateIdxRef.current + 1;
      if (nextIdx < streamCandidatesRef.current.length) {
        streamCandidateIdxRef.current = nextIdx;
        startCandidateStream(activeStationRef.current, streamCandidatesRef.current[nextIdx]);
        return;
      }
      setIsConnecting(false);
      clearWatchdog();
      setExhaustedError('Stream unavailable right now. Tap to retry.');
    }
  }, [clearWatchdog, engine.error, engine.playing, startCandidateStream]);

  const refreshCatalog = useCallback(async () => {
    setIsRefreshingCatalog(true);
    try {
      const { catalog } = await syncRemoteCatalog({ force: true });
      if (catalog) {
        applyCatalogUpdate(catalog.stations, catalog.categories, catalog.updatedAt);
      }
    } finally {
      setIsRefreshingCatalog(false);
    }
  }, [applyCatalogUpdate]);

  const playStation = useCallback(
    (station: Station, nextQueue?: Station[]) => {
      activeStationRef.current = station;
      setCurrentStation(station);
      if (nextQueue && nextQueue.length > 0) {
        setQueue(nextQueue);
      }

      const candidates = Array.from(
        new Set([station.streamUrl, ...(station.fallbackUrls ?? [])].filter(Boolean))
      );
      streamCandidatesRef.current = candidates;
      streamCandidateIdxRef.current = 0;

      startCandidateStream(station, candidates[0] ?? station.streamUrl);
      pushRecentId(station.id).then(setRecentIds).catch(() => {});
    },
    [startCandidateStream]
  );

  const togglePlayPause = useCallback(() => {
    if (!currentStation) return;
    if (engine.playing || isConnecting) {
      clearWatchdog();
      setIsConnecting(false);
      setExhaustedError(null);
      engine.pause();
    } else {
      playStation(currentStation);
    }
  }, [clearWatchdog, currentStation, engine, isConnecting, playStation]);

  const stop = useCallback(() => {
    clearWatchdog();
    setIsConnecting(false);
    setExhaustedError(null);
    activeStationRef.current = null;
    streamCandidatesRef.current = [];
    streamCandidateIdxRef.current = 0;
    engine.stop();
    setCurrentStation(null);
    setFullPlayerOpen(false);
  }, [clearWatchdog, engine]);

  const playNext = useCallback(() => {
    const activeList = queue.length > 0 ? queue : stations;
    if (activeList.length === 0) return;
    if (!currentStation) {
      playStation(activeList[0], activeList);
      return;
    }
    const idx = activeList.findIndex((s) => s.id === currentStation.id);
    const nextIdx = idx >= 0 ? (idx + 1) % activeList.length : 0;
    playStation(activeList[nextIdx], activeList);
  }, [currentStation, playStation, queue, stations]);

  const playPrevious = useCallback(() => {
    const activeList = queue.length > 0 ? queue : stations;
    if (activeList.length === 0) return;
    if (!currentStation) {
      playStation(activeList[0], activeList);
      return;
    }
    const idx = activeList.findIndex((s) => s.id === currentStation.id);
    const prevIdx = idx >= 0 ? (idx - 1 + activeList.length) % activeList.length : 0;
    playStation(activeList[prevIdx], activeList);
  }, [currentStation, playStation, queue, stations]);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (!minutes || minutes <= 0) {
      setSleepTimerMinutes(null);
      setSleepTimerEndAt(null);
      setSleepTimerRemainingSec(null);
      return;
    }
    const endAt = Date.now() + minutes * 60 * 1000;
    setSleepTimerMinutes(minutes);
    setSleepTimerEndAt(endAt);
    setSleepTimerRemainingSec(minutes * 60);
  }, []);

  useEffect(() => {
    if (!sleepTimerEndAt) {
      setSleepTimerRemainingSec(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((sleepTimerEndAt - Date.now()) / 1000));
      setSleepTimerRemainingSec(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        clearWatchdog();
        setIsConnecting(false);
        engine.stop();
        setSleepTimerMinutes(null);
        setSleepTimerEndAt(null);
        setSleepTimerRemainingSec(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clearWatchdog, engine, sleepTimerEndAt]);

  const toggleFavorite = useCallback((stationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFavoriteIds((prev) => {
      const exists = prev.includes(stationId);
      const next = exists ? prev.filter((id) => id !== stationId) : [stationId, ...prev];
      saveFavoriteIds(next);
      if (!exists) {
        // Give the heart animation a moment before any rating dialog.
        setTimeout(() => recordGoodMoment('favorite_added'), 800);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (stationId: string) => favoriteIds.includes(stationId),
    [favoriteIds]
  );

  const stationById = useMemo(() => {
    const map = new Map<string, Station>();
    for (const s of stations) {
      map.set(s.id, s);
    }
    return map;
  }, [stations]);

  const favoriteStations = useMemo(
    () => favoriteIds.map((id) => stationById.get(id)).filter((s): s is Station => Boolean(s)),
    [favoriteIds, stationById]
  );

  const recentStations = useMemo(
    () => recentIds.map((id) => stationById.get(id)).filter((s): s is Station => Boolean(s)),
    [recentIds, stationById]
  );

  const errorMessage = exhaustedError;

  const playbackState: PlaybackState = useMemo(() => {
    if (!currentStation) return 'idle';
    if (errorMessage) return 'error';
    if (engine.playing) return 'playing';
    if (isConnecting || engine.isBuffering) return 'loading';
    return 'paused';
  }, [currentStation, errorMessage, isConnecting, engine.isBuffering, engine.playing]);

  // A listening session that lasted a while and was then paused in the app is
  // a good moment to ask for a rating. Station switches (brief 'loading') don't
  // end the session.
  const listenStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (playbackState === 'playing') {
      if (listenStartRef.current === null) listenStartRef.current = Date.now();
      return;
    }
    if (playbackState === 'paused' || playbackState === 'idle') {
      const startedAt = listenStartRef.current;
      listenStartRef.current = null;
      if (
        startedAt !== null &&
        Date.now() - startedAt >= LONG_LISTEN_MS &&
        AppState.currentState === 'active'
      ) {
        recordGoodMoment('long_listen');
      }
    }
  }, [playbackState]);

  const value = useMemo<RadioPlayerContextValue>(
    () => ({
      stations,
      categories,
      catalogUpdatedAt,
      isRefreshingCatalog,
      refreshCatalog,
      currentStation,
      playbackState,
      errorMessage,
      playStation,
      togglePlayPause,
      stop,
      playNext,
      playPrevious,
      favoriteIds,
      favoriteStations,
      isFavorite,
      toggleFavorite,
      recentStations,
      sleepTimerMinutes,
      sleepTimerRemainingSec,
      setSleepTimer,
      isFullPlayerOpen,
      setFullPlayerOpen,
    }),
    [
      stations,
      categories,
      catalogUpdatedAt,
      isRefreshingCatalog,
      refreshCatalog,
      currentStation,
      playbackState,
      errorMessage,
      playStation,
      togglePlayPause,
      stop,
      playNext,
      playPrevious,
      favoriteIds,
      favoriteStations,
      isFavorite,
      toggleFavorite,
      recentStations,
      sleepTimerMinutes,
      sleepTimerRemainingSec,
      setSleepTimer,
      isFullPlayerOpen,
    ]
  );

  return <RadioPlayerContext.Provider value={value}>{children}</RadioPlayerContext.Provider>;
}

export function useRadioPlayer(): RadioPlayerContextValue {
  const ctx = useContext(RadioPlayerContext);
  if (!ctx) {
    throw new Error('useRadioPlayer must be used within a RadioPlayerProvider');
  }
  return ctx;
}
