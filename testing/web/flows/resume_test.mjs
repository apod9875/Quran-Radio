// A page refresh keeps listening: the radio or surah that was playing starts again after the reload.
import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import { chromium } from 'playwright';
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

const waitPlaying = (page, id) => page.waitForFunction((sid) => window.app.player.state === 'playing'
  && String(window.app.player.currentStation?.id) === String(sid), id, { timeout: 15000 });
const reload = async (page) => {
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.station-card', { state: 'attached' });
};

describe('refreshing the page', () => {
  it('plays the same radio again after a refresh', async () => {
    ctx = await openApp(browser, server.url);
    const page = ctx.page;
    const id = Number(await page.locator('.station-card').nth(6).getAttribute('data-id'));
    await page.locator('.station-card').nth(6).locator('.station-name').click();
    await waitPlaying(page, id);
    await reload(page);
    await waitPlaying(page, id);
    assert.match(await page.locator('#mobileBarTitle').innerText(), /\S/);
    assert.deepEqual(ctx.problems, []);
  });

  it('continues a surah from where it was, with its mushaf queue', async () => {
    ctx = await openApp(browser, server.url, { hash: '#/reciter/51', surahSeconds: 30 });
    const page = ctx.page;
    await page.locator('.surah-row[data-surah="2"] [data-action="play"]').click();
    await waitPlaying(page, 'surah:53:2');
    await page.evaluate(() => window.app.player.seek(12));
    await page.waitForFunction(() => window.app.player.audio.currentTime >= 11);
    await reload(page);
    await waitPlaying(page, 'surah:53:2');
    await page.waitForFunction(() => window.app.player.audio.currentTime >= 10, null, { timeout: 5000 });
    assert.equal(await page.evaluate(() => window.app.queue.tracks.length), 114);
  });

  it('does not start anything when the player was paused or stopped', async () => {
    ctx = await openApp(browser, server.url);
    const page = ctx.page;
    await page.locator('.station-card').nth(3).locator('.station-name').click();
    await page.waitForFunction(() => window.app.player.state === 'playing');
    await page.locator('#mobileBarPlayBtn').click();
    await page.waitForFunction(() => window.app.player.state === 'paused');
    await reload(page);
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.app.player.state), 'idle');
  });

  it('waits for the first tap when the browser blocks sound after the refresh', async () => {
    const strict = await chromium.launch({ args: ['--autoplay-policy=document-user-activation-required'] });
    try {
      ctx = await openApp(strict, server.url);
      const page = ctx.page;
      const id = Number(await page.locator('.station-card').nth(5).getAttribute('data-id'));
      await page.locator('.station-card').nth(5).locator('.station-name').click();
      await waitPlaying(page, id);
      await reload(page);
      await page.waitForFunction(() => window.app.player.state === 'paused', null, { timeout: 10000 });
      assert.match(await page.locator('.toast-notification').innerText(), /اضغط في أي مكان لمتابعة الاستماع/);
      await page.click('#searchInput'); // any tap on the page
      await waitPlaying(page, id);
    } finally {
      await ctx.context.close();
      ctx = null;
      await strict.close();
    }
  });
});
