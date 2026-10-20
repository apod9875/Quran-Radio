/** Volume controls (desktop panel and full player): one slider, mute button and percentage each. */
Object.assign(App.prototype, {
  _bindVolumeControls() {
    this.volumeControls = [...document.querySelectorAll('[data-volume-control]')];
    if (!this.player.supportsVolume) {
      // Nothing to control here (iOS): the hardware volume buttons do it
      this.volumeControls.forEach((control) => { control.hidden = true; });
      return;
    }
    this.volumeControls.forEach((control) => {
      control.querySelector('[data-volume-slider]').addEventListener('input', (e) => {
        this.player.setVolume(parseFloat(e.target.value));
      });
      control.querySelector('[data-volume-mute]').addEventListener('click', () => this.player.toggleMute());
    });
    this.player.onVolumeChange(() => this._renderVolume());
    this._renderVolume();
  },

  _renderVolume() {
    const { volume, muted } = this.player;
    const silent = muted || volume === 0;
    const shown = muted ? 0 : volume;
    const percent = Math.round(shown * 100);
    const icons = window.SvgIcons;
    const icon = silent ? icons.volumeMute(22) : (volume < 0.5 ? icons.volumeLow(22) : icons.volumeHigh(22));
    const label = silent ? this.t.unmuteLabel : this.t.muteLabel;

    this.volumeControls.forEach((control) => {
      const slider = control.querySelector('[data-volume-slider]');
      const button = control.querySelector('[data-volume-mute]');
      slider.value = shown;
      slider.style.setProperty('--vol', `${percent}%`);
      slider.setAttribute('aria-valuetext', `${percent}%`);
      control.querySelector('[data-volume-value]').textContent = `${percent}%`;
      control.classList.toggle('is-muted', silent);
      button.innerHTML = icon;
      button.setAttribute('aria-label', label);
      button.title = label;
      button.setAttribute('aria-pressed', String(silent));
    });
  }
});
