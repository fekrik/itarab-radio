import { Platform, Share } from 'react-native';
import type { Station } from '../types/radio';
import { smartLink, SELF_SLUG } from './apps';
import { recordGoodMoment } from '../services/reviewPrompt';

const APP_NAME = 'iTarab Radio';

async function shareText(message: string, url: string): Promise<void> {
  try {
    // iOS shows the url as a rich link preview; Android only reads `message`,
    // so the link has to be part of the text there.
    const result = await Share.share(
      Platform.OS === 'ios' ? { message, url } : { message: `${message}\n${url}` },
      { dialogTitle: `Share ${APP_NAME}` }
    );
    if (result.action === Share.sharedAction) {
      recordGoodMoment('shared');
    }
  } catch {
    // Share sheet unavailable or dismissed with an error. Nothing to do.
  }
}

/** Shares the station that's playing, with a link to get the app. */
export function shareStation(station: Station): Promise<void> {
  const where = station.country ? ` from ${station.country}` : '';
  const message = `I'm listening to ${station.name}${where}, live on ${APP_NAME} 📻\nأستمع الآن إلى ${station.name} على ${APP_NAME}`;
  return shareText(message, smartLink(SELF_SLUG, SELF_SLUG));
}

/** Shares the app itself. */
export function shareThisApp(): Promise<void> {
  const message = `${APP_NAME}: live Arabic music and news radio, free. Try it 📻`;
  return shareText(message, smartLink(SELF_SLUG, SELF_SLUG));
}
