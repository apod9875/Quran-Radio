import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { readRadios } from '../helpers/fixtures.mjs';

const require = createRequire(import.meta.url);
const { normalizeArabic, escapeHtml, safeJson, categorizeStation } = require('../../../web/js/core/utils.js');

describe('normalizeArabic', () => {
  it('ignores spaces, hamza forms, ta marbuta and alef maksura', () => {
    assert.equal(normalizeArabic('عبد الباسط'), normalizeArabic('عبدالباسط'));
    assert.equal(normalizeArabic('احمد'), normalizeArabic('أحمد'));
    assert.equal(normalizeArabic('إدريس'), normalizeArabic('ادريس'));
    assert.equal(normalizeArabic('القارئ'), normalizeArabic('القاري'));
    assert.equal(normalizeArabic('مدرسة'), normalizeArabic('مدرسه'));
    assert.equal(normalizeArabic('موسى'), normalizeArabic('موسي'));
  });

  it('strips diacritics and tatweel', () => {
    assert.equal(normalizeArabic('عَبْدُ'), 'عبد');
    assert.equal(normalizeArabic('عبـــد'), 'عبد');
  });

  it('lowercases Latin text and removes spaces', () => {
    assert.equal(normalizeArabic('Abdul Basit'), 'abdulbasit');
  });

  it('lets a spaced query find an unspaced station name', () => {
    const name = normalizeArabic('عبدالباسط عبدالصمد');
    assert.ok(name.includes(normalizeArabic('عبد الباسط')));
    assert.ok(name.includes(normalizeArabic('عبد الصمد')));
  });

  it('handles empty input', () => {
    assert.equal(normalizeArabic(''), '');
    assert.equal(normalizeArabic(null), '');
    assert.equal(normalizeArabic(undefined), '');
  });
});

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(escapeHtml(`a & b's`), 'a &amp; b&#39;s');
  });

  it('turns null into an empty string', () => {
    assert.equal(escapeHtml(null), '');
  });
});

describe('safeJson', () => {
  it('parses valid JSON and falls back on garbage', () => {
    assert.deepEqual(safeJson('[1,2]', []), [1, 2]);
    assert.deepEqual(safeJson('{broken', []), []);
    assert.deepEqual(safeJson(null, ['x']), ['x']);
  });
});

describe('categorizeStation', () => {
  const base = 'https://backup.qurango.net/radio/';
  const cases = [
    ['translation_quran_urdu_basit', 'TRANSLATIONS'],
    ['Translation_Quran_Hausa', 'TRANSLATIONS'],
    ['roqiah', 'TAFSEER'],
    ['tafseer', 'TAFSEER'],
    ['tabri', 'TAFSEER'],
    ['fatwa', 'TAFSEER'],
    ['saheh-bokharee', 'TAFSEER'],
    ['abdulbasit_abdulsamad_warsh', 'RIWAYAT'],
    ['ali_alhuthaifi_qalon', 'RIWAYAT'],
    ['muftah_alsaltany_aldori_an_abi_amr', 'RIWAYAT'],
    ['mohammad_alabdullah_albizi', 'RIWAYAT'],
    ['mohammad_alabdullah_aldorai', 'RIWAYAT'],
    ['muftah_alsaltany_aldorai', 'RIWAYAT'],
    ['abdulrasheed_soufi_khalaf', 'RIWAYAT'],
    ['abdullah_alkhalaf', 'POPULAR'],
    ['yasser_aldosari', 'POPULAR'],
    ['mishary_alafasi', 'POPULAR']
  ];

  for (const [slug, expected] of cases) {
    it(`${slug} is ${expected}`, () => {
      assert.equal(categorizeStation(base + slug, 'x'), expected);
    });
  }

  it('falls back to the station name when the stream URL is unknown', () => {
    assert.equal(categorizeStation('not a url', 'ترجمة معاني القرآن'), 'TRANSLATIONS');
    assert.equal(categorizeStation('https://example.org/live', 'Quran Tafseer'), 'TAFSEER');
    assert.equal(categorizeStation('https://example.org/live', 'قراءة ورش'), 'RIWAYAT');
    assert.equal(categorizeStation('https://example.org/live', 'Some Reciter'), 'POPULAR');
  });

  it('puts every live station in the same tab in Arabic and English', () => {
    const english = new Map(readRadios('eng').map((s) => [s.id, s.name]));
    for (const station of readRadios('ar')) {
      assert.equal(
        categorizeStation(station.url, station.name),
        categorizeStation(station.url, english.get(station.id)),
        `station ${station.id} changes tab between languages`
      );
    }
  });

  it('fills the Riwayat tab from the live station list', () => {
    const riwayat = readRadios('ar').filter((s) => categorizeStation(s.url, s.name) === 'RIWAYAT');
    assert.ok(riwayat.length >= 8, `expected at least 8 riwayat stations, got ${riwayat.length}`);
  });
});
