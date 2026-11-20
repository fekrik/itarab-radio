import Constants from 'expo-constants';
import bundledCatalogJson from '../../catalog/stations.json';
import type { CategoryId, CountrySummary, Station, StationCatalog } from '../types/radio';
import {
  getCachedCatalog,
  getCatalogEtag,
  getLastCatalogSync,
  saveCachedCatalog,
  saveCatalogEtag,
  saveLastCatalogSync,
} from './storageService';

/**
 * Configured in `app.json` -> `expo.extra.catalogUrl`
 * (e.g. "https://raw.githubusercontent.com/<user>/<repo>/main/catalog/stations.json"
 *  or your Cloudflare Pages URL) for daily over-the-air station updates.
 */
export const REMOTE_CATALOG_URL =
  ((Constants.expoConfig?.extra as { catalogUrl?: string } | undefined)?.catalogUrl ?? '').trim();

export const DAILY_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

const BUNDLED_CATALOG = bundledCatalogJson as StationCatalog;

function isValidCatalog(data: unknown): data is StationCatalog {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<StationCatalog>;
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.updatedAt === 'string' &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.stations) &&
    candidate.stations.length > 0 &&
    candidate.stations.every(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        typeof s.streamUrl === 'string' &&
        s.streamUrl.startsWith('https://')
    )
  );
}

export function getBundledCatalog(): StationCatalog {
  return BUNDLED_CATALOG;
}

export async function loadInitialCatalog(): Promise<StationCatalog> {
  const cached = await getCachedCatalog();
  if (cached) {
    const cachedTime = Date.parse(cached.updatedAt) || 0;
    const bundledTime = Date.parse(BUNDLED_CATALOG.updatedAt) || 0;
    if (cachedTime > bundledTime) {
      return cached;
    }
  }
  return BUNDLED_CATALOG;
}

export async function syncRemoteCatalog(
  { force = false }: { force?: boolean } = {}
): Promise<{ catalog: StationCatalog | null; updated: boolean }> {
  if (!REMOTE_CATALOG_URL) {
    return { catalog: null, updated: false };
  }

  if (!force) {
    const lastSync = await getLastCatalogSync();
    if (lastSync > 0 && Date.now() - lastSync < DAILY_SYNC_INTERVAL_MS) {
      return { catalog: null, updated: false };
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  const cachedEtag = await getCatalogEtag();
  if (cachedEtag && !force) {
    headers['If-None-Match'] = cachedEtag;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(REMOTE_CATALOG_URL, {
      headers,
      signal: controller.signal,
    });

    if (res.status === 304) {
      await saveLastCatalogSync(Date.now());
      return { catalog: null, updated: false };
    }

    if (!res.ok) {
      return { catalog: null, updated: false };
    }

    const data: unknown = await res.json();
    if (!isValidCatalog(data)) {
      return { catalog: null, updated: false };
    }

    await Promise.all([
      saveCachedCatalog(data),
      saveCatalogEtag(res.headers.get('etag')),
      saveLastCatalogSync(Date.now()),
    ]);

    return { catalog: data, updated: true };
  } catch {
    return { catalog: null, updated: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRemoteCatalog(): Promise<StationCatalog | null> {
  const { catalog } = await syncRemoteCatalog({ force: true });
  return catalog;
}

export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

export interface StationFilterOptions {
  query?: string;
  category?: CategoryId | 'all';
  countryCode?: string;
}

export function filterStations(
  stations: Station[],
  { query = '', category = 'all', countryCode = 'ALL' }: StationFilterOptions = {}
): Station[] {
  const normQuery = normalizeSearchText(query);
  return stations.filter((station) => {
    if (category !== 'all' && station.category !== category) {
      return false;
    }
    if (countryCode !== 'ALL' && station.countryCode !== countryCode) {
      return false;
    }
    if (!normQuery) {
      return true;
    }
    const haystack = normalizeSearchText(
      [
        station.name,
        station.country,
        station.countryAr,
        station.category,
        ...station.tags,
      ].join(' ')
    );
    return haystack.includes(normQuery);
  });
}

export function groupByCountry(stations: Station[]): CountrySummary[] {
  const byCode = new Map<string, CountrySummary>();
  for (const station of stations) {
    const existing = byCode.get(station.countryCode);
    if (existing) {
      existing.stationCount += 1;
    } else {
      byCode.set(station.countryCode, {
        code: station.countryCode,
        name: station.country,
        nameAr: station.countryAr,
        flag: station.flag,
        stationCount: 1,
      });
    }
  }
  return Array.from(byCode.values()).sort((a, b) => b.stationCount - a.stationCount);
}

export function getFeaturedStations(stations: Station[], limit = 12): Station[] {
  const curated = stations.filter((s) => s.featured);
  const tarab = stations.filter((s) => !s.featured && s.category === 'tarab');
  const others = stations.filter((s) => !s.featured && s.category !== 'tarab');

  const picked: Station[] = [];
  const seenIds = new Set<string>();
  const usedCountries = new Map<string, number>();

  for (const st of curated) {
    if (picked.length >= limit) break;
    if (seenIds.has(st.id)) continue;
    picked.push(st);
    seenIds.add(st.id);
    usedCountries.set(st.countryCode, (usedCountries.get(st.countryCode) || 0) + 1);
  }

  for (const st of tarab) {
    if (picked.length >= limit) break;
    if (seenIds.has(st.id)) continue;
    picked.push(st);
    seenIds.add(st.id);
    usedCountries.set(st.countryCode, (usedCountries.get(st.countryCode) || 0) + 1);
  }

  for (const st of others) {
    if (picked.length >= limit) break;
    if (seenIds.has(st.id)) continue;
    const count = usedCountries.get(st.countryCode) || 0;
    if (count < 2) {
      picked.push(st);
      seenIds.add(st.id);
      usedCountries.set(st.countryCode, count + 1);
    }
  }

  return picked;
}
