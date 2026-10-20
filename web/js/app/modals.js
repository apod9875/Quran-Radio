/** Modals and the full-screen player: open, close, Escape and click-outside. */
Object.assign(App.prototype, {
  _bindModalEvents() {
    const d = this.dom;
    const bind = (button, handler) => button.addEventListener('click', handler);

    bind(d.infoBtn, () => this.openAboutModal());
    bind(d.closeAboutBtn, () => this.closeAboutModal());
    bind(d.doneAboutBtn, () => this.closeAboutModal());
    bind(d.devicesBtn, () => this.openDevicesModal());
    bind(d.closeDevicesBtn, () => this.closeDevicesModal());
    bind(d.closeDevicesDoneBtn, () => this.closeDevicesModal());
    bind(d.closeTimerBtn, () => this.closeTimerModal());
    bind(d.cacheBtn, () => { window.location.hash = '#/saved'; });
    bind(d.refreshUnusedCacheBtn, () => this.refreshUnusedCache());
    bind(d.clearAllCacheBtn, () => this.clearAllCache());

    const playSavedRow = (e) => {
      const row = e.target.closest('.cached-item-row');
      const station = row && this.stationsById.get(Number(row.dataset.stationId));
      if (station) this.playOrToggle(station);
    };
    d.cachedStationsList.addEventListener('click', playSavedRow);
    d.cachedStationsList.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playSavedRow(e); }
    });

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
      this.closeMobileFullPlayer();
    });
  },

  openAboutModal() { this.dom.aboutModal.classList.add('active'); },
  closeAboutModal() { this.dom.aboutModal.classList.remove('active'); },
  openTimerModal() {
    const track = this.player.currentStation;
    this.dom.timerGrid.querySelector('.timer-chip-end').hidden = !(track && track.kind === 'surah');
    this.dom.timerModal.classList.add('active');
  },
  closeTimerModal() { this.dom.timerModal.classList.remove('active'); },
  closeDevicesModal() { this.dom.devicesModal.classList.remove('active'); },

  openDevicesModal() {
    const { escapeHtml } = window.QRUtils;
    const detector = window.DeviceDetector;
    const diag = detector.getScreenDiagnostics();

    this.dom.diagResolution.textContent = `${diag.width} x ${diag.height} @${diag.dpr}x`;
    this.dom.diagCategory.textContent = diag.category;
    this.dom.diagOrientation.textContent = diag.orientation;
    this.dom.diagTouch.textContent = diag.isTouch;
    this.dom.devicesContainer.innerHTML = detector.SUPPORTED_DEVICES.map((device) => `
      <div class="device-item-card">
        <div class="device-item-icon">${device.icon}</div>
        <div class="device-item-content">
          <div class="device-item-title">${escapeHtml(device.nameAr)}</div>
          <div class="device-item-examples">${escapeHtml(device.examples)}</div>
          <span class="device-status-badge">${escapeHtml(device.status)}</span>
        </div>
      </div>`).join('');
    this.dom.devicesModal.classList.add('active');
  },

  openMobileFullPlayer() {
    if (this.player.currentStation) this.dom.mobileFullPlayer.classList.add('active');
  },

  closeMobileFullPlayer() {
    this.dom.mobileFullPlayer.classList.remove('active');
  }
});
