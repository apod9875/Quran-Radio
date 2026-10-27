/** Station catalog: loading (with timeout + fallback), filtering and neighbours. */
const API_URL = 'https://www.mp3quran.net/api/v3/radios';
const FETCH_TIMEOUT_MS = 8000;
const STORED_LIST_KEY = 'qr_stations_'; // + language: the last list the API returned

Object.assign(App.prototype, {
  // A returning user sees the last list at once; the API refreshes it in the background
  async fetchStations() {
    const token = ++this.fetchToken;
    const lang = this.lang;
    const stored = this._storedRadioList(lang);
    if (stored) {
      this._showStations(stored);
      this._afterStationsShown();
    } else {
      this.dom.stationsCountBadge.textContent = this.t.loadingStations;
    }

    let list;
    try {
      list = await this._fetchRadioList(lang);
      window.QRUtils.writeStorage(STORED_LIST_KEY + lang, JSON.stringify(list));
    } catch (err) {
      if (stored) return; // keep the last list
      console.warn('[Stations] using the built-in fallback list:', err);
      list = (window.FALLBACK_STATIONS && window.FALLBACK_STATIONS[lang]) || [];
    }
    if (token !== this.fetchToken) return; // a newer language switch superseded this response
    if (stored) {
      if (JSON.stringify(list) !== JSON.stringify(stored)) this._showStations(list);
      return;
    }
    this._showStations(list);
    this._afterStationsShown();
  },

  _storedRadioList(lang) {
    try {
      const list = JSON.parse(window.QRUtils.readStorage(STORED_LIST_KEY + lang));
      return Array.isArray(list) && list.length ? list : null;
    } catch (e) {
      return null;
    }
  },

  _showStations(list) {
    this._setStations(list);
    this.renderCategories();
    this.renderStations();
    this._syncPlayingStation();
  },

  // The saved surahs must be known before a surah resumes after a refresh (it may play from the device)
  _afterStationsShown() {
    this.refreshCacheState().then(() => this.resumeAfterReload());
  },

  async _fetchRadioList(lang) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_URL}?language=${lang}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`API responded ${response.status}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.radios) || data.radios.length === 0) {
        throw new Error('API returned no stations');
      }
      return data.radios;
    } finally {
      clearTimeout(timer);
    }
  },

  _setStations(list) {
    const { normalizeArabic, categorizeStation } = window.QRUtils;
    const seen = new Set();
    this.stations = [];
    const extras = (window.QR_EXTRA_STATIONS || []).map((extra) => ({
      id: extra.id, name: extra.names[this.lang], url: extra.mirrors[0], mirrors: extra.mirrors, format: extra.format, audioOnly: extra.audioOnly, pinned: true
    }));
    [...extras, ...list].forEach((item) => {
      const id = Number(item.id);
      const name = String(item.name || '').trim();
      const url = String(item.url || '').trim();
      if (!url || seen.has(id)) return;
      seen.add(id);
      this.stations.push({
        id,
        name,
        url,
        category: item.pinned ? 'CHANNELS' : categorizeStation(url, name),
        riwaya: window.QRUtils.riwayaName(url, this.lang),
        riwayaId: window.QRUtils.riwayaId(url),
        pinned: !!item.pinned,
        mirrors: item.mirrors && item.mirrors.length > 1 ? item.mirrors.slice() : null,
        format: item.format || null,
        audioOnly: !!item.audioOnly,
        searchKey: normalizeArabic(name)
      });
    });
    this._sortStations();
    this.stationsById = new Map(this.stations.map((s) => [s.id, s]));
  },

  // Favorites first, then the pinned stations, then the rest by letters
  _sortStations() {
    this.stations = window.QRUtils.sortStations(this.stations, this.lang, this.favorites);
  },

  // After a language switch the playing station gets its name in the new language
  _syncPlayingStation() {
    const current = this.player.currentStation;
    const fresh = current && this.stationsById.get(current.id);
    if (fresh) this.player.updateStationMeta(fresh);
    this._updatePlayerUi(this.player.state, this.player.currentStation);
  },

  getFilteredStations() {
    const query = window.QRUtils.normalizeArabic(this.searchQuery);
    return this.stations.filter((s) => {
      const inCategory = this.activeCategory === 'ALL'
        || (this.activeCategory === 'FAVORITES' && this.favorites.has(s.id))
        || s.category === this.activeCategory;
      const inRiwaya = this.activeCategory !== 'RIWAYAT' || this.activeRiwaya === 'ALL' || s.riwayaId === this.activeRiwaya;
      return inCategory && inRiwaya && (!query || s.searchKey.includes(query));
    });
  },

  // Next/previous follow what the user is looking at; fall back to the full list
  neighborStation(step) {
    const current = this.player.currentStation;
    if (!current) return null;
    let list = this.getFilteredStations();
    let index = list.findIndex((s) => s.id === current.id);
    if (index === -1) {
      list = this.stations;
      index = list.findIndex((s) => s.id === current.id);
    }
    if (list.length === 0) return null;
    if (index === -1) return step > 0 ? list[0] : list[list.length - 1];
    return list[(index + step + list.length) % list.length];
  }
});
