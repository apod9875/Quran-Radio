/**
 * Service Worker for Quran Radio.
 * - App shell: network-first with a cache fallback, so a deploy reaches users on their next visit.
 * - Live streams are never touched; the browser's media decoder talks to the stream directly.
 * - Downloaded surahs are served at /offline-surah/<moshafId>/<nnn> with Range support.
 *
 * صدقة جارية لـ (عبدالرحيم معبد) • Mabed
 */
importScripts(
  './js/core/storage-names.js',
  './sw/config.js',
  './sw/range.js',
  './sw/db.js',
  './sw/audio-cache.js',
  './sw/surah-cache.js',
  './sw/static-cache.js'
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_STATIC && key !== CACHE_AUDIO).map((key) => caches.delete(key))
      ))
      .then(() => removeLegacyRadioSamples())
      .then(() => self.clients.claim())
  );
});

const MESSAGE_HANDLERS = {
  GET_CACHE_METRICS: () => getAudioCacheMetrics(),
  CLEAR_ALL_AUDIO_CACHE: async () => { await clearAudioCache(); return { success: true }; },
  RECORD_DOWNLOAD: (data) => recordDownload(data),
  DELETE_DOWNLOAD: (data) => deleteDownload(data)
};

self.addEventListener('message', (event) => {
  const data = event.data;
  const handler = data && MESSAGE_HANDLERS[data.type];
  if (!handler) return;
  const port = event.ports && event.ports[0];
  event.waitUntil(
    Promise.resolve()
      .then(() => handler(data))
      .then((result) => { if (port) port.postMessage(result); })
      .catch((err) => { if (port) port.postMessage({ success: false, error: String(err && err.message || err) }); })
  );
});

function isApiRequest(url) {
  return /(^|\.)mp3quran\.net$/.test(url.hostname) && url.pathname.startsWith('/api/');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    const surah = OFFLINE_SURAH_PATH.exec(url.pathname);
    if (surah) {
      event.respondWith(serveOfflineSurah(request, surah[1], Number(surah[2])));
    } else if (url.pathname.includes('/icons/')) {
      event.respondWith(cacheFirst(request));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_TIMEOUT_MS));
  }
  // Anything else (live audio streams, third parties) is left to the browser.
});
