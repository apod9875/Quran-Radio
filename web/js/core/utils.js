/**
 * Shared helpers. Loaded as a classic script in the page and via importScripts in the
 * service worker; the module.exports hook below lets Node tests load the same file.
 */
(function (root) {
  const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;

  // Same station always lands in the same tab, in both languages (decided from the stream slug).
  const RIWAYAT_SLUG = /warsh|qalon|qaloon|aldori|albizi|assosi|soufi_khalaf|ibn_thakwan/;
  const TRANSLATION_SLUG = /^translation_/;
  const TAFSEER_SLUG = /^(fatwa|roqiah|tafseer|mukhtasartafsir|tabri|gareeb-quran|saheh-muslim|saheh-bokharee|riyad|sahabah|fi_zilal_alsiyra|almukhtasar_fi_alsiyra|alanbiya|shmaeel|ramadan|alaikhtiarat_alfiqhayh_bin_baz)$/;

  const NAME_HINTS = [
    ['TRANSLATIONS', /translation|ترجمه|ترجمة/],
    ['TAFSEER', /تفسير|فتاو|tafs|fatwa|رقيه|رقية/],
    ['RIWAYAT', /ورش|قالون|warsh|qalon|qaloon/]
  ];

  function normalizeArabic(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .replace(DIACRITICS, '')
      .replace(/ـ/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/\s+/g, '');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeJson(text, fallback) {
    try {
      const parsed = JSON.parse(text);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function readStorage(key) {
    try { return root.localStorage.getItem(key); } catch (e) { return null; }
  }

  function writeStorage(key, value) {
    try { root.localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
  }

  function stationSlug(url) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      return (parts.pop() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function categorizeStation(url, name) {
    const slug = stationSlug(url);
    if (TRANSLATION_SLUG.test(slug)) return 'TRANSLATIONS';
    if (TAFSEER_SLUG.test(slug)) return 'TAFSEER';
    if (RIWAYAT_SLUG.test(slug)) return 'RIWAYAT';
    const normalized = normalizeArabic(name);
    for (const [category, pattern] of NAME_HINTS) {
      if (pattern.test(normalized)) return category;
    }
    return 'POPULAR';
  }

  const api = {
    normalizeArabic,
    escapeHtml,
    safeJson,
    readStorage,
    writeStorage,
    stationSlug,
    categorizeStation
  };

  root.QRUtils = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
