/** Loading a stream, stall detection, bounded retries and the offline fallback. */
// Timings live on one object so tests can shorten them (see testing/web/flows)
AudioStreamPlayer.TUNING = {
  maxRetries: 3,
  stallTimeoutMs: 7000,
  retryDelayMs: 1000,
  stalePauseMs: 20000
};

Object.assign(AudioStreamPlayer.prototype, {
  _cancelPending() {
    this._clearWatchdog();
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.loadToken++;
  },

  _clearWatchdog() {
    clearTimeout(this.watchdogTimer);
    this.watchdogTimer = null;
  },

  // A stream that stays in "buffering" counts as a failed attempt, so it can never loop forever.
  _startWatchdog() {
    this._clearWatchdog();
    const token = this.loadToken;
    this.watchdogTimer = setTimeout(() => {
      if (token === this.loadToken && this.state === 'buffering') this._handleStreamFailure('stall');
    }, AudioStreamPlayer.TUNING.stallTimeoutMs);
  },

  _startStation() {
    this.errorReason = null;
    if (!navigator.onLine) {
      if (this._tryOfflineCopy()) return;
      // Nothing to play without a connection: say so now instead of spinning through retries
      this.errorReason = 'offline-unsaved';
      this._setState('error');
      return;
    }
    this._loadStream(this.currentStation.url, false);
  },

  _loadStream(url, offline) {
    const token = ++this.loadToken;
    this.usingOffline = !!offline;
    this.audio.loop = !!offline;
    try { this.audio.pause(); } catch (e) { /* ignore */ }
    this.audio.src = url;
    this._setState('buffering');
    this._startWatchdog();

    const attempt = this.audio.play();
    if (attempt && attempt.catch) {
      attempt.catch((err) => {
        if (token !== this.loadToken) return;
        if (err && err.name === 'AbortError') return;
        if (err && err.name === 'NotAllowedError') {
          this._cancelPending();
          this._setState('paused');
          return;
        }
        this._handleStreamFailure('play-rejected');
      });
    }
  },

  _handleStreamFailure(reason) {
    this._clearWatchdog();
    if (!this.currentStation) return;

    if (this.usingOffline) {
      this.usingOffline = false;
      this.audio.loop = false;
      this._setState('error');
      return;
    }

    if (this.retryCount < AudioStreamPlayer.TUNING.maxRetries) {
      this.retryCount++;
      this._setState('buffering');
      const token = this.loadToken;
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => {
        if (token === this.loadToken) this._retryStream();
      }, AudioStreamPlayer.TUNING.retryDelayMs * this.retryCount);
      return;
    }

    console.warn(`[Audio] giving up after ${AudioStreamPlayer.TUNING.maxRetries} retries (${reason})`);
    if (!this._tryOfflineCopy()) this._setState('error');
  },

  // A cache-busting query resets the mobile TCP socket without changing the stream
  _retryStream() {
    if (!this.currentStation) return;
    const base = this.currentStation.url;
    this._loadStream(`${base}${base.includes('?') ? '&' : '?'}t=${Date.now()}`, false);
  },

  _tryOfflineCopy() {
    const station = this.currentStation;
    const url = station && this.getOfflineUrl ? this.getOfflineUrl(station) : null;
    if (!url || this.usingOffline) return false;
    this._loadStream(url, true);
    return true;
  },

  // Resume after pause/stop/error; reload when the old connection is likely dead
  _resumeCurrent() {
    const audio = this.audio;
    const stale = !audio.currentSrc || audio.readyState === 0 || !!audio.error
      || this.state === 'idle' || this.state === 'error' || this.usingOffline
      || Date.now() - this.pausedAt > AudioStreamPlayer.TUNING.stalePauseMs;
    this.retryCount = 0;
    if (stale) {
      this._startStation();
      return;
    }
    const token = ++this.loadToken;
    this._setState('buffering');
    this._startWatchdog();
    audio.play().catch(() => {
      if (token === this.loadToken) this._startStation();
    });
  }
});
