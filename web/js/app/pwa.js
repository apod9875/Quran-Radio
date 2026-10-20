/** Service worker registration, install prompt and the categories drag-to-scroll. */
Object.assign(App.prototype, {
  _setupPwa() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          if (registration) registration.update().catch(() => {});
          this.refreshCacheState();
        })
        .catch((err) => console.warn('[SW] registration failed:', err));

      // First visit: the worker only takes control after install, so sync once it does
      navigator.serviceWorker.addEventListener('controllerchange', () => this.refreshCacheState());
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredInstallPrompt = event;
      this.dom.installBtn.style.display = 'inline-flex';
    });

    this.dom.installBtn.addEventListener('click', async () => {
      if (!this.deferredInstallPrompt) return;
      this.deferredInstallPrompt.prompt();
      const choice = await this.deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') this.dom.installBtn.style.display = 'none';
      this.deferredInstallPrompt = null;
    });
  },

  // Mouse drag scrolling for the categories bar (touch uses native scrolling)
  _setupCategoryDrag() {
    const slider = this.dom.categoriesBar;
    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX;
      startScroll = slider.scrollLeft;
    });
    ['mouseleave', 'mouseup'].forEach((name) => slider.addEventListener(name, () => { isDown = false; }));
    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      slider.scrollLeft = startScroll - (e.pageX - startX) * 1.5;
    });
  }
});
