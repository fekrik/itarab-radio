import { ImageSourcePropType, Linking, Platform } from 'react-native';

// Barq Lab's live apps, shown on the "More from Barq Lab" screen.
// Keep this list in sync across iTarab Radio, Islamic Radio, Halal Scroll
// and Midnight Assembly, and with the /get/<slug> redirects on barqlab.app.

export type BarqAppSlug =
  | 'itarab-radio'
  | 'islamic-radio'
  | 'halal-scroll'
  | 'midnight-assembly'
  | 'pull-back';

export interface BarqApp {
  slug: BarqAppSlug;
  name: string;
  tagline: string;
  icon: ImageSourcePropType | null;
  /** App Store numeric id. null until the app is live on iOS. */
  appStoreId: string | null;
  /** Google Play package name. */
  playPackage: string;
}

/** The app this code is running in. */
export const SELF_SLUG: BarqAppSlug = 'itarab-radio';

export const BARQ_APPS: BarqApp[] = [
  {
    slug: 'pull-back',
    name: 'Pull Back',
    tagline: 'A daily photo puzzle. Guess the close-up as it zooms out.',
    icon: require('../../assets/barqlab/pull-back.png'),
    // Not released on the App Store yet (Nov 2026), so iPhone users go through
    // barqlab.app/get/pull-back, which can switch to the App Store on launch.
    appStoreId: null,
    playPackage: 'app.barqlab.pullback',
  },
  {
    slug: 'islamic-radio',
    name: 'Islamic Radio',
    tagline: 'Live Quran and Islamic radio from around the world.',
    icon: require('../../assets/barqlab/islamic-radio.png'),
    appStoreId: '1071852395',
    playPackage: 'com.almojor.islamicradio',
  },
  {
    slug: 'halal-scroll',
    name: 'Halal Scroll',
    tagline: 'A calm daily feed of Quran and Sunnah, with tafsir.',
    icon: require('../../assets/barqlab/halal-scroll.png'),
    appStoreId: '6834652749',
    playPackage: 'com.fekrik.halalscroll',
  },
  {
    slug: 'midnight-assembly',
    name: 'Midnight Assembly',
    tagline: 'A stealth toy escape game. Stay hidden, find the way out.',
    icon: require('../../assets/barqlab/midnight-assembly.png'),
    appStoreId: '6837762820',
    playPackage: 'com.fekri.midnightassembly',
  },
  {
    slug: 'itarab-radio',
    name: 'iTarab Radio',
    tagline: 'Live Arabic music and news radio.',
    icon: null, // own entry, never shown
    appStoreId: '625963573',
    playPackage: 'com.almojor.itarab',
  },
];

/**
 * One link that works for anyone: barqlab.app sends iPhone users to the App
 * Store, Android users to Google Play and everyone else to the app's page.
 */
export function smartLink(slug: BarqAppSlug, from: BarqAppSlug = SELF_SLUG): string {
  return `https://barqlab.app/get/${slug}?from=${from}`;
}

/** Opens the app's store page directly, skipping the browser where we can. */
export async function openStorePage(app: BarqApp): Promise<void> {
  const web = smartLink(app.slug);
  const direct =
    Platform.OS === 'ios' && app.appStoreId
      ? `itms-apps://apps.apple.com/app/id${app.appStoreId}`
      : Platform.OS === 'android'
        ? `market://details?id=${app.playPackage}`
        : null;
  if (direct) {
    try {
      await Linking.openURL(direct);
      return;
    } catch {
      // Store app missing (emulator, some Android builds). Fall back to the web link.
    }
  }
  Linking.openURL(web).catch(() => {});
}
