/** Offline audio samples: read a short clip of a live stream, store it, report and prune. */
function offlineKey(stationId) {
  return new Request(`${self.registration.scope}offline-audio/${stationId}`);
}

// Read the stream ourselves up to a byte or time budget, then cancel. Live streams never end.
async function readStreamClip(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAX_CLIP_MS);
  const chunks = [];
  let size = 0;
  let type = 'audio/mpeg';

  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    type = res.headers.get('Content-Type') || type;
    const reader = res.body.getReader();
    while (size < MAX_CLIP_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    reader.cancel().catch(() => {});
  } catch (err) {
    // The time budget aborting a healthy stream is fine as long as we kept enough audio.
    if (!(err && err.name === 'AbortError' && size >= MIN_CLIP_BYTES)) throw err;
  } finally {
    clearTimeout(timer);
  }

  if (size === 0) throw new Error('Empty stream');
  return { blob: new Blob(chunks, { type }), type };
}

async function precacheStation({ url, stationId, stationName }) {
  try {
    const clip = await readStreamClip(url);
    const key = offlineKey(stationId);
    const cache = await caches.open(CACHE_AUDIO);
    await cache.put(key, new Response(clip.blob, {
      status: 200,
      headers: {
        'Content-Type': clip.type,
        'Content-Length': String(clip.blob.size),
        'Accept-Ranges': 'bytes'
      }
    }));
    await dbPutClip({
      url: key.url,
      stationId,
      stationName: stationName || 'Holy Quran Radio',
      sizeBytes: clip.blob.size,
      addedAt: Date.now(),
      lastAccessed: Date.now()
    });
    return { success: true, stationId, size: clip.blob.size };
  } catch (err) {
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
}

// Metadata is only trusted for clips that really exist in the cache; orphans are dropped.
async function getAudioCacheMetrics() {
  const [records, cache] = await Promise.all([dbGetAll(), caches.open(CACHE_AUDIO)]);
  const present = new Set((await cache.keys()).map((req) => req.url));
  const items = [];
  records.forEach((record) => {
    if (present.has(record.url)) items.push(record);
    else dbDelete(record.url);
  });
  const totalBytes = items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  return { totalBytes, count: items.length, items };
}

// Only the user removes what they saved: one station sample at a time, or everything
async function deleteStationSample({ stationId }) {
  const key = offlineKey(stationId).url;
  const cache = await caches.open(CACHE_AUDIO);
  await cache.delete(key);
  await dbDelete(key);
  return { success: true };
}

async function clearAudioCache() {
  await caches.delete(CACHE_AUDIO);
  await dbClear();
}

// Serve a stored sample (with range support) at the same-origin /offline-audio/<id> URL.
async function serveOfflineAudio(request, stationId) {
  const cache = await caches.open(CACHE_AUDIO);
  const cached = await cache.match(offlineKey(stationId));
  if (!cached) return new Response('No offline copy of this station', { status: 404 });
  const range = request.headers.get('range');
  return range ? createPartialResponse(cached, range) : cached;
}
