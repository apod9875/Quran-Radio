/** Playing surahs: tracks, the mushaf queue, next/previous, resume position and "continue listening". */
Object.assign(App.prototype, {
  offlineSurahUrl(moshafId, surah) {
    return window.QR_STORAGE.offlineSurahPath(moshafId, surah);
  },

  // A downloaded surah plays from the device even online (instant, no data used)
  buildSurahTrack(reciter, moshaf, surah) {
    const model = window.QRQuranModel;
    const surahName = this.surahName(surah);
    const remoteUrl = model.surahUrl(moshaf, surah);
    return {
      id: model.surahTrackId(moshaf.id, surah),
      kind: 'surah',
      name: `${this.t.surahPrefix} ${surahName}`,
      surah,
      surahName,
      reciterId: reciter.id,
      reciterName: reciter.name,
      moshafId: moshaf.id,
      riwaya: this.moshafLabel(moshaf),
      remoteUrl,
      url: this.isSurahSaved(moshaf.id, surah) ? this.offlineSurahUrl(moshaf.id, surah) : remoteUrl
    };
  },

  playMoshaf(reciter, moshaf, startSurah) {
    const tracks = moshaf.surahs.map((n) => this.buildSurahTrack(reciter, moshaf, n));
    const index = Math.max(0, tracks.findIndex((track) => track.surah === startSurah));
    this.playQueue(tracks, index);
  },

  playQueue(tracks, index) {
    if (!tracks.length) return;
    this.queue = { tracks };
    const track = tracks[index];
    this.player.resumeAt = this.player.savedPosition(track.id);
    this.player.play(track);
  },

  playOrToggleSurah(reciter, moshaf, surah) {
    const current = this.player.currentStation;
    const id = window.QRQuranModel.surahTrackId(moshaf.id, surah);
    if (current && current.id === id && this.player.state !== 'idle' && this.player.state !== 'error') {
      this.player.togglePlayPause();
    } else {
      this.playMoshaf(reciter, moshaf, surah);
    }
  },

  // Next / previous surah inside the queue; false at either end
  stepQueue(step) {
    const current = this.player.currentStation;
    if (!this.queue || !current) return false;
    const tracks = this.queue.tracks;
    const index = tracks.findIndex((track) => track.id === current.id);
    const next = window.QRQuranModel.queueStep(tracks.length, index, step);
    if (next < 0) return false;
    const track = tracks[next];
    // It may have been downloaded since the queue was built
    if (this.isSurahSaved(track.moshafId, track.surah)) track.url = this.offlineSurahUrl(track.moshafId, track.surah);
    this.player.resumeAt = 0;
    this.player.play(track);
    return true;
  },

  _onTrackEnded() {
    if (!this.stepQueue(1)) this.player.stop();
  },

  // Remember the last surah for the "continue listening" card
  _rememberSurah(track) {
    if (!track || track.kind !== 'surah') return;
    window.QRUtils.writeStorage('qr_last_surah', JSON.stringify({
      trackId: track.id,
      reciterId: track.reciterId,
      moshafId: track.moshafId,
      surah: track.surah,
      title: track.name,
      subtitle: `${track.reciterName} · ${track.riwaya}`
    }));
  },

  async resumeLastSurah() {
    const last = window.QRUtils.safeJson(window.QRUtils.readStorage('qr_last_surah'), null);
    if (!last) return;
    try {
      await this.loadQuranCatalog();
    } catch (err) {
      this.showToast(this.t.recitersLoadFailed);
      return;
    }
    const entry = this.quran.moshafs.get(last.moshafId);
    if (entry) this.playMoshaf(entry.reciter, entry.moshaf, last.surah);
  }
});
