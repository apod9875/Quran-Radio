// The real service worker in a real browser, with a local endless stream standing in for a radio.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, describe, it } from 'node:test';
import { launchBrowser, openApp } from '../helpers/browser.mjs';
import { readRadios } from '../helpers/fixtures.mjs';
import { startStaticServer } from '../helpers/static-server.mjs';
import { startStreamServer } from '../helpers/stream-server.mjs';

const require = createRequire(import.meta.url);
const { STATIC_ASSETS } = require('../../../web/sw/config.js');

let server;
let streams;
let browser;
let ctx;
let stationId;

before(async () => {
  streams = await startStreamServer();
  server = await startStaticServer({ allowOrigins: [streams.origin] });
  browser = await launchBrowser();
  const radios = (lang) => readRadios(lang).map((s, i) => (i === 0 ? { ...s, url: streams.endlessUrl } : s));
  ctx = await openApp(browser, server.url, { serviceWorkers: 'allow', radios, width: 393 });
  stationId = Number(await ctx.page.locator('.station-card').first().getAttribute('data-id'));
  await ctx.page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
});

after(async () => {
  await ctx.context.close();
  await browser.close();
  await server.close();
  await streams.close();
});

const fetchOffline = (headers = {}) => ctx.page.evaluate(async ([id, extra]) => {
  const res = await fetch(`offline-audio/${id}`, { headers: extra });
  return { status: res.status, size: (await res.arrayBuffer()).byteLength, range: res.headers.get('Content-Range') };
}, [stationId, headers]);

describe('service worker', () => {
  it('installs with every app file cached', async () => {
    const cached = await ctx.page.evaluate(async () => {
      const names = (await caches.keys()).filter((n) => n.includes('static'));
      return (await (await caches.open(names[0])).keys()).length;
    });
    assert.ok(cached >= STATIC_ASSETS.length, `${cached} cached, expected at least ${STATIC_ASSETS.length}`);
  });

  it('does not report a station as saved just because it was played', async () => {
    await ctx.page.locator('.station-card').first().locator('.station-name').click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'playing', null, { timeout: 15000 });
    await ctx.page.evaluate(() => window.app.player.stop());
    await ctx.page.evaluate(() => window.app.refreshCacheState());
    assert.equal(await ctx.page.locator('.offline-ready-badge').count(), 0);
  });

  it('saves a sample of an endless stream and marks the station as offline ready', async () => {
    await ctx.page.locator('.station-card').first().locator('[data-action="precache"]').click();
    await ctx.page.locator('.station-card').first().locator('.offline-ready-badge').waitFor({ timeout: 60000 });

    const full = await fetchOffline();
    assert.equal(full.status, 200);
    assert.ok(full.size >= 256 * 1024, `sample is only ${full.size} bytes`);

    const partial = await fetchOffline({ Range: 'bytes=0-99' });
    assert.equal(partial.status, 206);
    assert.equal(partial.size, 100);
    assert.equal(partial.range, `bytes 0-99/${full.size}`);
  });

  it('lists the saved station in the cache modal', async () => {
    await ctx.page.click('#cacheBtn');
    await ctx.page.locator('#cachedStationsList .cached-item-row').first().waitFor();
    assert.equal(await ctx.page.locator('#cachedStationsList .cached-item-row').count(), 1);
    assert.match(await ctx.page.locator('#cacheUsageText').innerText(), /MB/);
    await ctx.page.keyboard.press('Escape');
  });

  it('keeps the favorite flag of a saved station in sync', async () => {
    await ctx.page.locator('.station-card').first().locator('[data-action="fav"]').click();
    const flag = async () => ctx.page.evaluate(async () => {
      const data = await window.QR_SW.request({ type: 'GET_CACHE_METRICS' });
      return data.items[0].isFavorite;
    });
    await ctx.page.waitForTimeout(300);
    assert.equal(await flag(), true);
    await ctx.page.locator('.station-card').first().locator('[data-action="fav"]').click();
    await ctx.page.waitForTimeout(300);
    assert.equal(await flag(), false);
  });

  it('plays the saved sample when the connection is lost', async () => {
    await ctx.context.setOffline(true);
    await ctx.page.evaluate(() => window.app.player.play(window.app.stations[0]));
    await ctx.page.waitForFunction(() => window.app.player.state === 'playing', null, { timeout: 15000 });
    assert.equal(await ctx.page.evaluate(() => window.app.player.usingOffline), true);
    await ctx.page.evaluate(() => window.app.player.stop());
    await ctx.context.setOffline(false);
  });

  it('clears the saved stations and their badges', async () => {
    ctx.page.once('dialog', (dialog) => dialog.accept());
    await ctx.page.click('#cacheBtn');
    await ctx.page.click('#clearAllCacheBtn');
    await ctx.page.waitForFunction(() => document.querySelectorAll('.offline-ready-badge').length === 0);
    assert.equal((await fetchOffline()).status, 404);
  });
});
