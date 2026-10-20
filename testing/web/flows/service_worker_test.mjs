// The real service worker in a real browser: install, old radio samples removed, live radio never saved.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, describe, it } from 'node:test';
import { launchBrowser, openApp } from '../helpers/browser.mjs';
import { startStaticServer } from '../helpers/static-server.mjs';

const require = createRequire(import.meta.url);
const { STATIC_ASSETS } = require('../../../web/sw/config.js');
const { CACHE_AUDIO } = require('../../../web/js/core/storage-names.js');

let server;
let browser;
let ctx;

before(async () => {
  server = await startStaticServer();
  browser = await launchBrowser();
  ctx = await openApp(browser, server.url, { serviceWorkers: 'allow', width: 393, hash: '#/saved' });
  await ctx.page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
});

after(async () => {
  await ctx.context.close();
  await browser.close();
  await server.close();
});

const audioKeys = () => ctx.page.evaluate(async (name) => (await (await caches.open(name)).keys()).map((r) => r.url), CACHE_AUDIO);

describe('service worker', () => {
  it('installs with every app file cached, but not the HLS library', async () => {
    const urls = await ctx.page.evaluate(async () => {
      const names = (await caches.keys()).filter((n) => n.includes('static'));
      return (await (await caches.open(names[0])).keys()).map((r) => r.url);
    });
    assert.ok(urls.length >= STATIC_ASSETS.length, `${urls.length} cached, expected at least ${STATIC_ASSETS.length}`);
    assert.ok(!urls.some((u) => u.includes('/vendor/')), 'hls.js is loaded on demand, never precached');
  });

  it('answers app files from the cache at once, but icons from the network first', async () => {
    const status = await ctx.page.evaluate(async () => {
      const name = (await caches.keys()).find((n) => n.includes('static'));
      const cache = await caches.open(name);
      await cache.put('/cached-only.txt', new Response('from the cache'));
      await cache.put('/icons/cached-only.png', new Response('old icon'));
      const file = await fetch('/cached-only.txt');
      const icon = await fetch('/icons/cached-only.png');
      return { file: await file.text(), icon: icon.status };
    });
    assert.equal(status.file, 'from the cache', 'the server does not have it: it came from the cache');
    assert.equal(status.icon, 404, 'an icon goes to the network when it answers');
  });

  it('removes the radio samples saved by earlier versions when it activates', async () => {
    // A fresh browser profile that already holds an old sample, then the new worker installs
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await context.newPage();
    await page.goto(`${server.url}/manifest.json`);
    await page.evaluate(async (name) => {
      const cache = await caches.open(name);
      await cache.put('/offline-audio/123', new Response('old sample'));
      await cache.put('/offline-surah/1/001', new Response('a surah'));
    }, CACHE_AUDIO);
    await page.goto(server.url);
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
    await page.waitForFunction(async (name) => {
      const keys = (await (await caches.open(name)).keys()).map((r) => r.url);
      return !keys.some((u) => u.includes('/offline-audio/'));
    }, CACHE_AUDIO, { timeout: 10000, polling: 200 });
    const keys = await page.evaluate(async (name) => (await (await caches.open(name)).keys()).map((r) => r.url), CACHE_AUDIO);
    assert.ok(keys.some((u) => u.includes('/offline-surah/1/001')), 'downloaded surahs are kept');
    await context.close();
  });

  it('shows the space used without any limit or device free-space figure', async () => {
    await ctx.page.locator('#savedSurahsList .cached-empty').waitFor();
    const text = await ctx.page.evaluate(() => document.querySelector('#savedView').innerText);
    assert.doesNotMatch(text, /GB|المساحة المتاحة|Free on this device|الإذاعات المحفوظة/);
    assert.match(await ctx.page.locator('#cacheUsageText').innerText(), /MB/);
    assert.equal(await ctx.page.locator('#cachedStationsList, #storageFreeText, #cacheProgressBar').count(), 0);
  });

  it('never saves a live radio, and cards have no save button', async () => {
    await ctx.page.click('.nav-item[data-nav="radio"]');
    await ctx.page.locator('.station-card').first().waitFor();
    assert.equal(await ctx.page.locator('[data-action="precache"]').count(), 0);
    assert.equal(await ctx.page.locator('.cat-chip[data-id="OFFLINE"]').count(), 0);
    await ctx.page.locator('.station-card').nth(5).locator('.station-name').click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'playing', null, { timeout: 15000 });
    await ctx.page.evaluate(() => window.app.player.stop());
    assert.deepEqual((await audioKeys()).filter((u) => !u.includes('/offline-surah/')), []);
  });

  it('reloads offline, dims the radios and fails at once with a clear message', async () => {
    await ctx.context.setOffline(true);
    await ctx.page.reload({ waitUntil: 'load' });
    await ctx.page.waitForSelector('.station-card', { timeout: 15000 });
    assert.ok(await ctx.page.locator('#offlineBanner').isVisible());
    assert.equal(await ctx.page.locator('.cat-chip.active').getAttribute('data-id'), 'ALL');
    const first = ctx.page.locator('.station-card').first();
    assert.ok(await first.evaluate((el) => Number(getComputedStyle(el).opacity)) < 1, 'radios are dimmed offline');
    await first.locator('.station-name').click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'error', null, { timeout: 3000 });
    assert.match(await ctx.page.locator('.toast-notification').innerText(), /الإذاعات المباشرة تحتاج اتصالاً بالإنترنت/);
    await ctx.context.setOffline(false);
    assert.deepEqual(ctx.problems, []);
  });
});
