// Playwright helpers: a browser, and pages that never touch the live mp3quran API or radio streams.
import { chromium } from 'playwright';
import { readRadios } from './fixtures.mjs';

export function launchBrowser() {
  return chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
}

// 60 seconds of silence as 8 kHz mono PCM: small, and every Chromium build can decode it.
function silentWav(seconds = 60) {
  const rate = 8000;
  const data = Buffer.alloc(rate * seconds, 0x80);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const STREAM_HOST = /^https:\/\/(backup\.qurango\.net|stream\.radiojar\.com)\//;

/**
 * options.width / height / lang: viewport and stored language
 * options.serviceWorkers: 'allow' | 'block' (default block)
 * options.streams: 'wav' (default) | 'hang' | 'fail'
 * options.radios: replace the station list (e.g. to point stations at a local stream server)
 * options.apiStatus: answer the station list request with this HTTP status instead (e.g. 500)
 */
export async function openApp(browser, baseUrl, options = {}) {
  const { width = 390, height = 800, lang = 'ar', streams = 'wav', serviceWorkers = 'block' } = options;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: width < 800,
    hasTouch: width < 800,
    serviceWorkers
  });
  await context.addInitScript((storedLang) => {
    try { localStorage.setItem('mp3quran_lang', storedLang); } catch (e) { /* storage blocked */ }
  }, lang);

  const wav = silentWav();
  await context.route(/\/api\/v3\/radios/, (route) => {
    if (options.apiStatus) {
      route.fulfill({ status: options.apiStatus, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'error' });
      return;
    }
    const requested = new URL(route.request().url()).searchParams.get('language') === 'eng' ? 'eng' : 'ar';
    const radios = options.radios ? options.radios(requested) : readRadios(requested);
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ radios })
    });
  });
  await context.route(STREAM_HOST, (route) => {
    if (streams === 'hang') return; // never answered: a stalled stream
    if (streams === 'fail') { route.abort('failed'); return; }
    route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: wav
    });
  });

  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !/Failed to load resource/.test(text)) problems.push(`console: ${text}`);
  });

  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.waitForSelector('.station-card');
  return { page, context, problems };
}
