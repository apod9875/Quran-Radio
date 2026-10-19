(function() {
  const TRANSLATIONS = {
    ar: {
      appTitle: "إذاعة القرآن الكريم",
      dedication: "صدقة جارية لـ ( عبدالرحيم معبد ) • Mabed",
      searchPlaceholder: "ابحث عن قارئ أو إذاعة...",
      all: "الكل",
      popular: "مشاهير القراء",
      riwayat: "الروايات",
      tafseer: "تفسير وفتاوى",
      translations: "ترجمات المعاني",
      favorites: "المفضلة",
      connecting: "جاري الاتصال بالبث...",
      live: "بث مباشر الآن",
      paused: "متوقف مؤقتاً",
      selectPrompt: "اختر إذاعة لبدء الاستماع المبارك",
      installApp: "تثبيت التطبيق",
      aboutTitle: "حول التطبيق والإهداء",
      sadaqahTitle: "صدقة جارية لـ ( عبدالرحيم معبد )",
      sadaqahDua: "اللهم اغفر له وارحمه وعافه واعف عنه وأكرم نزله ووسع مدخله واجعله في الفردوس الأعلى من الجنة",
      developedBy: "تطوير وبرمجة",
      githubRepo: "مستودع الكود على GitHub",
      webApp: "تطبيق الويب الرسمي",
      sleepTimerTitle: "مؤقت النوم",
      sleepTimerDesc: "اختر المدة أو اكتبها بالدقائق لإيقاف البث تلقائياً:",
      sleepIn: "المتبقي على الإيقاف: ",
      turnOffTimer: "إلغاء المؤقت",
      setCustomTimer: "تطبيق المدة",
      customMinutesPlaceholder: "أدخل الدقائق (مثلاً 25)",
      close: "إغلاق",
      minutes: "دقيقة",
      noResults: "لا توجد إذاعات مطابقة لبحثك",
      reciterDetails: "معلومات القارئ والإذاعة",
      origin: "البلد والمنشأ",
      era: "الفترة الزمنية",
      riwayahLabel: "الرواية / التخصص",
      bioLabel: "نبذة عن القارئ",
      stationsCount: "إذاعة متاحة",
      favAddedToast: "❤️ تمت الإضافة للمفضلة والحفظ في ذاكرة الـ 10GB للاستماع دون انترنت",
      favRemovedToast: "🤍 تم الإزالة من المفضلة",
      cacheTitle: "ذاكرة الصوتيات والاستماع دون انترنت (10 GB)",
      cacheBtnLabel: "ذاكرة 10GB",
      cacheRefreshedToast: "🔄 تم تحديث وتنظيف الصوتيات القديمة غير المستخدمة بنجاح",
      cacheClearedToast: "🗑️ تم مسح الذاكرة المؤقتة بالكامل",
      precacheSuccessToast: "⚡ تم حفظ الإذاعة في الذاكرة بنجاح للاستماع دون انترنت",
      offlineNotice: "وضع عدم الاتصال بالإنترنت • يتم تشغيل الإذاعات المحفوظة في ذاكرة الـ 10 جيجابايت",
      offlineReadyBadge: "متاح دون انترنت",
      precacheStationTitle: "حفظ للاستماع دون انترنت"
    },
    eng: {
      appTitle: "MP3Quran Live Radio",
      dedication: "Sadaqah Jariyah for Abdulrahim Mabed • Mabed",
      searchPlaceholder: "Search reciter or station...",
      all: "All",
      popular: "Top Reciters",
      riwayat: "Recitations",
      tafseer: "Tafseer & Fatwa",
      translations: "Translations",
      favorites: "Favorites",
      connecting: "Connecting...",
      live: "LIVE 24/7",
      paused: "PAUSED",
      selectPrompt: "Select a radio station to begin streaming",
      installApp: "Install App",
      aboutTitle: "About & Dedication",
      sadaqahTitle: "Sadaqah Jariyah for (Abdulrahim Mabed)",
      sadaqahDua: "May Allah grant him mercy, forgiveness, and the highest ranks in Jannah.",
      developedBy: "Developed by",
      githubRepo: "GitHub Repository",
      webApp: "Official Web App",
      sleepTimerTitle: "Sleep Timer",
      sleepTimerDesc: "Choose preset or enter custom minutes to stop playback:",
      sleepIn: "Auto-stop in: ",
      turnOffTimer: "Turn Off Timer",
      setCustomTimer: "Set Timer",
      customMinutesPlaceholder: "Enter minutes (e.g. 25)",
      close: "Close",
      minutes: "min",
      noResults: "No stations found matching your search",
      reciterDetails: "Reciter & Station Details",
      origin: "Country & Origin",
      era: "Era / Lifespan",
      riwayahLabel: "Recitation / Specialty",
      bioLabel: "Biography",
      stationsCount: "Stations Available",
      favAddedToast: "❤️ Added to favorites & saved in 10GB cache for offline play",
      favRemovedToast: "🤍 Removed from favorites",
      cacheTitle: "Audio Cache & Offline Playback (10 GB)",
      cacheBtnLabel: "10GB Cache",
      cacheRefreshedToast: "🔄 Unused audio cache successfully refreshed and pruned",
      cacheClearedToast: "🗑️ Audio cache cleared completely",
      precacheSuccessToast: "⚡ Station audio cached for offline playback",
      offlineNotice: "Offline Mode • Playing cached audio from 10 GB storage",
      offlineReadyBadge: "Offline Ready",
      precacheStationTitle: "Save for offline playback"
    }
  };

  const CATEGORIES = [
    { id: 'ALL', key: 'all' },
    { id: 'POPULAR', key: 'popular' },
    { id: 'RIWAYAT', key: 'riwayat' },
    { id: 'TAFSEER', key: 'tafseer' },
    { id: 'TRANSLATIONS', key: 'translations' },
    { id: 'FAVORITES', key: 'favorites' }
  ];

  class App {
    constructor() {
      this.lang = localStorage.getItem('mp3quran_lang') || 'ar';
      this.activeCategory = 'ALL';
      this.searchQuery = '';
      this.stations = [];
      this.favorites = new Set(JSON.parse(localStorage.getItem('mp3quran_favs') || '[]'));
      this.cachedUrls = new Set();
      this.player = new window.AudioStreamPlayer();
      this.deferredInstallPrompt = null;

      this._cacheDom();
      this._bindEvents();
      this._setupPwaAndCaching();
      this._setupCategoryTouchDrag();
      this.applyLanguage(this.lang);
      this.fetchStations();
      this.checkOfflineStatus(!navigator.onLine);
    }

    _setupPwaAndCaching() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          if (reg) reg.update().catch(() => {});
          this.refreshCachedUrlsList();
        }).catch(e => console.warn('SW err:', e));
      }

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        this.dom.installBtn.style.display = 'inline-flex';
      });

      this.dom.installBtn.addEventListener('click', async () => {
        if (!this.deferredInstallPrompt) return;
        this.deferredInstallPrompt.prompt();
        const choice = await this.deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          this.dom.installBtn.style.display = 'none';
        }
        this.deferredInstallPrompt = null;
      });
    }

    refreshCachedUrlsList() {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data && event.data.items) {
          this.cachedUrls = new Set(event.data.items.map(it => it.url));
          this.renderStations();
        }
      };
      navigator.serviceWorker.controller.postMessage({ type: 'GET_CACHE_METRICS' }, [channel.port2]);
    }

    _syncLovedUrlsToServiceWorker() {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
      const lovedUrls = this.stations
        .filter(s => this.favorites.has(s.id))
        .map(s => s.url);

      lovedUrls.forEach(url => {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_FAVORITE_STATION',
          url: url,
          isFavorite: true
        });
      });
    }

    _cacheDom() {
      this.dom = {
        html: document.documentElement,
        appTitle: document.getElementById('appTitle'),
        appDedication: document.getElementById('appDedication'),
        langBtnText: document.getElementById('langBtnText'),
        langToggleBtn: document.getElementById('langToggleBtn'),
        infoBtn: document.getElementById('infoBtn'),
        installBtn: document.getElementById('installBtn'),
        devicesBtn: document.getElementById('devicesBtn'),
        cacheBtn: document.getElementById('cacheBtn'),
        cacheBtnLabel: document.getElementById('cacheBtnLabel'),
        offlineBanner: document.getElementById('offlineBanner'),
        offlineBannerText: document.getElementById('offlineBannerText'),

        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        stationsCountBadge: document.getElementById('stationsCountBadge'),
        categoriesBar: document.getElementById('categoriesBar'),
        stationsContainer: document.getElementById('stationsContainer'),
        
        // Hero Player (Desktop)
        heroTitle: document.getElementById('heroTitle'),
        heroCategory: document.getElementById('heroCategory'),
        heroIndicator: document.getElementById('heroIndicator'),
        heroIndicatorText: document.getElementById('heroIndicatorText'),
        heroPlayBtn: document.getElementById('heroPlayBtn'),
        heroPrevBtn: document.getElementById('heroPrevBtn'),
        heroNextBtn: document.getElementById('heroNextBtn'),
        heroFavBtn: document.getElementById('heroFavBtn'),
        heroTimerBtn: document.getElementById('heroTimerBtn'),
        heroShareBtn: document.getElementById('heroShareBtn'),
        heroVolumeSlider: document.getElementById('heroVolumeSlider'),
        heroTimerBadge: document.getElementById('heroTimerBadge'),
        heroDedication: document.getElementById('heroDedication'),
        
        // Mobile Player Bar
        mobileBar: document.getElementById('mobilePlayerBar'),
        mobileBarTitle: document.getElementById('mobileBarTitle'),
        mobileBarStatus: document.getElementById('mobileBarStatus'),
        mobileBarPlayBtn: document.getElementById('mobileBarPlayBtn'),
        mobileBarFavBtn: document.getElementById('mobileBarFavBtn'),

        // Mobile Full Player Overlay
        mobileFullPlayer: document.getElementById('mobileFullPlayerOverlay'),
        closeFullPlayerBtn: document.getElementById('closeFullPlayerBtn'),
        fullPlayerTitle: document.getElementById('fullPlayerTitle'),
        fullPlayerCategory: document.getElementById('fullPlayerCategory'),
        fullPlayerPlayBtn: document.getElementById('fullPlayerPlayBtn'),
        fullPlayerPrevBtn: document.getElementById('fullPlayerPrevBtn'),
        fullPlayerNextBtn: document.getElementById('fullPlayerNextBtn'),
        fullPlayerFavBtn: document.getElementById('fullPlayerFavBtn'),
        fullPlayerTimerBtn: document.getElementById('fullPlayerTimerBtn'),
        fullPlayerVolumeSlider: document.getElementById('fullPlayerVolumeSlider'),

        toast: document.getElementById('toastNotification'),

        // Modals
        aboutModal: document.getElementById('aboutModal'),
        closeAboutBtn: document.getElementById('closeAboutBtn'),
        doneAboutBtn: document.getElementById('doneAboutBtn'),
        timerModal: document.getElementById('timerModal'),
        closeTimerBtn: document.getElementById('closeTimerBtn'),
        cancelTimerBtn: document.getElementById('cancelTimerBtn'),
        customTimerInput: document.getElementById('customTimerInput'),
        applyCustomTimerBtn: document.getElementById('applyCustomTimerBtn'),
        timerGrid: document.getElementById('timerGrid'),
        timerRemainingText: document.getElementById('timerRemainingText'),

        // 10 GB Cache Modal
        cacheModal: document.getElementById('cacheModal'),
        closeCacheBtn: document.getElementById('closeCacheBtn'),
        closeCacheDoneBtn: document.getElementById('closeCacheDoneBtn'),
        cacheUsageText: document.getElementById('cacheUsageText'),
        cacheProgressBar: document.getElementById('cacheProgressBar'),
        cacheStationsCountText: document.getElementById('cacheStationsCountText'),
        refreshUnusedCacheBtn: document.getElementById('refreshUnusedCacheBtn'),
        clearAllCacheBtn: document.getElementById('clearAllCacheBtn'),
        cachedStationsList: document.getElementById('cachedStationsList'),

        // Reciter Bio Modal
        reciterModal: document.getElementById('reciterModal'),
        closeReciterBtn: document.getElementById('closeReciterBtn'),
        reciterAvatarImg: document.getElementById('reciterAvatarImg'),
        reciterNameText: document.getElementById('reciterNameText'),
        reciterTitleTag: document.getElementById('reciterTitleTag'),
        reciterOriginText: document.getElementById('reciterOriginText'),
        reciterEraText: document.getElementById('reciterEraText'),
        reciterRiwayahText: document.getElementById('reciterRiwayahText'),
        reciterBioBody: document.getElementById('reciterBioBody')
      };
    }

    _setupCategoryTouchDrag() {
      const slider = this.dom.categoriesBar;
      let isDown = false;
      let startX;
      let scrollLeft;

      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider.addEventListener('mouseleave', () => { isDown = false; });
      slider.addEventListener('mouseup', () => { isDown = false; });
      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
      });
    }

    showToast(message) {
      if (!this.dom.toast) return;
      this.dom.toast.textContent = message;
      this.dom.toast.classList.add('show');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.dom.toast.classList.remove('show');
      }, 3500);
    }

    checkOfflineStatus(isOffline) {
      if (!this.dom.offlineBanner) return;
      if (isOffline) {
        this.dom.offlineBanner.style.display = 'block';
        if (this.dom.offlineBannerText) {
          this.dom.offlineBannerText.textContent = TRANSLATIONS[this.lang].offlineNotice;
        }
      } else {
        this.dom.offlineBanner.style.display = 'none';
      }
    }

    _bindEvents() {
      this.dom.langToggleBtn.addEventListener('click', () => {
        const newLang = this.lang === 'ar' ? 'eng' : 'ar';
        this.applyLanguage(newLang);
        this.fetchStations();
      });

      // UNINTERRUPTED SEARCH: Typing never interrupts audio
      this.dom.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.dom.clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
        this.renderStations();
      });

      this.dom.clearSearchBtn.addEventListener('click', () => {
        this.dom.searchInput.value = '';
        this.searchQuery = '';
        this.dom.clearSearchBtn.style.display = 'none';
        this.renderStations();
      });

      // Desktop Hero Player controls
      this.dom.heroPlayBtn.addEventListener('click', () => this.player.togglePlayPause());
      this.dom.heroPrevBtn.addEventListener('click', () => this.playPrevious());
      this.dom.heroNextBtn.addEventListener('click', () => this.playNext());
      this.dom.heroFavBtn.addEventListener('click', () => {
        if (this.player.currentStation) this.toggleFavorite(this.player.currentStation.id);
      });
      this.dom.heroVolumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        this.player.setVolume(vol);
        if (this.dom.fullPlayerVolumeSlider) this.dom.fullPlayerVolumeSlider.value = vol;
      });
      this.dom.heroShareBtn.addEventListener('click', () => this.shareCurrentStation());
      this.dom.heroTimerBtn.addEventListener('click', () => this.openTimerModal());

      // Mobile player bar
      this.dom.mobileBarPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.player.togglePlayPause();
      });
      this.dom.mobileBarFavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.player.currentStation) this.toggleFavorite(this.player.currentStation.id);
      });
      this.dom.mobileBar.addEventListener('click', () => {
        this.openMobileFullPlayer();
      });

      // Mobile Full Player controls
      if (this.dom.closeFullPlayerBtn) {
        this.dom.closeFullPlayerBtn.addEventListener('click', () => this.closeMobileFullPlayer());
      }
      if (this.dom.fullPlayerPlayBtn) {
        this.dom.fullPlayerPlayBtn.addEventListener('click', () => this.player.togglePlayPause());
      }
      if (this.dom.fullPlayerPrevBtn) {
        this.dom.fullPlayerPrevBtn.addEventListener('click', () => this.playPrevious());
      }
      if (this.dom.fullPlayerNextBtn) {
        this.dom.fullPlayerNextBtn.addEventListener('click', () => this.playNext());
      }
      if (this.dom.fullPlayerFavBtn) {
        this.dom.fullPlayerFavBtn.addEventListener('click', () => {
          if (this.player.currentStation) this.toggleFavorite(this.player.currentStation.id);
        });
      }
      if (this.dom.fullPlayerTimerBtn) {
        this.dom.fullPlayerTimerBtn.addEventListener('click', () => this.openTimerModal());
      }
      if (this.dom.fullPlayerVolumeSlider) {
        this.dom.fullPlayerVolumeSlider.addEventListener('input', (e) => {
          const vol = parseFloat(e.target.value);
          this.player.setVolume(vol);
          this.dom.heroVolumeSlider.value = vol;
        });
      }

      // 10 GB Cache Manager Modal Bindings
      if (this.dom.cacheBtn) {
        this.dom.cacheBtn.addEventListener('click', () => this.openCacheModal());
      }
      if (this.dom.closeCacheBtn) {
        this.dom.closeCacheBtn.addEventListener('click', () => this.closeCacheModal());
      }
      if (this.dom.closeCacheDoneBtn) {
        this.dom.closeCacheDoneBtn.addEventListener('click', () => this.closeCacheModal());
      }
      if (this.dom.refreshUnusedCacheBtn) {
        this.dom.refreshUnusedCacheBtn.addEventListener('click', () => this.refreshUnusedCache());
      }
      if (this.dom.clearAllCacheBtn) {
        this.dom.clearAllCacheBtn.addEventListener('click', () => this.clearAllCache());
      }

      // About Modal
      this.dom.infoBtn.addEventListener('click', () => this.openAboutModal());
      this.dom.closeAboutBtn.addEventListener('click', () => this.closeAboutModal());
      this.dom.doneAboutBtn.addEventListener('click', () => this.closeAboutModal());

      // Reciter Modal
      if (this.dom.closeReciterBtn) {
        this.dom.closeReciterBtn.addEventListener('click', () => this.closeReciterModal());
      }

      // Sleep Timer Presets
      if (this.dom.closeTimerBtn) {
        this.dom.closeTimerBtn.addEventListener('click', () => this.closeTimerModal());
      }
      if (this.dom.cancelTimerBtn) {
        this.dom.cancelTimerBtn.addEventListener('click', () => {
          this.player.setSleepTimer(null);
          this.closeTimerModal();
        });
      }
      if (this.dom.timerGrid) {
        this.dom.timerGrid.querySelectorAll('.btn-timer-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const mins = parseInt(btn.dataset.mins, 10);
            this.player.setSleepTimer(mins);
            this.closeTimerModal();
          });
        });
      }
      if (this.dom.applyCustomTimerBtn && this.dom.customTimerInput) {
        this.dom.applyCustomTimerBtn.addEventListener('click', () => {
          const val = parseInt(this.dom.customTimerInput.value, 10);
          if (val && val > 0 && val <= 600) {
            this.player.setSleepTimer(val);
            this.closeTimerModal();
          } else {
            alert(this.lang === 'ar' ? 'الرجاء إدخال رقم صحيح بين 1 و 600 دقيقة' : 'Please enter minutes between 1 and 600');
          }
        });
      }

      // Player callbacks
      this.player.onStateChange((state, station) => {
        this._updatePlayerUi(state, station);
      });

      this.player.onTimerTick((seconds) => {
        this._updateTimerUi(seconds);
      });

      this.player.onOfflineChange((isOffline) => {
        this.checkOfflineStatus(isOffline);
      });
    }

    applyLanguage(lang) {
      this.lang = lang;
      localStorage.setItem('mp3quran_lang', lang);
      const t = TRANSLATIONS[lang];

      this.dom.html.lang = lang;
      this.dom.html.dir = lang === 'ar' ? 'rtl' : 'ltr';

      this.dom.appTitle.textContent = t.appTitle;
      this.dom.appDedication.textContent = t.dedication;
      this.dom.searchInput.placeholder = t.searchPlaceholder;
      this.dom.langBtnText.textContent = lang === 'ar' ? 'English' : 'عربي';

      if (this.dom.cacheBtnLabel) this.dom.cacheBtnLabel.textContent = t.cacheBtnLabel;
      if (this.dom.offlineBannerText) this.dom.offlineBannerText.textContent = t.offlineNotice;

      const installLabel = this.dom.installBtn.querySelector('.btn-label');
      if (installLabel) installLabel.textContent = t.installApp;

      if (this.dom.applyCustomTimerBtn) this.dom.applyCustomTimerBtn.textContent = t.setCustomTimer;

      this.renderCategories();
      this.renderStations();
    }

    renderCategories() {
      const t = TRANSLATIONS[this.lang];
      this.dom.categoriesBar.innerHTML = CATEGORIES.map(cat => {
        const activeClass = this.activeCategory === cat.id ? 'active' : '';
        return `<button class="cat-chip ${activeClass}" data-id="${cat.id}">${t[cat.key]}</button>`;
      }).join('');

      this.dom.categoriesBar.querySelectorAll('.cat-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeCategory = btn.dataset.id;
          this.renderCategories();
          this.renderStations();
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
      });
    }

    async fetchStations() {
      const fallbackList = (window.FALLBACK_STATIONS && window.FALLBACK_STATIONS[this.lang]) || [];
      try {
        const response = await fetch(`https://mp3quran.net/api/v3/radios?language=${this.lang}`);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        if (data && data.radios && data.radios.length > 0) {
          this.stations = data.radios.map(item => ({
            id: item.id,
            name: item.name.trim(),
            url: item.url.trim(),
            category: this._categorizeStation(item.name)
          }));
        } else {
          this.stations = this._processFallback(fallbackList);
        }
      } catch (err) {
        console.warn('Using fallback stations:', err);
        this.stations = this._processFallback(fallbackList);
      }
      this.renderStations();
      this._syncLovedUrlsToServiceWorker();
      this.refreshCachedUrlsList();
    }

    _processFallback(list) {
      return list.map(item => ({
        id: item.id,
        name: item.name,
        url: item.url,
        category: this._categorizeStation(item.name)
      }));
    }

    _categorizeStation(name) {
      const lower = name.toLowerCase();
      if (lower.includes('translation') || lower.includes('ترجمة') || lower.includes('english') || lower.includes('french')) {
        return 'TRANSLATIONS';
      }
      if (lower.includes('تفسير') || lower.includes('فتاو') || lower.includes('tafseer') || lower.includes('fatwa') || lower.includes('رقية')) {
        return 'TAFSEER';
      }
      if (lower.includes('ورش') || lower.includes('قالون') || lower.includes('warsh') || lower.includes('qaloon') || lower.includes('الدوري')) {
        return 'RIWAYAT';
      }
      return 'POPULAR';
    }

    renderStations() {
      const filtered = this.stations.filter(s => {
        const matchesCat = this.activeCategory === 'ALL' ||
          (this.activeCategory === 'FAVORITES' ? this.favorites.has(s.id) : s.category === this.activeCategory);
        const matchesQuery = !this.searchQuery || s.name.toLowerCase().includes(this.searchQuery);
        return matchesCat && matchesQuery;
      });

      // Update Live Stations Count Badge
      if (this.dom.stationsCountBadge) {
        const countText = this.lang === 'ar' 
          ? `عرض ${filtered.length} من أصل ${this.stations.length} إذاعة`
          : `Showing ${filtered.length} of ${this.stations.length} stations`;
        this.dom.stationsCountBadge.textContent = countText;
      }

      if (filtered.length === 0) {
        this.dom.stationsContainer.innerHTML = `
          <div style="text-align:center; padding: 40px 20px; color: var(--text-muted);">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">📻</div>
            <p>${TRANSLATIONS[this.lang].noResults}</p>
          </div>
        `;
        return;
      }

      const isPlaying = this.player.state === 'playing';
      const isBuffering = this.player.state === 'buffering';
      const currentId = this.player.currentStation ? this.player.currentStation.id : null;
      const t = TRANSLATIONS[this.lang];

      this.dom.stationsContainer.innerHTML = filtered.map((s, index) => {
        const isCurrent = currentId === s.id;
        const isFav = this.favorites.has(s.id);
        const isCached = this.cachedUrls.has(s.url);
        const activeClass = isCurrent ? 'active' : '';
        const reciter = window.findReciterForStation ? window.findReciterForStation(s.name) : null;
        const formattedIndex = String(index + 1).padStart(2, '0');

        return `
          <div class="station-card ${activeClass}" data-id="${s.id}">
            <div class="station-left">
              <span class="station-index-badge">#${formattedIndex}</span>
              <div class="reciter-thumb">
                <img src="${reciter ? reciter.avatar : 'icons/icon-512.png'}" alt="Reciter avatar" loading="lazy">
              </div>
              <div class="station-details">
                <div class="station-name">${s.name}</div>
                <div class="station-meta">
                  <span class="station-badge">${t[s.category.toLowerCase()] || s.category}</span>
                  ${isCached ? `
                    <span class="offline-ready-badge" title="محفوظ في ذاكرة الـ 10GB للاستماع دون انترنت">
                      ⚡ ${t.offlineReadyBadge}
                    </span>
                  ` : ''}
                  ${isCurrent && isPlaying ? `
                    <div class="mini-wave">
                      <div class="wave-bar"></div>
                      <div class="wave-bar"></div>
                      <div class="wave-bar"></div>
                      <div class="wave-bar"></div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="station-actions">
              <!-- Pre-cache for offline playback button -->
              <button class="btn-card-action" data-action="precache" title="${t.precacheStationTitle}">
                ${isCached 
                  ? (window.SvgIcons ? window.SvgIcons.cloudCheck(18) : '✅') 
                  : (window.SvgIcons ? window.SvgIcons.cloudDownload(18) : '💾')}
              </button>
              <button class="btn-card-action" data-action="info" title="Reciter Info">
                ${window.SvgIcons ? window.SvgIcons.info(18) : 'ℹ️'}
              </button>
              <button class="btn-card-action fav ${isFav ? 'active' : ''}" data-action="fav" title="Favorite">
                ${isFav ? (window.SvgIcons ? window.SvgIcons.heartFilled(18) : '❤️') : (window.SvgIcons ? window.SvgIcons.heartOutline(18) : '🤍')}
              </button>
              <button class="btn-card-action btn-play-card" data-action="play">
                ${isCurrent && isBuffering 
                  ? (window.SvgIcons ? window.SvgIcons.spinner(18) : '⏳')
                  : (isCurrent && isPlaying 
                    ? (window.SvgIcons ? window.SvgIcons.pause(18) : '⏸️')
                    : (window.SvgIcons ? window.SvgIcons.play(18) : '▶️'))}
              </button>
            </div>
          </div>
        `;
      }).join('');

      this.dom.stationsContainer.querySelectorAll('.station-card').forEach(card => {
        const id = parseInt(card.dataset.id, 10);
        const station = this.stations.find(s => s.id === id);

        card.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="precache"]')) {
            e.stopPropagation();
            if (station) this.precacheStation(station);
            return;
          }
          if (e.target.closest('[data-action="info"]')) {
            e.stopPropagation();
            if (station) this.openReciterModal(station);
            return;
          }
          if (e.target.closest('[data-action="fav"]')) {
            e.stopPropagation();
            this.toggleFavorite(id);
            return;
          }
          if (station) {
            if (this.player.currentStation && this.player.currentStation.id === station.id) {
              this.player.togglePlayPause();
            } else {
              this.player.play(station);
            }
          }
        });
      });
    }

    async precacheStation(station) {
      const t = TRANSLATIONS[this.lang];
      this.showToast(this.lang === 'ar' ? '⏳ جاري حفظ البث الصوتي في ذاكرة الـ 10GB...' : '⏳ Caching audio stream to 10GB storage...');
      try {
        await this.player.precacheStation(station);
        this.cachedUrls.add(station.url);
        this.renderStations();
        this.showToast(t.precacheSuccessToast);
      } catch (err) {
        console.warn('Precache error:', err);
        this.showToast(this.lang === 'ar' ? '⚡ تم جدولة الحفظ بالذاكرة أثناء التشغيل' : '⚡ Stream cached for playback');
      }
    }

    openCacheModal() {
      if (!this.dom.cacheModal) return;
      this.updateCacheModalMetrics();
      this.dom.cacheModal.classList.add('active');
    }

    closeCacheModal() {
      if (this.dom.cacheModal) {
        this.dom.cacheModal.classList.remove('active');
      }
    }

    updateCacheModalMetrics() {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (!event.data) return;
        const { totalBytes, maxBytes, count, items } = event.data;
        
        const mbUsed = (totalBytes / (1024 * 1024)).toFixed(1);
        const gbUsed = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
        const pct = Math.min(100, ((totalBytes / maxBytes) * 100)).toFixed(1);

        if (this.dom.cacheUsageText) {
          this.dom.cacheUsageText.textContent = `${mbUsed} MB (${gbUsed} GB) / 10.0 GB (${pct}%)`;
        }
        if (this.dom.cacheProgressBar) {
          this.dom.cacheProgressBar.style.width = `${pct}%`;
        }
        if (this.dom.cacheStationsCountText) {
          this.dom.cacheStationsCountText.textContent = this.lang === 'ar'
            ? `${count} إذاعة محفوظة للاستماع دون انترنت`
            : `${count} stations cached for offline playback`;
        }

        // Populate cached stations list
        if (this.dom.cachedStationsList) {
          if (!items || items.length === 0) {
            this.dom.cachedStationsList.innerHTML = `
              <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">
                لا توجد إذاعات مسجلة في الذاكرة حالياً. يتم الحفظ تلقائياً عند الاستماع أو الضغط على 💾
              </div>
            `;
            return;
          }

          this.dom.cachedStationsList.innerHTML = items.map(it => {
            const sizeMb = (it.sizeBytes / (1024 * 1024)).toFixed(1);
            const dateStr = new Date(it.lastAccessed).toLocaleTimeString(this.lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
            return `
              <div class="cached-item-row">
                <span class="cached-item-name">${it.stationName || 'Holy Quran Radio'}</span>
                <span class="cached-item-meta">
                  <span>${sizeMb} MB</span>
                  <span>• ${dateStr}</span>
                </span>
              </div>
            `;
          }).join('');
        }
      };

      navigator.serviceWorker.controller.postMessage({ type: 'GET_CACHE_METRICS' }, [channel.port2]);
    }

    refreshUnusedCache() {
      const t = TRANSLATIONS[this.lang];
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data && event.data.success) {
          const freedMb = (event.data.freed / (1024 * 1024)).toFixed(1);
          this.showToast(`${t.cacheRefreshedToast} (${freedMb} MB)`);
          this.updateCacheModalMetrics();
          this.refreshCachedUrlsList();
        }
      };

      navigator.serviceWorker.controller.postMessage({ type: 'REFRESH_UNUSED_CACHE' }, [channel.port2]);
    }

    clearAllCache() {
      const t = TRANSLATIONS[this.lang];
      if (!confirm(this.lang === 'ar' ? 'هل أنت متأكد من مسح جميع الصوتيات المحفوظة في الذاكرة؟' : 'Are you sure you want to clear all cached audio?')) {
        return;
      }

      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        this.cachedUrls.clear();
        this.showToast(t.cacheClearedToast);
        this.updateCacheModalMetrics();
        this.renderStations();
      };

      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL_AUDIO_CACHE' }, [channel.port2]);
    }

    openReciterModal(station) {
      if (!window.findReciterForStation) return;
      const reciter = window.findReciterForStation(station.name);
      const t = TRANSLATIONS[this.lang];

      this.dom.reciterNameText.textContent = this.lang === 'ar' ? reciter.name : reciter.englishName;
      this.dom.reciterTitleTag.textContent = reciter.title;
      this.dom.reciterOriginText.textContent = reciter.origin;
      this.dom.reciterEraText.textContent = reciter.era;
      this.dom.reciterRiwayahText.textContent = reciter.riwayah;
      this.dom.reciterBioBody.textContent = reciter.bio;
      this.dom.reciterAvatarImg.src = reciter.avatar;

      this.dom.reciterModal.classList.add('active');
    }

    closeReciterModal() {
      this.dom.reciterModal.classList.remove('active');
    }

    openMobileFullPlayer() {
      if (!this.player.currentStation) return;
      this.dom.mobileFullPlayer.classList.add('active');
    }

    closeMobileFullPlayer() {
      this.dom.mobileFullPlayer.classList.remove('active');
    }

    toggleFavorite(id) {
      const t = TRANSLATIONS[this.lang];
      if (this.favorites.has(id)) {
        this.favorites.delete(id);
        this.showToast(t.favRemovedToast);
      } else {
        this.favorites.add(id);
        this.showToast(t.favAddedToast);
      }
      localStorage.setItem('mp3quran_favs', JSON.stringify(Array.from(this.favorites)));
      this.renderStations();
      this._updateFavButton(id);
      this._syncLovedUrlsToServiceWorker();
    }

    _updateFavButton(id) {
      if (this.player.currentStation && this.player.currentStation.id === id) {
        const isFav = this.favorites.has(id);
        const iconHtml = isFav 
          ? (window.SvgIcons ? window.SvgIcons.heartFilled(20) : '❤️') 
          : (window.SvgIcons ? window.SvgIcons.heartOutline(20) : '🤍');
        this.dom.heroFavBtn.innerHTML = iconHtml;
        this.dom.mobileBarFavBtn.innerHTML = iconHtml;
        if (this.dom.fullPlayerFavBtn) this.dom.fullPlayerFavBtn.innerHTML = iconHtml;
      }
    }

    playNext() {
      if (!this.player.currentStation || this.stations.length === 0) return;
      const idx = this.stations.findIndex(s => s.id === this.player.currentStation.id);
      const nextIdx = (idx !== -1 && idx < this.stations.length - 1) ? idx + 1 : 0;
      this.player.play(this.stations[nextIdx]);
    }

    playPrevious() {
      if (!this.player.currentStation || this.stations.length === 0) return;
      const idx = this.stations.findIndex(s => s.id === this.player.currentStation.id);
      const prevIdx = (idx > 0) ? idx - 1 : this.stations.length - 1;
      this.player.play(this.stations[prevIdx]);
    }

    shareCurrentStation() {
      const s = this.player.currentStation;
      if (!s) return;
      const shareData = {
        title: s.name,
        text: `${s.name}\n${s.url}\n\nMP3Quran Live Radio - صدقة جارية لـ (عبدالرحيم معبد) • Mabed`,
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${s.name}\n${s.url}`);
        alert(this.lang === 'ar' ? 'تم نسخ الرابط للحافظة' : 'Link copied to clipboard');
      }
    }

    _updatePlayerUi(state, station) {
      const t = TRANSLATIONS[this.lang];
      if (!station) {
        this.dom.heroTitle.textContent = t.selectPrompt;
        this.dom.heroCategory.textContent = '';
        this.dom.heroPlayBtn.innerHTML = window.SvgIcons ? window.SvgIcons.play(30, "svg-gold-glow") : '▶️';
        this.dom.mobileBar.classList.remove('visible');
        return;
      }

      this.dom.heroTitle.textContent = station.name;
      this.dom.heroCategory.textContent = t[station.category.toLowerCase()] || station.category;
      this.dom.mobileBarTitle.textContent = station.name;
      if (this.dom.fullPlayerTitle) this.dom.fullPlayerTitle.textContent = station.name;
      if (this.dom.fullPlayerCategory) this.dom.fullPlayerCategory.textContent = t[station.category.toLowerCase()] || station.category;

      const isFav = this.favorites.has(station.id);
      const favIcon = isFav 
        ? (window.SvgIcons ? window.SvgIcons.heartFilled(20) : '❤️') 
        : (window.SvgIcons ? window.SvgIcons.heartOutline(20) : '🤍');
      this.dom.heroFavBtn.innerHTML = favIcon;
      this.dom.mobileBarFavBtn.innerHTML = favIcon;
      if (this.dom.fullPlayerFavBtn) this.dom.fullPlayerFavBtn.innerHTML = favIcon;

      if (state === 'buffering') {
        const spinnerHero = window.SvgIcons ? window.SvgIcons.spinner(30) : '⏳';
        const spinnerMini = window.SvgIcons ? window.SvgIcons.spinner(20) : '⏳';
        this.dom.heroIndicatorText.textContent = t.connecting;
        this.dom.heroPlayBtn.innerHTML = spinnerHero;
        this.dom.mobileBarPlayBtn.innerHTML = spinnerMini;
        this.dom.mobileBarStatus.textContent = t.connecting;
        if (this.dom.fullPlayerPlayBtn) this.dom.fullPlayerPlayBtn.innerHTML = spinnerHero;
      } else if (state === 'playing') {
        const pauseHero = window.SvgIcons ? window.SvgIcons.pause(30, "svg-gold-glow") : '⏸️';
        const pauseMini = window.SvgIcons ? window.SvgIcons.pause(20) : '⏸️';
        this.dom.heroIndicatorText.textContent = t.live;
        this.dom.heroPlayBtn.innerHTML = pauseHero;
        this.dom.mobileBarPlayBtn.innerHTML = pauseMini;
        this.dom.mobileBarStatus.textContent = t.live;
        if (this.dom.fullPlayerPlayBtn) this.dom.fullPlayerPlayBtn.innerHTML = pauseHero;
      } else {
        const playHero = window.SvgIcons ? window.SvgIcons.play(30, "svg-gold-glow") : '▶️';
        const playMini = window.SvgIcons ? window.SvgIcons.play(20) : '▶️';
        this.dom.heroIndicatorText.textContent = t.paused;
        this.dom.heroPlayBtn.innerHTML = playHero;
        this.dom.mobileBarPlayBtn.innerHTML = playMini;
        this.dom.mobileBarStatus.textContent = t.paused;
        if (this.dom.fullPlayerPlayBtn) this.dom.fullPlayerPlayBtn.innerHTML = playHero;
      }

      this.dom.mobileBar.classList.add('visible');
      this.renderStations();
    }

    _updateTimerUi(seconds) {
      const t = TRANSLATIONS[this.lang];
      if (seconds === null || seconds <= 0) {
        this.dom.heroTimerBadge.style.display = 'none';
        this.dom.timerRemainingText.textContent = '';
        return;
      }

      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      this.dom.heroTimerBadge.style.display = 'inline-block';
      this.dom.heroTimerBadge.textContent = `🌙 ${t.sleepIn} ${formatted}`;
      this.dom.timerRemainingText.textContent = `${t.sleepIn} ${formatted}`;
    }

    openAboutModal() {
      this.dom.aboutModal.classList.add('active');
    }

    closeAboutModal() {
      this.dom.aboutModal.classList.remove('active');
    }

    openTimerModal() {
      this.dom.timerModal.classList.add('active');
    }

    closeTimerModal() {
      this.dom.timerModal.classList.remove('active');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
})();
