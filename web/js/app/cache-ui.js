/** Saved page storage: what the downloaded surahs use, and clearing everything. Radios are never saved. */
Object.assign(App.prototype, {
  // The service worker is the source of truth: only files that really sit in CacheStorage count
  async refreshCacheState() {
    if (!window.QR_SW.ready()) return;
    try {
      const data = await window.QR_SW.request({ type: 'GET_CACHE_METRICS' });
      this.storageBytes = data.totalBytes || 0;
      this._syncSavedSurahs(data.items || []);
    } catch (err) {
      console.warn('[Cache] could not read cache state:', err.message);
    }
  },

  // The saved page: space used and the downloaded surahs. No limit and no quota figure is shown:
  // downloads go on until the device itself is full.
  async renderStorage() {
    let data;
    try {
      data = await window.QR_SW.request({ type: 'GET_CACHE_METRICS' });
    } catch (err) {
      data = { totalBytes: 0, items: [] }; // worker not ready yet
    }
    const totalBytes = data.totalBytes || 0;
    this.storageBytes = totalBytes;
    this._syncSavedSurahs(data.items || []);
    this.renderSavedSurahs();
    this.dom.cacheUsageText.textContent = this.formatBytes(totalBytes);
    this.dom.cacheStationsCountText.textContent = this.t.savedSurahsCount.replace('{count}', this.savedSurahs.size);
    this.dom.clearAllCacheBtn.disabled = this.savedSurahs.size === 0;
  },

  formatBytes(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  async clearAllCache() {
    const ok = await this.confirmDialog({
      title: this.t.cacheClearBtn,
      message: this.t.cacheConfirmClear,
      details: this.formatBytes(this.storageBytes),
      confirmText: this.t.deleteDownload,
      danger: true
    });
    if (!ok) return;
    try {
      await window.QR_SW.request({ type: 'CLEAR_ALL_AUDIO_CACHE' });
      this.savedSurahs.clear();
      this.storageBytes = 0;
      if (this.currentView === 'reciter') this.renderSurahs();
      this.showToast(this.t.cacheClearedToast);
      this.renderStorage();
    } catch (err) {
      console.warn('[Cache] clear failed:', err.message);
    }
  }
});
