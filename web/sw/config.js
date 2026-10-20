/**
 * Service worker configuration.
 * Bump CACHE_STATIC whenever STATIC_ASSETS changes (a new file, a rename, a removal).
 */
const CACHE_STATIC = 'quran-radio-static-v2.1.0';
const CACHE_AUDIO = 'quran-radio-audio-v5';
const MAX_AUDIO_CACHE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

// A live stream never ends, so an offline copy is a short sample read from its start.
const MAX_CLIP_BYTES = 5 * 1024 * 1024;
const MAX_CLIP_MS = 60 * 1000;
const MIN_CLIP_BYTES = 256 * 1024;

const OFFLINE_AUDIO_PATH = /\/offline-audio\/(\d+)$/;

const STATIC_ASSETS = [
  './',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/header.css',
  './css/layout.css',
  './css/search-categories.css',
  './css/stations.css',
  './css/station-actions.css',
  './css/hero-player.css',
  './css/mobile-player.css',
  './css/toast-banner.css',
  './css/modals.css',
  './css/modal-about-timer.css',
  './css/modal-cache.css',
  './css/responsive-tablet.css',
  './css/responsive-phone.css',
  './js/core/utils.js',
  './js/core/sw-client.js',
  './js/icons.js',
  './js/devices.js',
  './js/fallback.js',
  './js/i18n/ar.js',
  './js/i18n/eng.js',
  './js/player/core.js',
  './js/player/events.js',
  './js/player/recovery.js',
  './js/player/session.js',
  './js/player/offline.js',
  './js/app/dom.js',
  './js/app/core.js',
  './js/app/pwa.js',
  './js/app/language.js',
  './js/app/stations.js',
  './js/app/extra-stations.js',
  './js/app/render-card.js',
  './js/app/render.js',
  './js/app/events.js',
  './js/app/player-ui.js',
  './js/app/cache-ui.js',
  './js/app/modals.js',
  './js/app/boot.js',
  './icons/icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STATIC_ASSETS, CACHE_STATIC, CACHE_AUDIO, OFFLINE_AUDIO_PATH };
}
