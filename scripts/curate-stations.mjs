#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOG_DIR = path.join(ROOT_DIR, 'catalog');
const CURATED_JSON_PATH = path.join(CATALOG_DIR, 'curated-stations.json');
const STATIONS_JSON_PATH = path.join(CATALOG_DIR, 'stations.json');
const REPORT_MD_PATH = path.join(CATALOG_DIR, 'report.md');

const RADIO_BROWSER_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://fr1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

const USER_AGENT = 'iTarabRadio/3.0';
const PROBE_CONCURRENCY = 20;
const PROBE_TIMEOUT_MS = 8000;
const MIN_STREAM_BYTES = 1024;
const TARGET_MIN_STATIONS = 180;
const TARGET_MAX_STATIONS = 240;
const MAX_PER_COUNTRY = 25;
const MAX_QURAN_PER_COUNTRY = 5;

const ARAB_COUNTRIES = [
  'YE', 'SA', 'QA', 'AE', 'KW', 'OM', 'BH',
  'EG', 'LB', 'JO', 'PS', 'IQ', 'SY',
  'MA', 'TN', 'DZ', 'SD', 'LY', 'MR', 'SO', 'DJ', 'KM',
];

const FLAGSHIP_NAME_QUERIES = [
  'khaleej', 'خليج', 'yemen', 'يمن', 'aden', 'sanaa',
  'monte carlo', 'مونت كارلو', 'bbc arabic', 'sky news', 'sawa',
  'rotana', 'mbc', 'marina', 'nogoum', 'aghani', 'sawt el ghad',
  'kalthoum', 'kalthom', 'fairuz', 'tarab', 'طرب',
];

const COUNTRY_META = {
  EG: { code: 'EG', name: 'Egypt', nameAr: 'مصر', flag: '🇪🇬' },
  SA: { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦' },
  LB: { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', flag: '🇱🇧' },
  AE: { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', flag: '🇦🇪' },
  MA: { code: 'MA', name: 'Morocco', nameAr: 'المغرب', flag: '🇲🇦' },
  JO: { code: 'JO', name: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴' },
  PS: { code: 'PS', name: 'Palestine', nameAr: 'فلسطين', flag: '🇵🇸' },
  QA: { code: 'QA', name: 'Qatar', nameAr: 'قطر', flag: '🇶🇦' },
  KW: { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼' },
  TN: { code: 'TN', name: 'Tunisia', nameAr: 'تونس', flag: '🇹🇳' },
  DZ: { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', flag: '🇩🇿' },
  IQ: { code: 'IQ', name: 'Iraq', nameAr: 'العراق', flag: '🇮🇶' },
  SY: { code: 'SY', name: 'Syria', nameAr: 'سوريا', flag: '🇸🇾' },
  OM: { code: 'OM', name: 'Oman', nameAr: 'عُمان', flag: '🇴🇲' },
  BH: { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭' },
  YE: { code: 'YE', name: 'Yemen', nameAr: 'اليمن', flag: '🇾🇪' },
  SD: { code: 'SD', name: 'Sudan', nameAr: 'السودان', flag: '🇸🇩' },
  LY: { code: 'LY', name: 'Libya', nameAr: 'ليبيا', flag: '🇱🇾' },
  MR: { code: 'MR', name: 'Mauritania', nameAr: 'موريتانيا', flag: '🇲🇷' },
  SO: { code: 'SO', name: 'Somalia', nameAr: 'الصومال', flag: '🇸🇴' },
  DJ: { code: 'DJ', name: 'Djibouti', nameAr: 'جيبوتي', flag: '🇩🇯' },
  KM: { code: 'KM', name: 'Comoros', nameAr: 'جزر القمر', flag: '🇰🇲' },
  INTL: { code: 'INTL', name: 'Pan-Arab / International', nameAr: 'عربي دولي', flag: '🌍' },
};

const CATEGORIES = [
  { id: 'tarab', label: 'Tarab & Classics', labelAr: 'طرب وكلاسيكيات' },
  { id: 'music', label: 'Arabic Music', labelAr: 'موسيقى عربية' },
  { id: 'quran', label: 'Holy Quran', labelAr: 'القرآن الكريم' },
  { id: 'news', label: 'News & Talk', labelAr: 'أخبار وحوارات' },
  { id: 'variety', label: 'Variety & FM', labelAr: 'منوعات' },
];

const ARABIC_SCRIPT_RE = /[\u0600-\u06FF]/;
const NON_ARABIC_LANGS = new Set([
  'english', 'hindi', 'tamil', 'malayalam', 'tagalog', 'urdu', 'french',
  'spanish', 'german', 'russian', 'korean', 'chinese', 'persian', 'farsi',
  'turkish', 'italian', 'portuguese', 'bengali', 'punjabi', 'telugu', 'nepali',
  'indonesian', 'malay', 'filipino', 'amharic', 'kurdish', 'berber',
  'español', 'portuguêsa', 'язык: русский', 'british english',
]);

const ARABIC_RELEVANCE_KEYWORDS = [
  'arab', 'arabic', 'tarab', 'quran', 'qoran', 'coran', 'koran', 'fairouz',
  'fairuz', 'fayrouz', 'umm kulthum', 'om kalthoum', 'oum kalthoum', 'om kalthom',
  'um kulthum', 'abdel halim', 'warda', 'khaleeji', 'khaleej', 'chaabi', 'rai',
  'nogoum', 'rotana', 'mbc', 'anghami', 'doualiya', 'sky news arabia', 'al jazeera',
  'aljazeera', 'bbc arabic', 'sawa', 'sham', 'nile', 'cairo', 'beirut', 'dubai',
  'riyadh', 'amman', 'alger', 'tunis', 'maroc', 'medina', 'makkah', 'orient',
  'chada', 'hit radio', 'mosaique', 'jawhara', 'sawt', 'sout', 'idhaat', 'izaa',
  'diab', 'amr diab', 'melody', 'mazzika', 'hawak', 'tarabiyat', 'baghdad',
  'damascus', 'palestine', 'quds', 'manama', 'muscat', 'doha', 'qatar radio',
  'kuwait', 'sanaa', 'sana’a', 'aden', 'yemen', 'sam fm', 'lana fm', 'afaq',
  'khartoum', 'tripoli', 'masr', 'misr', 'asharq', 'alarabiya', 'al arabiya',
  'hadith', 'sunnah', 'islamic', 'noor al-eman', 'emarat', 'abu dhabi',
  'panorama fm', 'alifalif', 'aghani',
];

const NON_ARABIC_EXPAT_KEYWORDS = [
  'bollywood', 'filipino', 'pinoy', 'tagalog', 'malayalam', 'kerala',
  'tamil', 'hindi', 'punjabi', 'desi', 'mirchi', 'kadak', 'suno', 'hit 96.7',
  'club fm', 'asianet', 'josh', 'virgin radio', 'heart', 'capital', 'bbc world',
  'radio 1', 'radio 2', 'lounge', 'chillout', 'country', 'metal', 'rock',
  'afrobeats', 'kpop', 'jpop', 'france inter', 'rfi ', 'skyrock', 'nrj',
  'cherie fm', 'nostalgie', 'fun radio', 'farsi', 'persian', 'avazfarsi',
  'turkish', 'addis abeba', 'ethiopia', 'amharic', 'ebc radio', 'qabayan',
  'radio olive', 'jiyo bindass', 'qbs radio', 'mbc kool', 'mbc radio mauric',
  'mbc radio mauritius', 'al jazeera english', 'al jazeera video', 'sky news australia',
  'candela ', 'cadena rasa', 'cadena enciso', 'monte carlo italia', 'monte carlo 80',
  'monte carlo disco', 'monte carlo fm', 'monte carlo gold', 'monte carlo lounge',
  'monte carlo vip', 'monte carlo golf', 'monte carlo: sweet', 'cx 20 radio monte carlo',
  'onda marina', 'gioiosa marina', 'marina blanes', 'marinahais', 'panorama80',
  'radio panorama', 'wmbc',
];

const SUPPORTED_CODECS = new Set(['MP3', 'AAC', 'AAC+', 'MP4', 'HLS']);
const BLOCKED_CODECS = new Set(['OGG', 'OPUS', 'WMA', 'FLAC']);

const EPHEMERAL_URL_RE =
  /(surfernetwork\.com|[?&](zt|token|exp|expires|sig|signature|hdnea|auth|rj-tok|rj-ttl)=|chunklist_w\d+)/i;

const ZENO_URL_RE = /^https?:\/\/(?:stream-\d+|node-\d+|stream)\.zeno\.fm\/([a-z0-9]+)(?:[/?].*)?$/i;

function normalizeZenoUrl(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  const match = trimmed.match(ZENO_URL_RE);
  if (match) {
    return `https://stream.zeno.fm/${match[1]}`;
  }
  return trimmed;
}

async function fetchJsonWithMirror(pathAndQuery) {
  let lastErr;
  for (const base of RADIO_BROWSER_MIRRORS) {
    const url = `${base}${pathAndQuery}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status} from ${url}`);
          continue;
        }
        return await res.json();
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
      }
    }
  }
  throw lastErr ?? new Error(`All mirrors failed for ${pathAndQuery}`);
}

function normalizeUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = normalizeZenoUrl(raw.trim());
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:') return null;
    u.hostname = u.hostname.toLowerCase();
    const normalizedPath = u.pathname === '/' ? '' : u.pathname.replace(/\/+$/, '');
    return `${u.protocol}//${u.host}${normalizedPath}${u.search}`;
  } catch {
    return null;
  }
}

function selectCandidateUrls(raw) {
  const candidates = [];
  for (const field of [raw.url, raw.url_resolved]) {
    if (!field || typeof field !== 'string') continue;
    const cleaned = normalizeZenoUrl(field.trim());
    if (!cleaned) continue;
    if (cleaned.startsWith('https://') && !EPHEMERAL_URL_RE.test(cleaned)) {
      candidates.push(cleaned);
    } else if (cleaned.startsWith('http://') && !EPHEMERAL_URL_RE.test(cleaned)) {
      candidates.push(cleaned.replace(/^http:\/\//i, 'https://'));
    }
  }
  return Array.from(new Set(candidates));
}

function cleanStationName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\r\n\t\u00A0]+/g, ' ')
    .replace(/^(?:[A-Z]{2}|AR)\s*[:\-–]+\s*/i, '')
    .replace(/^[\s.\-|:•_*#]+|[\s\-|:•_*#]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (s.length > 90) {
    s = `${s.slice(0, 87).trim()}...`;
  }
  return s;
}

function slugify(str) {
  const ascii = str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || 'station';
}

function normalizeNameForDedup(name) {
  return cleanStationName(name)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function isArabicRelevant(station, strictCheck) {
  const urlStr = `${station.url || ''} ${station.url_resolved || ''}`.toLowerCase();
  const combinedText = `${station.name || ''} ${station.tags || ''} ${station.language || ''} ${urlStr}`.toLowerCase();

  if (NON_ARABIC_EXPAT_KEYWORDS.some((kw) => combinedText.includes(kw))) {
    return false;
  }

  const langTokens = (station.language || '')
    .toLowerCase()
    .split(/[,;/|\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const hasArabicLang = langTokens.some((t) => t === 'arabic' || t === 'arab' || t === 'ar');
  const hasArabicScript = ARABIC_SCRIPT_RE.test(station.name || '') || ARABIC_SCRIPT_RE.test(station.tags || '');

  if (hasArabicLang || hasArabicScript) {
    return true;
  }

  if (langTokens.length > 0 && langTokens.every((t) => NON_ARABIC_LANGS.has(t))) {
    return false;
  }

  if (!strictCheck) {
    return true;
  }

  return ARABIC_RELEVANCE_KEYWORDS.some((kw) => combinedText.includes(kw));
}

function prefilterCandidate(raw, strictCheck) {
  const urlCandidates = selectCandidateUrls(raw);
  if (urlCandidates.length === 0) {
    return { ok: false, reason: 'non-https-or-ephemeral' };
  }

  if (!isArabicRelevant(raw, strictCheck)) {
    return { ok: false, reason: 'non-arabic' };
  }

  const codec = (raw.codec || '').trim().toUpperCase();
  const isHlsHint = raw.hls === 1 || urlCandidates.some((u) => /\.m3u8(\?|$)/i.test(u));

  if (BLOCKED_CODECS.has(codec) && !isHlsHint) {
    return { ok: false, reason: `blocked-codec:${codec}` };
  }

  if (codec && codec !== 'UNKNOWN' && !SUPPORTED_CODECS.has(codec) && !isHlsHint) {
    return { ok: false, reason: `unsupported-codec:${codec}` };
  }

  const name = cleanStationName(raw.name);
  if (!name || name.length < 2) {
    return { ok: false, reason: 'empty-name' };
  }

  return { ok: true, urlCandidates };
}

function inferCodecFromContentType(contentType, fallbackCodec, isHls) {
  if (isHls) return 'HLS';
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('mpegurl') || ct.includes('m3u')) return 'HLS';
  if (ct.includes('aacp')) return 'AAC+';
  if (ct.includes('aac')) return 'AAC';
  if (ct.includes('mp4')) return 'MP4';
  if (ct.includes('mpeg') || ct.includes('mp3')) return 'MP3';
  const fb = (fallbackCodec || '').toUpperCase();
  if (SUPPORTED_CODECS.has(fb)) return fb;
  return 'MP3';
}

function extractFirstHlsEntry(manifestText, baseUrl) {
  const lines = manifestText.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    try {
      return new URL(line, baseUrl).toString();
    } catch {
      return null;
    }
  }
  return null;
}

async function verifyHlsVariant(variantUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(variantUrl, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) return false;
    if (!res.url.startsWith('https://')) return false;
    const text = await res.text();
    return text.trimStart().startsWith('#EXTM3U');
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

function chooseDurableStreamUrl(originalUrl, finalUrl) {
  const normalizedOriginal = normalizeZenoUrl(originalUrl);
  if (!finalUrl || !finalUrl.startsWith('https://')) return normalizedOriginal;
  if (EPHEMERAL_URL_RE.test(finalUrl)) {
    return normalizedOriginal;
  }
  return normalizeZenoUrl(finalUrl);
}

async function probeStream(url, fallbackCodec = '') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const start = Date.now();
  let reader;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Icy-MetaData': '1',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, reason: `http-${res.status}` };
    }

    const finalUrl = res.url || url;
    if (!finalUrl.startsWith('https://')) {
      return { ok: false, reason: 'redirected-to-http' };
    }

    const durableUrl = chooseDurableStreamUrl(url, finalUrl);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const icyName = res.headers.get('icy-name')?.trim() || null;
    const icyBr = res.headers.get('icy-br')?.trim() || null;
    const hasIcyHeader = Boolean(icyName || icyBr || res.headers.get('icy-metaint'));

    const isM3uUrl = /\.m3u8(\?|$)/i.test(finalUrl) || /\.m3u8(\?|$)/i.test(url);
    const isHlsContentType =
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      contentType.includes('audio/mpegurl') ||
      contentType.includes('audio/x-mpegurl');

    const isAudioContentType =
      contentType.includes('audio/mpeg') ||
      contentType.includes('audio/mp3') ||
      contentType.includes('audio/x-mpeg') ||
      contentType.includes('audio/aac') ||
      contentType.includes('audio/aacp') ||
      contentType.includes('audio/mp4') ||
      (contentType.includes('application/octet-stream') && hasIcyHeader);

    const explicitlyRejected =
      contentType.includes('text/html') ||
      contentType.includes('application/json') ||
      contentType.includes('application/xml') ||
      contentType.includes('image/') ||
      (contentType.includes('text/plain') && !isM3uUrl);

    if (explicitlyRejected) {
      return { ok: false, reason: `bad-content-type:${contentType.split(';')[0]}` };
    }

    if (!isHlsContentType && !isM3uUrl && !isAudioContentType) {
      return { ok: false, reason: `unsupported-content-type:${contentType.split(';')[0] || 'none'}` };
    }

    if (!res.body) {
      return { ok: false, reason: 'no-body' };
    }

    reader = res.body.getReader();

    if (isHlsContentType || isM3uUrl) {
      let text = '';
      const decoder = new TextDecoder();
      while (text.length < 32768) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) text += decoder.decode(value, { stream: true });
        if (text.includes('#EXTM3U') && /\.(m3u8|ts|aac|m4s|mp4)/i.test(text)) {
          break;
        }
      }
      await reader.cancel().catch(() => {});
      const trimmed = text.trimStart();
      if (!trimmed.startsWith('#EXTM3U')) {
        return { ok: false, reason: 'invalid-hls-manifest' };
      }
      const firstEntry = extractFirstHlsEntry(trimmed, finalUrl);
      if (!firstEntry) {
        return { ok: false, reason: 'empty-hls-manifest' };
      }
      if (/\.m3u8(\?|$)/i.test(firstEntry)) {
        const variantOk = await verifyHlsVariant(firstEntry);
        if (!variantOk) {
          return { ok: false, reason: 'broken-hls-variant' };
        }
      }
      const latencyMs = Date.now() - start;
      return {
        ok: true,
        streamUrl: durableUrl,
        contentType: contentType.split(';')[0],
        isHls: true,
        icyName,
        codec: 'HLS',
        latencyMs,
      };
    }

    let totalBytes = 0;
    while (totalBytes < MIN_STREAM_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) totalBytes += value.byteLength;
    }
    await reader.cancel().catch(() => {});

    if (totalBytes < MIN_STREAM_BYTES) {
      return { ok: false, reason: `insufficient-bytes:${totalBytes}` };
    }

    const latencyMs = Date.now() - start;
    return {
      ok: true,
      streamUrl: durableUrl,
      contentType: contentType.split(';')[0],
      isHls: false,
      icyName,
      codec: inferCodecFromContentType(contentType, fallbackCodec, false),
      latencyMs,
    };
  } catch (err) {
    return { ok: false, reason: err?.name === 'AbortError' ? 'timeout' : 'network-error' };
  } finally {
    clearTimeout(timer);
    if (reader) {
      reader.cancel().catch(() => {});
    }
    controller.abort();
  }
}

async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function categorizeStation(name, tagsStr, streamUrl = '') {
  const hay = `${name} ${tagsStr} ${streamUrl}`.toLowerCase();

  // 1. Holy Quran & Islamic Radio
  if (
    /(qurango\.net|mp3quran\.net|assabile|quran|qoran|coran|koran|islamic|sunnah|athkar|azkar|ruqyah|hadith|tafseer|tafsir|قرآن|القرآن|اذاعة القران|إذاعة القرآن|تراتيل|القارئ|السيرة|الفتاوى|فتاوى|الفقه|الصحابة|رمضان|تلاوة|مصحف|تفسير|إسلام|سنة|رقية|أذكار|نور الإيمان|noor al-eman|السلفية|ابن القيم)/.test(
      hay
    )
  ) {
    return 'quran';
  }

  // 2. News & Talk
  if (
    /(aljazeera|al jazeera|getaj\.net|skynews|sky news|\bbbc\b|monte carlo|doualiya|france 24|france24|\bsawa\b|alarabiya|al arabiya|asharq|\bcnbc\b|\bnews\b|\btalk\b|\bsport\b|أخبار|اخبار|الجزيرة|مونت كارلو|العربية|حوار|رياضة|المقاومة)/.test(
      hay
    )
  ) {
    return 'news';
  }

  // 3. Tarab & Classics
  if (
    /(tarab|kalthoum|kalthom|kulthum|kaltoom|fairuz|fairouz|fayrouz|abdel halim|warda|farid al|farid el|sabah fakhri|abdel wahab|\boud\b|maqam|golden age|\bzaman\b|sout al khaleej|صوت الخليج|جلسات|جالسات|طرب|أم كلثوم|ام كلثوم|فيروز|عبد الحليم|عبدالحليم|فريد الأطرش|وردة|صباح فخري|زمان|تراث)/.test(
      hay
    )
  ) {
    return 'tarab';
  }

  // 4. Arabic Music
  if (
    /(\bmusic\b|\bpop\b|\bhits\b|khaleeji|khaleej|khaliji|chaabi|shaabi|\brai\b|orient|rotana|nogoum|anghami|mazzika|melody|hit radio|nile fm|hawak|diab|mbc fm|mbc mood|panorama|sam fm|lana fm|أغاني|اغاني|موسيقى|موسيقي|شعبي|خليجي|راي|نجوم|روتانا)/.test(
      hay
    )
  ) {
    return 'music';
  }

  return 'variety';
}

function normalizeCountry(rawCode) {
  const cc = (rawCode || '').trim().toUpperCase();
  if (COUNTRY_META[cc]) {
    return COUNTRY_META[cc];
  }
  return COUNTRY_META.INTL;
}

function normalizeLogoUrl(rawFavicon) {
  if (!rawFavicon || typeof rawFavicon !== 'string') return null;
  const trimmed = rawFavicon.trim();
  if (!trimmed.startsWith('https://')) return null;
  if (/facebook\.com\/(?:photo|favicon)/i.test(trimmed)) return null;
  if (/instagram\.com\/favicon/i.test(trimmed)) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

function parseTags(rawTags, category) {
  const rawList = Array.isArray(rawTags)
    ? rawTags
    : (rawTags || '').split(',');
  const tokens = rawList
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length >= 2 && t.length <= 28 && t !== 'classical');
  const unique = Array.from(new Set(['arabic', category, ...tokens]));
  return unique.slice(0, 6);
}

async function loadCuratedEntries() {
  try {
    const raw = await fs.readFile(CURATED_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function probeCuratedEntries(entries, failureReasons) {
  const results = await runWithConcurrency(entries, PROBE_CONCURRENCY, async (entry) => {
    const allUrls = [entry.streamUrl, ...(entry.fallbackUrls || [])]
      .map((u) => normalizeUrl(u))
      .filter((u) => Boolean(u) && !EPHEMERAL_URL_RE.test(u));

    const verifiedUrls = [];
    let primaryProbe = null;
    for (const candidate of allUrls) {
      const res = await probeStream(candidate, entry.codec || '');
      if (res.ok) {
        if (!primaryProbe) {
          primaryProbe = res;
        } else {
          verifiedUrls.push(res.streamUrl);
        }
      } else {
        failureReasons.set(`curated:${res.reason}`, (failureReasons.get(`curated:${res.reason}`) || 0) + 1);
      }
    }

    if (!primaryProbe) {
      console.warn(`Curated station skipped (offline): ${entry.name}`);
      return null;
    }

    const country = normalizeCountry(entry.countryCode);
    const station = {
      id: entry.id || `curated-${country.code.toLowerCase()}-${slugify(entry.name)}`,
      name: cleanStationName(entry.name),
      countryCode: country.code,
      country: country.name,
      countryAr: country.nameAr,
      flag: country.flag,
      category: entry.category || categorizeStation(entry.name, (entry.tags || []).join(','), primaryProbe.streamUrl),
      streamUrl: primaryProbe.streamUrl,
      codec: primaryProbe.codec,
      bitrate: Number(entry.bitrate) > 0 ? Number(entry.bitrate) : 128,
      isHls: primaryProbe.isHls,
      logoUrl: normalizeLogoUrl(entry.logoUrl),
      tags: parseTags(entry.tags, entry.category || 'variety'),
      latencyMs: primaryProbe.latencyMs,
      featured: entry.featured !== false,
    };

    if (verifiedUrls.length > 0) {
      station.fallbackUrls = Array.from(new Set(verifiedUrls.filter((u) => u !== station.streamUrl)));
    }

    return station;
  });

  return results.filter(Boolean);
}

function selectBalancedCatalog(curatedStations, discoveredStations) {
  const selected = [];
  const selectedIds = new Set();
  const countryCounts = new Map();
  const countryQuranCounts = new Map();

  function addStation(st, forceInclude = false) {
    if (selectedIds.has(st.id)) return false;
    const ccCount = countryCounts.get(st.countryCode) || 0;
    const qCount = countryQuranCounts.get(st.countryCode) || 0;
    if (!forceInclude) {
      if (ccCount >= MAX_PER_COUNTRY) return false;
      if (st.category === 'quran' && qCount >= MAX_QURAN_PER_COUNTRY) return false;
    }
    selected.push(st);
    selectedIds.add(st.id);
    countryCounts.set(st.countryCode, ccCount + 1);
    if (st.category === 'quran') {
      countryQuranCounts.set(st.countryCode, qCount + 1);
    }
    return true;
  }

  for (const st of curatedStations) {
    addStation(st, true);
  }

  const scored = [...discoveredStations].sort((a, b) => {
    const scoreA = a._score - a.latencyMs * 0.02;
    const scoreB = b._score - b.latencyMs * 0.02;
    return scoreB - scoreA;
  });

  // Pass 1: Include all remaining verified Yemen stations (up to MAX_PER_COUNTRY)
  for (const st of scored) {
    if (st.countryCode === 'YE') {
      addStation(st);
    }
  }

  // Pass 2: Guarantee strong coverage across all 5 categories
  for (const cat of CATEGORIES) {
    let taken = selected.filter((s) => s.category === cat.id).length;
    const catTarget = cat.id === 'quran' ? 28 : 32;
    for (const st of scored) {
      if (taken >= catTarget) break;
      if (st.category === cat.id && addStation(st)) {
        taken++;
      }
    }
  }

  // Pass 3: Guarantee top stations from every represented country (up to 6 per country)
  const countries = Array.from(new Set(scored.map((s) => s.countryCode)));
  for (const cc of countries) {
    let taken = countryCounts.get(cc) || 0;
    for (const st of scored) {
      if (st.countryCode === cc && taken < 6 && addStation(st)) {
        taken++;
      }
    }
  }

  // Pass 4: Fill up to TARGET_MAX_STATIONS by score
  for (const st of scored) {
    if (selected.length >= TARGET_MAX_STATIONS) break;
    addStation(st);
  }

  // Pass 5: If still under TARGET_MIN_STATIONS, relax per-country cap (keep Quran <= 8 per country)
  if (selected.length < TARGET_MIN_STATIONS) {
    for (const st of scored) {
      if (selected.length >= TARGET_MAX_STATIONS) break;
      if (selectedIds.has(st.id)) continue;
      const qCount = countryQuranCounts.get(st.countryCode) || 0;
      if (st.category === 'quran' && qCount >= 8) continue;
      addStation(st, true);
    }
  }

  return selected.map(({ _score, ...clean }) => clean);
}

function generateReport({ mode, totalCandidates, prefilterStats, probeResults, curatedCount, finalStations, failureReasons }) {
  const byCategory = {};
  for (const cat of CATEGORIES) {
    byCategory[cat.id] = 0;
  }
  const byCountry = new Map();
  for (const st of finalStations) {
    byCategory[st.category] = (byCategory[st.category] || 0) + 1;
    const key = `${st.flag} ${st.country} (${st.countryCode})`;
    byCountry.set(key, (byCountry.get(key) || 0) + 1);
  }

  const lines = [
    `# iTarab Radio — Station Catalog Verification Report`,
    ``,
    `- **Generated:** ${new Date().toISOString()}`,
    `- **Mode:** ${mode}`,
    `- **Curated flagship stations live:** ${curatedCount}`,
    `- **Total candidates evaluated:** ${totalCandidates}`,
    `- **Passed pre-filter (HTTPS + compatible codec + Arabic/MENA):** ${prefilterStats.passed}`,
    `- **Live probe passed:** ${probeResults.passed}`,
    `- **Live probe failed:** ${probeResults.failed}`,
    `- **Final catalog count:** ${finalStations.length}`,
    ``,
    `## Breakdown by Category`,
    `| Category | Count |`,
    `| :--- | ---: |`,
    ...CATEGORIES.map((c) => `| ${c.label} (\`${c.id}\`) | ${byCategory[c.id] || 0} |`),
    ``,
    `## Breakdown by Country`,
    `| Country | Count |`,
    `| :--- | ---: |`,
    ...Array.from(byCountry.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    ``,
  ];

  if (failureReasons.size > 0) {
    lines.push(`## Probe Failure Reasons`, `| Reason | Count |`, `| :--- | ---: |`);
    for (const [reason, count] of Array.from(failureReasons.entries()).sort((a, b) => b[1] - a[1])) {
      lines.push(`| \`${reason}\` | ${count} |`);
    }
    lines.push('');
  }

  lines.push(
    `## Curated & Top Verified Stations`,
    `| Name | Country | Category | Codec | Latency |`,
    `| :--- | :--- | :--- | :--- | ---: |`,
    ...finalStations.slice(0, 35).map(
      (s) =>
        `| ${s.name.replace(/\|/g, '/')} | ${s.flag} ${s.country} | \`${s.category}\` | ${s.codec} | ${s.latencyMs}ms |`
    ),
    ''
  );

  return lines.join('\n');
}

async function verifyExistingCatalog() {
  const failureReasons = new Map();
  const curatedEntries = await loadCuratedEntries();
  console.log(`Probing ${curatedEntries.length} curated stations...`);
  const curatedLive = await probeCuratedEntries(curatedEntries, failureReasons);

  const raw = await fs.readFile(STATIONS_JSON_PATH, 'utf8');
  const existing = JSON.parse(raw);
  const existingStations = existing.stations || [];

  const curatedIds = new Set(curatedLive.map((s) => s.id));
  const curatedUrls = new Set(curatedLive.map((s) => normalizeUrl(s.streamUrl)).filter(Boolean));
  const toCheck = existingStations.filter(
    (s) => !curatedIds.has(s.id) && !curatedUrls.has(normalizeUrl(s.streamUrl))
  );

  console.log(`Verifying ${toCheck.length} existing non-curated stations...`);
  let passedCount = curatedLive.length;
  let failedCount = curatedEntries.length - curatedLive.length;

  const probed = await runWithConcurrency(toCheck, PROBE_CONCURRENCY, async (st) => {
    const urlsToTry = [st.streamUrl, ...(st.fallbackUrls || [])]
      .map((u) => normalizeUrl(u))
      .filter(Boolean);

    let winner = null;
    const validFallbacks = [];
    for (const u of urlsToTry) {
      const res = await probeStream(u, st.codec);
      if (res.ok) {
        if (!winner) winner = res;
        else validFallbacks.push(res.streamUrl);
      } else {
        failureReasons.set(res.reason, (failureReasons.get(res.reason) || 0) + 1);
      }
    }

    if (!winner) {
      failedCount++;
      return null;
    }
    passedCount++;

    const updatedStation = {
      ...st,
      streamUrl: winner.streamUrl,
      codec: winner.codec,
      isHls: winner.isHls,
      latencyMs: winner.latencyMs,
    };
    if (validFallbacks.length > 0) {
      updatedStation.fallbackUrls = Array.from(new Set(validFallbacks.filter((u) => u !== winner.streamUrl)));
    } else {
      delete updatedStation.fallbackUrls;
    }
    return updatedStation;
  });

  const validStations = [...curatedLive, ...probed.filter(Boolean)];
  const updated = {
    version: existing.version || 1,
    updatedAt: new Date().toISOString(),
    stationCount: validStations.length,
    categories: CATEGORIES,
    stations: validStations,
  };

  await fs.mkdir(CATALOG_DIR, { recursive: true });
  await fs.writeFile(STATIONS_JSON_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

  const report = generateReport({
    mode: 'verify-only',
    totalCandidates: curatedEntries.length + toCheck.length,
    prefilterStats: { passed: curatedEntries.length + toCheck.length },
    probeResults: { passed: passedCount, failed: failedCount },
    curatedCount: curatedLive.length,
    finalStations: validStations,
    failureReasons,
  });
  await fs.writeFile(REPORT_MD_PATH, report, 'utf8');

  console.log(`Verification complete: ${validStations.length} alive (${curatedLive.length} curated), ${failedCount} removed.`);
}

async function curateCatalog() {
  const failureReasons = new Map();
  const curatedEntries = await loadCuratedEntries();
  console.log(`Probing ${curatedEntries.length} curated flagship stations...`);
  const curatedLive = await probeCuratedEntries(curatedEntries, failureReasons);
  console.log(`Curated live: ${curatedLive.length}/${curatedEntries.length}`);

  const queries = [
    { path: '/json/stations/search?language=arabic&limit=400&hidebroken=true&order=clickcount&reverse=true', strict: false },
    { path: '/json/stations/search?tag=arabic&limit=200&hidebroken=true&order=clickcount&reverse=true', strict: false },
    { path: '/json/stations/search?tag=tarab&limit=100&hidebroken=true&order=clickcount&reverse=true', strict: false },
    { path: '/json/stations/search?tag=quran&limit=100&hidebroken=true&order=clickcount&reverse=true', strict: false },
    ...ARAB_COUNTRIES.map((cc) => ({
      path: `/json/stations/search?countrycode=${cc}&limit=${cc === 'YE' ? 100 : 60}&hidebroken=true&order=clickcount&reverse=true`,
      strict: true,
    })),
    ...FLAGSHIP_NAME_QUERIES.map((term) => ({
      path: `/json/stations/search?name=${encodeURIComponent(term)}&limit=30&hidebroken=true&order=clickcount&reverse=true`,
      strict: true,
    })),
  ];

  console.log(`Fetching candidates from Radio-Browser (${queries.length} queries)...`);
  const seenUrls = new Set();
  const seenFinalUrls = new Set();
  const seenNameCountry = new Set();
  const usedIds = new Set();

  for (const st of curatedLive) {
    const norm = normalizeUrl(st.streamUrl);
    if (norm) {
      seenUrls.add(norm);
      seenFinalUrls.add(norm);
    }
    for (const fb of st.fallbackUrls || []) {
      const normFb = normalizeUrl(fb);
      if (normFb) {
        seenUrls.add(normFb);
        seenFinalUrls.add(normFb);
      }
    }
    seenNameCountry.add(`${normalizeNameForDedup(st.name)}::${st.countryCode}`);
    usedIds.add(st.id);
  }

  const candidates = [];
  let totalRawFetched = 0;

  for (const q of queries) {
    try {
      const items = await fetchJsonWithMirror(q.path);
      if (!Array.isArray(items)) continue;
      totalRawFetched += items.length;
      for (const raw of items) {
        const pre = prefilterCandidate(raw, q.strict);
        if (!pre.ok) continue;

        const normPrimary = normalizeUrl(pre.urlCandidates[0]);
        if (!normPrimary || seenUrls.has(normPrimary)) continue;

        const country = normalizeCountry(raw.countrycode);
        const cleanName = cleanStationName(raw.name);
        const dedupKey = `${normalizeNameForDedup(cleanName)}::${country.code}`;
        if (seenNameCountry.has(dedupKey)) continue;

        seenUrls.add(normPrimary);
        seenNameCountry.add(dedupKey);
        candidates.push({ raw, urlCandidates: pre.urlCandidates, cleanName, country });
      }
    } catch (err) {
      console.warn(`Warning: query failed (${q.path}): ${err.message}`);
    }
  }

  candidates.sort((a, b) => {
    const scoreA = (a.raw.votes || 0) * 3 + (a.raw.clickcount || 0) * 0.05 + (a.country.code === 'YE' ? 500 : 0);
    const scoreB = (b.raw.votes || 0) * 3 + (b.raw.clickcount || 0) * 0.05 + (b.country.code === 'YE' ? 500 : 0);
    return scoreB - scoreA;
  });

  const probePool = candidates.slice(0, 600);
  console.log(`Fetched ${totalRawFetched} raw records -> ${candidates.length} unique candidates (probing top ${probePool.length})...`);

  let passedCount = curatedLive.length;
  let failedCount = curatedEntries.length - curatedLive.length;

  const probed = await runWithConcurrency(probePool, PROBE_CONCURRENCY, async ({ raw, urlCandidates, cleanName, country }) => {
    let winner = null;
    let lastReason = 'unknown';

    for (const urlCandidate of urlCandidates) {
      const res = await probeStream(urlCandidate, raw.codec);
      if (res.ok) {
        winner = res;
        break;
      }
      lastReason = res.reason;
    }

    if (!winner) {
      failedCount++;
      failureReasons.set(lastReason, (failureReasons.get(lastReason) || 0) + 1);
      return null;
    }

    const finalNorm = normalizeUrl(winner.streamUrl) || winner.streamUrl;
    if (seenFinalUrls.has(finalNorm)) {
      return null;
    }
    seenFinalUrls.add(finalNorm);
    passedCount++;

    const category = categorizeStation(cleanName, raw.tags || '', winner.streamUrl);
    const baseId = raw.stationuuid || `${country.code.toLowerCase()}-${slugify(cleanName)}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    usedIds.add(id);

    const bitrateNum = Number(raw.bitrate) > 0 ? Number(raw.bitrate) : 128;
    const score =
      (raw.votes || 0) * 4 +
      Math.min(raw.clickcount || 0, 5000) * 0.05 +
      (category === 'tarab' ? 60 : 0) +
      (country.code === 'YE' ? 80 : 0);

    return {
      id,
      name: cleanName,
      countryCode: country.code,
      country: country.name,
      countryAr: country.nameAr,
      flag: country.flag,
      category,
      streamUrl: winner.streamUrl,
      codec: winner.codec,
      bitrate: bitrateNum,
      isHls: winner.isHls,
      logoUrl: normalizeLogoUrl(raw.favicon),
      tags: parseTags(raw.tags, category),
      latencyMs: winner.latencyMs,
      _score: score,
    };
  });

  const verifiedDiscovered = probed.filter(Boolean);
  const finalStations = selectBalancedCatalog(curatedLive, verifiedDiscovered);

  const catalog = {
    version: 1,
    updatedAt: new Date().toISOString(),
    stationCount: finalStations.length,
    categories: CATEGORIES,
    stations: finalStations,
  };

  await fs.mkdir(CATALOG_DIR, { recursive: true });
  await fs.writeFile(STATIONS_JSON_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

  const report = generateReport({
    mode: 'full-curation',
    totalCandidates: totalRawFetched + curatedEntries.length,
    prefilterStats: { passed: probePool.length + curatedEntries.length },
    probeResults: { passed: passedCount, failed: failedCount },
    curatedCount: curatedLive.length,
    finalStations,
    failureReasons,
  });
  await fs.writeFile(REPORT_MD_PATH, report, 'utf8');

  console.log(`Catalog saved to ${STATIONS_JSON_PATH} with ${finalStations.length} verified stations (${curatedLive.length} curated).`);
  console.log(`Report saved to ${REPORT_MD_PATH}.`);
}

const verifyOnly = process.argv.includes('--verify-only');
if (verifyOnly) {
  await verifyExistingCatalog();
} else {
  await curateCatalog();
}
