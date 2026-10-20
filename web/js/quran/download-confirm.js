/** Confirmation windows for downloading and deleting surahs, with the size read from the server. */
const SIZE_LOOKUPS_AT_ONCE = 6;

Object.assign(App.prototype, {
  async confirmSurahDownload(reciter, moshaf, surah) {
    if (!navigator.onLine) {
      this.showToast(this.t.downloadNeedsInternet);
      return;
    }
    const name = `${this.t.surahPrefix} ${this.surahName(surah)}`;
    const ok = await this._confirmWithSize({
      title: this.t.downloadSurah,
      message: this.t.downloadSurahMessage
        .replace('{name}', name).replace('{reciter}', reciter.name).replace('{riwaya}', this.moshafLabel(moshaf)),
      confirmText: this.t.downloadBtn
    }, [window.QRQuranModel.surahUrl(moshaf, surah)]);
    if (ok) this.queueSurahDownload(reciter, moshaf, surah);
  },

  confirmDelete(message) {
    return this.confirmDialog({ title: this.t.deleteDownload, message, confirmText: this.t.deleteDownload, danger: true });
  },

  // Opens the window at once; the size line fills in when the HEAD requests answer
  _confirmWithSize(options, urls) {
    const token = (this.sizeToken || 0) + 1;
    this.sizeToken = token;
    const answer = this.confirmDialog({ ...options, details: this.t.downloadSizeLoading });
    this._totalSize(urls).then((bytes) => {
      if (this.sizeToken !== token || !this.confirmResolve) return;
      this.setConfirmDetails(bytes
        ? this.t.downloadSize.replace('{size}', this.formatBytes(bytes))
        : this.t.downloadSizeUnknown);
    });
    return answer;
  },

  // Sum of Content-Length over the files, a few requests at a time; 0 when any size is unknown
  async _totalSize(urls) {
    const sizes = [];
    let next = 0;
    const worker = async () => {
      while (next < urls.length) {
        const url = urls[next++];
        sizes.push(await this._remoteSize(url));
      }
    };
    await Promise.all(Array.from({ length: Math.min(SIZE_LOOKUPS_AT_ONCE, urls.length) }, worker));
    return sizes.every((size) => size > 0) ? sizes.reduce((sum, size) => sum + size, 0) : 0;
  },

  async _remoteSize(url) {
    this.remoteSizes = this.remoteSizes || new Map();
    if (this.remoteSizes.has(url)) return this.remoteSizes.get(url);
    let size = 0;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      size = response.ok ? Number(response.headers.get('Content-Length')) || 0 : 0;
    } catch (err) { /* unknown size */ }
    if (size) this.remoteSizes.set(url, size);
    return size;
  }
});
