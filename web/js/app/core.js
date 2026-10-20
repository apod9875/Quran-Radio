/**
 * App: ties the station catalog, the player and the UI together.
 * The class is assembled from small mixins (pwa, language, stations, render, events,
 * player-ui, cache-ui, modals); boot.js creates the instance.
 */
class App {
  constructor() {
    const { readStorage, safeJson } = window.QRUtils;
    this.lang = readStorage('mp3quran_lang') === 'eng' ? 'eng' : 'ar';
    this.activeCategory = 'ALL';
    this.activeRiwaya = 'ALL';
    this.searchQuery = '';
    this.stations = [];
    this.stationsById = new Map();
    this.visibleIds = [];
    this.fetchToken = 0;
    this.cachedIds = new Set();
    this.precaching = new Set();
    this.autoOfflineShown = false;
    this.shownStationId = null;
    this.lastPlayerState = 'idle';
    this.deferredInstallPrompt = null;

    const savedFavorites = safeJson(readStorage('mp3quran_favs'), []);
    this.favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites.map(Number) : []);

    this.dom = window.QR_cacheDom();
    this.player = new window.AudioStreamPlayer();
    this.player.getOfflineUrl = (station) => this.getOfflineUrl(station);

    this._bindEvents();
    this._setupPwa();
    this._setupCategoryDrag();
    this.applyLanguage(this.lang);
    this.fetchStations();
    this.checkOfflineStatus(!navigator.onLine);
  }

  get t() {
    return window.QR_I18N[this.lang];
  }

  // Same-origin URL where the service worker serves a saved sample of this station
  getOfflineUrl(station) {
    return this.cachedIds.has(station.id) ? `offline-audio/${station.id}` : null;
  }

  showToast(message) {
    const toast = this.dom.toast;
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  checkOfflineStatus(isOffline) {
    const banner = this.dom.offlineBanner;
    if (!banner) return;
    banner.style.display = isOffline ? 'block' : 'none';
    document.body.classList.toggle('is-offline', isOffline);
    if (isOffline) {
      this.dom.offlineBannerText.textContent = this.t.offlineNotice;
      this._showSavedWhenOffline();
    }
  }
}

window.App = App;
