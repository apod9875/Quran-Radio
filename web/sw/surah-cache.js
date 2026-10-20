/**
 * Downloaded surahs. The page streams the file into CacheStorage itself (a long download would
 * outlive a service-worker event); the worker records it, serves it with Range support and deletes it.
 */
function offlineSurahKey(moshafId, surah) {
  return new Request(self.registration.scope + QR_STORAGE.offlineSurahPath(moshafId, surah));
}

async function serveOfflineSurah(request, moshafId, surah) {
  const cache = await caches.open(CACHE_AUDIO);
  const cached = await cache.match(offlineSurahKey(moshafId, surah));
  if (!cached) return new Response('This surah is not downloaded', { status: 404 });
  const range = request.headers.get('range');
  return range ? createPartialResponse(cached, range) : cached;
}

async function recordDownload(meta) {
  const key = offlineSurahKey(meta.moshafId, meta.surah).url;
  const cache = await caches.open(CACHE_AUDIO);
  if (!(await cache.match(key))) return { success: false, error: 'The file is not in the cache' };
  await dbPutClip({
    url: key,
    kind: 'surah',
    reciterId: meta.reciterId,
    reciterName: meta.reciterName,
    moshafId: meta.moshafId,
    riwaya: meta.riwaya,
    surah: meta.surah,
    surahName: meta.surahName,
    remoteUrl: meta.remoteUrl,
    sizeBytes: meta.sizeBytes,
    addedAt: Date.now(),
    lastAccessed: Date.now()
  });
  return { success: true };
}

async function deleteDownload({ moshafId, surah }) {
  const key = offlineSurahKey(moshafId, surah).url;
  const cache = await caches.open(CACHE_AUDIO);
  await cache.delete(key);
  await dbDelete(key);
  return { success: true };
}
