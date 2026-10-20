/**
 * AudioStreamPlayer: HTML5 audio engine for live Quran radio streams.
 * This file holds the state machine and the public API; the behaviour lives in
 *   events.js (audio + network events), recovery.js (loading, stalls, retries, offline copy),
 *   session.js (Media Session + sleep timer) and offline.js (saving a station sample).
 *
 * States: idle | buffering | playing | paused | error
 *
 * صدقة جارية لـ (عبدالرحيم معبد) • Mabed
 */
class AudioStreamPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.setAttribute('playsinline', 'true');
    this.audio.setAttribute('webkit-playsinline', 'true');
    // Icecast live streams must be decoded without CORS enforcement
    this.audio.crossOrigin = null;

    this.currentStation = null;
    this.state = 'idle';
    this.retryCount = 0;
    this.loadToken = 0;
    this.watchdogTimer = null;
    this.retryTimer = null;
    this.pausedAt = 0;
    this.usingOffline = false;
    this.getOfflineUrl = null; // set by the app: station => same-origin URL of a saved sample, or null

    this.sleepTimerRemaining = null;
    this.sleepTimerEndsAt = null;
    this.sleepTimerInterval = null;
    this.isOffline = !navigator.onLine;

    this.listeners = { state: [], timer: [], offline: [], skip: [] };

    const savedVolume = parseFloat(window.QRUtils.readStorage('mp3quran_volume'));
    this.volume = Number.isFinite(savedVolume) ? Math.max(0, Math.min(1, savedVolume)) : 1;
    this.audio.volume = this.volume;

    this._bindAudioEvents();
    this._bindNetworkEvents();
  }

  onStateChange(callback) { this.listeners.state.push(callback); }
  onTimerTick(callback) { this.listeners.timer.push(callback); }
  onOfflineChange(callback) { this.listeners.offline.push(callback); }
  onSkip(callback) { this.listeners.skip.push(callback); }

  _setState(state) {
    this.state = state;
    this._updateMediaSession();
    this.listeners.state.forEach((cb) => cb(this.state, this.currentStation));
  }

  // Start a station, or resume the current one when it is paused, stopped or in error.
  play(station) {
    if (!station || !station.url) return;
    const same = this.currentStation && this.currentStation.id === station.id;
    if (same && (this.state === 'buffering' || this.state === 'playing')) return;

    this._cancelPending();
    if (same) {
      this._resumeCurrent();
      return;
    }

    this.currentStation = station;
    this.retryCount = 0;
    this._updateMediaMetadata();
    this._startStation();
  }

  pause() {
    if (!this.currentStation) return;
    this._cancelPending();
    this.pausedAt = Date.now();
    try { this.audio.pause(); } catch (e) { /* element already torn down */ }
    this._setState('paused');
  }

  togglePlayPause() {
    if (!this.currentStation) return;
    if (this.state === 'playing' || this.state === 'buffering') this.pause();
    else this.play(this.currentStation);
  }

  stop() {
    this._cancelPending();
    this.usingOffline = false;
    this.audio.loop = false;
    try {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    } catch (e) { /* element already torn down */ }
    this._setState('idle');
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
    window.QRUtils.writeStorage('mp3quran_volume', String(this.volume));
  }

  // The station list is re-fetched when the language changes; keep the playing station's name fresh.
  updateStationMeta(station) {
    if (!station || !this.currentStation || station.id !== this.currentStation.id) return;
    this.currentStation = station;
    this._updateMediaMetadata();
  }
}

window.AudioStreamPlayer = AudioStreamPlayer;
