/**
 * Quran catalog model (mp3quran API v3): reciters -> mushafs (riwaya + style) -> surah files.
 * Pure functions only, so Node tests can load this file directly.
 */
(function (root) {
  const utils = root.QRUtils || (typeof require === 'function' ? require('../core/utils.js') : null);

  // "ورش عن نافع - مرتل" -> { riwaya: 'ورش عن نافع', style: 'مرتل' }.
  // The API repeats some names ("المصحف المجود - المصحف المجود"): the repeat is not a style.
  function splitMoshafName(name) {
    const parts = String(name || '').replace(/\s+/g, ' ').trim().split(/ - /);
    const riwaya = (parts[0] || '').trim();
    const style = parts.slice(1).join(' - ').trim();
    return { riwaya, style: style === riwaya ? '' : style };
  }

  function parseMoshaf(raw) {
    const { riwaya, style } = splitMoshafName(raw.name);
    const surahs = String(raw.surah_list || '').split(',')
      .map((n) => parseInt(n, 10))
      .filter((n) => n >= 1 && n <= 114);
    return {
      id: Number(raw.id),
      riwayaId: Number(raw.rewaya_id) || 0,
      riwaya,
      style,
      server: String(raw.server || '').trim().replace(/\/?$/, '/'),
      surahs: [...new Set(surahs)].sort((a, b) => a - b)
    };
  }

  // Index letter: hamza forms share "ا"; Latin letters are upper-case
  function letterOf(raw, name) {
    return utils.normalizeArabic(String(raw.letter || name).trim().charAt(0)).charAt(0).toUpperCase();
  }

  // Only reciters with at least one playable (https) mushaf; sorted by letters like the radios
  function parseReciters(list, lang = 'ar') {
    const reciters = (list || []).map((raw) => {
      const name = String(raw.name || '').trim();
      const moshafs = (raw.moshaf || []).map(parseMoshaf)
        .filter((m) => m.surahs.length > 0 && m.server.startsWith('https://'));
      const riwayat = new Map();
      moshafs.forEach((m) => { if (!riwayat.has(m.riwayaId)) riwayat.set(m.riwayaId, m.riwaya); });
      return {
        id: Number(raw.id),
        name,
        letter: letterOf(raw, name),
        searchKey: utils.normalizeArabic(name),
        moshafs,
        riwayat: [...riwayat.entries()].map(([id, label]) => ({ id, name: label })),
        styles: [...new Set(moshafs.map((m) => m.style).filter((s) => s && !/^(مرتل|murattal)$/i.test(s)))]
      };
    }).filter((r) => r.name && r.moshafs.length > 0);
    return utils.sortStations(reciters, lang);
  }

  function parseSuwar(list) {
    const suwar = new Map();
    (list || []).forEach((s) => {
      suwar.set(Number(s.id), { number: Number(s.id), name: String(s.name || '').trim(), makkia: Number(s.makkia) === 1 });
    });
    return suwar;
  }

  function surahFile(surah) {
    return String(surah).padStart(3, '0');
  }

  function surahUrl(moshaf, surah) {
    return `${moshaf.server}${surahFile(surah)}.mp3`;
  }

  function surahTrackId(moshafId, surah) {
    return `surah:${moshafId}:${surah}`;
  }

  // Index of the next/previous track; -1 at either end (a mushaf does not wrap around)
  function queueStep(length, index, step) {
    const next = index + step;
    return index < 0 || next < 0 || next >= length ? -1 : next;
  }

  // 75 -> "1:15", 3725 -> "1:02:05"
  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  const api = {
    splitMoshafName, parseMoshaf, parseReciters, parseSuwar,
    surahFile, surahUrl, surahTrackId, queueStep, formatTime
  };
  root.QRQuranModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
