# Quran Radio

Live Quran radio and a surah library per reciter (Arabic, with an English switch): a PWA in `web/` (vanilla JS, no build step, deployed from `./web` by Cloudflare, see `wrangler.toml`) and an Android Jetpack Compose app in `app/`.

## Rules
- Work and commit directly on `main`.
- **Frontend files stay small.** Every `.js`/`.css` file under `web/` aims for 100-150 lines; 200 is the hard ceiling. When a file would pass 200, split it into a folder instead of growing it. `npm run check` enforces this.
- **All tests live under `testing/`**, mirroring the source layout (`testing/web/unit`, `layout`, `flows`; fixtures in `testing/web/testdata`; helpers in `testing/web/helpers`). Never put a test next to the code it tests. `npm run check` fails when a test file sits outside `testing/`.
- Before finishing web work run `npm run check && npm test` (needs `npm ci` and `npx playwright install chromium` once).

## Web layout
- `web/css/*.css`: loaded in order from `index.html`. Spacing that changes per breakpoint lives only in the tokens at the bottom of `tokens.css` (`--gutter`, `--card-pad`, `--action-size`, `--thumb-size`, ...). The header, main content and mini player all use `--gutter`, so their edges line up at every width. Do not add padding shorthands inside media queries.
- `web/js/core`: `utils.js` (Arabic search normalisation, escaping, station categories), `sw-client.js`.
- `web/js/player/*`: `AudioStreamPlayer` split into core, events, recovery, session, seek, mirrors, hls. Retry timings are on `AudioStreamPlayer.TUNING` so tests can shorten them.
- Pinned stations live in `js/app/extra-stations.js` (Cairo, Makkah, Masjid al-Haram, Masjid an-Nabawi). `mirrors` = the same broadcast on several hosts: `mirrors.js` starts on the fastest one measured on this device (`qr_mirror_stats`) and fails over to the next with a 4 s stall timeout. `format: 'hls'` = a live HLS broadcast played as sound only: `hls.js` uses `web/vendor/hls.light.min.js` (loaded on demand, never precached; refresh it with `node scripts/vendor-hls.mjs` after bumping `hls.js` in package.json), or native HLS on the iPhone. `web/vendor/` is third-party and skipped by the line check.
- Station order: favorites first, then the pinned stations, then the rest by letters (`QRUtils.sortStations`).
- Never use `window.confirm` / `alert`: use `this.confirmDialog({ title, message, details, confirmText, danger })` (`js/app/confirm-dialog.js`, `#confirmModal`), which resolves true / false. Tests fail on any native dialog.
- `web/js/app/*`: `App` is assembled from mixins (`Object.assign(App.prototype, ...)`); `boot.js` creates it.
- Sections are hash routes (`js/app/router.js`): `#/radio`, `#/reciters`, `#/reciter/<id>[/<mushafId>]`, `#/saved`, switched by the bottom tab bar (`css/bottom-nav.css`).
- `web/js/quran/*`: the reciters and surahs from the mp3quran API v3 (`reciters`, `suwar`). `model.js` is pure (unit tested); `catalog.js` loads once; `reciters-view.js` / `reciter-view.js` render the pages; `surah-player.js` builds the mushaf queue; `downloads.js` saves whole surahs.
- A surah track has `kind: 'surah'` and an id `surah:<mushafId>:<n>`; the player (`js/player/seek.js`) seeks it, saves its position and plays the next one on `ended`. Live radio stays `kind` undefined.
- Static text comes from `data-i18n`, `data-i18n-html`, `data-i18n-placeholder` and `data-i18n-label` attributes and `web/js/i18n/ar.js` / `eng.js` (Arabic by default, English via the header switch; both files keep the same keys). Escape every API string with `QRUtils.escapeHtml` before putting it in `innerHTML`.

## Service worker
- `web/sw.js` plus `web/sw/*.js` (imported with `importScripts`). **Bump `CACHE_STATIC` in `web/sw/config.js` and update `STATIC_ASSETS` whenever a web file is added, renamed or removed**; `testing/web/unit/sw_assets_test.mjs` checks the list against `index.html`.
- Live streams are never intercepted and radios are never saved (downloads are for surahs only). The worker deletes old `/offline-audio/*` radio samples once on activate.
- No storage limit: the app shows only the space its downloads use (never a quota or "free space" figure) and downloads until the browser refuses (`QuotaExceededError` → "storage full" toast, partial file deleted). `navigator.storage.persist()` is asked on the first download.
- Surah downloads are written by the page itself (`js/quran/downloads.js`, so a long download is not cut by service-worker time limits) into the cache named in `js/core/storage-names.js`; the worker records them (`RECORD_DOWNLOAD`) and serves `/offline-surah/<mushafId>/<nnn>` with Range support (`sw/surah-cache.js`). Automatic clean-up never removes downloaded surahs.

## Android (`app/`)
- Not buildable on the author's machine (no SDK, no Gradle wrapper). Layout padding comes from `ui/theme/Dimens.kt`.
