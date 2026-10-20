/** Loads the reciters and surah names from the mp3quran API once (the service worker keeps a copy offline). */
const QURAN_API = 'https://www.mp3quran.net/api/v3';
const QURAN_TIMEOUT_MS = 15000;

Object.assign(App.prototype, {
  loadQuranCatalog() {
    if (this.quran) return Promise.resolve(this.quran);
    if (!this.quranLoading) {
      this.quranLoading = Promise.all([this._fetchQuranJson('reciters'), this._fetchQuranJson('suwar')])
        .then(([recitersData, suwarData]) => {
          const model = window.QRQuranModel;
          const reciters = model.parseReciters(recitersData.reciters);
          const moshafs = new Map();
          reciters.forEach((reciter) => reciter.moshafs.forEach((moshaf) => moshafs.set(moshaf.id, { reciter, moshaf })));
          this.quran = {
            reciters,
            byId: new Map(reciters.map((r) => [r.id, r])),
            moshafs,
            suwar: model.parseSuwar(suwarData.suwar)
          };
          return this.quran;
        })
        .catch((err) => {
          this.quranLoading = null; // allow a retry
          throw err;
        });
    }
    return this.quranLoading;
  },

  async _fetchQuranJson(endpoint) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), QURAN_TIMEOUT_MS);
    try {
      const response = await fetch(`${QURAN_API}/${endpoint}?language=ar`, { signal: controller.signal });
      if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  },

  surahName(number) {
    const surah = this.quran && this.quran.suwar.get(number);
    return surah ? surah.name : String(number);
  },

  surahIsMakki(number) {
    const surah = this.quran && this.quran.suwar.get(number);
    return surah ? surah.makkia : false;
  },

  // One line for a mushaf chip / subtitle: "ورش عن نافع · مجود"
  moshafLabel(moshaf) {
    return moshaf.style && moshaf.style !== 'مرتل' ? `${moshaf.riwaya} · ${moshaf.style}` : moshaf.riwaya;
  }
});
