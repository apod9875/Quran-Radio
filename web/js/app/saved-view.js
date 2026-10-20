/** Saved page: storage use, downloaded surahs grouped by reciter + mushaf, the download queue. */
Object.assign(App.prototype, {
  _bindSavedView() {
    this.dom.savedSurahsList.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      const group = e.target.closest('.saved-group');
      if (!button || !group) return;
      const moshafId = Number(group.dataset.moshaf);
      const row = e.target.closest('.saved-surah-row');
      const surah = row ? Number(row.dataset.surah) : null;
      if (button.dataset.action === 'play') this.playSavedSurahs(moshafId, surah);
      else if (button.dataset.action === 'delete') this.deleteSurahDownload(moshafId, surah, true);
      else if (button.dataset.action === 'delete-group') this.deleteSavedGroup(moshafId);
    });
    this.dom.downloadQueue.addEventListener('click', (e) => {
      const button = e.target.closest('[data-cancel]');
      if (button) this.cancelSurahDownload(button.dataset.cancel);
    });
  },

  showSaved() {
    this.renderStorage();
    this.renderDownloadQueue();
  },

  _savedGroups() {
    const groups = new Map();
    this.savedSurahs.forEach((item) => {
      const group = groups.get(item.moshafId) || { moshafId: item.moshafId, reciterName: item.reciterName, riwaya: item.riwaya, items: [], bytes: 0 };
      group.items.push(item);
      group.bytes += item.sizeBytes || 0;
      groups.set(item.moshafId, group);
    });
    const collator = new Intl.Collator('ar');
    return [...groups.values()]
      .map((g) => ({ ...g, items: g.items.sort((a, b) => a.surah - b.surah) }))
      .sort((a, b) => collator.compare(a.reciterName || '', b.reciterName || ''));
  },

  renderSavedSurahs() {
    const { escapeHtml } = window.QRUtils;
    const t = this.t;
    const icons = window.SvgIcons;
    const megabytes = (bytes) => `<bdi dir="ltr">${(bytes / (1024 * 1024)).toFixed(1)} MB</bdi>`;
    const groups = this._savedGroups();
    if (!groups.length) {
      this.dom.savedSurahsList.innerHTML = `<div class="cached-empty">${escapeHtml(t.noSavedSurahs)}</div>`;
      return;
    }
    this.dom.savedSurahsList.innerHTML = groups.map((g) => `
      <div class="saved-group" data-moshaf="${g.moshafId}">
        <div class="saved-group-head">
          <div class="saved-group-text">
            <div class="saved-group-title">${escapeHtml(g.reciterName || '')}</div>
            <div class="saved-group-sub">${escapeHtml(g.riwaya || '')} · ${escapeHtml(t.surahCount.replace('{count}', g.items.length))} · ${megabytes(g.bytes)}</div>
          </div>
          <button type="button" class="btn-card-action btn-play-card" data-action="play" aria-label="${escapeHtml(t.playAll)}" title="${escapeHtml(t.playAll)}">${icons.play(18)}</button>
          <button type="button" class="btn-card-action" data-action="delete-group" aria-label="${escapeHtml(t.deleteDownload)}" title="${escapeHtml(t.deleteDownload)}">${icons.trash(16)}</button>
        </div>
        ${g.items.map((item) => `
          <div class="saved-surah-row" data-surah="${item.surah}">
            <span class="surah-number">${item.surah}</span>
            <span class="saved-surah-name">${escapeHtml(`${t.surahPrefix} ${item.surahName || item.surah}`)}</span>
            <span class="saved-surah-size">${megabytes(item.sizeBytes || 0)}</span>
            <button type="button" class="btn-card-action" data-action="play" aria-label="${escapeHtml(t.playLabel)}" title="${escapeHtml(t.playLabel)}">${icons.play(16)}</button>
            <button type="button" class="btn-card-action" data-action="delete" aria-label="${escapeHtml(t.deleteDownload)}" title="${escapeHtml(t.deleteDownload)}">${icons.trash(16)}</button>
          </div>`).join('')}
      </div>`).join('');
  },

  // Plays the saved surahs of one mushaf from the device, starting at `surah` (or the first)
  playSavedSurahs(moshafId, surah) {
    const group = this._savedGroups().find((g) => g.moshafId === moshafId);
    if (!group) return;
    const tracks = group.items.map((item) => ({
      id: window.QRQuranModel.surahTrackId(moshafId, item.surah),
      kind: 'surah',
      name: `${this.t.surahPrefix} ${item.surahName || item.surah}`,
      surah: item.surah,
      surahName: item.surahName,
      reciterId: item.reciterId,
      reciterName: item.reciterName,
      moshafId,
      riwaya: item.riwaya,
      remoteUrl: item.remoteUrl,
      url: this.offlineSurahUrl(moshafId, item.surah)
    }));
    const index = surah ? Math.max(0, tracks.findIndex((track) => track.surah === surah)) : 0;
    this.playQueue(tracks, index);
  },

  async deleteSavedGroup(moshafId) {
    if (!window.confirm(this.t.deleteGroupConfirm)) return;
    const group = this._savedGroups().find((g) => g.moshafId === moshafId);
    if (!group) return;
    for (const item of group.items) await this.deleteSurahDownload(moshafId, item.surah, false);
    this.showToast(this.t.deletedToast);
  },

  renderDownloadQueue() {
    const { escapeHtml } = window.QRUtils;
    const jobs = (this.activeDownload ? [this.activeDownload] : []).concat(this.downloadQueue);
    const panel = this.dom.downloadQueue;
    panel.hidden = jobs.length === 0;
    panel.innerHTML = jobs.map((job) => {
      const percent = Math.round((this.downloadProgress.get(job.key) || 0) * 100);
      return `
        <div class="download-job">
          <div class="download-job-text">
            <span class="download-job-name">${escapeHtml(job.name)} · ${escapeHtml(job.reciter.name)}</span>
            <span class="download-job-bar"><span data-download-key="${job.key}" style="--p:${percent}%"></span></span>
          </div>
          <button type="button" class="btn-card-action" data-cancel="${job.key}" aria-label="${escapeHtml(this.t.cancelDownload)}" title="${escapeHtml(this.t.cancelDownload)}">${window.SvgIcons.close(16)}</button>
        </div>`;
    }).join('');
  }
});
