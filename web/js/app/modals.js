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
    bind(d.cacheBtn, () => this.openCacheModal());
    bind(d.closeCacheBtn, () => this.closeCacheModal());
    bind(d.closeCacheDoneBtn, () => this.closeCacheModal());
    bind(d.refreshUnusedCacheBtn, () => this.refreshUnusedCache());
    bind(d.clearAllCacheBtn, () => this.clearAllCache());

    const playSavedRow = (e) => {
      const row = e.target.closest('.cached-item-row');
      const station = row && this.stationsById.get(Number(row.dataset.stationId));
      if (!station) return;
      this.closeCacheModal();
      this.playOrToggle(station);
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
  openTimerModal() { this.dom.timerModal.classList.add('active'); },
  closeTimerModal() { this.dom.timerModal.classList.remove('active'); },
  closeDevicesModal() { this.dom.devicesModal.classList.remove('active'); },
  closeCacheModal() { this.dom.cacheModal.classList.remove('active'); },

  openCacheModal() {
    this.dom.cacheStationsCountText.textContent =
      this.t.cacheStationsCount.replace('{count}', this.cachedIds.size);
    this.updateCacheModalMetrics();
    this.dom.cacheModal.classList.add('active');
  },

  openDevicesModal() {
    const { escapeHtml } = window.QRUtils;
    const detector = window.DeviceDetector;
    const isArabic = this.lang === 'ar';
    const diag = detector.getScreenDiagnostics();

    this.dom.diagResolution.textContent = `${diag.width} x ${diag.height} @${diag.dpr}x`;
    this.dom.diagCategory.textContent = isArabic ? diag.category : diag.categoryEn;
    this.dom.diagOrientation.textContent = diag.orientation;
    this.dom.diagTouch.textContent = diag.isTouch;
    this.dom.devicesContainer.innerHTML = detector.SUPPORTED_DEVICES.map((device) => `
      <div class="device-item-card">
        <div class="device-item-icon">${device.icon}</div>
        <div class="device-item-content">
          <div class="device-item-title">${escapeHtml(isArabic ? device.nameAr : device.nameEn)}</div>
          <div class="device-item-examples">${escapeHtml(device.examples)}</div>
          <span class="device-status-badge">${escapeHtml(isArabic ? device.status : device.statusEn)}</span>
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
