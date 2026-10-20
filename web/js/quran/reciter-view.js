/** Reciter page: mushaf (riwaya) chips, play / download all, surah search and the surah rows. */
Object.assign(App.prototype, {
  _bindReciterView() {
    const d = this.dom;
    this.surahQuery = '';

    d.moshafBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.riwaya-chip');
      if (chip && this.openReciter) this.replaceRoute(`#/reciter/${this.openReciter.reciter.id}/${chip.dataset.moshaf}`);
    });
    d.playAllBtn.addEventListener('click', () => {
      const open = this.openReciter;
      if (open) this.playMoshaf(open.reciter, open.moshaf, open.moshaf.surahs[0]);
    });
    d.downloadAllBtn.addEventListener('click', () => this.downloadWholeMoshaf());
    d.reciterFavBtn.addEventListener('click', () => {
      if (this.openReciter) this.toggleFavoriteReciter(this.openReciter.reciter.id);
    });
    d.surahSearch.addEventListener('input', (e) => {
      this.surahQuery = e.target.value.trim();
      this.renderSurahs();
    });
    d.surahSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') d.surahSearch.blur(); });

    d.surahList.addEventListener('click', (e) => {
      const row = e.target.closest('.surah-row');
      if (!row || !this.openReciter) return;
      const surah = Number(row.dataset.surah);
      const { reciter, moshaf } = this.openReciter;
      if (e.target.closest('[data-action="download"]')) this.toggleSurahDownload(reciter, moshaf, surah);
      else this.playOrToggleSurah(reciter, moshaf, surah);
    });
  },

  async showReciter(reciterId, moshafId) {
    const d = this.dom;
    const t = this.t;
    if (!this.quran) {
      d.reciterTitle.textContent = t.loadingReciters;
      d.reciterSubtitle.textContent = '';
      d.surahList.innerHTML = '';
      d.moshafBar.innerHTML = '';
    }
    try {
      await this.loadQuranCatalog();
    } catch (err) {
      d.reciterTitle.textContent = t.recitersLoadFailed;
      return;
    }
    if (this.currentView !== 'reciter') return;

    const reciter = this.quran.byId.get(reciterId);
    if (!reciter) {
      this.openReciter = null;
      d.reciterTitle.textContent = t.reciterNotFound;
      d.reciterSubtitle.textContent = '';
      d.moshafBar.innerHTML = '';
      d.surahList.innerHTML = '';
      return;
    }
    const moshaf = reciter.moshafs.find((m) => m.id === moshafId) || reciter.moshafs[0];
    if (!this.openReciter || this.openReciter.reciter.id !== reciter.id) {
      this.surahQuery = '';
      d.surahSearch.value = '';
    }
    this.openReciter = { reciter, moshaf };

    d.reciterTitle.textContent = reciter.name;
    d.reciterSubtitle.textContent = `${this.moshafLabel(moshaf)} · ${t.surahCount.replace('{count}', moshaf.surahs.length)}`;
    this._renderReciterFav();
    this._renderMoshafBar();
    this.renderSurahs();
  },

  _renderReciterFav() {
    if (!this.openReciter) return;
    const isFav = this.favoriteReciters.has(this.openReciter.reciter.id);
    const button = this.dom.reciterFavBtn;
    button.classList.toggle('active', isFav);
    button.setAttribute('aria-pressed', String(isFav));
    button.innerHTML = isFav ? window.SvgIcons.heartFilled(18) : window.SvgIcons.heartOutline(18);
  },

  _renderMoshafBar() {
    const { escapeHtml } = window.QRUtils;
    const { reciter, moshaf } = this.openReciter;
    const bar = this.dom.moshafBar;
    bar.hidden = reciter.moshafs.length < 2;
    bar.innerHTML = reciter.moshafs.map((m) => `
      <button type="button" class="riwaya-chip${m.id === moshaf.id ? ' active' : ''}" data-moshaf="${m.id}">
        ${escapeHtml(this.moshafLabel(m))} <span class="riwaya-count">${m.surahs.length}</span>
      </button>`).join('');
  },

  renderSurahs() {
    if (!this.openReciter) return;
    const { normalizeArabic, escapeHtml } = window.QRUtils;
    const { moshaf } = this.openReciter;
    const query = normalizeArabic(this.surahQuery);
    const surahs = moshaf.surahs.filter((n) => !query
      || normalizeArabic(this.surahName(n)).includes(query) || String(n) === query);

    this.dom.surahList.innerHTML = surahs.length
      ? surahs.map((n) => this._surahRowHtml(moshaf, n)).join('')
      : `<div class="empty-state"><p>${escapeHtml(this.t.noSurahs)}</p></div>`;
  },

  _surahRowHtml(moshaf, surah) {
    const { escapeHtml } = window.QRUtils;
    const t = this.t;
    const icons = window.SvgIcons;
    const id = window.QRQuranModel.surahTrackId(moshaf.id, surah);
    const current = this.player.currentStation;
    const isCurrent = !!current && current.id === id;
    const state = this.player.state;
    const saved = this.isSurahSaved(moshaf.id, surah);
    const key = this.surahKey(moshaf.id, surah);
    const downloading = this.downloadProgress.has(key);
    const progress = Math.round((this.downloadProgress.get(key) || 0) * 100);

    const downloadIcon = saved ? icons.cloudCheck(18) : (downloading ? icons.close(16) : icons.cloudDownload(18));
    const downloadLabel = saved ? t.deleteDownload : (downloading ? t.cancelDownload : t.downloadSurah);
    const playLabel = isCurrent && (state === 'playing' || state === 'buffering') ? t.pauseLabel : t.playLabel;

    return `
      <div class="surah-row${isCurrent ? ' active' : ''}${saved ? ' is-saved' : ''}" data-surah="${surah}" data-track-id="${id}">
        <span class="surah-number">${surah}</span>
        <div class="surah-info">
          <div class="surah-name">${escapeHtml(`${t.surahPrefix} ${this.surahName(surah)}`)}</div>
          <div class="surah-meta">${escapeHtml(this.surahIsMakki(surah) ? t.makkia : t.madania)}${saved ? ` · ${escapeHtml(t.offlineReadyBadge)}` : ''}</div>
        </div>
        <button type="button" class="btn-card-action surah-download${downloading ? ' is-downloading' : ''}${saved ? ' is-saved' : ''}" data-action="download" style="--p:${progress}%" aria-label="${escapeHtml(downloadLabel)}" title="${escapeHtml(downloadLabel)}">${downloadIcon}</button>
        <button type="button" class="btn-card-action btn-play-card" data-action="play" aria-label="${escapeHtml(playLabel)}" title="${escapeHtml(playLabel)}">${this._playIcon(isCurrent, state, 18)}</button>
      </div>`;
  },

  // Re-render the rows of one track (play state / download state) if the reciter page shows them
  refreshSurahRow(moshafId, surah) {
    if (this.currentView !== 'reciter' || !this.openReciter || this.openReciter.moshaf.id !== moshafId) return;
    const row = this.dom.surahList.querySelector(`.surah-row[data-surah="${surah}"]`);
    if (!row) return;
    const holder = document.createElement('div');
    holder.innerHTML = this._surahRowHtml(this.openReciter.moshaf, surah).trim();
    row.replaceWith(holder.firstElementChild);
  },

  downloadWholeMoshaf() {
    const open = this.openReciter;
    if (!open) return;
    const missing = open.moshaf.surahs.filter((n) => !this.isSurahSaved(open.moshaf.id, n));
    if (!missing.length) return;
    if (!window.confirm(this.t.downloadAllConfirm.replace('{count}', missing.length))) return;
    missing.forEach((n) => this.queueSurahDownload(open.reciter, open.moshaf, n, { silent: true }));
  }
});
