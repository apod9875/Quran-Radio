# Quran Radio

Live Quran radio: a PWA in `web/` (vanilla JS, no build step, deployed from `./web` by Cloudflare, see `wrangler.toml`) and an Android Jetpack Compose app in `app/`.

## Rules
- Work and commit directly on `main`.
- **Frontend files stay small.** Every `.js`/`.css` file under `web/` aims for 100-150 lines; 200 is the hard ceiling. When a file would pass 200, split it into a folder instead of growing it. `npm run check` enforces this.
- **All tests live under `testing/`**, mirroring the source layout (`testing/web/unit`, `layout`, `flows`; fixtures in `testing/web/testdata`; helpers in `testing/web/helpers`). Never put a test next to the code it tests. `npm run check` fails when a test file sits outside `testing/`.
- Before finishing web work run `npm run check && npm test` (needs `npm ci` and `npx playwright install chromium` once).

## Web layout
- `web/css/*.css`: loaded in order from `index.html`. Spacing that changes per breakpoint lives only in the tokens at the bottom of `tokens.css` (`--gutter`, `--card-pad`, `--action-size`, `--thumb-size`, ...). The header, main content and mini player all use `--gutter`, so their edges line up at every width. Do not add padding shorthands inside media queries.
- `web/js/core`: `utils.js` (Arabic search normalisation, escaping, station categories), `sw-client.js`.
- `web/js/player/*`: `AudioStreamPlayer` split into core, events, recovery, session, offline. Retry timings are on `AudioStreamPlayer.TUNING` so tests can shorten them.
- `web/js/app/*`: `App` is assembled from mixins (`Object.assign(App.prototype, ...)`); `boot.js` creates it.
- Static text is translated with `data-i18n`, `data-i18n-html`, `data-i18n-placeholder` and `data-i18n-label` attributes; dictionaries are `web/js/i18n/ar.js` and `eng.js`. Escape every API string with `QRUtils.escapeHtml` before putting it in `innerHTML`.

## Service worker
- `web/sw.js` plus `web/sw/*.js` (imported with `importScripts`). **Bump `CACHE_STATIC` in `web/sw/config.js` and update `STATIC_ASSETS` whenever a web file is added, renamed or removed**; `testing/web/unit/sw_assets_test.mjs` checks the list against `index.html`.
- Live streams are never intercepted. A station's offline copy is a short sample (up to 5 MB or 60 s) read from the stream start and served from `/offline-audio/<stationId>`.

## Android (`app/`)
- Not buildable on the author's machine (no SDK, no Gradle wrapper). Layout padding comes from `ui/theme/Dimens.kt`.
