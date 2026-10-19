const CACHE_STATIC = 'quran-radio-static-v1.0.0';
const CACHE_AUDIO = 'quran-radio-loved-audio-cache-v1';

let MAX_AUDIO_CACHE_BYTES = 10 * 1024 * 1024 * 1024; // 10GB mobile, 20GB PC
let lovedAudioUrls = new Set();

self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data.type === 'SET_CACHE_LIMIT') {
      MAX_AUDIO_CACHE_BYTES = event.data.limitBytes;
    } else if (event.data.type === 'SET_LOVED_URLS') {
      lovedAudioUrls = new Set(event.data.urls || []);
      console.log(`[SW] Updated loved radio streams for caching: ${lovedAudioUrls.size} stations`);
    }
  }
});

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/player.js',
  './js/fallback.js',
  './manifest.json',
  './icons/icon-512.png',
  './icons/icon-192.png'
];

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

async function enforceStorageLimit() {
  const cache = await caches.open(CACHE_AUDIO);
  const requests = await cache.keys();
  if (requests.length > 300) {
    for (let i = 0; i < requests.length - 200; i++) {
      await cache.delete(requests[i]);
    }
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Audio streams: CACHE ONLY IF LOVED (Favorite)
  if (url.pathname.includes('/radio/') || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.aac') || event.request.destination === 'audio') {
    const isLoved = Array.from(lovedAudioUrls).some(lovedUrl => event.request.url.includes(lovedUrl) || lovedUrl.includes(url.pathname));

    if (!isLoved) {
      // NOT LOVED: Do NOT store in cache, stream directly from network with no offline caching storage
      event.respondWith(fetch(event.request));
      return;
    }

    // LOVED STATION: Aggressively cache for offline playback (up to 20GB PC / 10GB Mobile)
    event.respondWith(
      caches.open(CACHE_AUDIO).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
              enforceStorageLimit();
            }
          }).catch(() => {});
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
            enforceStorageLimit();
          }
          return networkResponse;
        } catch (err) {
          return new Response('Offline audio stream unavailable', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // API requests
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

  // Static assets
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
