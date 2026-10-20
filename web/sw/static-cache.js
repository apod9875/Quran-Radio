/**
 * Strategies for the app shell.
 * - staleWhileRevalidate: app files open at once from the cache and are refreshed in the background, so a
 *   slow connection never holds the start back (a new version is precached by the new worker anyway).
 * - networkFirst: icons and the API, which must be fresh when the network answers.
 */
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

async function staleWhileRevalidate(request) {
  const network = fetch(request);
  const cached = await cachedFallback(request);
  if (cached) {
    network.then((fresh) => storeCopy(request, fresh)).catch(() => {});
    return cached;
  }
  const fresh = await network;
  storeCopy(request, fresh);
  return fresh;
}
