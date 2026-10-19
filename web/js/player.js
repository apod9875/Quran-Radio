/**
 * AudioStreamPlayer with Mobile & Honor Device Playback Optimization
 * Features:
 * - Direct Live Stream Media Decoding (Bypasses Service Worker stalls)
 * - HTML5 Audio Engine with automatic load(), buffering & error recovery
 * - Mobile User Gesture Unlocking (Touch/Click pre-warming)
 * - Automatic Fallback Mirrors & Cache-busting retry for dropped sockets
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
    this.audio.setAttribute('playsinline', 'true');
    this.audio.setAttribute('webkit-playsinline', 'true');
    // Clear crossOrigin so browser media decoder handles Icecast live streams without CORS rejection
    this.audio.crossOrigin = null;

    this.currentStation = null;
    this.state = 'idle';
    this.sleepTimerRemaining = null;
    this.sleepTimerInterval = null;
    this.isOffline = !navigator.onLine;
    this.watchdogTimer = null;
    this.retryCount = 0;

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
    this._setupMobileGestureUnlock();
    this._requestPersistentStorage();
  }

  _setupMobileGestureUnlock() {
    // Mobile browsers (Honor Browser, Chrome on Android, Safari) require user gesture to unlock audio
    const unlock = () => {
      try {
        const dummyPromise = this.audio.play();
        if (dummyPromise !== undefined) {
          dummyPromise.then(() => {
            if (!this.currentStation) {
              this.audio.pause();
            }
          }).catch(() => {});
        }
      } catch (e) {}
    };

    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('touchend', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true, passive: true });
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
      // If we had an error while offline, retry current station
      if (this.currentStation && this.state === 'error') {
        this.play(this.currentStation);
      }
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
      this._startWatchdog();
    });

    this.audio.addEventListener('waiting', () => {
      this._setState('buffering');
      this._startWatchdog();
    });

    this.audio.addEventListener('canplay', () => {
      this._clearWatchdog();
      if (this.state === 'buffering') {
        this.audio.play().catch(() => {});
      }
    });

    this.audio.addEventListener('playing', () => {
      this._clearWatchdog();
      this.retryCount = 0;
      this._setState('playing');
    });

    this.audio.addEventListener('pause', () => {
      this._clearWatchdog();
      if (this.state !== 'buffering' && this.state !== 'idle') {
        this._setState('paused');
      }
    });

    this.audio.addEventListener('error', (e) => {
      this._clearWatchdog();
      console.warn('Audio stream error event:', e);

      // Handle stream auto-recovery with mirror or timestamp bust
      if (this.currentStation && this.retryCount < 2) {
        this.retryCount++;
        console.log(`[Audio] Retrying stream (${this.retryCount}/2)...`);
        setTimeout(() => {
          this._retryStream();
        }, 1000);
      } else {
        this._setState('error');
      }
    });
  }

  _startWatchdog() {
    this._clearWatchdog();
    // If buffering takes more than 7 seconds on mobile, restart stream with cache-busting timestamp
    this.watchdogTimer = setTimeout(() => {
      if (this.state === 'buffering' && this.currentStation) {
        console.warn('[Audio] Buffering watchdog triggered: stream stalled, refreshing connection');
        this._retryStream();
      }
    }, 7000);
  }

  _clearWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  _retryStream() {
    if (!this.currentStation) return;
    try {
      let targetUrl = this.currentStation.url;
      // Append cache-buster to reset mobile TCP socket
      const sep = targetUrl.includes('?') ? '&' : '?';
      const retryUrl = `${targetUrl}${sep}t=${Date.now()}`;

      this.audio.pause();
      this.audio.src = retryUrl;
      this.audio.load();
      this.audio.play().catch(e => {
        console.warn('Retry play error:', e);
        this._setState('paused');
      });
    } catch (e) {
      console.warn('Stream reload error:', e);
    }
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
        const p = this.audio.play();
        if (p !== undefined) {
          p.catch(e => {
            console.warn('Resume error, reloading stream:', e);
            this._retryStream();
          });
        }
      }
      return;
    }

    this._clearWatchdog();
    this.retryCount = 0;
    this.currentStation = station;

    // Reset media element cleanly before loading new stream on mobile
    try {
      this.audio.pause();
      this.audio.removeAttribute('src');
    } catch (e) {}

    this.audio.src = station.url;
    this._setState('buffering');

    // Notify Service Worker for access tracking
    this._notifyServiceWorkerOfPlayback(station);

    // Call .load() explicitly for Android / Honor browser readiness
    this.audio.load();

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this._setState('playing');
      }).catch((err) => {
        console.warn('Audio play rejection:', err);
        // If autoplay blocked or socket dropped, set to paused so user can tap
        this._setState('paused');
      });
    }

    this._startWatchdog();
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
      this._setState('paused');
    } else {
      if (!this.audio.src || this.audio.src === '' || this.audio.src === window.location.href) {
        this.play(this.currentStation);
      } else {
        const p = this.audio.play();
        if (p !== undefined) {
          p.catch(() => this._retryStream());
        }
      }
    }
  }

  stop() {
    this._clearWatchdog();
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
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

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentStation.name,
        artist: 'صدقة جارية لـ (عبدالرحيم معبد) • Mabed',
        album: 'MP3Quran Live Radio',
        artwork: [
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
      navigator.mediaSession.setActionHandler('stop', () => this.stop());
    } catch (e) {}
  }

  // Pre-cache an entire station audio sample for offline access
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
