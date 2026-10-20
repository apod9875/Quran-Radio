/** Language switching: static text comes from data-i18n attributes, dynamic text from this.t. */
Object.assign(App.prototype, {
  applyLanguage(lang) {
    this.lang = lang;
    window.QRUtils.writeStorage('mp3quran_lang', lang);
    const t = this.t;

    this.dom.html.lang = lang === 'ar' ? 'ar' : 'en';
    this.dom.html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.dom.langBtnText.textContent = lang === 'ar' ? 'English' : 'عربي';
    this.dom.langBtnShort.textContent = lang === 'ar' ? 'EN' : 'ع';

    this._applyStaticText(t);
    this.dom.timerGrid.querySelectorAll('.btn-timer-chip').forEach((chip) => {
      chip.textContent = `${chip.dataset.mins} ${t.minutes}`;
    });
    this.checkOfflineStatus(!navigator.onLine);

    this.renderCategories();
    this.renderStations();
    this._updatePlayerUi(this.player.state, this.player.currentStation);
    this._updateTimerUi(this.player.sleepTimerRemaining);
    if (this.dom.cacheModal.classList.contains('active')) this.updateCacheModalMetrics();
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
  },

  toggleLanguage() {
    this.applyLanguage(this.lang === 'ar' ? 'eng' : 'ar');
    this.fetchStations();
  }
});
