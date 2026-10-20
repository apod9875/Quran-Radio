import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { readReciters, readSuwar } from '../helpers/fixtures.mjs';

const require = createRequire(import.meta.url);
const model = require('../../../web/js/quran/model.js');
const { parseRoute } = require('../../../web/js/core/utils.js');

describe('mushaf names', () => {
  it('splits the riwaya from the style', () => {
    assert.deepEqual(model.splitMoshafName('ورش عن نافع - مرتل'), { riwaya: 'ورش عن نافع', style: 'مرتل' });
    assert.deepEqual(model.splitMoshafName('حفص عن عاصم - تسجيل عام 1387 هـ - 1967م'),
      { riwaya: 'حفص عن عاصم', style: 'تسجيل عام 1387 هـ - 1967م' });
  });

  it('drops a style that only repeats the name, and collapses double spaces', () => {
    assert.deepEqual(model.splitMoshafName('المصحف المجود - المصحف المجود'), { riwaya: 'المصحف المجود', style: '' });
    assert.equal(model.splitMoshafName('شعبة  عن عاصم - مرتل').riwaya, 'شعبة عن عاصم');
  });
});

describe('parseReciters', () => {
  const reciters = model.parseReciters(readReciters());

  it('keeps every reciter with a playable mushaf and sorts them by letters', () => {
    assert.equal(reciters.length, readReciters().length);
    const collator = new Intl.Collator('ar');
    const { nameSortKey } = require('../../../web/js/core/utils.js');
    for (let i = 1; i < reciters.length; i++) {
      assert.ok(collator.compare(nameSortKey(reciters[i - 1].name, 'ar'), nameSortKey(reciters[i].name, 'ar')) <= 0);
    }
  });

  it('lists each riwaya of a reciter once, with the surahs of each mushaf', () => {
    const hussary = reciters.find((r) => r.name === 'محمود خليل الحصري');
    assert.deepEqual(hussary.riwayat.map((w) => w.name).sort(),
      ['الدوري عن أبي عمرو', 'المصحف المجود', 'حفص عن عاصم', 'قالون عن نافع', 'ورش عن نافع'].sort());
    const warsh = hussary.moshafs.find((m) => m.riwaya === 'ورش عن نافع');
    assert.equal(warsh.surahs.length, 114);
    assert.equal(warsh.surahs[0], 1);
    assert.ok(warsh.server.endsWith('/'));
  });

  it('normalises the first letter so أ / إ / ا share one index entry', () => {
    const letters = new Set(reciters.map((r) => r.letter));
    assert.ok(!letters.has('أ') && !letters.has('إ'));
    assert.ok(letters.has('ا'));
  });

  it('skips mushafs without surahs or with insecure servers', () => {
    const parsed = model.parseReciters([{ id: 1, name: 'قارئ', moshaf: [
      { id: 1, name: 'حفص عن عاصم - مرتل', rewaya_id: 1, server: 'http://insecure/', surah_list: '1,2' },
      { id: 2, name: 'حفص عن عاصم - مرتل', rewaya_id: 1, server: 'https://ok/', surah_list: '' }
    ] }]);
    assert.equal(parsed.length, 0);
  });
});

describe('surah helpers', () => {
  const moshaf = { id: 7, server: 'https://cdn.mp3quran.net/audio/x/' };

  it('builds file URLs and stable track ids', () => {
    assert.equal(model.surahUrl(moshaf, 1), 'https://cdn.mp3quran.net/audio/x/001.mp3');
    assert.equal(model.surahUrl(moshaf, 114), 'https://cdn.mp3quran.net/audio/x/114.mp3');
    assert.equal(model.surahTrackId(7, 18), 'surah:7:18');
  });

  it('reads the 114 surah names', () => {
    const suwar = model.parseSuwar(readSuwar());
    assert.equal(suwar.size, 114);
    assert.equal(suwar.get(1).name, 'الفاتحة');
    assert.equal(suwar.get(2).makkia, false);
    assert.equal(suwar.get(114).makkia, true);
  });

  it('steps through a queue without wrapping around', () => {
    assert.equal(model.queueStep(3, 0, 1), 1);
    assert.equal(model.queueStep(3, 2, 1), -1);
    assert.equal(model.queueStep(3, 0, -1), -1);
    assert.equal(model.queueStep(3, -1, 1), -1);
  });

  it('formats times for short and long surahs', () => {
    assert.equal(model.formatTime(0), '0:00');
    assert.equal(model.formatTime(75), '1:15');
    assert.equal(model.formatTime(3725), '1:02:05');
    assert.equal(model.formatTime(NaN), '0:00');
  });
});

describe('parseRoute', () => {
  it('reads every section and falls back to the radio page', () => {
    assert.deepEqual(parseRoute(''), { view: 'radio' });
    assert.deepEqual(parseRoute('#/radio'), { view: 'radio' });
    assert.deepEqual(parseRoute('#/reciters'), { view: 'reciters' });
    assert.deepEqual(parseRoute('#/saved'), { view: 'saved' });
    assert.deepEqual(parseRoute('#/reciter/51'), { view: 'reciter', reciterId: 51, moshafId: null });
    assert.deepEqual(parseRoute('#/reciter/51/52'), { view: 'reciter', reciterId: 51, moshafId: 52 });
    assert.deepEqual(parseRoute('#/reciter/abc'), { view: 'radio' });
    assert.deepEqual(parseRoute('#/nothing'), { view: 'radio' });
  });
});
