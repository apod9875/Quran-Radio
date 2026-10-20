/**
 * Stations with several stream mirrors (Cairo, Makkah): start on the mirror that has been fastest on
 * this device, and hand over to the next mirror at once when one stalls or fails.
 */
const MIRROR_STATS_KEY = 'qr_mirror_stats';
const MIRROR_FAIL_MS = 15000; // a mirror that never started counts as a very slow start

Object.assign(AudioStreamPlayer.prototype, {
  _hasMirrors() {
    const station = this.currentStation;
    return !!station && Array.isArray(station.mirrors) && station.mirrors.length > 1;
  },

  _mirrorStats() {
    const stats = window.QRUtils.safeJson(window.QRUtils.readStorage(MIRROR_STATS_KEY), {});
    return stats && typeof stats === 'object' ? stats : {};
  },

  _recordMirror(url, ms) {
    const stats = window.QRUtils.updateMirrorStat(this._mirrorStats(), url, ms);
    window.QRUtils.writeStorage(MIRROR_STATS_KEY, JSON.stringify(stats));
  },

  // The URL a fresh start uses: the fastest known mirror, or the station's only URL
  _firstStreamUrl() {
    if (!this._hasMirrors()) {
      this.mirrorOrder = null;
      return this.currentStation.url;
    }
    this.mirrorOrder = window.QRUtils.orderMirrors(this.currentStation.mirrors, this._mirrorStats());
    this.mirrorIndex = 0;
    return this.mirrorOrder[0];
  },

  _currentStreamUrl() {
    return this.mirrorOrder ? this.mirrorOrder[this.mirrorIndex] : this.currentStation.url;
  },

  // With another mirror to go to, waiting long on a stalled one only delays the sound
  _stallTimeoutMs() {
    const tuning = AudioStreamPlayer.TUNING;
    if (this._isHls()) return tuning.hlsStallTimeoutMs;
    return this._hasMirrors() ? tuning.mirrorStallTimeoutMs : tuning.stallTimeoutMs;
  },

  // Called on 'playing': how long this mirror took from load to sound
  _onStreamStarted() {
    if (this.mirrorOrder && this.mirrorLoadAt) this._recordMirror(this._currentStreamUrl(), performance.now() - this.mirrorLoadAt);
    this.mirrorLoadAt = 0;
  },

  // A failing mirror hands over to the next one; false when none is left (then the normal retries run)
  _tryNextMirror() {
    if (!this.mirrorOrder || this.mirrorIndex >= this.mirrorOrder.length - 1) return false;
    if (this.mirrorLoadAt) this._recordMirror(this._currentStreamUrl(), MIRROR_FAIL_MS);
    this.mirrorIndex++;
    this._loadStream(this._currentStreamUrl(), false);
    return true;
  }
});
