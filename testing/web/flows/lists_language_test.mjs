// Infinite scrolling on every list, and the reciters / surahs in English.
import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import { launchBrowser, openApp, scrollToEnd } from '../helpers/browser.mjs';
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

const open = async (options) => { ctx = await openApp(browser, server.url, { width: 390, height: 700, ...options }); return ctx.page; };
const count = (page, selector) => page.locator(selector).count();

describe('infinite scrolling', () => {
  it('renders the radio stations a page at a time until all are shown', async () => {
    const page = await open();
    assert.equal(await count(page, '#stationsContainer .station-card'), 30);
    assert.equal(await count(page, '#stationsContainer .list-cursor'), 1);
    await scrollToEnd(page, '#stationsContainer');
    assert.equal(await count(page, '#stationsContainer .station-card'), 181);
    assert.equal(await count(page, '#stationsContainer .list-cursor'), 0);
  });

  it('starts again from the first page after a search', async () => {
    const page = await open();
    await scrollToEnd(page, '#stationsContainer');
    await page.fill('#searchInput', 'ا');
    assert.ok((await count(page, '#stationsContainer .station-card')) <= 30);
  });

  it('renders the surahs of a mushaf a page at a time', async () => {
    const page = await open({ hash: '#/reciter/51' });
    await page.locator('#surahList .surah-row').first().waitFor();
    assert.equal(await count(page, '#surahList .surah-row'), 30);
    await scrollToEnd(page, '#surahList');
    assert.equal(await count(page, '#surahList .surah-row'), 114);
  });

  it('still plays and marks a station that appears in a later page', async () => {
    const page = await open();
    await scrollToEnd(page, '#stationsContainer');
    const last = page.locator('#stationsContainer .station-card').last();
    await last.locator('.station-name').click();
    await page.waitForFunction(() => window.app.player.state === 'playing');
    assert.equal(await last.evaluate((el) => el.classList.contains('active')), true);
  });
});

describe('reciters and surahs in English', () => {
  it('loads English reciter and surah names after switching language', async () => {
    const page = await open({ hash: '#/reciters' });
    await page.locator('.reciter-card').first().waitFor();
    await page.click('#langToggleBtn');
    await page.waitForFunction(() => document.querySelector('#recitersCount').textContent.includes('reciters'));
    const names = await page.locator('#recitersList .station-name').allInnerTexts();
    assert.ok(names.includes('Ibrahim Al-Akdar'));
    assert.ok(/^[A-Z]$/.test(await page.locator('.letter-chip').first().innerText()), 'Latin letters in the index');

    await page.locator('.reciter-card', { hasText: 'Mahmoud Khalil Al-Hussary' }).click();
    await page.locator('#surahList .surah-row').first().waitFor();
    assert.equal(await page.locator('#surahList .surah-name').first().innerText(), 'Surah Al-Fatihah');
    assert.ok(await page.locator('#moshafBar .riwaya-chip', { hasText: "Rewayat Warsh A'n Nafi'" }).count() >= 1);
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'ltr');
  });

  it('keeps a surah playing while the language changes', async () => {
    const page = await open({ hash: '#/reciter/51', surahSeconds: 30 });
    await page.locator('.surah-row[data-surah="1"] [data-action="play"]').click();
    await page.waitForFunction(() => window.app.player.state === 'playing');
    await page.click('#langToggleBtn');
    await page.waitForFunction(() => document.querySelector('#surahList .surah-name')?.textContent.startsWith('Surah'));
    assert.equal(await page.evaluate(() => window.app.player.state), 'playing');
    assert.deepEqual(ctx.problems, []);
  });
});
