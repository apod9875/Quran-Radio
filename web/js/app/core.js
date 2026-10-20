/**
 * App: ties the radio stations, the Quran reciters, the player and the UI together.
 * The class is assembled from small mixins (js/app/*, js/quran/*); boot.js creates the instance.
 */
class App {
  constructor() {
    const { readStorage, safeJson } = window.QRUtils;
    this.lang = readStorage('qr_lang') === 'eng' ? 'eng' : 'ar'; // Arabic by default
    this.activeCategory = 'ALL';
    this.activeRiwaya = 'ALL';
    this.searchQuery = '';
    this.stations = [];
    this.stationsById = new Map();
    this.visibleIds = [];
    this.fetchToken = 0;
    this.shownStationId = null;
    this.lastPlayerState = 'idle';
    this.deferredInstallPrompt = null;

    const savedFavorites = safeJson(readStorage('mp3quran_favs'), []);
    this.favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites.map(Number) : []);
    const favoriteReciters = safeJson(readStorage('qr_fav_reciters'), []);
    this.favoriteReciters = new Set(Array.isArray(favoriteReciters) ? favoriteReciters.map(Number) : []);
    this.quran = null;
    this.queue = null;
    this.currentView = null;

    this.dom = window.QR_cacheDom();
    this.player = new window.AudioStreamPlayer();
    this.player.getOfflineUrl = (station) => this.getOfflineUrl(station);
    this._initDownloads();
    this._bindConfirmDialog();

    this._bindEvents();
    this._setupPwa();
    this._setupCategoryDrag();
    this.applyText();
    this.fetchStations();
    this.checkOfflineStatus(!navigator.onLine);
    this._setupRouter();
  }

  get t() {
    return window.QR_I18N[this.lang];
  }

  // One InfiniteList per list container, created on first use
  listFor(name, container, renderItem) {
    this.lists = this.lists || {};
    if (!this.lists[name]) this.lists[name] = new window.InfiniteList(container, { renderItem, pageSize: 30 });
    this.lists[name].cursorText = window.QRUtils.escapeHtml(this.t.loadingMore);
    return this.lists[name];
  }

  // Same-origin URL where the service worker serves a downloaded surah; radios are never saved
  getOfflineUrl(track) {
    if (track.kind !== 'surah' || !this.isSurahSaved(track.moshafId, track.surah)) return null;
    return this.offlineSurahUrl(track.moshafId, track.surah);
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
    }
  }
}

window.App = App;
