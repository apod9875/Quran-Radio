/** Reciters page: search, riwaya / favorites filter, letter index and the "continue listening" card. */
Object.assign(App.prototype, {
  _bindRecitersView() {
    const d = this.dom;
    this.reciterQuery = '';
    this.reciterFilter = 'ALL';

    d.reciterSearch.addEventListener('input', (e) => {
      this.reciterQuery = e.target.value.trim();
      this.renderReciters();
    });
    d.reciterSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') d.reciterSearch.blur(); });

    d.reciterFilterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.riwaya-chip');
      if (!chip) return;
      this.reciterFilter = chip.dataset.filter;
      d.reciterFilterBar.querySelectorAll('.riwaya-chip').forEach((el) => el.classList.toggle('active', el === chip));
      this.renderReciters();
      this._centerChip(d.reciterFilterBar, chip);
    });

    d.letterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.letter-chip');
      const card = chip && d.recitersList.querySelector(`.reciter-card[data-letter="${chip.dataset.letter}"]`);
      if (card) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });

    const open = (e) => {
      const card = e.target.closest('.reciter-card');
      if (!card) return;
      if (e.target.closest('[data-action="fav-reciter"]')) {
        this.toggleFavoriteReciter(Number(card.dataset.reciterId));
        return;
      }
      window.location.hash = `#/reciter/${card.dataset.reciterId}`;
    };
    d.recitersList.addEventListener('click', open);
    d.recitersList.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('reciter-card')) {
        e.preventDefault();
        open(e);
      }
    });
    d.continueCard.addEventListener('click', () => this.resumeLastSurah());
  },

  async showReciters() {
    const d = this.dom;
    this.renderContinueCard();
    if (!this.quran) {
      d.recitersCount.textContent = this.t.loadingReciters;
      d.recitersList.innerHTML = '';
    }
    try {
      await this.loadQuranCatalog();
    } catch (err) {
      d.recitersCount.textContent = this.t.recitersLoadFailed;
      return;
    }
    if (this.currentView !== 'reciters') return;
    this.renderReciterFilters();
    this.renderReciters();
    this.renderContinueCard();
  },

  _filteredReciters() {
    const query = window.QRUtils.normalizeArabic(this.reciterQuery);
    const filter = this.reciterFilter;
    return this.quran.reciters.filter((r) => {
      if (query && !r.searchKey.includes(query)) return false;
      if (filter === 'FAV') return this.favoriteReciters.has(r.id);
      return filter === 'ALL' || r.riwayat.some((w) => String(w.id) === filter);
    });
  },

  renderReciterFilters() {
    const { escapeHtml } = window.QRUtils;
    const counts = new Map();
    this.quran.reciters.forEach((r) => r.riwayat.forEach((w) => {
      const entry = counts.get(w.id) || { id: w.id, name: w.name, count: 0 };
      entry.count++;
      counts.set(w.id, entry);
    }));
    const riwayat = [...counts.values()].sort((a, b) => b.count - a.count);
    const chips = [{ id: 'ALL', name: this.t.allRiwayat, count: this.quran.reciters.length }];
    if (this.favoriteReciters.size) chips.push({ id: 'FAV', name: this.t.favoriteReciters, count: this.favoriteReciters.size });
    riwayat.forEach((w) => chips.push({ id: String(w.id), name: w.name, count: w.count }));
    if (!chips.some((c) => c.id === this.reciterFilter)) this.reciterFilter = 'ALL';

    this.dom.reciterFilterBar.innerHTML = chips.map((c) => `
      <button type="button" class="riwaya-chip${c.id === this.reciterFilter ? ' active' : ''}" data-filter="${c.id}">
        ${escapeHtml(c.name)} <span class="riwaya-count">${c.count}</span>
      </button>`).join('');
  },

  renderReciters() {
    if (!this.quran) return;
    const { escapeHtml } = window.QRUtils;
    const list = this._filteredReciters();
    const t = this.t;
    this.dom.recitersCount.textContent = t.recitersCount
      .replace('{shown}', list.length).replace('{total}', this.quran.reciters.length);

    const letters = [...new Set(list.map((r) => r.letter))];
    this.dom.letterBar.innerHTML = letters.map((l) =>
      `<button type="button" class="letter-chip" data-letter="${escapeHtml(l)}">${escapeHtml(l)}</button>`).join('');

    if (!list.length) {
      this.dom.recitersList.innerHTML = `<div class="empty-state"><p>${escapeHtml(t.noReciters)}</p></div>`;
      return;
    }
    let lastLetter = null;
    this.dom.recitersList.innerHTML = list.map((r) => {
      const first = r.letter !== lastLetter;
      lastLetter = r.letter;
      return this._reciterCardHtml(r, first);
    }).join('');
  },

  _reciterCardHtml(reciter, firstOfLetter) {
    const { escapeHtml } = window.QRUtils;
    const t = this.t;
    const isFav = this.favoriteReciters.has(reciter.id);
    const riwayat = reciter.riwayat.map((w) => `<span class="station-badge station-riwaya">${escapeHtml(w.name)}</span>`).join('');
    const styles = reciter.styles.map((s) => `<span class="station-badge">${escapeHtml(s)}</span>`).join('');
    const count = reciter.moshafs.length > 1 ? `<span class="reciter-count">${escapeHtml(t.moshafCount.replace('{count}', reciter.moshafs.length))}</span>` : '';
    return `
      <div class="reciter-card" data-reciter-id="${reciter.id}" ${firstOfLetter ? `data-letter="${escapeHtml(reciter.letter)}"` : ''} tabindex="0" role="link">
        <span class="reciter-avatar" aria-hidden="true">${escapeHtml(reciter.name.charAt(0))}</span>
        <div class="reciter-info">
          <div class="station-name">${escapeHtml(reciter.name)}</div>
          <div class="reciter-badges">${riwayat}${styles}${count}</div>
        </div>
        <button type="button" class="btn-card-action fav${isFav ? ' active' : ''}" data-action="fav-reciter" aria-pressed="${isFav}" aria-label="${escapeHtml(t.favoriteLabel)}" title="${escapeHtml(t.favoriteLabel)}">
          ${isFav ? window.SvgIcons.heartFilled(18) : window.SvgIcons.heartOutline(18)}
        </button>
      </div>`;
  },

  toggleFavoriteReciter(id) {
    const adding = !this.favoriteReciters.has(id);
    if (adding) this.favoriteReciters.add(id);
    else this.favoriteReciters.delete(id);
    window.QRUtils.writeStorage('qr_fav_reciters', JSON.stringify([...this.favoriteReciters]));
    this.showToast(adding ? this.t.favAddedToast : this.t.favRemovedToast);
    if (this.currentView === 'reciters') {
      this.renderReciterFilters();
      this.renderReciters();
    } else if (this.currentView === 'reciter') {
      this._renderReciterFav();
    }
  },

  renderContinueCard() {
    const last = window.QRUtils.safeJson(window.QRUtils.readStorage('qr_last_surah'), null);
    const card = this.dom.continueCard;
    if (!last || !last.title) {
      card.hidden = true;
      return;
    }
    const { escapeHtml } = window.QRUtils;
    const position = this.player.savedPosition(last.trackId);
    const time = position ? ` · <bdi dir="ltr">${window.QRQuranModel.formatTime(position)}</bdi>` : '';
    card.innerHTML = `
      <span class="continue-icon">${window.SvgIcons.play(22)}</span>
      <span class="continue-text">
        <span class="continue-label">${escapeHtml(this.t.continueListening)}</span>
        <span class="continue-title">${escapeHtml(last.title)}${time}</span>
        <span class="continue-sub">${escapeHtml(last.subtitle || '')}</span>
      </span>`;
    card.hidden = false;
  }
});
