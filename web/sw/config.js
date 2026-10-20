/**
 * Service worker configuration.
 * Bump CACHE_STATIC whenever STATIC_ASSETS changes (a new file, a rename, a removal).
 */
const CACHE_STATIC = 'quran-radio-static-v3.7.1';

// Shared with the page (js/core/storage-names.js); Node tests load it with require
const STORAGE_NAMES = (typeof self !== 'undefined' && self.QR_STORAGE) || require('../js/core/storage-names.js');
const CACHE_AUDIO = STORAGE_NAMES.CACHE_AUDIO;

const OFFLINE_SURAH_PATH = /\/offline-surah\/(\d+)\/(\d{3})$/;

const STATIC_ASSETS = [
  './',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/header.css',
  './css/layout.css',
  './css/search-categories.css',
  './css/riwaya-filter.css',
  './css/stations.css',
  './css/station-actions.css',
  './css/hero-player.css',
  './css/volume.css',
  './css/mobile-player.css',
  './css/toast-banner.css',
  './css/modals.css',
  './css/confirm.css',
  './css/update-banner.css',
  './css/whats-new.css',
  './css/modal-about-timer.css',
  './css/storage.css',
  './css/bottom-nav.css',
  './css/progress.css',
  './css/reciters.css',
  './css/reciter.css',
  './css/saved.css',
  './css/responsive-tablet.css',
  './css/responsive-phone.css',
  './js/core/storage-names.js',
  './js/core/utils.js',
  './js/core/sw-client.js',
  './js/core/infinite-list.js',
  './js/icons.js',
  './js/devices.js',
  './js/fallback.js',
  './js/i18n/ar.js',
  './js/i18n/eng.js',
  './js/player/core.js',
  './js/player/events.js',
  './js/player/recovery.js',
  './js/player/session.js',
  './js/player/mirrors.js',
  './js/player/hls.js',
  './js/player/seek.js',
  './js/app/dom.js',
  './js/app/core.js',
  './js/app/pwa.js',
  './js/app/language.js',
  './js/app/stations.js',
  './js/app/extra-stations.js',
  './js/app/render-card.js',
  './js/app/render.js',
  './js/app/riwaya-filter.js',
  './js/app/events.js',
  './js/app/player-ui.js',
  './js/app/volume-ui.js',
  './js/app/cache-ui.js',
  './js/app/modals.js',
  './js/app/confirm-dialog.js',
  './js/app/progress-ui.js',
  './js/app/saved-view.js',
  './js/app/router.js',
  './js/app/resume.js',
  './js/app/updates.js',
  './js/app/releases.js',
  './js/app/whats-new.js',
  './js/quran/model.js',
  './js/quran/catalog.js',
  './js/quran/reciters-view.js',
  './js/quran/reciter-view.js',
  './js/quran/surah-player.js',
  './js/quran/downloads.js',
  './js/quran/download-confirm.js',
  './js/app/boot.js',
  './icons/quran-radio-192.png',
  './icons/quran-radio-512.png',
  './icons/quran-radio-maskable-512.png',
  './icons/quran-radio-32.png',
  './icons/quran-radio-apple-180.png'
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STATIC_ASSETS, CACHE_STATIC, CACHE_AUDIO, OFFLINE_SURAH_PATH };
}
