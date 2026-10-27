// Playwright helpers: a browser, and pages that never touch the live mp3quran API, radio streams or CDN.
import { chromium } from 'playwright';
import { fulfillWithRange, liveHlsPlaylist, silentMp3, silentWav } from './audio.mjs';
import { readRadios, readReciters, readSuwar } from './fixtures.mjs';

export function launchBrowser() {
  return chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
}

const STREAM_HOST = /^https:\/\/(backup\.qurango\.net|stream\.radiojar\.com|radio\.xecod\.com|edge\.mixlr\.com)\//;
const HLS_HOST = /^https:\/\/(win\.holol\.com|cdn-globecast\.akamaized\.net|5c7b683162943\.streamlock\.net)\//;
const SURAH_HOST = /^https:\/\/(cdn|server\d+)\.mp3quran\.net\//;
const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json',
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});

/**
 * options.width / height: viewport; options.lang: 'ar' (default) or 'eng'
 * options.serviceWorkers: 'allow' | 'block' (default block)
 * options.streams: live radio streams 'wav' (default) | 'hang' | 'fail'
 * options.failHosts: stream hosts (e.g. ['stream.radiojar.com']) whose requests fail, to test mirror failover
 * options.radios: replace the station list (e.g. to point stations at a local stream server)
 * options.apiStatus: answer the station list request with this HTTP status instead (e.g. 500)
 * options.quranStatus: answer the reciters / suwar requests with this HTTP status instead
 * options.surahSeconds: length of every surah file served for cdn.mp3quran.net (default 3)
 * options.hash: open the app on this route (e.g. '#/reciters')
 * options.whatsNew: let the "what's new" window behave as for a real user (off by default)
 */
export async function openApp(browser, baseUrl, options = {}) {
  const { width = 390, height = 800, streams = 'wav', serviceWorkers = 'block', surahSeconds = 3 } = options;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: width < 800,
    hasTouch: width < 800,
    serviceWorkers
  });

  // The "what's new" window would cover other tests: count the latest notes as seen, unless a test
  // asks for it (options.whatsNew) or set an older version itself
  if (!options.whatsNew) {
    await context.addInitScript(() => {
      try { if (!localStorage.getItem('qr_seen_version')) localStorage.setItem('qr_seen_version', '999.0.0'); } catch (e) { /* blocked */ }
    });
  }

  // Start in English when asked (the app remembers the language in localStorage)
  if (options.lang === 'eng') {
    await context.addInitScript(() => { try { localStorage.setItem('qr_lang', 'eng'); } catch (e) { /* blocked */ } });
  }

  const liveWav = silentWav(60);
  const surahWav = silentWav(surahSeconds);
  const langOf = (route) => (new URL(route.request().url()).searchParams.get('language') === 'eng' ? 'eng' : 'ar');
  await context.route(/\/api\/v3\/radios/, (route) => {
    if (options.apiStatus) return json(route, options.apiStatus, 'error');
    const lang = langOf(route);
    return json(route, 200, { radios: options.radios ? options.radios(lang) : readRadios(lang) });
  });
  await context.route(/\/api\/v3\/(reciters|suwar)/, (route) => {
    if (options.quranStatus) return json(route, options.quranStatus, 'error');
    const lang = langOf(route);
    const isSuwar = route.request().url().includes('/suwar');
    return json(route, 200, isSuwar ? { suwar: readSuwar(lang) } : { reciters: readReciters(lang) });
  });
  await context.route(STREAM_HOST, (route) => {
    const host = new URL(route.request().url()).host;
    if (streams === 'hang') return; // never answered: a stalled stream
    if (streams === 'fail' || (options.failHosts || []).includes(host)) { route.abort('failed'); return; }
    route.fulfill({ status: 200, contentType: 'audio/wav', headers: { 'Access-Control-Allow-Origin': '*' }, body: liveWav });
  });
  await context.route(SURAH_HOST, (route) => fulfillWithRange(route, surahWav));
  const segment = silentMp3(2);
  await context.route(HLS_HOST, (route) => {
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (route.request().url().includes('.m3u8')) {
      return route.fulfill({ status: 200, contentType: 'application/vnd.apple.mpegurl', headers: cors, body: liveHlsPlaylist() });
    }
    return route.fulfill({ status: 200, contentType: 'audio/mpeg', headers: cors, body: segment });
  });

  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  // The app uses its own confirmation window: a native alert / confirm is a bug
  page.on('dialog', (dialog) => {
    problems.push(`native dialog: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !/Failed to load resource/.test(text)) problems.push(`console: ${text}`);
  });

  await page.goto(baseUrl + (options.hash || ''), { waitUntil: 'load' });
  await page.waitForSelector('.station-card', { state: 'attached' });
  return { page, context, problems };
}

// Scroll until an infinite list has rendered everything (its "loading more" cursor is gone)
export async function scrollToEnd(page, container) {
  for (let i = 0; i < 60; i++) {
    const more = await page.evaluate((sel) => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      return !!document.querySelector(`${sel} .list-cursor`);
    }, container);
    if (!more) return;
    await page.waitForTimeout(80);
  }
  throw new Error(`${container} never finished loading`);
}
