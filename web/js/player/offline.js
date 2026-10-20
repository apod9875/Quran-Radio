/** Saving a short sample of a station for offline playback (done by the service worker). */
const PRECACHE_TIMEOUT_MS = 90000;

Object.assign(AudioStreamPlayer.prototype, {
  async precacheStation(station) {
    this._requestPersistentStorage();
    const result = await window.QR_SW.request({
      type: 'CACHE_STATION_AUDIO',
      url: station.url,
      stationId: station.id,
      stationName: station.name
    }, PRECACHE_TIMEOUT_MS);
    if (!result || !result.success) {
      throw new Error((result && result.error) || 'Caching failed');
    }
    return result;
  },

  // Asked for on the first save (station or surah) rather than on page load, so the prompt has context
  async _requestPersistentStorage() {
    if (this._persistRequested || !(navigator.storage && navigator.storage.persist)) return;
    this._persistRequested = true;
    try {
      await navigator.storage.persist();
    } catch (e) { /* not available in this browser */ }
  }
});
