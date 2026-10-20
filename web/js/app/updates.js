/**
 * Telling users about updates.
 * - A new version: the service worker installs it in the background (skipWaiting + clients.claim), so a
 *   controller change on a page that already had one means new code is waiting; a banner offers
 *   "update now", which reloads (whatever plays resumes after the reload, see resume.js).
 * - A new app icon: installed apps keep their icon until the user approves the change (Chrome) or
 *   reinstalls (iPhone), so installed users are told once how to get it. Bump ICON_VERSION with every
 *   new icon artwork (and give the icon files new names, see scripts/make-icons.py).
 */
const ICON_VERSION = 2;
const UPDATE_CHECK_MS = 30 * 60 * 1000;

Object.assign(App.prototype, {
  _setupUpdates(registration) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) this.showUpdateBanner(); // the first install is not an update
    });

    // Long sessions (radio left playing) and reopened apps look for a new deploy too
    let lastCheck = Date.now();
    const check = () => {
      lastCheck = Date.now();
      registration.update().catch(() => {});
    };
    setInterval(check, UPDATE_CHECK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > 5 * 60 * 1000) check();
    });
  },

  _bindUpdateBanner() {
    this.dom.updateNowBtn.addEventListener('click', () => window.location.reload());
    this.dom.updateLaterBtn.addEventListener('click', () => { this.dom.updateBanner.hidden = true; });
  },

  showUpdateBanner() {
    this.dom.updateBanner.hidden = false;
  },

  _isInstalledApp() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  },

  // Once per icon version, only inside the installed app (a browser tab has no home-screen icon)
  async showIconNotice() {
    const { readStorage, writeStorage } = window.QRUtils;
    if (!this._isInstalledApp() || readStorage('qr_icon_notice') === String(ICON_VERSION)) return;
    const ua = navigator.userAgent;
    const t = this.t;
    let message = t.iconNoticeDesktop;
    if (/iPhone|iPad|iPod/i.test(ua)) message = t.iconNoticeIos;
    else if (/Android/i.test(ua)) message = t.iconNoticeAndroid;
    const ok = await this.confirmDialog({ title: t.iconNoticeTitle, message, confirmText: t.iconNoticeOk, cancelText: t.later });
    if (ok) writeStorage('qr_icon_notice', String(ICON_VERSION)); // "later" shows it again next time
  }
});
