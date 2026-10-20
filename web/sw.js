/**
 * Service Worker for MP3Quran Live Radio.
 * - App shell: network-first with a cache fallback, so a deploy reaches users on their next visit.
 * - Live streams are never touched; the browser's media decoder talks to the stream directly.
 * - Offline samples of stations live in CacheStorage and are served at /offline-audio/<id>.
 *
 * صدقة جارية لـ (عبدالرحيم معبد) • Mabed
 */
importScripts(
  './sw/config.js',
  './sw/range.js',
  './sw/db.js',
  './sw/audio-cache.js',
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
      .then(() => self.clients.claim())
  );
});

const MESSAGE_HANDLERS = {
  GET_CACHE_METRICS: () => getAudioCacheMetrics(),
  CACHE_STATION_AUDIO: (data) => precacheStation(data),
  CLEAR_ALL_AUDIO_CACHE: async () => { await clearAudioCache(); return { success: true }; },
  REFRESH_UNUSED_CACHE: async () => {
    const result = await refreshUnusedAudioCache(true);
    return { success: true, freed: result.bytesFreed, metrics: await getAudioCacheMetrics() };
  },
  SET_FAVORITE_STATION: async (data) => {
    await dbUpdateByStation(data.stationId, { isFavorite: !!data.isFavorite });
    return { success: true };
  },
  TOUCH_AUDIO: async (data) => {
    await dbUpdateByStation(data.stationId, { lastAccessed: Date.now() });
    return { success: true };
  }
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
    const offline = OFFLINE_AUDIO_PATH.exec(url.pathname);
    if (offline) {
      event.respondWith(serveOfflineAudio(request, offline[1]));
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
