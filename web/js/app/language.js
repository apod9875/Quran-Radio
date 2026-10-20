/** Interface text: static text comes from data-i18n attributes, dynamic text from this.t (Arabic). */
Object.assign(App.prototype, {
  applyText() {
    const t = this.t;
    this._applyStaticText(t);
    this.dom.timerGrid.querySelectorAll('.btn-timer-chip[data-mins]').forEach((chip) => {
      if (chip.dataset.mins !== 'end') chip.textContent = `${chip.dataset.mins} ${t.minutes}`;
    });
    this.checkOfflineStatus(!navigator.onLine);

    this.renderCategories();
    this.renderStations();
    this._updatePlayerUi(this.player.state, this.player.currentStation);
    this._updateTimerUi(this.player.sleepTimerRemaining);
    if (this.player.supportsVolume) this._renderVolume();
  },

  _applyStaticText(t) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (t[el.dataset.i18n] !== undefined) el.textContent = t[el.dataset.i18n];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      if (t[el.dataset.i18nHtml] !== undefined) el.innerHTML = t[el.dataset.i18nHtml];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      if (t[el.dataset.i18nPlaceholder] !== undefined) el.placeholder = t[el.dataset.i18nPlaceholder];
    });
    document.querySelectorAll('[data-i18n-label]').forEach((el) => {
      const text = t[el.dataset.i18nLabel];
      if (text === undefined) return;
      el.title = text;
      el.setAttribute('aria-label', text);
    });
  }
});
