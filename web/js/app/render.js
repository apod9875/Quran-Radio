/** Rendering of the category chips and the station list. */
const CATEGORIES = [
  { id: 'ALL', key: 'all' },
  { id: 'POPULAR', key: 'popular' },
  { id: 'RIWAYAT', key: 'riwayat' },
  { id: 'TAFSEER', key: 'tafseer' },
  { id: 'TRANSLATIONS', key: 'translations' },
  { id: 'OFFLINE', key: 'savedOffline' },
  { id: 'FAVORITES', key: 'favorites' }
];

Object.assign(App.prototype, {
  // Tabs with no stations are hidden; "All" and "Favorites" always stay
  renderCategories() {
    const t = this.t;
    const present = new Set(this.stations.map((s) => s.category));
    const visible = CATEGORIES.filter((c) => ['ALL', 'OFFLINE', 'FAVORITES'].includes(c.id) || present.has(c.id));
    if (!visible.some((c) => c.id === this.activeCategory)) this.activeCategory = 'ALL';

    this.renderRiwayaFilter();
    this.dom.categoriesBar.innerHTML = visible.map((cat) => `
      <button type="button" class="cat-chip${this.activeCategory === cat.id ? ' active' : ''}" data-id="${cat.id}">${window.QRUtils.escapeHtml(t[cat.key])}</button>`).join('');
  },

  _selectCategory(chip) {
    this.activeCategory = chip.dataset.id;
    if (this.activeCategory !== 'RIWAYAT') this.activeRiwaya = 'ALL';
    this.dom.categoriesBar.querySelectorAll('.cat-chip').forEach((el) => {
      el.classList.toggle('active', el === chip);
    });
    this.renderRiwayaFilter();
    this.renderStations();
    this._centerChip(this.dom.categoriesBar, chip);
  },

  // Center a chip inside its scrolling bar without scrolling the page itself
  _centerChip(bar, chip) {
    const chipBox = chip.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    const delta = chipBox.left + chipBox.width / 2 - (barBox.left + barBox.width / 2);
    bar.scrollBy({ left: delta, behavior: 'smooth' });
  },

  renderStations() {
    const t = this.t;
    const filtered = this.getFilteredStations();
    this.visibleIds = filtered.map((s) => s.id);

    this.dom.stationsCountBadge.textContent = this.stations.length === 0
      ? t.loadingStations
      : t.stationsCount.replace('{shown}', filtered.length).replace('{total}', this.stations.length);

    const emptyHtml = this.stations.length === 0 ? '' : `
      <div class="empty-state">
        <span class="empty-state-icon">${window.SvgIcons.radio(40)}</span>
        <p>${window.QRUtils.escapeHtml(this.activeCategory === 'OFFLINE' && !this.searchQuery ? t.noOffline : t.noResults)}</p>
      </div>`;
    this.listFor('stations', this.dom.stationsContainer, (s, i) => this._cardHtml(s, i))
      .setItems(filtered, { emptyHtml });
  },

  // Replace one card in place (used for play-state, favorite and cache changes)
  refreshCard(id) {
    const index = this.visibleIds.indexOf(id);
    const station = this.stationsById.get(id);
    const card = this.dom.stationsContainer.querySelector(`.station-card[data-id="${id}"]`);
    if (index === -1 || !station || !card) return;
    const hadFocus = card.contains(document.activeElement);
    const holder = document.createElement('div');
    holder.innerHTML = this._cardHtml(station, index).trim();
    const fresh = holder.firstElementChild;
    card.replaceWith(fresh);
    if (hadFocus) fresh.focus({ preventScroll: true });
  }
});
