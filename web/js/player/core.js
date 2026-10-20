/**
 * AudioStreamPlayer: HTML5 audio engine for live Quran radio streams and surah files.
 * This file holds the state machine and the public API; the behaviour lives in
 *   events.js (audio + network events), recovery.js (loading, stalls, retries, offline copy),
 *   session.js (Media Session + sleep timer), mirrors.js (fastest mirror + failover), hls.js (HLS live) and
 *   seek.js (surah files: seeking, speed, saved position, end of track).
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
    this.hls = null;
    this.mirrorOrder = null; // see mirrors.js
    this.mirrorIndex = 0;
    this.mirrorLoadAt = 0;
    this.errorReason = null;
    this.resumeAt = 0; // seconds to start the next surah at (set by the app before play())
    this.pendingSeek = 0;
    this.lastPositionSave = 0;
    this.stopAfterTrack = false;
    const savedRate = parseFloat(window.QRUtils.readStorage('qr_rate'));
    this.rate = [1, 1.25, 1.5, 0.75].includes(savedRate) ? savedRate : 1;
    this.getOfflineUrl = null; // set by the app: track => same-origin URL of a downloaded surah, or null

    this.sleepTimerRemaining = null;
    this.sleepTimerEndsAt = null;
    this.sleepTimerInterval = null;
    this.isOffline = !navigator.onLine;

    this.listeners = { state: [], timer: [], offline: [], skip: [], volume: [], progress: [], ended: [] };

    const savedVolume = parseFloat(window.QRUtils.readStorage('mp3quran_volume'));
    this.volume = Number.isFinite(savedVolume) ? Math.max(0, Math.min(1, savedVolume)) : 1;
    this.lastVolume = this.volume > 0 ? this.volume : 0.5;
    this.muted = window.QRUtils.readStorage('mp3quran_muted') === '1';
    this.audio.volume = this.volume;
    this.audio.muted = this.muted;
    this.supportsVolume = this._detectVolumeSupport();

    this._bindAudioEvents();
    this._bindSeekEvents();
    this._bindNetworkEvents();
  }

  onStateChange(callback) { this.listeners.state.push(callback); }
  onTimerTick(callback) { this.listeners.timer.push(callback); }
  onOfflineChange(callback) { this.listeners.offline.push(callback); }
  onSkip(callback) { this.listeners.skip.push(callback); }
  onVolumeChange(callback) { this.listeners.volume.push(callback); }
  onProgress(callback) { this.listeners.progress.push(callback); }
  onEnded(callback) { this.listeners.ended.push(callback); }

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
    this.usingOffline = false; // the device copy of the previous track says nothing about this one
    this._updateMediaMetadata();
    this._startStation();
  }

  pause() {
    if (!this.currentStation) return;
    this._cancelPending();
    if (this._isFile()) this._savePosition();
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
    this._destroyHls();
    try {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    } catch (e) { /* element already torn down */ }
    this._setState('idle');
  }

  // iOS Safari ignores audio.volume (the hardware buttons control the sound), so the UI hides itself there
  _detectVolumeSupport() {
    try {
      const previous = this.audio.volume;
      this.audio.volume = 0.5;
      const works = Math.abs(this.audio.volume - 0.5) < 0.01;
      this.audio.volume = previous;
      return works;
    } catch (e) {
      return false;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.volume > 0) {
      this.lastVolume = this.volume;
      this.muted = false;
    }
    this._applyVolume();
  }

  // Mute keeps the slider position; unmuting from a zero level restores the last audible one
  toggleMute() {
    if (this.muted || this.volume === 0) {
      this.muted = false;
      if (this.volume === 0) this.volume = this.lastVolume;
    } else {
      this.muted = true;
    }
    this._applyVolume();
  }

  _applyVolume() {
    this.audio.volume = this.volume;
    this.audio.muted = this.muted;
    window.QRUtils.writeStorage('mp3quran_volume', String(this.volume));
    window.QRUtils.writeStorage('mp3quran_muted', this.muted ? '1' : '0');
    this.listeners.volume.forEach((cb) => cb(this.volume, this.muted));
  }

  // The station list is re-fetched when the language changes; keep the playing station's name fresh.
  updateStationMeta(station) {
    if (!station || !this.currentStation || station.id !== this.currentStation.id) return;
    this.currentStation = station;
    this._updateMediaMetadata();
  }
}

window.AudioStreamPlayer = AudioStreamPlayer;
