// Quran section in a real browser: tabs and routes, reciters page, reciter page and surah playback.
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

const open = async (options) => { ctx = await openApp(browser, server.url, { width: 390, ...options }); return ctx.page; };
const hash = (page) => page.evaluate(() => window.location.hash);
const cards = (page) => page.locator('#recitersList .reciter-card');
const rows = (page) => page.locator('#surahList .surah-row');
const player = (page, expr) => page.evaluate(`window.app.player.${expr}`);
const waitFor = (page, fn, arg, timeout = 15000) => page.waitForFunction(fn, arg, { timeout });

async function openReciters(page) {
  await page.click('.nav-item[data-nav="reciters"]');
  await cards(page).first().waitFor();
}

async function playSurah(page, surah) {
  await page.locator(`.surah-row[data-surah="${surah}"] [data-action="play"]`).click();
  await waitFor(page, (n) => window.app.player.state === 'playing' && window.app.player.currentStation.surah === n, surah);
}

describe('sections and routes', () => {
  it('switches sections with the tab bar and supports the back button', async () => {
    const page = await open();
    await openReciters(page);
    assert.equal(await hash(page), '#/reciters');
    assert.ok(await page.locator('#recitersView').isVisible());
    assert.ok(await page.locator('[data-view="radio"]').isHidden());
    assert.equal(await page.locator('.nav-item.active').getAttribute('data-nav'), 'reciters');

    await cards(page).first().click();
    await rows(page).first().waitFor();
    assert.match(await hash(page), /^#\/reciter\/\d+$/);
    assert.equal(await page.locator('.nav-item.active').getAttribute('data-nav'), 'reciters');

    await page.goBack();
    await page.locator('#recitersView').waitFor({ state: 'visible' });
    assert.equal(await hash(page), '#/reciters');

    await page.click('.nav-item[data-nav="saved"]');
    await page.locator('#savedView').waitFor({ state: 'visible' });
    await page.locator('.nav-item.active[data-nav="saved"]').waitFor();
  });

  it('opens a reciter directly from a link', async () => {
    const page = await open({ hash: '#/reciter/51' });
    await rows(page).first().waitFor();
    assert.equal(await page.locator('#reciterTitle').innerText(), 'عبدالباسط عبدالصمد');
  });

  it('says so when the reciters cannot be loaded', async () => {
    const page = await open({ quranStatus: 500 });
    await page.click('.nav-item[data-nav="reciters"]');
    await waitFor(page, () => document.querySelector('#recitersCount').textContent.includes('تعذر'));
  });
});

describe('reciters page', () => {
  it('lists every reciter with the riwayat of all his mushafs', async () => {
    const page = await open();
    await openReciters(page);
    assert.equal(await cards(page).count(), 14);
    const hussary = cards(page).filter({ hasText: 'محمود خليل الحصري' });
    const badges = await hussary.locator('.station-riwaya').allInnerTexts();
    assert.ok(badges.includes('ورش عن نافع') && badges.includes('قالون عن نافع') && badges.includes('حفص عن عاصم'));
  });

  it('finds reciters regardless of spaces and hamza', async () => {
    const page = await open();
    await openReciters(page);
    await page.fill('#reciterSearch', 'عبد الباسط');
    assert.equal(await cards(page).count(), 1);
    await page.fill('#reciterSearch', 'احمد');
    assert.equal(await cards(page).count(), 2);
    await page.fill('#reciterSearch', 'لا يوجد');
    assert.ok(await page.locator('#recitersList .empty-state').isVisible());
  });

  it('filters reciters by riwaya', async () => {
    const page = await open();
    await openReciters(page);
    const chip = page.locator('#reciterFilterBar .riwaya-chip', { hasText: 'ورش عن نافع' }).first();
    const expected = Number((await chip.locator('.riwaya-count').innerText()).trim());
    await chip.click();
    assert.equal(await cards(page).count(), expected);
    for (const text of await cards(page).allInnerTexts()) assert.match(text, /ورش عن نافع/);
  });

  it('jumps to a letter from the letter index', async () => {
    const page = await open({ height: 700 });
    await openReciters(page);
    await page.locator('.letter-chip[data-letter="م"]').click();
    await waitFor(page, () => {
      const card = document.querySelector('.reciter-card[data-letter="م"]');
      const top = card.getBoundingClientRect().top;
      return top >= 0 && top < window.innerHeight / 2;
    });
  });

  it('keeps favorite reciters and offers them as a filter', async () => {
    const page = await open();
    await openReciters(page);
    await cards(page).first().locator('[data-action="fav-reciter"]').click();
    const favChip = page.locator('#reciterFilterBar .riwaya-chip[data-filter="FAV"]');
    await favChip.click();
    assert.equal(await cards(page).count(), 1);
    await page.reload();
    await openReciters(page);
    assert.equal(await page.locator('#reciterFilterBar .riwaya-chip[data-filter="FAV"] .riwaya-count').innerText(), '1');
  });
});

describe('reciter page and surah playback', () => {
  it('shows a chip per mushaf and every surah of the chosen mushaf', async () => {
    const page = await open({ hash: '#/reciter/118' });
    await rows(page).first().waitFor();
    assert.equal(await page.locator('#moshafBar .riwaya-chip').count(), 5);
    assert.match(await page.locator('#reciterSubtitle').innerText(), /114/);
    assert.equal(await rows(page).count(), 30, 'the first page only');
    await scrollToEnd(page, '#surahList');
    assert.equal(await rows(page).count(), 114);
    await page.locator('#moshafBar .riwaya-chip', { hasText: 'ورش عن نافع' }).click();
    await waitFor(page, () => window.location.hash === '#/reciter/118/120');
    assert.match(await page.locator('#reciterSubtitle').innerText(), /ورش عن نافع/);
    await page.fill('#surahSearch', 'الكهف');
    assert.equal(await rows(page).count(), 1);
    await page.fill('#surahSearch', '36');
    assert.equal(await page.locator('#surahList .surah-name').innerText(), 'سورة يس');
  });

  it('plays a surah with its reciter and riwaya, a seek bar and no live badge', async () => {
    const page = await open({ hash: '#/reciter/51', surahSeconds: 30 });
    await rows(page).first().waitFor();
    await playSurah(page, 1);
    assert.equal(await page.locator('#mobileBarTitle').innerText(), 'سورة الفاتحة');
    assert.match(await page.locator('#mobileBarStatus').innerText(), /عبدالباسط عبدالصمد/);
    assert.ok(await page.locator('.surah-row[data-surah="1"].active').isVisible());

    await page.click('#mobilePlayerBar .mini-bar-info');
    assert.equal(await page.locator('#fullPlayerHeading').innerText(), 'مشغل التلاوة');
    assert.ok(await page.locator('#mobileFullPlayerOverlay [data-seek-control]').isVisible());
    assert.ok(await page.locator('#mobileFullPlayerOverlay .live-indicator').isHidden());
  });

  it('moves on to the next surah when one ends', async () => {
    const page = await open({ hash: '#/reciter/51' });
    await rows(page).first().waitFor();
    await playSurah(page, 1);
    await waitFor(page, () => window.app.player.currentStation.surah === 2, null, 15000);
  });

  it('seeks, changes speed and resumes from the saved position after a reload', async () => {
    const page = await open({ hash: '#/reciter/51', surahSeconds: 60 });
    await rows(page).first().waitFor();
    await playSurah(page, 1);
    await page.evaluate(() => window.app.player.seek(30));
    assert.ok(Math.abs((await player(page, 'audio.currentTime')) - 30) < 2);

    await page.click('#mobilePlayerBar .mini-bar-info');
    await page.locator('#mobileFullPlayerOverlay [data-rate-chip]').click();
    assert.equal(await player(page, 'audio.playbackRate'), 1.25);
    await page.locator('#closeFullPlayerBtn').click();
    await page.locator('#mobileBarPlayBtn').click();
    await waitFor(page, () => window.app.player.state === 'paused');

    await page.reload();
    await page.click('.nav-item[data-nav="reciters"]');
    await page.locator('#continueCard').waitFor();
    assert.match(await page.locator('#continueCard').innerText(), /سورة الفاتحة/);
    await page.locator('#continueCard').click();
    await waitFor(page, () => window.app.player.state === 'playing');
    assert.ok((await player(page, 'audio.currentTime')) >= 25, 'playback resumed from the saved position');
    assert.equal(await player(page, 'rate'), 1.25, 'the speed is remembered');
  });

  it('can stop at the end of the current surah', async () => {
    const page = await open({ hash: '#/reciter/51' });
    await rows(page).first().waitFor();
    await playSurah(page, 1);
    await page.evaluate(() => window.app.openTimerModal());
    const endChip = page.locator('#timerGrid .timer-chip-end');
    assert.ok(await endChip.isVisible());
    await endChip.click();
    await waitFor(page, () => window.app.player.state === 'idle', null, 15000);
    assert.equal(await player(page, 'currentStation.surah'), 1, 'it did not go on to the next surah');
  });

  it('follows the mushaf with next and previous', async () => {
    const page = await open({ hash: '#/reciter/51', surahSeconds: 30 });
    await rows(page).first().waitFor();
    await playSurah(page, 2);
    await page.evaluate(() => window.app.playNeighbor(1));
    await waitFor(page, () => window.app.player.currentStation.surah === 3);
    await page.evaluate(() => window.app.playNeighbor(-1));
    await waitFor(page, () => window.app.player.currentStation.surah === 2);
    assert.deepEqual(ctx.problems, []);
  });
});
