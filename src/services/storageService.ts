import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StationCatalog } from '../types/radio';

const FAVORITES_KEY = '@itarab/favorites';
const RECENT_KEY = '@itarab/recent';
const CATALOG_CACHE_KEY = '@itarab/catalog-cache';
const CATALOG_LAST_SYNC_KEY = '@itarab/catalog-last-sync';
const CATALOG_ETAG_KEY = '@itarab/catalog-etag';
const MAX_RECENT_ITEMS = 12;

async function readStringArray(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export async function getFavoriteIds(): Promise<string[]> {
  return readStringArray(FAVORITES_KEY);
}

export async function saveFavoriteIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Persistence failure should not interrupt playback UI
  }
}

export async function getRecentIds(): Promise<string[]> {
  return readStringArray(RECENT_KEY);
}

export async function pushRecentId(stationId: string): Promise<string[]> {
  const existing = await getRecentIds();
  const next = [stationId, ...existing.filter((id) => id !== stationId)].slice(0, MAX_RECENT_ITEMS);
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Non-fatal persistence error
  }
  return next;
}

export async function getCachedCatalog(): Promise<StationCatalog | null> {
  try {
    const raw = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StationCatalog;
    if (!parsed || !Array.isArray(parsed.stations) || parsed.stations.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedCatalog(catalog: StationCatalog): Promise<void> {
  try {
    await AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog));
  } catch {
    // Non-fatal cache error
  }
}

export async function getLastCatalogSync(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(CATALOG_LAST_SYNC_KEY);
    if (!raw) return 0;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  } catch {
    return 0;
  }
}

export async function saveLastCatalogSync(timestampMs: number): Promise<void> {
  try {
    await AsyncStorage.setItem(CATALOG_LAST_SYNC_KEY, String(timestampMs));
  } catch {
    // Non-fatal cache error
  }
}

export async function getCatalogEtag(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CATALOG_ETAG_KEY);
  } catch {
    return null;
  }
}

export async function saveCatalogEtag(etag: string | null): Promise<void> {
  try {
    if (etag) {
      await AsyncStorage.setItem(CATALOG_ETAG_KEY, etag);
    } else {
      await AsyncStorage.removeItem(CATALOG_ETAG_KEY);
    }
  } catch {
    // Non-fatal cache error
  }
}
