// Cairo / Makkah / Haram / Nabawi: pinned order, mirror failover, HLS played as sound, favorites first.
import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import { launchBrowser, openApp } from '../helpers/browser.mjs';
import { startStaticServer } from '../helpers/static-server.mjs';

let server;
let browser;
let ctx;

before(async () => {
  server = await startStaticServer();
  browser = await launchBrowser();
});

after(async () => {
  await browser.close();
  await server.close();
});

afterEach(async () => {
  if (ctx) await ctx.context.close();
  ctx = null;
});

const open = async (options) => { ctx = await openApp(browser, server.url, { width: 393, ...options }); return ctx.page; };
const ids = (page) => page.locator('#stationsContainer .station-card').evaluateAll((els) => els.map((e) => Number(e.dataset.id)));
const playCard = (page, id) => page.locator(`.station-card[data-id="${id}"] .station-name`).click();
const waitPlaying = (page, id) => page.waitForFunction((sid) => window.app.player.currentStation?.id === sid
  && window.app.player.state === 'playing', id, { timeout: 20000 });

describe('pinned live stations', () => {
  it('lists Cairo, Makkah, the Haram and the Nabawi first, in Arabic and English', async () => {
    const page = await open();
    assert.deepEqual((await ids(page)).slice(0, 4), [900001, 900002, 900003, 900004]);
    const names = await page.locator('.station-card .station-name').allInnerTexts();
    assert.deepEqual(names.slice(0, 4), ['إذاعة القرآن الكريم من القاهرة', 'إذاعة القرآن الكريم من مكة المكرمة',
      'البث المباشر من المسجد الحرام', 'البث المباشر من المسجد النبوي']);
    await page.click('#langToggleBtn');
    await page.waitForFunction(() => document.querySelector('.station-card .station-name').textContent === 'Holy Quran Radio from Cairo');
    const english = await page.locator('.station-card .station-name').allInnerTexts();
    assert.deepEqual(english.slice(1, 4), ['Holy Quran Radio from Makkah', 'Live from Masjid al-Haram', 'Live from Masjid an-Nabawi']);
  });

  it('marks only the HLS broadcasts as using more data', async () => {
    const page = await open();
    assert.equal(await page.locator('.station-note-badge').count(), 2);
    assert.match(await page.locator('.station-card[data-id="900004"] .station-note-badge').innerText(), /بث مرئي · يستهلك بيانات أكثر/);
  });
});

describe('mirror failover', () => {
  it('reaches the second Cairo mirror without an error when the first fails, and starts there next time', async () => {
    const page = await open({ failHosts: ['stream.radiojar.com'] });
    await playCard(page, 900001);
    await waitPlaying(page, 900001);
    assert.match(await page.evaluate(() => window.app.player.audio.currentSrc), /radio\.xecod\.com/);
    assert.equal(await page.evaluate(() => window.app.player.retryCount), 0);
    assert.equal(await page.locator('.toast-notification.show', { hasText: 'تعذر' }).count(), 0);

    await page.evaluate(() => window.app.player.stop());
    await playCard(page, 900001);
    await waitPlaying(page, 900001);
    const first = await page.evaluate(() => window.app.player.mirrorOrder[0]);
    assert.match(first, /radio\.xecod\.com/, 'the mirror that worked is tried first now');
    assert.deepEqual(ctx.problems, []);
  });

  it('waits less on mirrored stations and longer on HLS, whose first segment is large', async () => {
    const page = await open();
    const timeouts = await page.evaluate(() => {
      const p = window.app.player;
      const timeoutOf = (station) => { p.currentStation = station; return p._stallTimeoutMs(); };
      return [timeoutOf(window.app.stationsById.get(900002)), timeoutOf(window.app.stationsById.get(900004)),
        timeoutOf(window.app.stations.find((s) => !s.pinned))];
    });
    assert.deepEqual(timeouts, [4000, 15000, 7000]);
  });
});

describe('HLS live broadcasts', () => {
  it('loads hls.js once, on demand, plays the sound and destroys it on switch', async () => {
    const page = await open();
    const hlsRequests = [];
    page.on('request', (r) => { if (r.url().includes('hls.light.min.js')) hlsRequests.push(r.url()); });
    assert.equal(await page.evaluate(() => typeof window.Hls), 'undefined', 'not loaded before an HLS station plays');

    await playCard(page, 900004);
    await waitPlaying(page, 900004);
    assert.equal(await page.evaluate(() => !!window.app.player.hls), true);

    await playCard(page, 900003);
    await waitPlaying(page, 900003);
    await playCard(page, 900002);
    await waitPlaying(page, 900002);
    assert.equal(await page.evaluate(() => window.app.player.hls), null, 'switching to a normal stream destroys hls.js');
    assert.equal(hlsRequests.length, 1);
    assert.deepEqual(ctx.problems, []);
  });
});

describe('radio channels tab', () => {
  it('sits right after All and lists only the five channels, in order', async () => {
    const page = await open();
    const chips = await page.locator('.cat-chip').evaluateAll((els) => els.map((e) => e.dataset.id));
    assert.deepEqual(chips.slice(0, 3), ['ALL', 'CHANNELS', 'POPULAR']);
    assert.equal((await page.locator('.cat-chip').nth(1).innerText()).trim(), 'الإذاعات');

    await page.click('.cat-chip[data-id="CHANNELS"]');
    assert.deepEqual(await ids(page), [900001, 900002, 900003, 900004, 900005]);
    const names = await page.locator('.station-card .station-name').allInnerTexts();
    assert.equal(names[4], 'إذاعة القرآن الكريم من البحرين');

    await page.click('.cat-chip[data-id="POPULAR"]');
    assert.ok((await ids(page)).every((id) => id < 900001), 'reciters tab holds no channel');
  });

  it('names the tab and the Bahrain station in English', async () => {
    const page = await open({ lang: 'eng' });
    assert.equal((await page.locator('.cat-chip').nth(1).innerText()).trim(), 'Radio Channels');
    await page.click('.cat-chip[data-id="CHANNELS"]');
    const names = await page.locator('.station-card .station-name').allInnerTexts();
    assert.equal(names[4], 'Holy Quran Radio from Bahrain');
  });

  it('plays Bahrain as sound with no video-data note', async () => {
    const page = await open();
    assert.equal(await page.locator('.station-card[data-id="900005"] .station-note-badge').count(), 0);
    await playCard(page, 900005);
    await waitPlaying(page, 900005);
  });
});

describe('favorites first', () => {
  it('moves a hearted station above the pinned ones, back again when removed, and keeps it after a reload', async () => {
    const page = await open();
    const id = (await ids(page))[20];
    await page.locator(`.station-card[data-id="${id}"] [data-action="fav"]`).click();
    assert.deepEqual((await ids(page)).slice(0, 2), [id, 900001]);

    await page.reload();
    await page.waitForSelector('.station-card');
    assert.equal((await ids(page))[0], id);

    await page.locator(`.station-card[data-id="${id}"] [data-action="fav"]`).click();
    assert.equal((await ids(page))[0], 900001);
    assert.equal((await ids(page)).indexOf(id), 20);
  });
});
