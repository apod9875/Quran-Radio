/** HTML for one station card. Every dynamic string is escaped. */
Object.assign(App.prototype, {
  _categoryLabel(station) {
    return this.t[station.category.toLowerCase()] || station.category;
  },

  // "Hafs from Asim"-style label when known, otherwise the tab name
  _categoryLine(station) {
    if (station.kind === 'surah') return `${station.reciterName} · ${station.riwaya}`;
    return station.riwaya || this._categoryLabel(station);
  },

  _playIcon(isCurrent, state, size) {
    const icons = window.SvgIcons;
    if (isCurrent && state === 'buffering') return icons.spinner(size);
    if (isCurrent && state === 'playing') return icons.pause(size);
    return icons.play(size);
  },

  _cardHtml(station, index) {
    const { escapeHtml } = window.QRUtils;
    const icons = window.SvgIcons;
    const t = this.t;
    const current = this.player.currentStation;
    const isCurrent = !!current && current.id === station.id;
    const state = this.player.state;
    const isFav = this.favorites.has(station.id);
    const isCached = this.cachedIds.has(station.id);
    const playLabel = isCurrent && (state === 'playing' || state === 'buffering') ? t.pauseLabel : t.playLabel;

    const cachedBadge = isCached
      ? `<span class="offline-ready-badge" title="${escapeHtml(t.offlineReadyTitle)}">${icons.cloudCheck(12)} ${escapeHtml(t.offlineReadyBadge)}</span>`
      : '';
    const wave = isCurrent && state === 'playing'
      ? '<div class="mini-wave"><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div></div>'
      : '';

    return `
      <div class="station-card${isCurrent ? ' active' : ''}${isCached ? ' is-saved' : ''}" data-id="${station.id}" tabindex="0" role="button">
        <div class="station-left">
          <span class="station-index-badge">#${String(index + 1).padStart(2, '0')}</span>
          <div class="station-thumb">
            <img src="icons/icon-192.png" alt="" width="42" height="42" loading="lazy" decoding="async">
          </div>
          <div class="station-details">
            <div class="station-name">${escapeHtml(station.name)}</div>
            <div class="station-meta">
              <span class="station-badge${station.riwaya ? ' station-riwaya' : ''}">${escapeHtml(this._categoryLine(station))}</span>
              ${cachedBadge}${wave}
            </div>
          </div>
        </div>
        <div class="station-actions">
          <button type="button" class="btn-card-action" data-action="precache" title="${escapeHtml(t.precacheStationTitle)}" aria-label="${escapeHtml(t.precacheStationTitle)}">
            ${isCached ? icons.cloudCheck(18) : icons.cloudDownload(18)}
          </button>
          <button type="button" class="btn-card-action fav${isFav ? ' active' : ''}" data-action="fav" title="${escapeHtml(t.favoriteLabel)}" aria-label="${escapeHtml(t.favoriteLabel)}" aria-pressed="${isFav}">
            ${isFav ? icons.heartFilled(18) : icons.heartOutline(18)}
          </button>
          <button type="button" class="btn-card-action btn-play-card" data-action="play" title="${escapeHtml(playLabel)}" aria-label="${escapeHtml(playLabel)}">
            ${this._playIcon(isCurrent, state, 18)}
          </button>
        </div>
      </div>`;
  }
});
