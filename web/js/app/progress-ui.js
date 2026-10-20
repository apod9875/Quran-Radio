/** Seek bar, ±10 s, speed chip and the mini-player progress line (shown for surahs only). */
Object.assign(App.prototype, {
  _bindProgressUi() {
    this.seekControls = [...document.querySelectorAll('[data-seek-control]')];
    this.surahExtras = [...document.querySelectorAll('[data-surah-extras]')];
    const format = window.QRQuranModel.formatTime;

    this.seekControls.forEach((control) => {
      const slider = control.querySelector('[data-seek-slider]');
      // While dragging only the label follows the thumb; the jump happens on release
      slider.addEventListener('input', () => {
        this.isSeeking = true;
        control.querySelector('[data-seek-current]').textContent = format(slider.value);
        this._paintSeek(slider);
      });
      slider.addEventListener('change', () => {
        this.isSeeking = false;
        this.player.seek(Number(slider.value));
      });
    });

    this.surahExtras.forEach((extras) => {
      extras.addEventListener('click', (e) => {
        const skip = e.target.closest('[data-seek-by]');
        if (skip) this.player.seekBy(Number(skip.dataset.seekBy));
        if (e.target.closest('[data-rate-chip]')) {
          this.player.cycleRate();
          this._renderRate();
        }
      });
    });

    this.player.onProgress((progress) => this._renderProgress(progress));
    this._renderRate();
  },

  // Called whenever the track changes: surahs get the seek bar, live radio does not
  _renderTrackKind(track) {
    const isSurah = !!track && track.kind === 'surah';
    document.body.classList.toggle('track-surah', isSurah);
    this.dom.fullPlayerHeading.textContent = isSurah ? this.t.surahPlayerHeading : this.t.fullPlayerHeading;
    this.seekControls.forEach((control) => { control.hidden = !isSurah; });
    this.surahExtras.forEach((extras) => { extras.hidden = !isSurah; });
    if (!isSurah) this.dom.miniProgressFill.style.width = '0%';
  },

  _renderProgress({ current, duration, seekable }) {
    if (!seekable) return;
    const format = window.QRQuranModel.formatTime;
    const percent = duration ? Math.min(100, (current / duration) * 100) : 0;
    this.dom.miniProgressFill.style.width = `${percent}%`;
    if (this.isSeeking) return;
    this.seekControls.forEach((control) => {
      const slider = control.querySelector('[data-seek-slider]');
      slider.max = String(Math.floor(duration || 0));
      slider.value = String(Math.floor(current));
      slider.setAttribute('aria-valuetext', `${format(current)} / ${format(duration)}`);
      control.querySelector('[data-seek-current]').textContent = format(current);
      control.querySelector('[data-seek-duration]').textContent = format(duration);
      this._paintSeek(slider);
    });
  },

  _paintSeek(slider) {
    const max = Number(slider.max) || 0;
    const percent = max ? (Number(slider.value) / max) * 100 : 0;
    slider.style.setProperty('--seek', `${percent}%`);
  },

  _renderRate() {
    document.querySelectorAll('[data-rate-chip] bdi').forEach((label) => {
      label.textContent = `${this.player.rate}×`;
    });
  }
});
