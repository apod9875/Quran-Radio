/** Page-side helper for talking to the service worker over a MessageChannel. */
window.QR_SW = {
  ready() {
    return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
  },

  post(message) {
    if (this.ready()) navigator.serviceWorker.controller.postMessage(message);
  },

  request(message, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (!this.ready()) {
        reject(new Error('Service Worker not ready'));
        return;
      }
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(new Error('Service Worker timeout')), timeoutMs);
      channel.port1.onmessage = (event) => {
        clearTimeout(timer);
        resolve(event.data);
      };
      navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
    });
  }
};
