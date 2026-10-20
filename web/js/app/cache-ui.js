/** Offline samples: saving a station, the saved page, and keeping the "saved" badges truthful. */
Object.assign(App.prototype, {
  // The service worker is the source of truth: only clips that really sit in CacheStorage count
  async refreshCacheState() {
    if (!window.QR_SW.ready()) return;
    try {
      const data = await window.QR_SW.request({ type: 'GET_CACHE_METRICS' });
      this.storageBytes = data.totalBytes || 0;
      this._syncSavedSurahs(data.items || []);
      const items = (data.items || []).filter((item) => item.kind !== 'surah');
      const ids = new Set(items.map((item) => item.stationId));
      const changed = ids.size !== this.cachedIds.size || [...ids].some((id) => !this.cachedIds.has(id));
      this.cachedIds = ids;
      if (changed) this.renderStations();
      this._showSavedWhenOffline();
    } catch (err) {
      console.warn('[Cache] could not read cache state:', err.message);
    }
  },

  // Without a connection only saved stations can play, so open that tab once (the user can leave it)
  _showSavedWhenOffline() {
    if (navigator.onLine || this.autoOfflineShown || this.activeCategory !== 'ALL' || this.cachedIds.size === 0) return;
    this.autoOfflineShown = true;
    this.activeCategory = 'OFFLINE';
    this.renderCategories();
    this.renderStations();
  },

  async precacheStation(station) {
    if (!navigator.onLine) {
      this.showToast(this.t.precacheOfflineToast);
      return;
    }
    if (this.precaching.has(station.id)) return;
    this.precaching.add(station.id);
    const button = this.dom.stationsContainer
      .querySelector(`.station-card[data-id="${station.id}"] [data-action="precache"]`);
    if (button) {
      button.innerHTML = window.SvgIcons.spinner(18);
      button.disabled = true;
    }
    this.showToast(this.t.precacheBusyToast);

    try {
      await this.player.precacheStation(station);
      this.cachedIds.add(station.id);
      this.showToast(this.t.precacheSuccessToast);
    } catch (err) {
      console.warn('[Cache] precache failed:', err.message);
      this.showToast(this.t.precacheFailToast);
    } finally {
      this.precaching.delete(station.id);
      if (this.activeCategory === 'OFFLINE') this.renderStations();
      else this.refreshCard(station.id);
    }
  },

  // The saved page: storage bar, saved radio samples and downloaded surahs
  async renderStorage() {
    let data;
    try {
      data = await window.QR_SW.request({ type: 'GET_CACHE_METRICS' });
    } catch (err) {
      data = { totalBytes: 0, items: [] }; // worker not ready yet: still show the free space
    }
    const { escapeHtml } = window.QRUtils;
    const t = this.t;
    const totalBytes = data.totalBytes || 0;
    this.storageBytes = totalBytes;
    this._syncSavedSurahs(data.items || []);
    this.renderSavedSurahs();
    await this._renderStorageBar(totalBytes);
    const items = (data.items || []).filter((item) => item.kind !== 'surah');
    this.dom.cacheStationsCountText.textContent = `${t.savedSurahsCount.replace('{count}', this.savedSurahs.size)} · ${t.cacheStationsCount.replace('{count}', items.length)}`;

    const locale = this.lang === 'ar' ? 'ar-EG' : 'en-US';
    this.listFor('savedStations', this.dom.cachedStationsList, (item) => {
      const time = new Date(item.lastAccessed).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="cached-item-row" data-station-id="${item.stationId}" role="button" tabindex="0">
          <span class="cached-item-name">${escapeHtml(item.stationName || 'Quran Radio')}</span>
          <span class="cached-item-meta"><span class="ltr-run">${this.formatBytes(item.sizeBytes || 0)}</span><span>${escapeHtml(time)}</span></span>
          <button type="button" class="btn-card-action" data-action="delete-sample" aria-label="${escapeHtml(t.deleteDownload)}" title="${escapeHtml(t.deleteDownload)}">${window.SvgIcons.trash(16)}</button>
        </div>`;
    }).setItems(items, { emptyHtml: `<div class="cached-empty">${escapeHtml(t.cacheEmpty)}</div>` });
  },

  formatBytes(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  // No app limit: the bar shows what the saved audio uses next to the free space on the device
  async _renderStorageBar(totalBytes) {
    let estimate = {};
    try {
      if (navigator.storage && navigator.storage.estimate) estimate = await navigator.storage.estimate();
    } catch (e) { /* not available */ }
    const free = estimate.quota && estimate.usage !== undefined ? Math.max(0, estimate.quota - estimate.usage) : null;
    const pct = estimate.quota ? Math.min(100, (totalBytes / estimate.quota) * 100) : 0;
    this.dom.cacheUsageText.textContent = this.formatBytes(totalBytes);
    this.dom.cacheProgressBar.style.width = `${Math.max(pct, totalBytes ? 1 : 0)}%`;
    this.dom.storageFreeText.textContent = free === null ? '' : this.t.storageFree.replace('{size}', this.formatBytes(free));
    this.dom.storageFreeText.hidden = free === null;
  },

  async deleteStationSample(stationId) {
    if (!window.confirm(this.t.deleteSampleConfirm)) return;
    try {
      await window.QR_SW.request({ type: 'DELETE_STATION_SAMPLE', stationId });
    } catch (err) {
      return;
    }
    this.cachedIds.delete(stationId);
    this.refreshCard(stationId);
    if (this.activeCategory === 'OFFLINE') this.renderStations();
    this.showToast(this.t.deletedToast);
    this.renderStorage();
  },

  async clearAllCache() {
    if (!window.confirm(this.t.cacheConfirmClear)) return;
    try {
      await window.QR_SW.request({ type: 'CLEAR_ALL_AUDIO_CACHE' });
      this.cachedIds.clear();
      this.savedSurahs.clear();
      this.storageBytes = 0;
      if (this.currentView === 'reciter') this.renderSurahs();
      this.showToast(this.t.cacheClearedToast);
      this.renderStorage();
      this.renderStations();
    } catch (err) {
      console.warn('[Cache] clear failed:', err.message);
    }
  }
});
