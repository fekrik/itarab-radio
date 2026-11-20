import type { CategoryId } from '../types/radio';

export const COLORS = {
  bg: '#0B0D14',
  surface: '#141824',
  surfaceElevated: '#1C2233',
  border: '#262E45',
  gold: '#E2B354',
  goldSoft: 'rgba(226, 179, 84, 0.14)',
  goldText: '#F5D283',
  live: '#EF4444',
  liveSoft: 'rgba(239, 68, 68, 0.16)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  white: '#FFFFFF',
  overlay: 'rgba(5, 7, 12, 0.72)',
} as const;

export const CATEGORY_GRADIENTS: Record<CategoryId, [string, string]> = {
  tarab: ['#9A6B1C', '#4A2F08'],
  music: ['#4338CA', '#1E1B4B'],
  quran: ['#0F766E', '#042F2E'],
  news: ['#BE123C', '#4C0519'],
  variety: ['#0369A1', '#082F49'],
};

export const CATEGORY_ACCENTS: Record<CategoryId, string> = {
  tarab: '#E2B354',
  music: '#818CF8',
  quran: '#34D399',
  news: '#FB7185',
  variety: '#38BDF8',
};
