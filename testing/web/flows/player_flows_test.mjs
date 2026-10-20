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
    Object.assign(window.AudioStreamPlayer.TUNING, { maxRetries: 2, stallTimeoutMs: 300, mirrorStallTimeoutMs: 300, retryDelayMs: 50 });
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
    const names = await page.locator('.station-card .station-name').allInnerTexts();
    assert.ok(names.length >= 3 && names.length < total);
    assert.ok(names.every((n) => n.replace(/\s/g, '').includes('عبدالباسط')));

    await search(page, 'احمد');
    assert.ok((await cardCount(page)) >= 10, 'احمد should find the أحمد stations');

    await search(page, 'zzzz-nothing');
    assert.ok(await page.locator('.empty-state').isVisible());

    await page.click('#clearSearchBtn');
    assert.equal(await cardCount(page), total);
  });

  it('shows a filled Riwayat tab', async () => {
    const page = await open();
    await page.click('.cat-chip[data-id="RIWAYAT"]');
    assert.ok((await cardCount(page)) >= 8);
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
  it('switches between Arabic and English and remembers the choice', async () => {
    const page = await open();
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
    assert.equal(await page.locator('#langBtnText').innerText(), 'English');
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'playing');

    await page.click('#langToggleBtn');
    await page.waitForFunction(() => document.querySelector('.station-card .station-name')?.textContent.startsWith('Holy Quran'));
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'ltr');
    assert.equal(await page.locator('#appTitle').innerText(), 'Quran Radio');
    assert.equal(await page.locator('#mobileBarStatus').innerText(), 'LIVE 24/7');
    assert.equal(await state(page), 'playing', 'switching language keeps the audio playing');

    await page.reload();
    await page.waitForSelector('.station-card');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    await page.click('#langToggleBtn');
    await page.waitForFunction(() => document.documentElement.dir === 'rtl');
    assert.equal(await page.locator('#appTitle').innerText(), 'إذاعة القرآن الكريم');
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
    assert.equal(await page.locator('.station-name', { hasText: '<img src=x' }).count(), 1);
    assert.equal(await page.locator('.station-name img').count(), 0);
  });

  it('falls back to the built-in stations when the API is down', async () => {
    const page = await open({ apiStatus: 500 });
    const expected = await page.evaluate(() => window.FALLBACK_STATIONS.ar.length);
    assert.equal(await cardCount(page), expected + 4, 'fallback stations plus the four pinned live stations');
  });

  it('shows the last station list at once on the next start, before the API answers', async () => {
    const page = await open();
    const expected = await cardCount(page);
    // The API never answers now (a slow connection): the list must not wait for it, nor fall back
    await ctx.context.route(/\/api\/v3\/radios/, () => {});
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.station-card', { state: 'attached', timeout: 3000 });
    assert.equal(await cardCount(page), expected);
    assert.doesNotMatch(await page.locator('#stationsCountBadge').innerText(), /جاري تحميل/);
  });
});

describe('sleep timer inside the full-screen player', () => {
  it('shows the timer dialog on top and the countdown without closing the player', async () => {
    const page = await open();
    await card(page, 0).locator('.station-name').click();
    await waitState(page, 'playing');
    await page.click('#mobilePlayerBar .mini-bar-info');
    await page.click('#fullPlayerTimerBtn');

    const onTop = await page.evaluate(() => {
      const chip = document.querySelector('#timerGrid .btn-timer-chip').getBoundingClientRect();
      const hit = document.elementFromPoint(chip.left + chip.width / 2, chip.top + chip.height / 2);
      return !!hit.closest('#timerModal');
    });
    assert.ok(onTop, 'the timer dialog is hidden behind the full player');

    await page.click('#timerGrid .btn-timer-chip');
    assert.ok(await page.locator('#fullPlayerTimerBadge, #fullTimerBadge').first().isVisible());
    assert.match(await page.locator('#fullTimerBadge').innerText(), /\d\d:\d\d/);
  });
});

describe('Egyptian radio, alphabetical order and riwayat', () => {
  it('pins the Cairo Quran radio first and plays it', async () => {
    const page = await open();
    assert.equal(await card(page, 0).getAttribute('data-id'), '900001');
    assert.equal(await card(page, 0).locator('.station-name').innerText(), 'إذاعة القرآن الكريم من القاهرة');
    await card(page, 0).locator('.station-name').click();
    await page.waitForFunction(() => window.app.player.currentStation.id === 900001);
  });

  it('lists the other stations alphabetically', async () => {
    const page = await open();
    const ok = await page.evaluate(() => {
      const { nameSortKey } = window.QRUtils;
      const collator = new Intl.Collator('ar', { sensitivity: 'base', numeric: true });
      const names = [...document.querySelectorAll('.station-card .station-name')].map((e) => e.textContent).slice(4);
      return names.every((n, i) => i === 0 || collator.compare(nameSortKey(names[i - 1], 'ar'), nameSortKey(n, 'ar')) <= 0);
    });
    assert.ok(ok, 'the list is not in alphabetical order');
  });

  it('shows the riwaya name on every station of the Riwayat tab', async () => {
    const page = await open();
    await page.click('.cat-chip[data-id="RIWAYAT"]');
    const badges = await page.locator('.station-card .station-riwaya').allInnerTexts();
    assert.equal(badges.length, await cardCount(page));
    assert.ok(badges.includes('ورش عن نافع') && badges.includes('قالون عن نافع'));
  });
});

describe('riwaya filter', () => {
  const chips = (page) => page.locator('#riwayaBar .riwaya-chip');

  it('shows a chip per riwaya with counts only on the Riwayat tab', async () => {
    const page = await open();
    assert.ok(await page.locator('#riwayaBar').isHidden());
    await page.click('.cat-chip[data-id="RIWAYAT"]');
    assert.ok(await page.locator('#riwayaBar').isVisible());
    assert.equal(await chips(page).count(), 8, 'All riwayat plus 7 riwayat');
    const warsh = chips(page).filter({ hasText: 'ورش عن نافع' });
    assert.equal((await warsh.locator('.riwaya-count').innerText()).trim(), '2');
    assert.match(await chips(page).first().innerText(), /كل الروايات\s*10/);
    await page.click('.cat-chip[data-id="ALL"]');
    assert.ok(await page.locator('#riwayaBar').isHidden());
  });

  it('filters the list by the chosen riwaya and restores it afterwards', async () => {
    const page = await open();
    await page.click('.cat-chip[data-id="RIWAYAT"]');
    await chips(page).filter({ hasText: 'ورش عن نافع' }).click();
    assert.equal(await cardCount(page), 2);
    assert.deepEqual([...new Set(await page.locator('.station-riwaya').allInnerTexts())], ['ورش عن نافع']);
    assert.match(await page.locator('#stationsCountBadge').innerText(), /2/);

    await chips(page).first().click();
    assert.equal(await cardCount(page), 10);

    await chips(page).filter({ hasText: 'قالون عن نافع' }).click();
    await page.click('.cat-chip[data-id="POPULAR"]');
    await page.click('.cat-chip[data-id="RIWAYAT"]');
    assert.equal(await cardCount(page), 10, 'leaving the tab resets the riwaya filter');
  });

});

describe('volume control', () => {
  const open2 = async () => {
    const page = await open();
    await page.locator('.station-card').nth(2).locator('.station-name').click();
    await waitState(page, 'playing');
    await page.click('#mobilePlayerBar .mini-bar-info');
    return page;
  };
  const full = (page) => page.locator('#mobileFullPlayerOverlay [data-volume-control]');
  const setSlider = (page, value) => full(page).locator('[data-volume-slider]').evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);

  it('puts high volume on the right in Arabic and fills the track up to the thumb', async () => {
    const page = await open2();
    const slider = full(page).locator('[data-volume-slider]');
    assert.equal(await slider.evaluate((el) => getComputedStyle(el).direction), 'ltr');
    assert.equal((await full(page).locator('[data-volume-value]').innerText()).trim(), '100%');
    await setSlider(page, 0.3);
    assert.equal(await slider.evaluate((el) => el.style.getPropertyValue('--vol')), '30%');
    assert.equal((await full(page).locator('[data-volume-value]').innerText()).trim(), '30%');
    assert.equal(await page.evaluate(() => window.app.player.audio.volume), 0.3);
  });

  it('mutes and restores the previous level, and keeps both controls in sync', async () => {
    const page = await open2();
    await setSlider(page, 0.3);
    await full(page).locator('[data-volume-mute]').click();
    assert.equal(await page.evaluate(() => window.app.player.audio.muted), true);
    assert.equal(await full(page).locator('[data-volume-mute]').getAttribute('aria-pressed'), 'true');
    assert.equal((await full(page).locator('[data-volume-value]').innerText()).trim(), '0%');
    const hero = page.locator('.hero-player-panel [data-volume-control]');
    assert.equal(await hero.evaluate((el) => el.classList.contains('is-muted')), true);

    await full(page).locator('[data-volume-mute]').click();
    assert.equal(await page.evaluate(() => window.app.player.audio.muted), false);
    assert.equal(await page.evaluate(() => window.app.player.audio.volume), 0.3);
    assert.equal((await hero.locator('[data-volume-value]').innerText()).trim(), '30%');
  });

  it('moving the slider while muted unmutes, and the level survives a reload', async () => {
    const page = await open2();
    await full(page).locator('[data-volume-mute]').click();
    await setSlider(page, 0.6);
    assert.equal(await page.evaluate(() => window.app.player.audio.muted), false);
    await page.reload();
    await page.waitForSelector('.station-card');
    assert.equal(await page.evaluate(() => window.app.player.audio.volume), 0.6);
    assert.equal(await page.evaluate(() => window.app.player.muted), false);
  });
});
