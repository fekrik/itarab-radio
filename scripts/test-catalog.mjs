#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const STATIONS_JSON_PATH = path.join(ROOT_DIR, 'catalog', 'stations.json');

const VALID_CATEGORIES = new Set(['tarab', 'music', 'news', 'variety']);
const EPHEMERAL_RE = /(surfernetwork\.com|[?&](zt|token|exp|expires|sig|signature|hdnea|auth|rj-tok|rj-ttl)=)/i;

function normalizeSearchText(input) {
  return (input || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

function filterStations(stations, { query = '', category = 'all', countryCode = 'ALL' } = {}) {
  const normQuery = normalizeSearchText(query);
  return stations.filter((s) => {
    if (category !== 'all' && s.category !== category) return false;
    if (countryCode !== 'ALL' && s.countryCode !== countryCode) return false;
    if (!normQuery) return true;
    const haystack = normalizeSearchText(
      [s.name, s.country, s.countryAr, s.category, ...(s.tags || [])].join(' ')
    );
    return haystack.includes(normQuery);
  });
}

async function run() {
  const raw = await fs.readFile(STATIONS_JSON_PATH, 'utf8');
  const catalog = JSON.parse(raw);

  assert.equal(typeof catalog.version, 'number', 'catalog.version must be a number');
  assert.ok(Date.parse(catalog.updatedAt), 'catalog.updatedAt must be a valid ISO timestamp');
  assert.ok(Array.isArray(catalog.categories), 'catalog.categories must be an array');
  assert.ok(Array.isArray(catalog.stations), 'catalog.stations must be an array');
  assert.equal(
    catalog.stationCount,
    catalog.stations.length,
    `stationCount (${catalog.stationCount}) must equal stations.length (${catalog.stations.length})`
  );
  assert.ok(
    catalog.stations.length >= 150,
    `Expected at least 150 stations, found ${catalog.stations.length}`
  );

  const ids = new Set();
  const categoriesSeen = new Set();
  const countriesSeen = new Set();
  let yemenCount = 0;

  for (const st of catalog.stations) {
    assert.ok(typeof st.id === 'string' && st.id.trim().length > 0, 'Station id must be non-empty');
    assert.ok(!ids.has(st.id), `Duplicate station id: ${st.id}`);
    ids.add(st.id);

    assert.ok(typeof st.name === 'string' && st.name.trim().length > 0, `Empty name for ${st.id}`);
    assert.ok(
      typeof st.streamUrl === 'string' && st.streamUrl.startsWith('https://'),
      `streamUrl must start with https:// for ${st.name}: ${st.streamUrl}`
    );
    assert.ok(
      !EPHEMERAL_RE.test(st.streamUrl),
      `streamUrl must not contain ephemeral signed tokens for ${st.name}: ${st.streamUrl}`
    );

    if (st.fallbackUrls !== undefined) {
      assert.ok(Array.isArray(st.fallbackUrls), `fallbackUrls must be an array for ${st.name}`);
      for (const fb of st.fallbackUrls) {
        assert.ok(
          typeof fb === 'string' && fb.startsWith('https://'),
          `fallbackUrl must start with https:// for ${st.name}: ${fb}`
        );
        assert.ok(
          !EPHEMERAL_RE.test(fb),
          `fallbackUrl must not contain ephemeral signed tokens for ${st.name}: ${fb}`
        );
      }
    }

    assert.ok(
      VALID_CATEGORIES.has(st.category),
      `Invalid category "${st.category}" for ${st.name}`
    );
    categoriesSeen.add(st.category);
    countriesSeen.add(st.countryCode);
    if (st.countryCode === 'YE') {
      yemenCount++;
    }

    assert.ok(
      st.logoUrl === null || (typeof st.logoUrl === 'string' && st.logoUrl.startsWith('https://')),
      `Invalid logoUrl for ${st.name}: ${st.logoUrl}`
    );
  }

  // iTarab Radio is music & news only; religious stations live in the Islamic Radio app.
  const religiousRe = /(quran|qoran|coran|koran|قرآن|القران|تلاوة|القارئ|الشيخ|sheikh)/i;
  const religious = catalog.stations.filter((s) => religiousRe.test(`${s.name} ${s.streamUrl}`));
  assert.equal(religious.length, 0, `Religious stations found: ${religious.map((s) => s.name).join(', ')}`);
  assert.ok(
    !catalog.categories.some((c) => c.id === 'quran'),
    'catalog.categories must not include "quran"'
  );

  for (const cat of VALID_CATEGORIES) {
    assert.ok(categoriesSeen.has(cat), `Category "${cat}" has 0 stations in catalog`);
  }
  assert.ok(
    countriesSeen.size >= 15,
    `Expected at least 15 countries, found ${countriesSeen.size}`
  );
  assert.ok(
    yemenCount >= 6,
    `Expected at least 6 Yemen stations, found ${yemenCount}`
  );

  // Filter / search behavior checks (English + Arabic normalization + flagship checks)
  const tarabOnly = filterStations(catalog.stations, { category: 'tarab' });
  assert.ok(tarabOnly.length > 0, 'Expected at least 1 tarab station');
  assert.ok(tarabOnly.every((s) => s.category === 'tarab'), 'Category filter leaked non-tarab station');

  const khaleej = filterStations(catalog.stations, { query: 'Sout Al Khaleej' });
  assert.ok(khaleej.length > 0, 'Expected Sout Al Khaleej to be present in catalog');

  const yemenSearch = filterStations(catalog.stations, { countryCode: 'YE' });
  assert.ok(yemenSearch.length >= 6, 'Expected at least 6 Yemen stations via countryCode filter');

  const arabicQuery = filterStations(catalog.stations, { query: 'فيروز' });
  assert.ok(arabicQuery.length > 0, 'Expected Arabic search "فيروز" to match at least 1 station');

  const normalizedArabicQuery = filterStations(catalog.stations, { query: 'اذاعة' });
  assert.ok(
    normalizedArabicQuery.length > 0,
    'Expected Arabic normalized search "اذاعة" (without hamza) to match stations with "إذاعة"'
  );

  const countrySearch = filterStations(catalog.stations, { query: 'Egypt' });
  assert.ok(countrySearch.length > 0, 'Expected English country search "Egypt" to match stations');

  console.log(
    `Catalog validation passed: ${catalog.stations.length} stations, ${categoriesSeen.size} categories, ${countriesSeen.size} countries (${yemenCount} Yemen).`
  );
}

await run();
