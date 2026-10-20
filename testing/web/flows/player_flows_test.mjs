// End-to-end flows in a real browser: playing, recovering, searching, languages and modals.
import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
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
const state = (page) => page.evaluate(() => window.app.player.state);
const waitState = (page, expected, timeout = 15000) =>
  page.waitForFunction((s) => window.app.player.state === s, expected, { timeout });
const card = (page, n) => page.locator('.station-card').nth(n);
const cardCount = (page) => page.locator('.station-card').count();

async function search(page, text) {
  await page.fill('#searchInput', text);
}

describe('playing', () => {
  it('plays a station and shows it in the cards and the mini player', async () => {
    const page = await open();
    await card(page, 2).locator('.station-name').click();
    await waitState(page, 'playing');
    const name = await card(page, 2).locator('.station-name').innerText();
    assert.equal(await page.locator('.station-card.active').count(), 1);
    assert.equal(await page.locator('#mobileBarTitle').innerText(), name);
    assert.ok(await page.locator('.mobile-player-bar.visible').isVisible());
    assert.ok(await page.evaluate(() => document.body.classList.contains('has-mini-player')));
    assert.match(await card(page, 2).locator('[data-action="play"]').getAttribute('aria-label'), /إيقاف/);
    assert.deepEqual(ctx.problems, []);
  });

  it('pauses and resumes from the card button', async () => {
    const page = await open();
    await card(page, 0).locator('[data-action="play"]').click();
    await waitState(page, 'playing');
    await page.locator('.station-card.active [data-action="play"]').click();
    await waitState(page, 'paused');
    await page.locator('.station-card.active [data-action="play"]').click();
    await waitState(page, 'playing');
  });

  it('moves the highlighted card when another station starts', async () => {
    const page = await open();
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'playing');
    await card(page, 1).locator('.station-name').click();
    await waitState(page, 'playing');
    assert.equal(await page.locator('.station-card.active').count(), 1);
    assert.equal(await page.locator('.station-card.active').getAttribute('data-id'),
      await card(page, 1).getAttribute('data-id'));
  });

  it('plays again after the sleep timer has stopped the stream', async () => {
    const page = await open();
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'playing');
    await page.evaluate(() => window.app.player.setSleepTimer(0.03));
    await waitState(page, 'idle', 10000);
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'playing');
  });

  it('starts a station from the keyboard', async () => {
    const page = await open();
    await card(page, 1).focus();
    await page.keyboard.press('Enter');
    await waitState(page, 'playing');
  });
});

describe('a stream that does not answer', () => {
  const shortTimings = () => page => page.evaluate(() => {
    Object.assign(window.AudioStreamPlayer.TUNING, { maxRetries: 2, stallTimeoutMs: 300, retryDelayMs: 50 });
  });

  it('ends in an error with a message instead of reconnecting forever', async () => {
    const page = await open({ streams: 'hang' });
    await shortTimings()(page);
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'error', 10000);
    await page.waitForSelector('.toast-notification.show');
    assert.match(await page.locator('.toast-notification').innerText(), /تعذر تشغيل البث/);
    assert.match(await page.locator('#mobileBarStatus').innerText(), /تعذر تشغيل البث/);

    const changes = await page.evaluate(() => new Promise((resolve) => {
      let count = 0;
      window.app.player.onStateChange(() => { count++; });
      setTimeout(() => resolve(count), 1500);
    }));
    assert.equal(changes, 0, 'the player kept changing state after giving up');
  });

  it('can be paused while it is still connecting', async () => {
    const page = await open({ streams: 'hang' });
    await page.evaluate(() => { window.AudioStreamPlayer.TUNING.stallTimeoutMs = 60000; });
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'buffering');
    await page.locator('#mobileBarPlayBtn').click();
    await waitState(page, 'paused');
    await page.waitForTimeout(500);
    assert.equal(await state(page), 'paused');
  });
});

describe('finding stations', () => {
  it('matches Arabic names regardless of spaces and hamza', async () => {
    const page = await open();
    const total = await cardCount(page);

    await search(page, 'عبد الباسط');
    const names = await page.locator('.station-name').allInnerTexts();
    assert.ok(names.length >= 3 && names.length < total);
    assert.ok(names.every((n) => n.replace(/\s/g, '').includes('عبدالباسط')));

    await search(page, 'احمد');
    assert.ok((await cardCount(page)) >= 10, 'احمد should find the أحمد stations');

    await search(page, 'zzzz-nothing');
    assert.ok(await page.locator('.empty-state').isVisible());

    await page.click('#clearSearchBtn');
    assert.equal(await cardCount(page), total);
  });

  it('shows a filled Riwayat tab and keeps its stations in both languages', async () => {
    const page = await open();
    await page.click('.cat-chip[data-id="RIWAYAT"]');
    const arabic = await cardCount(page);
    assert.ok(arabic >= 8);

    await page.click('#langToggleBtn');
    await page.waitForFunction(() => document.querySelector('.station-name')?.textContent.startsWith('Radio'));
    assert.equal(await page.locator('.cat-chip.active').getAttribute('data-id'), 'RIWAYAT');
    assert.equal(await cardCount(page), arabic);
  });

  it('keeps favorites across a reload and lists them in the Favorites tab', async () => {
    const page = await open();
    const id = await card(page, 1).getAttribute('data-id');
    await card(page, 1).locator('[data-action="fav"]').click();
    await page.click('.cat-chip[data-id="FAVORITES"]');
    assert.equal(await cardCount(page), 1);
    await page.reload();
    await page.waitForSelector('.station-card');
    assert.ok(await page.locator(`.station-card[data-id="${id}"] .fav.active`).count() === 1);
  });

  it('plays the next station from the filtered list', async () => {
    const page = await open();
    await search(page, 'عبد الباسط');
    const ids = await page.locator('.station-card').evaluateAll((els) => els.map((e) => Number(e.dataset.id)));
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'playing');
    await page.evaluate(() => window.app.playNeighbor(1));
    await page.waitForFunction((second) => window.app.player.currentStation.id === second, ids[1]);
  });
});

describe('language, modals and content', () => {
  it('switches direction and refreshes the texts, including the player', async () => {
    const page = await open();
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'playing');
    await page.click('#langToggleBtn');
    await page.waitForFunction(() => document.querySelector('.station-name')?.textContent.startsWith('Radio'));
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'ltr');
    assert.equal(await page.locator('#appTitle').innerText(), 'MP3Quran Live Radio');
    assert.equal(await page.locator('#mobileBarStatus').innerText(), 'LIVE 24/7');
    assert.match(await page.locator('#mobileBarTitle').innerText(), /^Radio /);
    assert.equal(await page.locator('#closeCacheBtn').getAttribute('aria-label'), 'Close');
  });

  it('opens the supported devices modal and closes it with Escape', async () => {
    const page = await open();
    await page.click('#devicesBtn');
    await page.waitForSelector('#devicesModal.active');
    assert.equal(await page.locator('.device-item-card').count(), 5);
    assert.notEqual(await page.locator('#diagResolution').innerText(), '0 x 0');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#devicesModal.active').count(), 0);
  });

  it('has no reciter info feature left', async () => {
    const page = await open();
    assert.equal(await page.locator('#reciterModal').count(), 0);
    assert.equal(await page.locator('[data-action="info"]').count(), 0);
    assert.equal(await page.evaluate(() => typeof window.findReciterForStation), 'undefined');
  });

  it('shows station names as text, never as markup', async () => {
    const page = await open({
      radios: () => [{ id: 1, name: '<img src=x onerror="window.__xss=1">Reciter', url: 'https://backup.qurango.net/radio/x' }]
    });
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.match(await page.locator('.station-name').innerText(), /<img src=x/);
    assert.equal(await page.locator('.station-name img').count(), 0);
  });

  it('falls back to the built-in stations when the API is down', async () => {
    const page = await open({ apiStatus: 500 });
    const expected = await page.evaluate(() => window.FALLBACK_STATIONS.ar.length);
    assert.equal(await cardCount(page), expected);
  });
});
