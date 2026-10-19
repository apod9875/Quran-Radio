# Implementation Plan: Loved-Only Offline Audio Caching & AI Icon

## User Review & Critical Decisions

> [!IMPORTANT]
> Audio caching (up to 20GB on PC / 10GB on Mobile) will now be restricted **exclusively to loved (favorite) radio stations**. Unloved stations will not be cached for offline storage. When a user clicks the "Love" (heart) button on a station, an elegant toast notification will pop up explaining that the station has been saved and cached for offline playback. Additionally, the new AI-generated Sacred Emerald & Gold app icon will be integrated across the app and web PWA.

- **Loved-Only Caching Rule**: Service Worker cache interceptor will check if the requested station/stream URL is in the user's favorites list (`mp3quran_favs`). Only loved stations are cached.
- **Toast Notification**: Elegant floating notification banner when toggling favorite ("❤️ تم حفظ الإذاعة في المفضلة والتخزين المؤقت للاستماع دون إنترنت").
- **AI-Generated Icon**: Integrate the generated Sacred Emerald & Gold icon into web PWA and Android resources.

---

## 1. Technical Changes & Architecture

### ServiceWorker (`web/sw.js`)
- Update fetch interception: check if requested stream belongs to a favorite/loved station (or pass favorites list / check cache headers). Since ServiceWorker runs in background, we can check if URL matches cached favorite streams or cache all streams that are explicitly requested from favorites. Alternatively, when a station is favorited, pre-cache its initial stream chunk, and in fetch handler, cache streams only when initiated by a favorite action.

### Web App Logic (`web/js/app.js` & `web/css/styles.css`)
- Toast notification container and trigger function (`showToast(message)`).
- When user clicks favorite (Love), show toast: `❤️ تم حفظ الإذاعة في المفضلة والتخزين المؤقت للاستماع دون انترنت`.
- Inform ServiceWorker of updated favorites list via `postMessage`.

### AI Icon Integration
- Copy generated AI image asset into `web/icons/icon.png` and update `web/manifest.json` and `web/index.html`.

---

## Verification Plan

1. **Loved-Only Caching Verification**: Verify that clicking favorite (Love) caches the radio stream and displays the offline storage toast notification.
2. **Non-Loved No-Storage Verification**: Verify that playing a non-favorited station streams live without allocating offline cache storage.
3. **AI Icon Integration**: Verify that the new attractive AI icon is displayed correctly across the web app and PWA manifest.
