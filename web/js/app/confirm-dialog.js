/** A real confirmation window (instead of window.confirm / alert). confirmDialog() resolves true / false. */
Object.assign(App.prototype, {
  _bindConfirmDialog() {
    const d = this.dom;
    d.confirmOkBtn.addEventListener('click', () => this._closeConfirm(true));
    d.confirmCancelBtn.addEventListener('click', () => this._closeConfirm(false));
    d.confirmModal.addEventListener('click', (e) => {
      if (e.target === d.confirmModal) this._closeConfirm(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.confirmResolve) this._closeConfirm(false);
    });
  },

  // details: an extra line that can be filled in later with setConfirmDetails (e.g. a size)
  confirmDialog({ title, message, details = '', confirmText, cancelText, danger = false }) {
    const d = this.dom;
    if (this.confirmResolve) this._closeConfirm(false);
    d.confirmTitle.textContent = title;
    d.confirmMessage.textContent = message;
    this.setConfirmDetails(details);
    d.confirmOkBtn.textContent = confirmText || this.t.confirmOk;
    d.confirmCancelBtn.textContent = cancelText || this.t.confirmCancel;
    d.confirmOkBtn.classList.toggle('is-danger', danger);
    d.confirmModal.classList.add('active');
    d.confirmOkBtn.focus({ preventScroll: true });
    return new Promise((resolve) => { this.confirmResolve = resolve; });
  },

  setConfirmDetails(text) {
    this.dom.confirmDetails.textContent = text || '';
    this.dom.confirmDetails.hidden = !text;
  },

  _closeConfirm(result) {
    this.dom.confirmModal.classList.remove('active');
    const resolve = this.confirmResolve;
    this.confirmResolve = null;
    if (resolve) resolve(result);
  }
});
