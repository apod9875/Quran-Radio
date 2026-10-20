/**
 * "What's new": after an update the user sees, once, the release notes of every version newer than the
 * last one they saw (js/app/releases.js). A first visit shows nothing; the About window can open the
 * latest notes at any time.
 */
const SEEN_VERSION_KEY = 'qr_seen_version';
const MAX_RELEASES_SHOWN = 3;

Object.assign(App.prototype, {
  _bindWhatsNew() {
    const d = this.dom;
    const close = () => this._closeWhatsNew();
    d.whatsNewOkBtn.addEventListener('click', close);
    d.whatsNewCloseBtn.addEventListener('click', close);
    d.whatsNewModal.addEventListener('click', (e) => { if (e.target === d.whatsNewModal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.whatsNewResolve) close(); });
    d.whatsNewBtn.addEventListener('click', () => {
      this.closeAboutModal();
      this.openWhatsNew((window.QR_RELEASES || []).slice(0, 1));
    });
  },

  // Releases the user has not seen yet; [] on a first visit (everything is new, nothing to announce)
  _unseenReleases() {
    const releases = window.QR_RELEASES || [];
    if (!releases.length) return [];
    const { readStorage, writeStorage } = window.QRUtils;
    const seen = readStorage(SEEN_VERSION_KEY);
    if (!seen) {
      // Someone who used the app before this feature existed still gets the notes once
      const returning = ['qr_lang', 'mp3quran_favs', 'mp3quran_volume', 'qr_now_playing', 'qr_last_surah']
        .some((key) => readStorage(key) !== null);
      if (!returning) {
        writeStorage(SEEN_VERSION_KEY, releases[0].version);
        return [];
      }
      return releases.slice(0, 1);
    }
    const newer = releases.filter((r) => window.QRUtils.compareVersions(r.version, seen) > 0);
    return newer.slice(0, MAX_RELEASES_SHOWN);
  },

  // Resolves when the window is closed (or at once when there is nothing new)
  showWhatsNewIfUpdated() {
    const unseen = this._unseenReleases();
    if (!unseen.length) return Promise.resolve();
    return this.openWhatsNew(unseen);
  },

  openWhatsNew(releases) {
    const { escapeHtml } = window.QRUtils;
    const lang = this.lang;
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    this.dom.whatsNewList.innerHTML = releases.map((r) => {
      const date = new Date(`${r.date}T12:00:00`).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
      return `
        <div class="whats-new-release">
          <div class="whats-new-version">${escapeHtml(this.t.versionLabel).replace('{version}', `<bdi dir="ltr">${escapeHtml(r.version)}</bdi>`)} · <bdi>${escapeHtml(date)}</bdi></div>
          <ul>${(r[lang] || r.ar).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
        </div>`;
    }).join('');
    this.dom.whatsNewModal.classList.add('active');
    this.dom.whatsNewOkBtn.focus({ preventScroll: true });
    return new Promise((resolve) => { this.whatsNewResolve = resolve; });
  },

  _closeWhatsNew() {
    const releases = window.QR_RELEASES || [];
    if (releases.length) window.QRUtils.writeStorage(SEEN_VERSION_KEY, releases[0].version);
    this.dom.whatsNewModal.classList.remove('active');
    const resolve = this.whatsNewResolve;
    this.whatsNewResolve = null;
    if (resolve) resolve();
  }
});
