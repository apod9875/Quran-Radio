/** Player UI (hero, mini bar, full player), favorites and station navigation. */
Object.assign(App.prototype, {
  _statusText(state) {
    const t = this.t;
    if (state === 'buffering') return t.connecting;
    if (state === 'playing') return t.live;
    if (state === 'error') return t.streamError;
    return t.paused;
  },

  _favIcon(isFav, size) {
    return isFav ? window.SvgIcons.heartFilled(size) : window.SvgIcons.heartOutline(size);
  },

  _updateFavButtons() {
    const station = this.player.currentStation;
    if (!station) return;
    const icon = this._favIcon(this.favorites.has(station.id), 20);
    this.dom.heroFavBtn.innerHTML = icon;
    this.dom.mobileBarFavBtn.innerHTML = icon;
    this.dom.fullPlayerFavBtn.innerHTML = icon;
  },

  _updatePlayerUi(state, station) {
    const d = this.dom;
    const t = this.t;
    const icons = window.SvgIcons;

    if (!station) {
      d.heroTitle.textContent = t.selectPrompt;
      d.heroCategory.textContent = '';
      d.heroIndicatorText.textContent = t.live;
      d.mobileBarStatus.textContent = t.liveHint;
      d.heroPlayBtn.innerHTML = icons.play(30, 'svg-gold-glow');
      d.mobileBar.classList.remove('visible');
      document.body.classList.remove('has-mini-player');
      this.shownStationId = null;
      return;
    }

    const category = this._categoryLabel(station);
    d.heroTitle.textContent = station.name;
    d.heroCategory.textContent = category;
    d.mobileBarTitle.textContent = station.name;
    d.fullPlayerTitle.textContent = station.name;
    d.fullPlayerCategory.textContent = category;

    const status = this._statusText(state);
    d.heroIndicatorText.textContent = status;
    d.mobileBarStatus.textContent = status;

    const busy = state === 'buffering';
    const playing = state === 'playing';
    const bigIcon = busy ? icons.spinner(30) : (playing ? icons.pause(30, 'svg-gold-glow') : icons.play(30, 'svg-gold-glow'));
    const smallIcon = busy ? icons.spinner(20) : (playing ? icons.pause(20) : icons.play(20));
    d.heroPlayBtn.innerHTML = bigIcon;
    d.fullPlayerPlayBtn.innerHTML = bigIcon;
    d.mobileBarPlayBtn.innerHTML = smallIcon;
    this._updateFavButtons();

    d.mobileBar.classList.add('visible');
    document.body.classList.add('has-mini-player');

    // Only the previous and the current card change when the player state changes
    [this.shownStationId, station.id].forEach((id, i, ids) => {
      if (id != null && ids.indexOf(id) === i) this.refreshCard(id);
    });
    this.shownStationId = station.id;

    if (state === 'error' && this.lastPlayerState !== 'error') this.showToast(t.streamError);
    if (busy && this.lastPlayerState !== 'buffering' && this.cachedIds.has(station.id)) {
      window.QR_SW.post({ type: 'TOUCH_AUDIO', stationId: station.id });
    }
    this.lastPlayerState = state;
  },

  _updateTimerUi(seconds) {
    const badge = this.dom.heroTimerBadge;
    if (!seconds || seconds <= 0) {
      badge.style.display = 'none';
      this.dom.timerRemainingText.textContent = '';
      return;
    }
    const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    const label = window.QRUtils.escapeHtml(this.t.sleepIn);
    badge.style.display = 'inline-block';
    badge.innerHTML = `${window.SvgIcons.moon(14)} ${label} <bdi dir="ltr">${clock}</bdi>`;
    this.dom.timerRemainingText.textContent = `${this.t.sleepIn} ${clock}`;
  },

  playOrToggle(station) {
    const current = this.player.currentStation;
    if (current && current.id === station.id && this.player.state !== 'idle' && this.player.state !== 'error') {
      this.player.togglePlayPause();
    } else {
      this.player.play(station);
    }
  },

  playNeighbor(step) {
    const station = this.neighborStation(step);
    if (station) this.player.play(station);
  },

  toggleFavorite(id) {
    const adding = !this.favorites.has(id);
    if (adding) this.favorites.add(id);
    else this.favorites.delete(id);
    window.QRUtils.writeStorage('mp3quran_favs', JSON.stringify(Array.from(this.favorites)));
    this.showToast(adding ? this.t.favAddedToast : this.t.favRemovedToast);

    // Removing a favorite inside the Favorites tab drops its card; otherwise just refresh it
    if (this.activeCategory === 'FAVORITES') this.renderStations();
    else this.refreshCard(id);
    this._updateFavButtons();
    if (this.cachedIds.has(id)) {
      window.QR_SW.post({ type: 'SET_FAVORITE_STATION', stationId: id, isFavorite: adding });
    }
  },

  async shareCurrentStation() {
    const station = this.player.currentStation;
    if (!station) return;
    const data = {
      title: station.name,
      text: `${station.name}\n${station.url}\n\nMP3Quran Live Radio - ${this.t.dedication}`,
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) { /* user dismissed the sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${station.name}\n${station.url}`);
      this.showToast(this.t.linkCopied);
    } catch (e) {
      this.showToast(station.url);
    }
  }
});
