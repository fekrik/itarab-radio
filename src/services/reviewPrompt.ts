import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

// Asks for an App Store / Google Play rating at a good moment:
// right after the listener does something that shows they like the app
// (a long listening session, adding a favorite, sharing), and only once
// they've used the app on a few different days. The OS has its own limits
// on top of ours (iOS shows the dialog at most 3 times a year).

const KEY = '@barqlab/review-prompt';
const MIN_DAYS_USED = 3;
const MIN_DAYS_SINCE_INSTALL = 2;
const MIN_DAYS_BETWEEN_PROMPTS = 120;
const MAX_PROMPTS = 3;
const DAY = 24 * 60 * 60 * 1000;

export type GoodMoment = 'long_listen' | 'favorite_added' | 'shared';

interface State {
  firstSeen: number;
  daysUsed: string[];
  lastPromptAt: number | null;
  promptCount: number;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function load(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (typeof s.firstSeen === 'number' && Array.isArray(s.daysUsed)) return s;
    }
  } catch {
    // fall through to a fresh state
  }
  return { firstSeen: Date.now(), daysUsed: [], lastPromptAt: null, promptCount: 0 };
}

async function save(s: State): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // not worth surfacing
  }
}

/** Call once per app launch / return to foreground. */
export async function recordAppOpen(): Promise<void> {
  const s = await load();
  const t = today();
  if (!s.daysUsed.includes(t)) {
    s.daysUsed = [...s.daysUsed, t].slice(-30);
  }
  await save(s);
}

let inFlight = false;

/** Call after a positive moment. Shows the rating dialog if it's a good time. */
export async function recordGoodMoment(_moment: GoodMoment): Promise<void> {
  if (inFlight || Platform.OS === 'web') return;
  inFlight = true;
  try {
    const s = await load();
    const now = Date.now();
    if (s.promptCount >= MAX_PROMPTS) return;
    if (s.daysUsed.length < MIN_DAYS_USED) return;
    if (now - s.firstSeen < MIN_DAYS_SINCE_INSTALL * DAY) return;
    if (s.lastPromptAt && now - s.lastPromptAt < MIN_DAYS_BETWEEN_PROMPTS * DAY) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    if (!(await StoreReview.hasAction())) return;

    s.lastPromptAt = now;
    s.promptCount += 1;
    await save(s);
    await StoreReview.requestReview();
  } catch {
    // never let a rating prompt break the app
  } finally {
    inFlight = false;
  }
}
