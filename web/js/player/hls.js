/**
 * HLS live stations (Masjid al-Haram, Masjid an-Nabawi), played as sound only, through hls.js where
 * the browser has Media Source and natively on the iPhone. hls.js is
 * loaded from our own origin the first time such a station plays, so nobody else downloads it.
 */
const HLS_SCRIPT = 'vendor/hls.light.min.js';
let hlsLibrary = null;

function loadHlsLibrary() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (!hlsLibrary) {
    hlsLibrary = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = HLS_SCRIPT;
      script.onload = () => (window.Hls ? resolve(window.Hls) : reject(new Error('hls.js did not load')));
      script.onerror = () => {
        hlsLibrary = null; // allow a later retry
        script.remove();
        reject(new Error('hls.js could not be downloaded'));
      };
      document.head.appendChild(script);
    });
  }
  return hlsLibrary;
}

Object.assign(AudioStreamPlayer.prototype, {
  _isHls() {
    return !!this.currentStation && this.currentStation.format === 'hls';
  },

  // hls.js wherever Media Source exists (it handles these TS streams the same everywhere); the iPhone has
  // no Media Source but plays HLS natively, with lock-screen and background playback
  _needsHlsJs() {
    if (!this._isHls()) return false;
    return !!window.MediaSource || !this.audio.canPlayType('application/vnd.apple.mpegurl');
  },

  _playWithHlsJs(url, token) {
    loadHlsLibrary().then((Hls) => {
      if (token !== this.loadToken) return;
      if (!Hls.isSupported()) throw new Error('HLS is not supported in this browser');
      // Only the sound is heard, so stay on the lightest level. No worker: the CSP allows none from blob:
      const hls = new Hls({ enableWorker: false, lowLatencyMode: false, maxBufferLength: 20, startLevel: 0 });
      this.hls = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => { hls.autoLevelCapping = 0; });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal && token === this.loadToken) this._handleStreamFailure(`hls-${data.type}`);
      });
      hls.loadSource(url);
      hls.attachMedia(this.audio);
      this._startWatchdog(); // the library download does not count against the stall timeout
      this._playAudio(token);
    }).catch((err) => {
      if (token !== this.loadToken) return;
      console.warn('[Audio] HLS:', err.message);
      this._handleStreamFailure('hls-load');
    });
  },

  _destroyHls() {
    if (!this.hls) return;
    const hls = this.hls;
    this.hls = null;
    hls.destroy();
  }
});
