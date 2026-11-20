export type CategoryId = 'tarab' | 'music' | 'quran' | 'news' | 'variety';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  labelAr: string;
}

export interface Station {
  id: string;
  name: string;
  countryCode: string;
  country: string;
  countryAr: string;
  flag: string;
  category: CategoryId;
  streamUrl: string;
  fallbackUrls?: string[];
  codec: string;
  bitrate: number;
  isHls: boolean;
  logoUrl: string | null;
  tags: string[];
  latencyMs: number;
  featured?: boolean;
}

export interface StationCatalog {
  version: number;
  updatedAt: string;
  stationCount: number;
  categories: CategoryMeta[];
  stations: Station[];
}

export interface CountrySummary {
  code: string;
  name: string;
  nameAr: string;
  flag: string;
  stationCount: number;
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export type TabKey = 'stations' | 'countries' | 'favorites';
