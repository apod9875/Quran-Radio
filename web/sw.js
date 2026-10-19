/**
 * Service Worker for MP3Quran Live Radio
 * Featuring Aggressive 10 GB Audio Caching, Offline Range Request Slicing,
 * and LRU Cache Eviction / Refresh for Unused Audio.
 * 
 * صدقة جارية لـ (عبدالرحيم معبد) • Mabed
 */

const CACHE_STATIC = 'quran-radio-static-v1.3.0';
const CACHE_AUDIO = 'quran-radio-audio-10gb-v3';
const MAX_AUDIO_CACHE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB Max limit

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/icons.js',
  './js/reciters.js',
  './js/devices.js',
  './js/fallback.js',
  './js/player.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Open or initialize IndexedDB for tracking audio cache metadata & LRU timestamps
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('quran_radio_cache_db', 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('audio_cache')) {
        const store = db.createObjectStore('audio_cache', { keyPath: 'url' });
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
        store.createIndex('stationId', 'stationId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function recordAudioAccess(url, stationId, stationName, sizeBytes, isFavorite) {
  try {
    const db = await openDb();
    const tx = db.transaction('audio_cache', 'readwrite');
    const store = tx.objectStore('audio_cache');
    const existingReq = store.get(url);
    existingReq.onsuccess = () => {
      const existing = existingReq.result || {};
      store.put({
        url: url,
        stationId: stationId || existing.stationId || 0,
        stationName: stationName || existing.stationName || 'Holy Quran Radio',
        sizeBytes: sizeBytes || existing.sizeBytes || 0,
        addedAt: existing.addedAt || Date.now(),
        lastAccessed: Date.now(),
        isFavorite: isFavorite !== undefined ? isFavorite : (existing.isFavorite || false)
      });
    };
  } catch (e) {
    console.warn('[SW] recordAudioAccess error:', e);
  }
}

async function getAudioCacheMetrics() {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction('audio_cache', 'readonly');
      const store = tx.objectStore('audio_cache');
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        let totalBytes = 0;
        items.forEach(it => {
          totalBytes += (it.sizeBytes || 0);
        });
        resolve({
          totalBytes: totalBytes,
          maxBytes: MAX_AUDIO_CACHE_BYTES,
          count: items.length,
          items: items
        });
      };
      req.onerror = () => resolve({ totalBytes: 0, maxBytes: MAX_AUDIO_CACHE_BYTES, count: 0, items: [] });
    });
  } catch (e) {
    return { totalBytes: 0, maxBytes: MAX_AUDIO_CACHE_BYTES, count: 0, items: [] };
  }
}

// Refresh / Prune Unused Audio (LRU: Remove non-favorites or oldest unused)
async function refreshUnusedAudioCache(forceAggressive = false) {
  try {
    const metrics = await getAudioCacheMetrics();
    const cache = await caches.open(CACHE_AUDIO);
    const db = await openDb();

    // Sort items by lastAccessed ascending (oldest first)
    const items = metrics.items.sort((a, b) => a.lastAccessed - b.lastAccessed);

    let bytesFreed = 0;
    let itemsRemoved = 0;

    // Condition: if total exceeds 9GB (approaching 10GB limit) or forceAggressive is requested by user
    const targetBytes = MAX_AUDIO_CACHE_BYTES * 0.85; // Prune down to 85% of 10GB
    const shouldPrune = forceAggressive || metrics.totalBytes > targetBytes;

    if (shouldPrune) {
      for (const item of items) {
        // Keep favorites unless total is strictly over 10GB and we have no other choice
        if (!item.isFavorite || metrics.totalBytes - bytesFreed > MAX_AUDIO_CACHE_BYTES) {
          await cache.delete(item.url);
          const delTx = db.transaction('audio_cache', 'readwrite');
          delTx.objectStore('audio_cache').delete(item.url);

          bytesFreed += (item.sizeBytes || 0);
          itemsRemoved++;

          if (!forceAggressive && (metrics.totalBytes - bytesFreed) <= targetBytes) {
            break;
          }
        }
      }
    }

    console.log(`[SW] Refreshed unused audio cache: removed ${itemsRemoved} items, freed ${(bytesFreed / (1024 * 1024)).toFixed(2)} MB`);
    return { bytesFreed, itemsRemoved };
  } catch (err) {
    console.warn('[SW] refreshUnusedAudioCache error:', err);
    return { bytesFreed: 0, itemsRemoved: 0 };
  }
}

// Service Worker Lifecycle
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_STATIC && key !== CACHE_AUDIO).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Message Listener for Cache Management
self.addEventListener('message', async (event) => {
  if (!event.data) return;

  if (event.data.type === 'GET_CACHE_METRICS') {
    const metrics = await getAudioCacheMetrics();
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(metrics);
    }
  } else if (event.data.type === 'REFRESH_UNUSED_CACHE') {
    const result = await refreshUnusedAudioCache(true);
    const updated = await getAudioCacheMetrics();
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true, freed: result.bytesFreed, metrics: updated });
    }
  } else if (event.data.type === 'CLEAR_ALL_AUDIO_CACHE') {
    await caches.delete(CACHE_AUDIO);
    try {
      const db = await openDb();
      const tx = db.transaction('audio_cache', 'readwrite');
      tx.objectStore('audio_cache').clear();
    } catch (e) {}
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  } else if (event.data.type === 'SET_FAVORITE_STATION') {
    try {
      const db = await openDb();
      const tx = db.transaction('audio_cache', 'readwrite');
      const store = tx.objectStore('audio_cache');
      const req = store.get(event.data.url);
      req.onsuccess = () => {
        if (req.result) {
          req.result.isFavorite = event.data.isFavorite;
          store.put(req.result);
        }
      };
    } catch (e) {}
  } else if (event.data.type === 'CACHE_STATION_AUDIO') {
    // Aggressive pre-cache station audio
    const { url, stationId, stationName } = event.data;
    try {
      const cache = await caches.open(CACHE_AUDIO);
      const res = await fetch(url, { headers: { 'Range': 'bytes=0-5242880' } }); // Fetch initial 5MB chunk
      if (res.ok || res.status === 206) {
        const cloned = res.clone();
        await cache.put(url, cloned);
        const blob = await res.blob();
        await recordAudioAccess(url, stationId, stationName, blob.size, true);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, url, size: blob.size });
        }
      }
    } catch (err) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: err.message });
      }
    }
  }
});

// Helper to synthesize Range 206 response from cached 200 response
function createPartialResponse(cachedResponse, rangeHeader) {
  return cachedResponse.arrayBuffer().then((buffer) => {
    const total = buffer.byteLength;
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

    if (start >= total || end >= total) {
      return new Response('', {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: { 'Content-Range': `bytes */${total}` }
      });
    }

    const chunk = buffer.slice(start, end + 1);
    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': cachedResponse.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': chunk.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  });
}

// Fetch Interception
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Audio streams: Aggressively cache & serve for offline playback
  const isAudio = url.pathname.includes('/radio/') || 
                  url.pathname.endsWith('.mp3') || 
                  url.pathname.endsWith('.aac') || 
                  url.port === '8000' || 
                  url.port === '8002' ||
                  event.request.destination === 'audio' ||
                  url.hostname.includes('qurango.net') ||
                  url.hostname.includes('mp3quran.net/radio');

  if (isAudio) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_AUDIO);
        const rangeHeader = event.request.headers.get('range');

        // Check if we already have this audio in the cache
        const cachedResponse = await cache.match(event.request.url);

        // If offline: prioritize serving from cache immediately
        if (!navigator.onLine) {
          if (cachedResponse) {
            recordAudioAccess(event.request.url, null, null, null, undefined);
            if (rangeHeader) {
              return createPartialResponse(cachedResponse, rangeHeader);
            }
            return cachedResponse;
          }
          return new Response('Offline audio stream unavailable in cache', {
            status: 503,
            statusText: 'Offline Cache Miss'
          });
        }

        // Online: Try network first with fast background caching, or serve cache if fast
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
            // Clone and store into 10 GB audio cache
            const clone = networkResponse.clone();
            cache.put(event.request.url, clone).then(async () => {
              // Estimate size from content-length
              const cl = networkResponse.headers.get('content-length');
              const bytes = cl ? parseInt(cl, 10) : 5 * 1024 * 1024; // Default estimate 5MB per stream
              await recordAudioAccess(event.request.url, null, null, bytes, undefined);
              // Trigger LRU cleanup if approaching 10GB limit
              refreshUnusedAudioCache(false);
            }).catch(() => {});
          }
          return networkResponse;
        } catch (fetchErr) {
          // Network failed: Fallback to cached audio!
          if (cachedResponse) {
            recordAudioAccess(event.request.url, null, null, null, undefined);
            if (rangeHeader) {
              return createPartialResponse(cachedResponse, rangeHeader);
            }
            return cachedResponse;
          }
          throw fetchErr;
        }
      })()
    );
    return;
  }

  // 2. MP3Quran API: Cache first with network refresh
  if (url.hostname.includes('mp3quran.net')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Static Assets: Cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
