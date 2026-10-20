// Surah downloads with the real service worker: save, list, play offline with seeking, delete.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { launchBrowser, openApp } from '../helpers/browser.mjs';
import { startStaticServer } from '../helpers/static-server.mjs';

let server;
let browser;
let ctx;

before(async () => {
  server = await startStaticServer();
  browser = await launchBrowser();
  ctx = await openApp(browser, server.url, { serviceWorkers: 'allow', surahSeconds: 20, width: 390 });
  await ctx.page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
});

after(async () => {
  await ctx.context.close();
  await browser.close();
  await server.close();
});

const go = async (hash) => {
  await ctx.page.evaluate((h) => { window.location.hash = h; }, hash);
};
const confirmModal = () => ctx.page.locator('#confirmModal.active');
const answer = async (button) => {
  await confirmModal().waitFor();
  await ctx.page.click(button === 'ok' ? '#confirmOkBtn' : '#confirmCancelBtn');
  await ctx.page.locator('#confirmModal.active').waitFor({ state: 'detached' });
};
const fetchSaved = (path, headers = {}) => ctx.page.evaluate(async ([p, h]) => {
  const res = await fetch(p, { headers: h });
  return { status: res.status, size: (await res.arrayBuffer()).byteLength, range: res.headers.get('Content-Range') };
}, [path, headers]);

describe('surah downloads', () => {
  it('asks in a confirmation window with the surah, reciter and size, and Cancel downloads nothing', async () => {
    await go('#/reciter/51');
    await ctx.page.locator('.surah-row').first().waitFor();
    await ctx.page.fill('#surahSearch', '108');
    await ctx.page.locator('.surah-row[data-surah="108"] [data-action="download"]').click();
    await confirmModal().waitFor();
    assert.match(await ctx.page.locator('#confirmMessage').innerText(), /سورة الكوثر.*عبدالباسط عبدالصمد/);
    await ctx.page.waitForFunction(() => /MB/.test(document.querySelector('#confirmDetails').textContent));
    assert.equal(await ctx.page.locator('#confirmOkBtn.is-danger').count(), 0);
    await answer('cancel');
    assert.equal(await ctx.page.evaluate(() => window.app.downloadProgress.size), 0);
    assert.equal(await ctx.page.locator('.surah-row[data-surah="108"].is-saved').count(), 0);
  });

  it('shows "storage full" when the device refuses the file, and keeps no partial copy', async () => {
    await ctx.page.evaluate(() => {
      window.__realPut = Cache.prototype.put;
      Cache.prototype.put = function () { return Promise.reject(new DOMException('full', 'QuotaExceededError')); };
    });
    await ctx.page.locator('.surah-row[data-surah="108"] [data-action="download"]').click();
    await answer('ok');
    await ctx.page.waitForFunction(() => /مساحة جهازك ممتلئة/.test(document.querySelector('.toast-notification').textContent));
    await ctx.page.evaluate(() => { Cache.prototype.put = window.__realPut; });
    assert.equal((await fetchSaved('offline-surah/53/108')).status, 404);
    assert.equal(await ctx.page.locator('.surah-row[data-surah="108"].is-saved').count(), 0);
  });

  it('downloads one surah after confirming and marks it as saved', async () => {
    await ctx.page.locator('.surah-row[data-surah="108"] [data-action="download"]').click();
    await answer('ok');
    await ctx.page.locator('.surah-row[data-surah="108"].is-saved').waitFor({ timeout: 30000 });
    assert.match(await ctx.page.locator('.toast-notification').innerText(), /تم تحميل سورة الكوثر/);
    const file = await fetchSaved('offline-surah/53/108');
    assert.equal(file.status, 200);
    assert.ok(file.size > 100000);
  });

  it('downloads a whole mushaf after asking', async () => {
    await go('#/reciter/123/124');
    await ctx.page.locator('#surahList .surah-row').first().waitFor();
    const total = await ctx.page.locator('#surahList .surah-row').count();
    await ctx.page.click('#downloadAllBtn');
    await confirmModal().waitFor();
    assert.match(await ctx.page.locator('#confirmMessage').innerText(), new RegExp(`${total} سورة`));
    await answer('ok');
    await ctx.page.waitForFunction((n) => document.querySelectorAll('#surahList .surah-row.is-saved').length === n, total, { timeout: 60000 });
  });

  it('lists the downloads grouped by reciter and mushaf on the saved page', async () => {
    await ctx.page.click('.nav-item[data-nav="saved"]');
    await ctx.page.locator('.saved-group').first().waitFor();
    assert.equal(await ctx.page.locator('.saved-group').count(), 2);
    const alafasy = ctx.page.locator('.saved-group', { hasText: 'مشاري العفاسي' });
    assert.match(await alafasy.locator('.saved-group-sub').innerText(), /الدوري عن الكسائي/);
    assert.match(await ctx.page.locator('#cacheStationsCountText').innerText(), /سورة محفوظة/);
  });

  it('plays a downloaded surah after an offline reload, with seeking', async () => {
    await ctx.context.setOffline(true);
    await ctx.page.reload({ waitUntil: 'load' });
    await ctx.page.locator('.saved-group').first().waitFor({ timeout: 20000 });
    const group = ctx.page.locator('.saved-group', { hasText: 'عبدالباسط عبدالصمد' });
    await group.locator('.saved-surah-row [data-action="play"]').first().click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'playing', null, { timeout: 15000 });
    assert.match(await ctx.page.evaluate(() => window.app.player.audio.currentSrc), /offline-surah\/53\/108$/);

    await ctx.page.evaluate(() => window.app.player.seek(12));
    await ctx.page.waitForFunction(() => window.app.player.audio.currentTime >= 11, null, { timeout: 5000 });
    const part = await fetchSaved('offline-surah/53/108', { Range: 'bytes=0-99' });
    assert.equal(part.status, 206);
    assert.equal(part.size, 100);
  });

  it('opens the reciters offline from the cache and refuses unsaved surahs at once', async () => {
    await ctx.page.evaluate(() => window.app.player.stop());
    await go('#/reciter/51');
    await ctx.page.locator('.surah-row[data-surah="1"]').waitFor({ timeout: 15000 });
    await ctx.page.fill('#surahSearch', '108');
    assert.ok(await ctx.page.locator('.surah-row[data-surah="108"].is-saved').isVisible());
    await ctx.page.fill('#surahSearch', '');
    await ctx.page.locator('.surah-row[data-surah="1"] [data-action="play"]').click();
    await ctx.page.waitForFunction(() => window.app.player.state === 'error', null, { timeout: 3000 });
    assert.match(await ctx.page.locator('.toast-notification').innerText(), /هذه السورة غير محفوظة/);
    await ctx.context.setOffline(false);
  });

  it('deletes a download and frees its space', async () => {
    await ctx.page.click('.nav-item[data-nav="saved"]');
    const group = ctx.page.locator('.saved-group', { hasText: 'عبدالباسط عبدالصمد' });
    await group.waitFor();
    await group.locator('.saved-surah-row [data-action="delete"]').first().click();
    await confirmModal().waitFor();
    assert.equal(await ctx.page.locator('#confirmOkBtn.is-danger').count(), 1, 'deleting uses the red button');
    await answer('ok');
    await ctx.page.waitForFunction(() => document.querySelectorAll('.saved-group').length === 1);
    assert.equal((await fetchSaved('offline-surah/53/108')).status, 404);
    assert.deepEqual(ctx.problems, []);
  });
});
