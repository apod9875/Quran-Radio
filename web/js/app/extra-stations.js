/**
 * The radio channels (not in the mp3quran radio list): pinned to the top in this order and listed on
 * their own "Radio Channels" tab (category CHANNELS).
 * `mirrors`: the same broadcast from several hosts; the player starts on the one that has been fastest on
 * this device and fails over to the next (js/player/mirrors.js). `format: 'hls'`: a live HLS video
 * broadcast played as sound only (js/player/hls.js).
 */
window.QR_EXTRA_STATIONS = [
  {
    id: 900001,
    mirrors: ['https://stream.radiojar.com/8s5u5tpdtwzuv', 'https://radio.xecod.com/station/quran-cairo'],
    names: { ar: 'إذاعة القرآن الكريم من القاهرة', eng: 'Holy Quran Radio from Cairo' }
  },
  {
    id: 900002,
    mirrors: ['https://edge.mixlr.com/channel/rwumx', 'https://stream.radiojar.com/4wqre23fytzuv'],
    names: { ar: 'إذاعة القرآن الكريم من مكة المكرمة', eng: 'Holy Quran Radio from Makkah' }
  },
  {
    id: 900003,
    format: 'hls',
    mirrors: ['https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8', 'https://win.holol.com/live/quran/playlist.m3u8'],
    names: { ar: 'البث المباشر من المسجد الحرام', eng: 'Live from Masjid al-Haram' }
  },
  {
    id: 900004,
    format: 'hls',
    mirrors: ['https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8', 'https://win.holol.com/live/sunnah/playlist.m3u8'],
    names: { ar: 'البث المباشر من المسجد النبوي', eng: 'Live from Masjid an-Nabawi' }
  },
  {
    // Bahrain Quran 106.1 FM from its broadcaster's own server: the source stream first, the stream group as fallback
    id: 900005,
    format: 'hls',
    audioOnly: true, // real audio stream: no "video, uses more data" note
    mirrors: [
      'https://5c7b683162943.streamlock.net/live/radio-106-1/playlist.m3u8',
      'https://5c7b683162943.streamlock.net/live/ngrp:radio-106-1_all/playlist.m3u8'
    ],
    names: { ar: 'إذاعة القرآن الكريم من البحرين', eng: 'Holy Quran Radio from Bahrain' }
  }
];
