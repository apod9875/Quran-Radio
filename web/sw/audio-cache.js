/** Saved audio (downloaded surahs only): what is stored, clearing it, and removing old radio samples. */

// Metadata is only trusted for files that really exist in the cache; orphans are dropped.
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

async function clearAudioCache() {
  await caches.delete(CACHE_AUDIO);
  await dbClear();
}

// Radios can no longer be saved: earlier versions stored short samples at /offline-audio/<id>
async function removeLegacyRadioSamples() {
  const cache = await caches.open(CACHE_AUDIO);
  const keys = await cache.keys();
  await Promise.all(keys
    .filter((request) => request.url.includes('/offline-audio/'))
    .map(async (request) => {
      await cache.delete(request);
      await dbDelete(request.url);
    }));
}
