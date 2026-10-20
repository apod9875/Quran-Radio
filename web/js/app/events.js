/** Event wiring. Lists use one delegated listener each, so re-rendering never re-binds anything. */
Object.assign(App.prototype, {
  _bindEvents() {
    this.dom.langToggleBtn.addEventListener('click', () => this.toggleLanguage());
    this._bindSearchEvents();
    this._bindListEvents();
    this._bindPlayerControls();
    this._bindTimerEvents();
    this._bindModalEvents();
    this._bindVolumeControls();

    this.player.onStateChange((state, station) => this._updatePlayerUi(state, station));
    this.player.onTimerTick((seconds) => this._updateTimerUi(seconds));
    this.player.onOfflineChange((isOffline) => this.checkOfflineStatus(isOffline));
    this.player.onSkip((step) => this.playNeighbor(step));
  },

  _bindSearchEvents() {
    const { searchInput, clearSearchBtn } = this.dom;
    // Typing never interrupts the audio
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
      this.renderStations();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchInput.blur(); // hides the on-screen keyboard
    });
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      clearSearchBtn.style.display = 'none';
      this.renderStations();
    });
  },

  _bindListEvents() {
    this.dom.categoriesBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (chip) this._selectCategory(chip);
    });

    this.dom.riwayaBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.riwaya-chip');
      if (chip) this._selectRiwaya(chip);
    });

    const list = this.dom.stationsContainer;
    const stationOf = (e) => {
      const card = e.target.closest('.station-card');
      return card ? this.stationsById.get(Number(card.dataset.id)) : null;
    };

    list.addEventListener('click', (e) => {
      const station = stationOf(e);
      if (!station) return;
      const button = e.target.closest('[data-action]');
      const action = button ? button.dataset.action : 'play';
      if (action === 'precache') this.precacheStation(station);
      else if (action === 'fav') this.toggleFavorite(station.id);
      else this.playOrToggle(station);
    });

    list.addEventListener('keydown', (e) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.classList.contains('station-card')) return;
      e.preventDefault();
      const station = stationOf(e);
      if (station) this.playOrToggle(station);
    });
  },

  _bindPlayerControls() {
    const d = this.dom;
    const player = this.player;
    const onAll = (elements, handler) => elements.forEach((el) => el.addEventListener('click', handler));
    const favoriteCurrent = () => {
      if (player.currentStation) this.toggleFavorite(player.currentStation.id);
    };

    onAll([d.heroPlayBtn, d.fullPlayerPlayBtn], () => player.togglePlayPause());
    onAll([d.heroPrevBtn, d.fullPlayerPrevBtn], () => this.playNeighbor(-1));
    onAll([d.heroNextBtn, d.fullPlayerNextBtn], () => this.playNeighbor(1));
    onAll([d.heroFavBtn, d.fullPlayerFavBtn], favoriteCurrent);
    onAll([d.heroTimerBtn, d.fullPlayerTimerBtn], () => this.openTimerModal());
    d.heroShareBtn.addEventListener('click', () => this.shareCurrentStation());

    // Mini player: buttons act on their own, the rest of the bar opens the full player
    d.mobileBarPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      player.togglePlayPause();
    });
    d.mobileBarFavBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      favoriteCurrent();
    });
    d.mobileBar.addEventListener('click', () => this.openMobileFullPlayer());
    d.closeFullPlayerBtn.addEventListener('click', () => this.closeMobileFullPlayer());
  },

  _bindTimerEvents() {
    const d = this.dom;
    d.cancelTimerBtn.addEventListener('click', () => {
      this.player.setSleepTimer(null);
      this.closeTimerModal();
    });
    d.timerGrid.addEventListener('click', (e) => {
      const chip = e.target.closest('.btn-timer-chip');
      if (!chip) return;
      this.player.setSleepTimer(parseInt(chip.dataset.mins, 10));
      this.closeTimerModal();
    });
    d.applyCustomTimerBtn.addEventListener('click', () => {
      const minutes = parseInt(d.customTimerInput.value, 10);
      if (minutes > 0 && minutes <= 600) {
        this.player.setSleepTimer(minutes);
        this.closeTimerModal();
      } else {
        this.showToast(this.t.timerInvalid);
      }
    });
  }
});
