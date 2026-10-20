/** Strategies for the app shell: fresh from the network first, the cache only as a fallback. */
const NETWORK_TIMEOUT_MS = 4000;
const API_TIMEOUT_MS = 8000;

function storeCopy(request, response) {
  if (!response || !response.ok) return;
  const copy = response.clone();
  caches.open(CACHE_STATIC).then((cache) => cache.put(request, copy)).catch(() => {});
}

async function cachedFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  // Not './index.html': a server redirect there would make a cached copy unusable for navigations.
  return request.mode === 'navigate' ? caches.match('./') : undefined;
}

async function networkFirst(request, timeoutMs = NETWORK_TIMEOUT_MS) {
  const network = fetch(request);
  const slow = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
  try {
    const fast = await Promise.race([network, slow]);
    if (fast) {
      storeCopy(request, fast);
      return fast;
    }
    // Network is slow: use the cache when there is one, otherwise keep waiting for the network.
    const cached = await cachedFallback(request);
    if (cached) {
      network.then((late) => storeCopy(request, late)).catch(() => {});
      return cached;
    }
    const late = await network;
    storeCopy(request, late);
    return late;
  } catch (err) {
    const cached = await cachedFallback(request);
    if (cached) return cached;
    throw err;
  }
}

// Icons never change under the same name, so serving them from the cache is safe and fast.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  storeCopy(request, response);
  return response;
}
