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
let target;

before(async () => {
  streams = await startStreamServer();
  server = await startStaticServer({ allowOrigins: [streams.origin] });
  browser = await launchBrowser();
  const radios = (lang) => readRadios(lang).map((s, i) => (i === 0 ? { ...s, url: streams.endlessUrl } : s));
  ctx = await openApp(browser, server.url, { serviceWorkers: 'allow', radios, width: 393 });
  stationId = readRadios('ar')[0].id;
  target = ctx.page.locator(`.station-card[data-id="${stationId}"]`);
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
    await target.locator('.station-name').click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'playing', null, { timeout: 15000 });
    await ctx.page.evaluate(() => window.app.player.stop());
    await ctx.page.evaluate(() => window.app.refreshCacheState());
    assert.equal(await ctx.page.locator('.offline-ready-badge').count(), 0);
  });

  it('saves a sample of an endless stream and marks the station as offline ready', async () => {
    await target.locator('[data-action="precache"]').click();
    await target.locator('.offline-ready-badge').waitFor({ timeout: 60000 });

    const full = await fetchOffline();
    assert.equal(full.status, 200);
    assert.ok(full.size >= 256 * 1024, `sample is only ${full.size} bytes`);

    const partial = await fetchOffline({ Range: 'bytes=0-99' });
    assert.equal(partial.status, 206);
    assert.equal(partial.size, 100);
    assert.equal(partial.range, `bytes 0-99/${full.size}`);
  });

  it('lists the saved station on the saved page', async () => {
    await ctx.page.click('#cacheBtn');
    assert.equal(await ctx.page.evaluate(() => location.hash), '#/saved');
    await ctx.page.locator('#cachedStationsList .cached-item-row').first().waitFor();
    assert.equal(await ctx.page.locator('#cachedStationsList .cached-item-row').count(), 1);
    assert.match(await ctx.page.locator('#cacheUsageText').innerText(), /MB/);
    await ctx.page.click('.nav-item[data-nav="radio"]');
  });

  it('keeps saved items independent of favorites and shows no storage limit', async () => {
    await target.locator('[data-action="fav"]').click();
    await target.locator('[data-action="fav"]').click();
    await ctx.page.click('.nav-item[data-nav="saved"]');
    await ctx.page.locator('#cachedStationsList .cached-item-row').first().waitFor();
    assert.equal(await ctx.page.locator('#cachedStationsList .cached-item-row').count(), 1, 'un-favoriting kept the sample');
    assert.equal(await ctx.page.locator('#refreshUnusedCacheBtn').count(), 0);
    assert.doesNotMatch(await ctx.page.evaluate(() => document.body.innerText), /10\s?GB|10 جيجا/);
    await ctx.page.waitForFunction(() => !document.querySelector('#storageFreeText').hidden);
    assert.match(await ctx.page.locator('#storageFreeText').innerText(), /المساحة المتاحة/);
    await ctx.page.click('.nav-item[data-nav="radio"]');
  });

  it('plays a saved station from the saved page', async () => {
    await ctx.page.click('.nav-item[data-nav="saved"]');
    await ctx.page.locator('#cachedStationsList .cached-item-row').first().click();
    await ctx.page.waitForFunction((id) => window.app.player.currentStation?.id === id, stationId);
    await ctx.page.evaluate(() => window.app.player.stop());
    await ctx.page.click('.nav-item[data-nav="radio"]');
  });

  it('reloads without a connection and opens the Saved offline tab', async () => {
    await ctx.context.setOffline(true);
    await ctx.page.reload({ waitUntil: 'load' });
    await ctx.page.waitForSelector('.station-card', { timeout: 15000 });
    assert.ok(await ctx.page.locator('#offlineBanner').isVisible());
    assert.ok(await ctx.page.evaluate(() => document.body.classList.contains('is-offline')));
    assert.equal(await ctx.page.locator('.cat-chip.active').getAttribute('data-id'), 'OFFLINE');
    assert.equal(await ctx.page.locator('.station-card').count(), 1);
    assert.equal(await ctx.page.locator('.station-card .offline-ready-badge').count(), 1);
  });

  it('plays the saved sample offline and says so', async () => {
    await ctx.page.locator('.station-card').first().locator('.station-name').click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'playing', null, { timeout: 15000 });
    assert.equal(await ctx.page.evaluate(() => window.app.player.usingOffline), true);
    assert.match(await ctx.page.locator('#mobileBarStatus').innerText(), /المقطع المحفوظ/);
    await ctx.page.evaluate(() => window.app.player.stop());
  });

  it('dims unsaved stations and fails at once with a clear message', async () => {
    await ctx.page.click('.cat-chip[data-id="ALL"]');
    const dimmed = await ctx.page.locator('.station-card:not(.is-saved)').first()
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    assert.ok(dimmed < 1, 'unsaved stations are dimmed while offline');

    await ctx.page.locator('.station-card:not(.is-saved)').first().locator('.station-name').click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'error', null, { timeout: 3000 });
    assert.match(await ctx.page.locator('.toast-notification').innerText(), /غير محفوظة/);
  });

  it('refuses to save a station without a connection', async () => {
    await ctx.page.locator('.station-card:not(.is-saved)').first().locator('[data-action="precache"]').click();
    assert.match(await ctx.page.locator('.toast-notification').innerText(), /يحتاج اتصالاً/);
    await ctx.context.setOffline(false);
    await ctx.page.evaluate(() => window.app.player.stop());
  });

  it('deletes one saved station from the saved page', async () => {
    await ctx.page.click('.nav-item[data-nav="saved"]');
    const row = ctx.page.locator('#cachedStationsList .cached-item-row').first();
    await row.waitFor();
    ctx.page.once('dialog', (dialog) => dialog.accept());
    await row.locator('[data-action="delete-sample"]').click();
    await ctx.page.locator('#cachedStationsList .cached-empty').waitFor();
    assert.equal((await fetchOffline()).status, 404);
    await ctx.page.click('.nav-item[data-nav="radio"]');
    assert.equal(await target.locator('.offline-ready-badge').count(), 0);
    // save it again so the clear-all test below has something to clear
    await target.locator('[data-action="precache"]').click();
    await target.locator('.offline-ready-badge').waitFor({ timeout: 60000 });
  });

  it('clears the saved stations and their badges', async () => {
    ctx.page.once('dialog', (dialog) => dialog.accept());
    await ctx.page.click('.nav-item[data-nav="saved"]');
    await ctx.page.click('#clearAllCacheBtn');
    await ctx.page.waitForFunction(() => document.querySelectorAll('.offline-ready-badge').length === 0);
    assert.equal((await fetchOffline()).status, 404);
  });
});
