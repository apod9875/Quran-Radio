/** Collects every element the app touches, once, by id. */
window.QR_cacheDom = function () {
  const ids = [
    'appTitle', 'appDedication', 'langBtnText', 'langBtnShort', 'langToggleBtn', 'infoBtn', 'installBtn',
    'devicesBtn', 'cacheBtn', 'offlineBanner', 'offlineBannerText',
    'searchInput', 'clearSearchBtn', 'stationsCountBadge', 'categoriesBar', 'riwayaBar', 'stationsContainer',
    'heroTitle', 'heroCategory', 'heroIndicatorText', 'heroPlayBtn', 'heroPrevBtn', 'heroNextBtn',
    'heroFavBtn', 'heroTimerBtn', 'heroShareBtn', 'heroTimerBadge', 'fullTimerBadge',
    'mobilePlayerBar', 'mobileBarTitle', 'mobileBarStatus', 'mobileBarPlayBtn', 'mobileBarFavBtn',
    'mobileFullPlayerOverlay', 'closeFullPlayerBtn', 'fullPlayerTitle', 'fullPlayerCategory',
    'fullPlayerPlayBtn', 'fullPlayerPrevBtn', 'fullPlayerNextBtn', 'fullPlayerFavBtn',
    'fullPlayerTimerBtn',
    'toastNotification',
    'aboutModal', 'closeAboutBtn', 'doneAboutBtn',
    'devicesModal', 'closeDevicesBtn', 'closeDevicesDoneBtn', 'devicesContainer',
    'diagResolution', 'diagCategory', 'diagOrientation', 'diagTouch',
    'timerModal', 'closeTimerBtn', 'cancelTimerBtn', 'customTimerInput', 'applyCustomTimerBtn',
    'timerGrid', 'timerRemainingText',
    'cacheUsageText', 'cacheStationsCountText', 'clearAllCacheBtn',
    'confirmModal', 'confirmTitle', 'confirmMessage', 'confirmDetails', 'confirmOkBtn', 'confirmCancelBtn',
    'updateBanner', 'updateNowBtn', 'updateLaterBtn',
    'whatsNewModal', 'whatsNewList', 'whatsNewOkBtn', 'whatsNewCloseBtn', 'whatsNewBtn',
    'bottomNav', 'miniProgressFill', 'fullPlayerHeading',
    'recitersView', 'continueCard', 'reciterSearch', 'recitersCount', 'reciterFilterBar', 'letterBar', 'recitersList',
    'reciterView', 'reciterTitle', 'reciterSubtitle', 'reciterFavBtn', 'moshafBar', 'playAllBtn', 'downloadAllBtn',
    'surahSearch', 'surahList',
    'savedView', 'downloadQueue', 'savedSurahsList'
  ];

  const dom = { html: document.documentElement };
  ids.forEach((id) => { dom[id] = document.getElementById(id); });

  // Short aliases used throughout the app
  dom.mobileBar = dom.mobilePlayerBar;
  dom.mobileFullPlayer = dom.mobileFullPlayerOverlay;
  dom.toast = dom.toastNotification;
  return dom;
};
