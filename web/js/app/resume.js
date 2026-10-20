/**
 * Keep listening across a page refresh. A reload always stops the audio (the page is torn down), so the
 * app remembers what was playing and starts it again on the next load: a radio by id, a surah with its
 * mushaf queue and position. Where the browser blocks sound until the first touch, the player waits on
 * the same station and resumes on the first tap anywhere.
 */
const NOW_PLAYING_KEY = 'qr_now_playing';

Object.assign(App.prototype, {
  _setupResume() {
    this.player.onStateChange((state, track) => this._saveNowPlaying(state, track));
    // Written once more while the page goes away, with the state it had before the browser paused it
    window.addEventListener('pagehide', () => {
      if (this.player._isFile()) this.player._savePosition();
      this._saveNowPlaying(this.player.state, this.player.currentStation);
      this.leavingPage = true;
    });
  },

  _saveNowPlaying(state, track) {
    if (this.leavingPage || !track) return;
    const playing = state === 'playing' || state === 'buffering';
    const entry = track.kind === 'surah'
      ? { kind: 'surah', moshafId: track.moshafId, surah: track.surah, playing }
      : { kind: 'radio', id: track.id, playing };
    if (state === 'idle') entry.playing = false;
    if (state === 'error') return; // keep the last good state: a failed stream is retried after a refresh
    window.QRUtils.writeStorage(NOW_PLAYING_KEY, JSON.stringify(entry));
  },

  // Called once the stations are loaded (radio) and the saved surahs are known
  async resumeAfterReload() {
    if (this.resumeChecked) return;
    this.resumeChecked = true;
    const saved = window.QRUtils.safeJson(window.QRUtils.readStorage(NOW_PLAYING_KEY), null);
    if (!saved || !saved.playing || this.player.currentStation) return;

    if (saved.kind === 'radio') {
      const station = this.stationsById.get(Number(saved.id));
      if (station) this._startResumed(() => this.player.play(station));
      return;
    }
    try {
      await this.loadQuranCatalog();
    } catch (err) {
      return;
    }
    const entry = this.quran.moshafs.get(saved.moshafId);
    if (entry && !this.player.currentStation) this._startResumed(() => this.playMoshaf(entry.reciter, entry.moshaf, saved.surah));
  },

  _startResumed(start) {
    this.resumePending = true;
    const onState = (state) => {
      if (!this.resumePending) return;
      if (state === 'playing' || state === 'error') this.resumePending = false;
      if (state === 'paused' && !this.resumeHintShown) {
        // Sound was blocked until the user touches the page
        this.resumeHintShown = true;
        this.showToast(this.t.resumeTapHint);
        this._resumeOnFirstTap();
      }
    };
    this.player.onStateChange(onState);
    start();
  },

  _resumeOnFirstTap() {
    const resume = () => {
      ['click', 'keydown'].forEach((type) => document.removeEventListener(type, resume, true));
      // After the tap's own handler: a tap on play or on another station already did what the user wanted
      setTimeout(() => {
        if (this.resumePending && this.player.state === 'paused') this.player.play(this.player.currentStation);
        this.resumePending = false;
      }, 0);
    };
    ['click', 'keydown'].forEach((type) => document.addEventListener(type, resume, true));
  }
});
