/** Riwaya filter: a second chip row, shown only while the Riwayat tab is open. */
Object.assign(App.prototype, {
  renderRiwayaFilter() {
    const bar = this.dom.riwayaBar;
    const open = this.activeCategory === 'RIWAYAT';
    bar.hidden = !open;
    if (!open) {
      bar.innerHTML = '';
      return;
    }

    const { escapeHtml } = window.QRUtils;
    const groups = new Map();
    let total = 0;
    this.stations.forEach((s) => {
      if (s.category !== 'RIWAYAT') return;
      total++;
      if (!s.riwayaId) return;
      const group = groups.get(s.riwayaId) || { id: s.riwayaId, name: s.riwaya, count: 0 };
      group.count++;
      groups.set(s.riwayaId, group);
    });
    if (this.activeRiwaya !== 'ALL' && !groups.has(this.activeRiwaya)) this.activeRiwaya = 'ALL';

    const collator = new Intl.Collator(this.lang === 'ar' ? 'ar' : 'en', { sensitivity: 'base' });
    const chips = [{ id: 'ALL', name: this.t.allRiwayat, count: total }]
      .concat([...groups.values()].sort((a, b) => collator.compare(a.name, b.name)));

    bar.innerHTML = chips.map((chip) => `
      <button type="button" class="riwaya-chip${chip.id === this.activeRiwaya ? ' active' : ''}" data-riwaya="${chip.id}">
        ${escapeHtml(chip.name)} <span class="riwaya-count">${chip.count}</span>
      </button>`).join('');
  },

  _selectRiwaya(chip) {
    this.activeRiwaya = chip.dataset.riwaya;
    this.dom.riwayaBar.querySelectorAll('.riwaya-chip').forEach((el) => {
      el.classList.toggle('active', el === chip);
    });
    this.renderStations();
    this._centerChip(this.dom.riwayaBar, chip);
  }
});
