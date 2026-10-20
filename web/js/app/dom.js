/** Collects every element the app touches, once, by id. */
window.QR_cacheDom = function () {
  const ids = [
    'appTitle', 'appDedication', 'langBtnText', 'langBtnShort', 'langToggleBtn', 'infoBtn', 'installBtn',
    'devicesBtn', 'cacheBtn', 'offlineBanner', 'offlineBannerText',
    'searchInput', 'clearSearchBtn', 'stationsCountBadge', 'categoriesBar', 'stationsContainer',
    'heroTitle', 'heroCategory', 'heroIndicatorText', 'heroPlayBtn', 'heroPrevBtn', 'heroNextBtn',
    'heroFavBtn', 'heroTimerBtn', 'heroShareBtn', 'heroVolumeSlider', 'heroTimerBadge', 'fullTimerBadge',
    'mobilePlayerBar', 'mobileBarTitle', 'mobileBarStatus', 'mobileBarPlayBtn', 'mobileBarFavBtn',
    'mobileFullPlayerOverlay', 'closeFullPlayerBtn', 'fullPlayerTitle', 'fullPlayerCategory',
    'fullPlayerPlayBtn', 'fullPlayerPrevBtn', 'fullPlayerNextBtn', 'fullPlayerFavBtn',
    'fullPlayerTimerBtn', 'fullPlayerVolumeSlider',
    'toastNotification',
    'aboutModal', 'closeAboutBtn', 'doneAboutBtn',
    'devicesModal', 'closeDevicesBtn', 'closeDevicesDoneBtn', 'devicesContainer',
    'diagResolution', 'diagCategory', 'diagOrientation', 'diagTouch',
    'timerModal', 'closeTimerBtn', 'cancelTimerBtn', 'customTimerInput', 'applyCustomTimerBtn',
    'timerGrid', 'timerRemainingText',
    'cacheModal', 'closeCacheBtn', 'closeCacheDoneBtn', 'cacheUsageText', 'cacheProgressBar',
    'cacheStationsCountText', 'refreshUnusedCacheBtn', 'clearAllCacheBtn', 'cachedStationsList'
  ];

  const dom = { html: document.documentElement };
  ids.forEach((id) => { dom[id] = document.getElementById(id); });

  // Short aliases used throughout the app
  dom.mobileBar = dom.mobilePlayerBar;
  dom.mobileFullPlayer = dom.mobileFullPlayerOverlay;
  dom.toast = dom.toastNotification;
  return dom;
};
