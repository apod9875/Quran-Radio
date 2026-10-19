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
      sleepTimerDesc: "اختر المدة لإيقاف البث تلقائياً أثناء الاستماع:",
      sleepIn: "المتبقي على الإيقاف: ",
      turnOffTimer: "إلغاء المؤقت",
      close: "إغلاق",
      minutes: "دقيقة",
      noResults: "لا توجد إذاعات مطابقة لبحثك",
      favAddedToast: "❤️ تمت الإضافة للمفضلة والتخزين المؤقت للاستماع دون انترنت",
      favRemovedToast: "🤍 تم الإزالة من المفضلة وإلغاء التخزين المؤقت"
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
      sleepTimerDesc: "Select duration to stop playback automatically:",
      sleepIn: "Auto-stop in: ",
      turnOffTimer: "Turn Off Timer",
      close: "Close",
      minutes: "min",
      noResults: "No stations found matching your search",
      favAddedToast: "❤️ Added to favorites & cached for offline playback",
      favRemovedToast: "🤍 Removed from favorites & offline cache"
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
      this.player = new window.AudioStreamPlayer();
      this.deferredInstallPrompt = null;

      this._cacheDom();
      this._bindEvents();
      this._setupPwaAndCaching();
      this.applyLanguage(this.lang);
      this.fetchStations();
    }

    _setupPwaAndCaching() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(() => {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 960;
          const cacheLimitBytes = isMobile ? 10 * 1024 * 1024 * 1024 : 20 * 1024 * 1024 * 1024;
          
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SET_CACHE_LIMIT',
              limitBytes: cacheLimitBytes
            });
            this._syncLovedUrlsToServiceWorker();
          }
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

    _syncLovedUrlsToServiceWorker() {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
      const lovedUrls = this.stations
        .filter(s => this.favorites.has(s.id))
        .map(s => s.url);

      navigator.serviceWorker.controller.postMessage({
        type: 'SET_LOVED_URLS',
        urls: lovedUrls
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
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        categoriesBar: document.getElementById('categoriesBar'),
        stationsContainer: document.getElementById('stationsContainer'),
        
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
        
        mobileBar: document.getElementById('mobilePlayerBar'),
        mobileBarTitle: document.getElementById('mobileBarTitle'),
        mobileBarStatus: document.getElementById('mobileBarStatus'),
        mobileBarPlayBtn: document.getElementById('mobileBarPlayBtn'),
        mobileBarFavBtn: document.getElementById('mobileBarFavBtn'),

        toast: document.getElementById('toastNotification'),

        aboutModal: document.getElementById('aboutModal'),
        closeAboutBtn: document.getElementById('closeAboutBtn'),
        doneAboutBtn: document.getElementById('doneAboutBtn'),
        timerModal: document.getElementById('timerModal'),
        closeTimerBtn: document.getElementById('closeTimerBtn'),
        cancelTimerBtn: document.getElementById('cancelTimerBtn'),
        timerGrid: document.getElementById('timerGrid'),
        timerRemainingText: document.getElementById('timerRemainingText')
      };
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

    _bindEvents() {
      this.dom.langToggleBtn.addEventListener('click', () => {
        const newLang = this.lang === 'ar' ? 'eng' : 'ar';
        this.applyLanguage(newLang);
        this.fetchStations();
      });

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

      this.dom.heroPlayBtn.addEventListener('click', () => this.player.togglePlayPause());
      this.dom.heroPrevBtn.addEventListener('click', () => this.playPrevious());
      this.dom.heroNextBtn.addEventListener('click', () => this.playNext());
      this.dom.heroFavBtn.addEventListener('click', () => {
        if (this.player.currentStation) this.toggleFavorite(this.player.currentStation.id);
      });
      this.dom.heroVolumeSlider.addEventListener('input', (e) => {
        this.player.setVolume(parseFloat(e.target.value));
      });
      this.dom.heroShareBtn.addEventListener('click', () => this.shareCurrentStation());
      this.dom.heroTimerBtn.addEventListener('click', () => this.openTimerModal());

      this.dom.mobileBarPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.player.togglePlayPause();
      });
      this.dom.mobileBarFavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.player.currentStation) this.toggleFavorite(this.player.currentStation.id);
      });
      this.dom.mobileBar.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      this.dom.infoBtn.addEventListener('click', () => this.openAboutModal());
      this.dom.closeAboutBtn.addEventListener('click', () => this.closeAboutModal());
      this.dom.doneAboutBtn.addEventListener('click', () => this.closeAboutModal());
      this.dom.closeTimerBtn.addEventListener('click', () => this.closeTimerModal());
      this.dom.cancelTimerBtn.addEventListener('click', () => {
        this.player.setSleepTimer(null);
        this.closeTimerModal();
      });

      this.dom.timerGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-timer-chip');
        if (btn) {
          const mins = parseInt(btn.dataset.mins, 10);
          this.player.setSleepTimer(mins);
          this.closeTimerModal();
        }
      });

      this.player.onStateChange((state, station) => {
        this._updatePlayerUi(state, station);
      });

      this.player.onTimerTick((remainingSeconds) => {
        this._updateTimerUi(remainingSeconds);
      });
    }

    applyLanguage(lang) {
      this.lang = lang;
      localStorage.setItem('mp3quran_lang', lang);
      const t = TRANSLATIONS[lang];

      this.dom.html.setAttribute('lang', lang);
      this.dom.html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

      this.dom.appTitle.textContent = t.appTitle;
      this.dom.appDedication.textContent = t.dedication;
      this.dom.langBtnText.textContent = lang === 'ar' ? 'English' : 'العربية';
      this.dom.searchInput.placeholder = t.searchPlaceholder;
      this.dom.installBtn.querySelector('.btn-label').textContent = t.installApp;
      this.dom.heroDedication.textContent = t.dedication;

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

      this.dom.stationsContainer.innerHTML = filtered.map(s => {
        const isCurrent = currentId === s.id;
        const isFav = this.favorites.has(s.id);
        const activeClass = isCurrent ? 'active' : '';

        return `
          <div class="station-card ${activeClass}" data-id="${s.id}">
            <div class="station-info">
              <div class="station-icon-wrap">
                ${isCurrent && isPlaying ? `
                  <div class="mini-wave">
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                  </div>
                ` : `<span>📻</span>`}
              </div>
              <div class="station-details">
                <div class="station-name">${s.name}</div>
                <div class="station-meta">
                  <span class="station-badge">${TRANSLATIONS[this.lang][s.category.toLowerCase()] || s.category}</span>
                </div>
              </div>
            </div>
            <div class="station-actions">
              <button class="btn-card-action fav ${isFav ? 'active' : ''}" data-action="fav" title="Favorite">
                ${isFav ? '❤️' : '🤍'}
              </button>
              <button class="btn-card-action btn-play-card" data-action="play">
                ${isCurrent && isBuffering ? '⏳' : (isCurrent && isPlaying ? '⏸️' : '▶️')}
              </button>
            </div>
          </div>
        `;
      }).join('');

      this.dom.stationsContainer.querySelectorAll('.station-card').forEach(card => {
        const id = parseInt(card.dataset.id, 10);
        const station = this.stations.find(s => s.id === id);

        card.addEventListener('click', (e) => {
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
        this.dom.heroFavBtn.textContent = isFav ? '❤️' : '🤍';
        this.dom.mobileBarFavBtn.textContent = isFav ? '❤️' : '🤍';
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
        this.dom.heroPlayBtn.innerHTML = '▶️';
        this.dom.mobileBar.classList.remove('visible');
        return;
      }

      this.dom.heroTitle.textContent = station.name;
      this.dom.heroCategory.textContent = t[station.category.toLowerCase()] || station.category;
      this.dom.mobileBarTitle.textContent = station.name;

      const isFav = this.favorites.has(station.id);
      this.dom.heroFavBtn.textContent = isFav ? '❤️' : '🤍';
      this.dom.mobileBarFavBtn.textContent = isFav ? '❤️' : '🤍';

      if (state === 'buffering') {
        this.dom.heroIndicatorText.textContent = t.connecting;
        this.dom.heroPlayBtn.innerHTML = '⏳';
        this.dom.mobileBarPlayBtn.innerHTML = '⏳';
        this.dom.mobileBarStatus.textContent = t.connecting;
      } else if (state === 'playing') {
        this.dom.heroIndicatorText.textContent = t.live;
        this.dom.heroPlayBtn.innerHTML = '⏸️';
        this.dom.mobileBarPlayBtn.innerHTML = '⏸️';
        this.dom.mobileBarStatus.textContent = t.live;
      } else {
        this.dom.heroIndicatorText.textContent = t.paused;
        this.dom.heroPlayBtn.innerHTML = '▶️';
        this.dom.mobileBarPlayBtn.innerHTML = '▶️';
        this.dom.mobileBarStatus.textContent = t.paused;
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
