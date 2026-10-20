/**
 * Surah downloads for real offline listening. The page streams the file into CacheStorage itself
 * (a long download would outlive a service-worker event), one at a time, with progress and cancel;
 * the service worker then records it and serves it from /offline-surah/<mushafId>/<nnn>.
 */
Object.assign(App.prototype, {
  _initDownloads() {
    this.savedSurahs = new Map();      // "mushafId:surah" -> metadata from the service worker
    this.downloadQueue = [];
    this.activeDownload = null;
    this.downloadProgress = new Map(); // "mushafId:surah" -> 0..1 (queued downloads sit at 0)
    this.storageBytes = 0;
  },

  surahKey(moshafId, surah) {
    return `${moshafId}:${surah}`;
  },

  isSurahSaved(moshafId, surah) {
    return this.savedSurahs.has(this.surahKey(moshafId, surah));
  },

  // Called with the metrics items whenever the service worker reports what is stored
  _syncSavedSurahs(items) {
    const before = new Set(this.savedSurahs.keys());
    this.savedSurahs = new Map(items.filter((i) => i.kind === 'surah').map((i) => [this.surahKey(i.moshafId, i.surah), i]));
    const changed = before.size !== this.savedSurahs.size || [...before].some((k) => !this.savedSurahs.has(k));
    if (changed && this.currentView === 'reciter') this.renderSurahs();
  },

  toggleSurahDownload(reciter, moshaf, surah) {
    const key = this.surahKey(moshaf.id, surah);
    if (this.isSurahSaved(moshaf.id, surah)) this.deleteSurahDownload(moshaf.id, surah, true);
    else if (this.downloadProgress.has(key)) this.cancelSurahDownload(key);
    else this.queueSurahDownload(reciter, moshaf, surah);
  },

  queueSurahDownload(reciter, moshaf, surah, { silent } = {}) {
    const key = this.surahKey(moshaf.id, surah);
    if (!navigator.onLine) {
      this.showToast(this.t.downloadNeedsInternet);
      return;
    }
    if (this.isSurahSaved(moshaf.id, surah) || this.downloadProgress.has(key)) return;
    const name = `${this.t.surahPrefix} ${this.surahName(surah)}`;
    this.downloadQueue.push({ key, reciter, moshaf, surah, name });
    this.downloadProgress.set(key, 0);
    if (!silent) this.showToast(this.t.downloadQueued.replace('{name}', name));
    this._onDownloadChange(moshaf.id, surah);
    this._pumpDownloads();
  },

  cancelSurahDownload(key) {
    if (this.activeDownload && this.activeDownload.key === key) {
      this.activeDownload.controller.abort();
      return;
    }
    const job = this.downloadQueue.find((j) => j.key === key);
    this.downloadQueue = this.downloadQueue.filter((j) => j.key !== key);
    this.downloadProgress.delete(key);
    if (job) this._onDownloadChange(job.moshaf.id, job.surah);
  },

  async _pumpDownloads() {
    if (this.activeDownload || !this.downloadQueue.length) return;
    const job = this.downloadQueue.shift();
    job.controller = new AbortController();
    this.activeDownload = job;
    try {
      await this._downloadSurah(job);
      this.showToast(this.t.downloadDone.replace('{name}', job.name));
    } catch (err) {
      if (err.name !== 'AbortError') this.showToast(err.userMessage || this.t.downloadFailed.replace('{name}', job.name));
    } finally {
      this.activeDownload = null;
      this.downloadProgress.delete(job.key);
      this._onDownloadChange(job.moshaf.id, job.surah);
      if (this.currentView === 'saved') this.renderStorage();
      this._pumpDownloads();
    }
  },

  async _downloadSurah(job) {
    const { reciter, moshaf, surah } = job;
    const remoteUrl = window.QRQuranModel.surahUrl(moshaf, surah);
    this.player._requestPersistentStorage(); // ask the browser not to evict what the user saves
    const response = await fetch(remoteUrl, { signal: job.controller.signal });
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
    const total = Number(response.headers.get('Content-Length')) || 0;
    await this._ensureSpace(total, job.name);

    // One copy of the stream goes into the cache, the other only counts bytes for the progress ring
    const [toCache, toCount] = response.body.tee();
    const cache = await caches.open(window.QR_STORAGE.CACHE_AUDIO);
    const key = new URL(this.offlineSurahUrl(moshaf.id, surah), document.baseURI).href;
    const type = response.headers.get('Content-Type') || 'audio/mpeg';
    const saving = cache.put(key, new Response(toCache, { headers: { 'Content-Type': type } }));

    const reader = toCount.getReader();
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      loaded += value.byteLength;
      if (total) this._setDownloadProgress(job, loaded / total);
    }
    await saving;

    const result = await window.QR_SW.request({
      type: 'RECORD_DOWNLOAD',
      moshafId: moshaf.id,
      surah,
      reciterId: reciter.id,
      reciterName: reciter.name,
      riwaya: this.moshafLabel(moshaf),
      surahName: this.surahName(surah),
      remoteUrl,
      sizeBytes: loaded
    });
    if (!result || !result.success) {
      await cache.delete(key);
      throw new Error((result && result.error) || 'Could not record the download');
    }
    this.savedSurahs.set(job.key, { kind: 'surah', moshafId: moshaf.id, surah, reciterId: reciter.id,
      reciterName: reciter.name, riwaya: this.moshafLabel(moshaf), surahName: this.surahName(surah), remoteUrl, sizeBytes: loaded });
    this.storageBytes += loaded;
  },

  async _ensureSpace(bytes, name) {
    const fail = (message) => Object.assign(new Error(message), { userMessage: message });
    if (!navigator.storage || !navigator.storage.estimate) return;
    const { quota, usage } = await navigator.storage.estimate();
    if (quota && usage !== undefined && quota - usage < bytes * 1.05) throw fail(this.t.notEnoughSpace.replace('{name}', name));
  },

  _setDownloadProgress(job, ratio) {
    this.downloadProgress.set(job.key, ratio);
    if (this.progressFrame) return;
    // Repaint at most once per frame, however fast the bytes arrive
    this.progressFrame = requestAnimationFrame(() => {
      this.progressFrame = null;
      const value = `${Math.round((this.downloadProgress.get(job.key) || 0) * 100)}%`;
      document.querySelectorAll(`[data-download-key="${job.key}"], .surah-row[data-track-id="${window.QRQuranModel.surahTrackId(job.moshaf.id, job.surah)}"] .surah-download`)
        .forEach((el) => el.style.setProperty('--p', value));
      if (this.currentView === 'saved') this.renderDownloadQueue();
    });
  },

  _onDownloadChange(moshafId, surah) {
    this.refreshSurahRow(moshafId, surah);
    if (this.currentView === 'saved') this.renderDownloadQueue();
  },

  async deleteSurahDownload(moshafId, surah, confirmFirst) {
    const name = `${this.t.surahPrefix} ${this.surahName(surah)}`;
    if (confirmFirst && !window.confirm(this.t.deleteSurahConfirm.replace('{name}', name))) return;
    try {
      await window.QR_SW.request({ type: 'DELETE_DOWNLOAD', moshafId, surah });
    } catch (err) {
      return;
    }
    const item = this.savedSurahs.get(this.surahKey(moshafId, surah));
    this.savedSurahs.delete(this.surahKey(moshafId, surah));
    if (item) this.storageBytes = Math.max(0, this.storageBytes - (item.sizeBytes || 0));
    this.refreshSurahRow(moshafId, surah);
    if (this.currentView === 'saved') this.renderStorage();
  }
});
