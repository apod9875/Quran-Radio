/** Interface language (Arabic / English): data-i18n attributes for static text, this.t for the rest. */
Object.assign(App.prototype, {
  applyText() {
    const t = this.t;
    this.dom.html.lang = this.lang === 'ar' ? 'ar' : 'en';
    this.dom.html.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    this.dom.langBtnText.textContent = this.lang === 'ar' ? 'English' : 'عربي';
    this.dom.langBtnShort.textContent = this.lang === 'ar' ? 'EN' : 'ع';
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
    if (this.player.currentStation) this._renderTrackKind(this.player.currentStation);
  },

  // Switch Arabic <-> English: texts at once, then radios and reciters reload in the new language.
  // Whatever is playing keeps playing.
  toggleLanguage() {
    this.lang = this.lang === 'ar' ? 'eng' : 'ar';
    window.QRUtils.writeStorage('qr_lang', this.lang);
    this.quran = null;
    this.quranLoading = null;
    this.applyText();
    this.fetchStations();
    if (this.currentView && this.currentView !== 'radio') this.route();
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
