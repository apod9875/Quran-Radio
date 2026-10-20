/**
 * Storage names shared by the page and the service worker (the worker loads this file with
 * importScripts), so a downloaded surah is written and read under exactly the same key.
 */
(function (root) {
  const api = {
    CACHE_AUDIO: 'quran-radio-audio-v5',
    MAX_AUDIO_CACHE_BYTES: 10 * 1024 * 1024 * 1024, // 10 GB

    // Same-origin path of a downloaded surah, e.g. offline-surah/102/001
    offlineSurahPath(moshafId, surah) {
      return `offline-surah/${moshafId}/${String(surah).padStart(3, '0')}`;
    }
  };

  root.QR_STORAGE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
