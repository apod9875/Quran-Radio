/** Media Session (lock screen controls) and the sleep timer. */
Object.assign(AudioStreamPlayer.prototype, {
  _updateMediaMetadata() {
    if (!('mediaSession' in navigator) || !this.currentStation) return;
    try {
      const track = this.currentStation;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name,
        artist: track.reciterName || 'صدقة جارية لـ (عبدالرحيم معبد) • Mabed',
        album: track.riwaya || 'Quran Radio',
        artwork: [
          { src: 'icons/quran-radio-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/quran-radio-192.png', sizes: '192x192', type: 'image/png' }
        ]
      });
      const session = navigator.mediaSession;
      session.setActionHandler('play', () => this.play(this.currentStation));
      session.setActionHandler('pause', () => this.pause());
      session.setActionHandler('stop', () => this.stop());
      session.setActionHandler('nexttrack', () => this.listeners.skip.forEach((cb) => cb(1)));
      session.setActionHandler('previoustrack', () => this.listeners.skip.forEach((cb) => cb(-1)));
      const file = this._isFile();
      session.setActionHandler('seekto', file ? (d) => this.seek(d.seekTime) : null);
      session.setActionHandler('seekbackward', file ? (d) => this.seekBy(-(d.seekOffset || 10)) : null);
      session.setActionHandler('seekforward', file ? (d) => this.seekBy(d.seekOffset || 10) : null);
    } catch (e) { /* some browsers reject unknown actions */ }
  },

  _updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const playback = { playing: 'playing', buffering: 'playing', paused: 'paused' };
    try {
      navigator.mediaSession.playbackState = playback[this.state] || 'none';
    } catch (e) { /* ignore */ }
  },

  // The timer counts down to an end timestamp, so throttled background timers cannot make it drift.
  // minutes: a number, null to cancel, or 'end' to stop when the current surah finishes
  setSleepTimer(minutes) {
    clearInterval(this.sleepTimerInterval);
    this.sleepTimerInterval = null;
    this.sleepTimerEndsAt = null;
    this.sleepTimerRemaining = null;
    this.stopAfterTrack = false;

    if (minutes === 'end') {
      this.stopAfterTrack = true;
      this.sleepTimerRemaining = 'end';
      this._notifyTimer('end');
      return;
    }

    if (!minutes || minutes <= 0) {
      this._notifyTimer(null);
      return;
    }

    this.sleepTimerEndsAt = Date.now() + minutes * 60 * 1000;
    this._tickSleepTimer();
    this.sleepTimerInterval = setInterval(() => this._tickSleepTimer(), 1000);
    if (!this._visibilityBound) {
      this._visibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (this.sleepTimerEndsAt) this._tickSleepTimer();
      });
    }
  },

  _tickSleepTimer() {
    if (!this.sleepTimerEndsAt) return;
    const left = Math.max(0, Math.round((this.sleepTimerEndsAt - Date.now()) / 1000));
    if (left > 0) {
      this.sleepTimerRemaining = left;
      this._notifyTimer(left);
      return;
    }
    clearInterval(this.sleepTimerInterval);
    this.sleepTimerInterval = null;
    this.sleepTimerEndsAt = null;
    this.sleepTimerRemaining = null;
    this._notifyTimer(null);
    this.stop();
  },

  _notifyTimer(seconds) {
    this.listeners.timer.forEach((cb) => cb(seconds));
  }
});
