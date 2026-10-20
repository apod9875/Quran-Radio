/** Audio element and network events. */
Object.assign(AudioStreamPlayer.prototype, {
  _isActive() {
    return !!this.currentStation && this.state !== 'idle';
  },

  _isStreaming() {
    return this.state === 'playing' || this.state === 'buffering';
  },

  _bindAudioEvents() {
    const audio = this.audio;

    audio.addEventListener('waiting', () => {
      if (this.state !== 'playing' && this.state !== 'buffering') return;
      this._setState('buffering');
      this._startWatchdog();
    });

    audio.addEventListener('canplay', () => {
      this._clearWatchdog();
      if (this.state === 'buffering') audio.play().catch(() => {});
    });

    audio.addEventListener('playing', () => {
      if (!this._isActive()) return;
      this._clearWatchdog();
      this.retryCount = 0;
      this._setState('playing');
    });

    // The OS or a headset paused us (our own pause() already moved the state to 'paused')
    audio.addEventListener('pause', () => {
      if (this.state !== 'playing') return;
      this._clearWatchdog();
      this.pausedAt = Date.now();
      this._setState('paused');
    });

    // A live stream "ending" means the server dropped the connection
    audio.addEventListener('ended', () => {
      if (this._isStreaming() && !this.usingOffline) this._handleStreamFailure('ended');
    });

    audio.addEventListener('error', () => {
      if (!this._isStreaming()) return;
      console.warn('[Audio] stream error', audio.error && audio.error.code);
      this._handleStreamFailure('error');
    });
  },

  _bindNetworkEvents() {
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.listeners.offline.forEach((cb) => cb(false));
      if (!this.currentStation) return;
      const wasPlaying = this.state === 'playing' || this.state === 'buffering';
      if (this.usingOffline && wasPlaying) {
        this._cancelPending();
        this.retryCount = 0;
        this._startStation();
      } else if (this.state === 'error') {
        this.play(this.currentStation);
      }
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.listeners.offline.forEach((cb) => cb(true));
      const wasPlaying = this.state === 'playing' || this.state === 'buffering';
      if (wasPlaying && !this.usingOffline) {
        this._cancelPending();
        if (!this._tryOfflineCopy()) this._setState('error');
      }
    });
  }
});
