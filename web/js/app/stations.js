/** Station catalog: loading (with timeout + fallback), filtering and neighbours. */
const API_URL = 'https://www.mp3quran.net/api/v3/radios';
const FETCH_TIMEOUT_MS = 8000;

Object.assign(App.prototype, {
  async fetchStations() {
    const token = ++this.fetchToken;
    const lang = this.lang;
    this.dom.stationsCountBadge.textContent = this.t.loadingStations;

    let list;
    try {
      list = await this._fetchRadioList(lang);
    } catch (err) {
      console.warn('[Stations] using the built-in fallback list:', err);
      list = (window.FALLBACK_STATIONS && window.FALLBACK_STATIONS[lang]) || [];
    }
    if (token !== this.fetchToken) return; // a newer language switch superseded this response

    this._setStations(list);
    this.renderCategories();
    this.renderStations();
    this._syncPlayingStation();
    this.refreshCacheState();
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
      id: extra.id, name: extra.names[this.lang], url: extra.url, pinned: !!extra.pinned
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
        category: categorizeStation(url, name),
        riwaya: window.QRUtils.riwayaName(url, this.lang),
        riwayaId: window.QRUtils.riwayaId(url),
        pinned: !!item.pinned,
        searchKey: normalizeArabic(name)
      });
    });
    this.stations = window.QRUtils.sortStations(this.stations, this.lang);
    this.stationsById = new Map(this.stations.map((s) => [s.id, s]));
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
        || (this.activeCategory === 'FAVORITES' ? this.favorites.has(s.id) : s.category === this.activeCategory);
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
