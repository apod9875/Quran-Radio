/**
 * AudioStreamPlayer with Aggressive 10 GB Offline Audio Caching Support
 * Features:
 * - HTML5 Audio Engine with automatic buffering & error recovery
 * - Offline Playback capability with Service Worker CacheStorage
 * - Storage Quota Estimation & Persistent Storage Request
 * - Sleep Timer & MediaSession API
 * 
 * صدقة جارية لـ (عبدالرحيم معبد) • Mabed
 */

class AudioStreamPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.currentStation = null;
    this.state = 'idle';
    this.sleepTimerRemaining = null;
    this.sleepTimerInterval = null;
    this.isOffline = !navigator.onLine;

    this.listeners = {
      state: [],
      timer: [],
      volume: [],
      offline: []
    };

    const savedVol = localStorage.getItem('mp3quran_volume');
    this.volume = savedVol !== null ? parseFloat(savedVol) : 1.0;
    this.audio.volume = this.volume;

    this._bindAudioEvents();
    this._bindNetworkEvents();
    this._requestPersistentStorage();
  }

  async _requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        console.log(`[Storage] Persistent storage granted: ${isPersisted}`);
      } catch (e) {
        console.warn("[Storage] Persistent storage request error:", e);
      }
    }
  }

  _bindNetworkEvents() {
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.listeners.offline.forEach(cb => cb(false));
      console.log('[Network] Back online');
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.listeners.offline.forEach(cb => cb(true));
      console.log('[Network] Connection lost, switched to Offline Mode');
    });
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
      console.warn('Audio stream error event:', e);
      if (this.isOffline) {
        this._setState('error');
      } else {
        // Quick retry once in case of live connection hiccup
        setTimeout(() => {
          if (this.currentStation && this.state === 'buffering') {
            this.audio.load();
            this.audio.play().catch(() => this._setState('error'));
          }
        }, 1200);
      }
    });
  }

  onStateChange(callback) {
    this.listeners.state.push(callback);
  }

  onTimerTick(callback) {
    this.listeners.timer.push(callback);
  }

  onVolumeChange(callback) {
    this.listeners.volume.push(callback);
  }

  onOfflineChange(callback) {
    this.listeners.offline.push(callback);
  }

  _setState(state) {
    this.state = state;
    this._updateMediaSession();
    this.listeners.state.forEach(cb => cb(this.state, this.currentStation));
  }

  play(station) {
    if (!station || !station.url) return;

    if (this.currentStation && this.currentStation.id === station.id) {
      if (this.state === 'paused' || this.state === 'error') {
        this.audio.play().catch(e => console.warn(e));
      }
      return;
    }

    this.currentStation = station;
    this.audio.src = station.url;
    this._setState('buffering');

    // Inform Service Worker of played station for aggressive caching & LRU timestamp
    this._notifyServiceWorkerOfPlayback(station);

    this.audio.play().catch((err) => {
      console.warn('Autoplay error:', err);
      this._setState('paused');
    });
  }

  _notifyServiceWorkerOfPlayback(station) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'RECORD_STATION_ACCESS',
        url: station.url,
        stationId: station.id,
        stationName: station.name
      });
    }
  }

  togglePlayPause() {
    if (!this.currentStation) return;
    if (this.state === 'playing') {
      this.audio.pause();
    } else {
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
    this.listeners.volume.forEach(cb => cb(this.volume));
  }

  setSleepTimer(minutes) {
    clearInterval(this.sleepTimerInterval);
    this.sleepTimerInterval = null;

    if (!minutes || minutes <= 0) {
      this.sleepTimerRemaining = null;
      this._notifyTimer(null);
      return;
    }

    this.sleepTimerRemaining = Math.round(minutes * 60);
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
      album: 'MP3Quran Live Radio (Offline Ready)',
      artwork: [
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
    navigator.mediaSession.setActionHandler('stop', () => this.stop());
  }

  // Pre-cache an entire station audio stream for guaranteed offline access
  async precacheStation(station) {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      throw new Error('Service Worker not ready');
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data && event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data ? event.data.error : 'Caching failed'));
        }
      };

      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_STATION_AUDIO',
        url: station.url,
        stationId: station.id,
        stationName: station.name
      }, [channel.port2]);
    });
  }
}

window.AudioStreamPlayer = AudioStreamPlayer;
