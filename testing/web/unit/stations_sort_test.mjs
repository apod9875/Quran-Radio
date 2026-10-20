import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { readRadios } from '../helpers/fixtures.mjs';

const require = createRequire(import.meta.url);
const { riwayaName, riwayaId, sortStations, nameSortKey, categorizeStation } = require('../../../web/js/core/utils.js');

const station = (id, name, extra = {}) => ({ id, name, ...extra });

describe('sortStations', () => {
  it('sorts Arabic names by letters and ignores hamza forms and the إذاعة prefix', () => {
    const sorted = sortStations([
      station(1, 'محمد جبريل'), station(2, 'إذاعة أحمد العجمي'), station(3, 'ياسر الدوسري'),
      station(4, 'احمد صابر'), station(5, 'إبراهيم الأخضر')
    ], 'ar').map((s) => s.id);
    assert.deepEqual(sorted, [5, 2, 4, 1, 3]);
  });

  it('sorts English names ignoring the leading "Radio" and punctuation', () => {
    const sorted = sortStations([
      station(1, 'Radio Zain'), station(2, '-Main Radio-'), station(3, 'Radio Ahmad Saber'), station(4, 'Bader')
    ], 'eng').map((s) => s.id);
    assert.deepEqual(sorted, [3, 4, 2, 1]);
  });

  it('keeps pinned stations first, in their given order', () => {
    const sorted = sortStations([
      station(1, 'ب'), station(2, 'ز', { pinned: true }), station(3, 'أ')
    ], 'ar').map((s) => s.id);
    assert.deepEqual(sorted, [2, 3, 1]);
  });

  it('orders every live station list without losing or inventing stations', () => {
    for (const lang of ['ar', 'eng']) {
      const radios = readRadios(lang);
      const sorted = sortStations(radios, lang);
      assert.equal(sorted.length, radios.length);
      const keys = sorted.map((s) => nameSortKey(s.name, lang));
      const collator = new Intl.Collator(lang === 'ar' ? 'ar' : 'en', { sensitivity: 'base', numeric: true });
      for (let i = 1; i < keys.length; i++) {
        assert.ok(collator.compare(keys[i - 1], keys[i]) <= 0, `${lang}: "${keys[i - 1]}" should not come before "${keys[i]}"`);
      }
    }
  });
});

describe('riwayaName', () => {
  const base = 'https://backup.qurango.net/radio/';
  const known = {
    abdulbasit_abdulsamad_warsh: ['ورش عن نافع', 'Warsh from Nafi'],
    mahmoud_khalil_alhussary_warsh: ['ورش عن نافع', 'Warsh from Nafi'],
    ali_alhuthaifi_qalon: ['قالون عن نافع', 'Qalun from Nafi'],
    mohammad_alabdullah_albizi: ['البزي عن ابن كثير', 'Al-Bazzi from Ibn Kathir'],
    mohammad_alabdullah_aldorai: ['الدوري عن أبي عمرو', 'Ad-Duri from Abu Amr'],
    muftah_alsaltany_aldori_an_abi_amr: ['الدوري عن أبي عمرو', 'Ad-Duri from Abu Amr'],
    abdulrasheed_soufi_assosi: ['السوسي عن أبي عمرو', 'As-Susi from Abu Amr'],
    abdulrasheed_soufi_khalaf: ['خلف عن حمزة', 'Khalaf from Hamzah'],
    muftah_alsaltany_ibn_thakwan_an_ibn_amr: ['ابن ذكوان عن ابن عامر', 'Ibn Dhakwan from Ibn Amir']
  };

  for (const [slug, [ar, eng]] of Object.entries(known)) {
    it(`${slug} is named in both languages`, () => {
      assert.equal(riwayaName(base + slug, 'ar'), ar);
      assert.equal(riwayaName(base + slug, 'eng'), eng);
    });
  }

  it('guesses nothing for other stations', () => {
    for (const slug of ['abdullah_alkhalaf', 'yasser_aldosari', 'mishary_alafasi', 'muftah_alsaltany', 'tafseer']) {
      assert.equal(riwayaName(base + slug, 'ar'), null, slug);
    }
  });

  it('gives every station of the Riwayat tab a riwaya name', () => {
    for (const s of readRadios('ar')) {
      if (categorizeStation(s.url, s.name) === 'RIWAYAT') assert.ok(riwayaName(s.url, 'ar'), `${s.id} ${s.url}`);
    }
  });
});

describe('riwayaId', () => {
  const base = 'https://backup.qurango.net/radio/';

  it('gives stable ids that match the names', () => {
    assert.equal(riwayaId(base + 'abdulbasit_abdulsamad_warsh'), 'warsh');
    assert.equal(riwayaId(base + 'ali_alhuthaifi_qalon'), 'qalon');
    assert.equal(riwayaId(base + 'mohammad_alabdullah_albizi'), 'albizi');
    assert.equal(riwayaId(base + 'muftah_alsaltany_aldori_an_abi_amr'), 'aldori');
    assert.equal(riwayaId(base + 'mohammad_alabdullah_aldorai'), 'aldori');
    assert.equal(riwayaId(base + 'abdulrasheed_soufi_assosi'), 'assosi');
    assert.equal(riwayaId(base + 'abdulrasheed_soufi_khalaf'), 'khalaf');
    assert.equal(riwayaId(base + 'muftah_alsaltany_ibn_thakwan_an_ibn_amr'), 'ibnthakwan');
  });

  it('is null exactly when there is no riwaya name', () => {
    for (const s of readRadios('ar')) {
      assert.equal(riwayaId(s.url) === null, riwayaName(s.url, 'ar') === null, s.url);
    }
  });

  it('keeps the seven riwayat of the live list', () => {
    const ids = new Set(readRadios('ar').map((s) => riwayaId(s.url)).filter(Boolean));
    assert.deepEqual([...ids].sort(), ['albizi', 'aldori', 'assosi', 'ibnthakwan', 'khalaf', 'qalon', 'warsh']);
  });
});
