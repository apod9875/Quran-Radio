class AudioStreamPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.currentStation = null;
    this.state = 'idle';
    this.sleepTimerRemaining = null;
    this.sleepTimerInterval = null;
    this.listeners = {
      state: [],
      timer: []
    };

    const savedVol = localStorage.getItem('mp3quran_volume');
    this.volume = savedVol !== null ? parseFloat(savedVol) : 1.0;
    this.audio.volume = this.volume;

    this._bindAudioEvents();
    this._requestPersistentStorage();
  }

  async _requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const persisted = await navigator.storage.persist();
        console.log("Persistent storage granted:", persisted);
      } catch (e) {
        console.warn("Persistent storage request failed:", e);
      }
    }
  }

  _bindAudioEvents() {
    this.audio.addEventListener('loadstart', () => {
      this._setState('buffering');
    });

    this.audio.addEventListener('waiting', () => {
      this._setState('buffering');
    });

    this.audio.addEventListener('playing', () => {
      this._setState('playing');
    });

    this.audio.addEventListener('pause', () => {
      if (this.state !== 'buffering') {
        this._setState('paused');
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio stream error (falling back to cached stream if offline):', e);
      this._setState('error');
    });
  }

  onStateChange(callback) {
    this.listeners.state.push(callback);
  }

  onTimerTick(callback) {
    this.listeners.timer.push(callback);
  }

  _setState(state) {
    this.state = state;
    this._updateMediaSession();
    this.listeners.state.forEach(cb => cb(this.state, this.currentStation));
  }

  play(station) {
    if (!station || !station.url) return;

    if (this.currentStation && this.currentStation.id === station.id && this.state === 'paused') {
      this.audio.play().catch(e => console.warn(e));
      return;
    }

    this.currentStation = station;
    this.audio.src = station.url;
    this._setState('buffering');

    this.audio.play().catch((err) => {
      console.warn('Autoplay error:', err);
      this._setState('paused');
    });
  }

  togglePlayPause() {
    if (!this.currentStation) return;
    if (this.state === 'playing') {
      this.audio.pause();
    } else if (this.state === 'paused' || this.state === 'error') {
      this.audio.play().catch(e => console.warn(e));
    }
  }

  stop() {
    this.audio.pause();
    this.audio.src = '';
    this._setState('idle');
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audio.volume = this.volume;
    localStorage.setItem('mp3quran_volume', this.volume.toString());
  }

  setSleepTimer(minutes) {
    clearInterval(this.sleepTimerInterval);
    this.sleepTimerInterval = null;

    if (!minutes || minutes <= 0) {
      this.sleepTimerRemaining = null;
      this._notifyTimer(null);
      return;
    }

    this.sleepTimerRemaining = minutes * 60;
    this._notifyTimer(this.sleepTimerRemaining);

    this.sleepTimerInterval = setInterval(() => {
      if (this.sleepTimerRemaining > 0) {
        this.sleepTimerRemaining--;
        this._notifyTimer(this.sleepTimerRemaining);
      } else {
        clearInterval(this.sleepTimerInterval);
        this.sleepTimerInterval = null;
        this.sleepTimerRemaining = null;
        this._notifyTimer(null);
        this.stop();
      }
    }, 1000);
  }

  _notifyTimer(seconds) {
    this.listeners.timer.forEach(cb => cb(seconds));
  }

  _updateMediaSession() {
    if (!('mediaSession' in navigator) || !this.currentStation) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentStation.name,
      artist: 'صدقة جارية لـ (عبدالرحيم معبد) • Mabed',
      album: 'MP3Quran Live Radio',
      artwork: [
        { src: 'icons/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
    navigator.mediaSession.setActionHandler('stop', () => this.stop());
  }
}

window.AudioStreamPlayer = AudioStreamPlayer;
