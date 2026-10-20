/**
 * Stations that are not in the mp3quran API. Ids start far above the API ids so favorites and
 * saved offline samples never clash. Pinned stations stay at the top of the list.
 * Source: radio-browser.info lists the official Egyptian Quran radio on radiojar.
 */
window.QR_EXTRA_STATIONS = [
  {
    id: 900001,
    url: 'https://stream.radiojar.com/8s5u5tpdtwzuv',
    pinned: true,
    names: { ar: 'إذاعة القرآن الكريم من القاهرة', eng: 'Holy Quran Radio from Cairo' }
  }
];
