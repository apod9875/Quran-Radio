/** Offline samples: saving a station, the cache modal, and keeping the "saved" badges truthful. */
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

      items.forEach((item) => {
        const wanted = this.favorites.has(item.stationId);
        if (!!item.isFavorite !== wanted) {
          window.QR_SW.post({ type: 'SET_FAVORITE_STATION', stationId: item.stationId, isFavorite: wanted });
        }
      });
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
      await this.player.precacheStation(station, this.favorites.has(station.id));
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
      return;
    }
    const { escapeHtml } = window.QRUtils;
    const t = this.t;
    const totalBytes = data.totalBytes || 0;
    this.storageBytes = totalBytes;
    this._syncSavedSurahs(data.items || []);
    this.renderSavedSurahs();
    const mb = (totalBytes / (1024 * 1024)).toFixed(1);
    const gb = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const pct = Math.min(100, (totalBytes / data.maxBytes) * 100).toFixed(1);

    this.dom.cacheUsageText.textContent = `${mb} MB (${gb} GB) / 10.0 GB (${pct}%)`;
    this.dom.cacheProgressBar.style.width = `${pct}%`;
    const items = (data.items || []).filter((item) => item.kind !== 'surah');
    this.dom.cacheStationsCountText.textContent = `${t.savedSurahsCount.replace('{count}', this.savedSurahs.size)} · ${t.cacheStationsCount.replace('{count}', items.length)}`;

    if (items.length === 0) {
      this.dom.cachedStationsList.innerHTML = `<div class="cached-empty">${escapeHtml(t.cacheEmpty)}</div>`;
      return;
    }
    const locale = this.lang === 'ar' ? 'ar-EG' : 'en-US';
    this.dom.cachedStationsList.innerHTML = items.map((item) => {
      const size = (item.sizeBytes / (1024 * 1024)).toFixed(1);
      const time = new Date(item.lastAccessed).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="cached-item-row" data-station-id="${item.stationId}" role="button" tabindex="0">
          <span class="cached-item-name">${escapeHtml(item.stationName || 'Holy Quran Radio')}</span>
          <span class="cached-item-meta"><span class="ltr-run">${size} MB</span><span>${escapeHtml(time)}</span></span>
        </div>`;
    }).join('');
  },

  async refreshUnusedCache() {
    try {
      const result = await window.QR_SW.request({ type: 'REFRESH_UNUSED_CACHE' });
      if (!result || !result.success) return;
      const freed = (result.freed / (1024 * 1024)).toFixed(1);
      this.showToast(`${this.t.cacheRefreshedToast} (${freed} MB)`);
      this.renderStorage();
      this.refreshCacheState();
    } catch (err) {
      console.warn('[Cache] refresh failed:', err.message);
    }
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
