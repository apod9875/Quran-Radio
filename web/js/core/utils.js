/**
 * Shared helpers. Loaded as a classic script in the page and via importScripts in the
 * service worker; the module.exports hook below lets Node tests load the same file.
 */
(function (root) {
  const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;

  // Same station always lands in the same tab, in both languages (decided from the stream slug).
  const RIWAYAT_SLUG = /warsh|qalon|qaloon|aldor(?:a)?i|albizi|assosi|soufi_khalaf|ibn_thakwan/;
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

  // Only riwayat that the stream name proves; nothing is guessed for other stations.
  const RIWAYAT = [
    { id: 'warsh', pattern: /warsh/, ar: 'ورش عن نافع', eng: 'Warsh from Nafi' },
    { id: 'qalon', pattern: /qalon|qaloon/, ar: 'قالون عن نافع', eng: 'Qalun from Nafi' },
    { id: 'albizi', pattern: /albizi/, ar: 'البزي عن ابن كثير', eng: 'Al-Bazzi from Ibn Kathir' },
    { id: 'assosi', pattern: /assosi/, ar: 'السوسي عن أبي عمرو', eng: 'As-Susi from Abu Amr' },
    { id: 'aldori', pattern: /aldor(?:a)?i/, ar: 'الدوري عن أبي عمرو', eng: 'Ad-Duri from Abu Amr' },
    { id: 'khalaf', pattern: /soufi_khalaf/, ar: 'خلف عن حمزة', eng: 'Khalaf from Hamzah' },
    { id: 'ibnthakwan', pattern: /ibn_thakwan/, ar: 'ابن ذكوان عن ابن عامر', eng: 'Ibn Dhakwan from Ibn Amir' }
  ];

  function findRiwaya(url) {
    const slug = stationSlug(url);
    return RIWAYAT.find((r) => r.pattern.test(slug)) || null;
  }

  function riwayaName(url, lang) {
    const riwaya = findRiwaya(url);
    return riwaya ? riwaya[lang === 'ar' ? 'ar' : 'eng'] : null;
  }

  function riwayaId(url) {
    const riwaya = findRiwaya(url);
    return riwaya ? riwaya.id : null;
  }

  // Sort key: ignore leading punctuation and the generic "Radio" / "إذاعة" prefix
  function nameSortKey(name, lang) {
    const clean = String(name || '').replace(/^[^\p{L}\p{N}]+/u, '');
    if (lang === 'ar') return normalizeArabic(clean).replace(/^اذاعه/, '');
    return clean.replace(/^radio\s+/i, '').toLowerCase();
  }

  // Pinned stations first (in their given order), everything else alphabetical
  function sortStations(stations, lang) {
    const collator = new Intl.Collator(lang === 'ar' ? 'ar' : 'en', { sensitivity: 'base', numeric: true });
    const pinned = stations.filter((s) => s.pinned);
    const rest = stations.filter((s) => !s.pinned)
      .sort((a, b) => collator.compare(nameSortKey(a.name, lang), nameSortKey(b.name, lang)));
    return [...pinned, ...rest];
  }

  // "#/reciter/12/34" -> { view: 'reciter', reciterId: 12, moshafId: 34 }; anything unknown is the radio page
  function parseRoute(hash) {
    const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    const isId = (value) => /^\d+$/.test(value || '');
    if (parts[0] === 'reciters' || parts[0] === 'saved') return { view: parts[0] };
    if (parts[0] === 'reciter' && isId(parts[1])) {
      return { view: 'reciter', reciterId: Number(parts[1]), moshafId: isId(parts[2]) ? Number(parts[2]) : null };
    }
    return { view: 'radio' };
  }

  const api = {
    parseRoute,
    riwayaName,
    riwayaId,
    nameSortKey,
    sortStations,
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
