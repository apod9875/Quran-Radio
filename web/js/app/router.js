/** Hash routes (#/radio, #/reciters, #/reciter/<id>[/<mushafId>], #/saved) and the section tabs. */
Object.assign(App.prototype, {
  _setupRouter() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  route() {
    const route = window.QRUtils.parseRoute(window.location.hash);
    const previous = this.currentView;
    this.currentView = route.view;

    document.querySelectorAll('.view[data-view]').forEach((section) => {
      section.hidden = section.dataset.view !== route.view;
    });
    const tab = route.view === 'reciter' ? 'reciters' : route.view;
    this.dom.bottomNav.querySelectorAll('.nav-item').forEach((item) => {
      const active = item.dataset.nav === tab;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    if (route.view === 'reciters') this.showReciters();
    else if (route.view === 'reciter') this.showReciter(route.reciterId, route.moshafId);
    else if (route.view === 'saved') this.showSaved();

    if (previous && previous !== route.view) window.scrollTo(0, 0);
  },

  // Change the mushaf of the open reciter without adding a history entry for every tap
  replaceRoute(hash) {
    history.replaceState(null, '', hash);
    this.route();
  }
});
