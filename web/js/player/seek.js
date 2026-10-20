/**
 * Surah files (as opposed to live radio): seeking, speed, saved position and "ended".
 * A track is a file when track.kind === 'surah'.
 */
const RATES = [1, 1.25, 1.5, 0.75];
const POSITION_SAVE_MS = 5000;

Object.assign(AudioStreamPlayer.prototype, {
  _isFile() {
    return !!this.currentStation && this.currentStation.kind === 'surah';
  },

  _bindSeekEvents() {
    const audio = this.audio;
    const emit = () => this._emitProgress();

    audio.addEventListener('loadedmetadata', () => {
      if (this._isFile() && this.pendingSeek > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(this.pendingSeek, Math.max(0, audio.duration - 2));
      }
      this.pendingSeek = 0;
      emit();
    });
    audio.addEventListener('durationchange', emit);
    audio.addEventListener('seeked', emit);
    audio.addEventListener('timeupdate', () => {
      emit();
      if (this._isFile() && Date.now() - this.lastPositionSave > POSITION_SAVE_MS) this._savePosition();
    });
  },

  progress() {
    const duration = this.audio.duration;
    return {
      current: this.audio.currentTime || 0,
      duration: this._isFile() && Number.isFinite(duration) ? duration : 0,
      seekable: this._isFile()
    };
  },

  _emitProgress() {
    const p = this.progress();
    this.listeners.progress.forEach((cb) => cb(p));
    if (p.seekable && p.duration && 'mediaSession' in navigator && navigator.mediaSession.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({ duration: p.duration, position: Math.min(p.current, p.duration), playbackRate: this.audio.playbackRate });
      } catch (e) { /* not supported */ }
    }
  },

  seek(seconds) {
    if (!this._isFile() || !Number.isFinite(this.audio.duration)) return;
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration - 0.5));
    this._savePosition();
    this._emitProgress();
  },

  seekBy(delta) {
    this.seek((this.audio.currentTime || 0) + delta);
  },

  // Speed applies to surahs only; a live stream always plays at normal speed
  cycleRate() {
    const next = RATES[(RATES.indexOf(this.rate) + 1) % RATES.length];
    this.rate = next;
    window.QRUtils.writeStorage('qr_rate', String(next));
    if (this._isFile()) {
      this.audio.defaultPlaybackRate = next;
      this.audio.playbackRate = next;
    }
    return next;
  },

  _applyRate() {
    const rate = this._isFile() ? this.rate : 1;
    this.audio.defaultPlaybackRate = rate;
    this.audio.playbackRate = rate;
  },

  _savePosition() {
    const track = this.currentStation;
    if (!this._isFile() || !track) return;
    this.lastPositionSave = Date.now();
    const { current, duration } = this.progress();
    // Near the end counts as finished: next time the surah starts from the beginning
    const value = duration && current > duration - 10 ? 0 : Math.floor(current);
    window.QRUtils.writeStorage(`qr_pos_${track.id}`, String(value));
  },

  savedPosition(trackId) {
    return parseInt(window.QRUtils.readStorage(`qr_pos_${trackId}`), 10) || 0;
  },

  // A surah reached its end: either the sleep timer stops here or the app plays the next one
  _onFileEnded() {
    this._clearWatchdog();
    const track = this.currentStation;
    window.QRUtils.writeStorage(`qr_pos_${track.id}`, '0');
    this._setState('paused');
    if (this.stopAfterTrack) {
      this.stopAfterTrack = false;
      this.sleepTimerRemaining = null;
      this._notifyTimer(null);
      this.stop();
      return;
    }
    this.listeners.ended.forEach((cb) => cb(track));
  }
});
