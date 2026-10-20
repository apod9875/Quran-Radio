/** Loading a stream, stall detection, bounded retries and the offline fallback. */
// Timings live on one object so tests can shorten them (see testing/web/flows)
AudioStreamPlayer.TUNING = {
  maxRetries: 3,
  stallTimeoutMs: 7000,
  mirrorStallTimeoutMs: 4000, // stations with another mirror to fail over to
  hlsStallTimeoutMs: 15000, // HLS starts with a whole video segment (about 1 MB) before the first sound
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
    }, this._stallTimeoutMs());
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
    this._loadStream(this._firstStreamUrl(), false);
  },

  _loadStream(url, offline) {
    const token = ++this.loadToken;
    this.usingOffline = !!offline;
    this.mirrorLoadAt = offline ? 0 : performance.now();
    this.pendingSeek = this._isFile() ? this.resumeAt : 0;
    this.resumeAt = 0;
    try { this.audio.pause(); } catch (e) { /* ignore */ }
    this._destroyHls();
    this._setState('buffering');
    this._startWatchdog();
    if (!offline && this._needsHlsJs()) {
      this._playWithHlsJs(url, token);
      return;
    }
    this.audio.src = url;
    this._applyRate();
    this._playAudio(token);
  },

  _playAudio(token) {
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
      this._setState('error');
      return;
    }
    if (this._tryNextMirror()) return;

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
    // A surah continues from where it stopped
    if (this._isFile()) this.resumeAt = this.audio.currentTime || this.pendingSeek || 0;
    const base = this._firstStreamUrl(); // a retry starts again from the fastest mirror
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
    const broken = !audio.currentSrc || audio.readyState === 0 || !!audio.error
      || this.state === 'idle' || this.state === 'error';
    // A paused live stream goes stale quickly; a paused file does not
    const stale = broken || (!this._isFile()
      && (this.usingOffline || Date.now() - this.pausedAt > AudioStreamPlayer.TUNING.stalePauseMs));
    this.retryCount = 0;
    if (stale) {
      if (this._isFile()) this.resumeAt = audio.currentTime || this.savedPosition(this.currentStation.id);
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
