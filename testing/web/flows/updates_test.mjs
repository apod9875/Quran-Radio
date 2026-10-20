// Telling users about updates: the "new version" banner and the one-time new-icon notice.
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

const reload = async (page) => {
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.station-card', { state: 'attached' });
};

describe('new version banner', () => {
  it('stays hidden on the first install and appears when a new version takes over', async () => {
    ctx = await openApp(browser, server.url, { serviceWorkers: 'allow' });
    const page = ctx.page;
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#updateBanner').isVisible(), false, 'the first install is not an update');

    // A page that already has a worker sees a new one take control (what a deploy looks like)
    await reload(page);
    await page.waitForFunction(() => window.app && navigator.serviceWorker.controller);
    await page.waitForFunction(() => document.querySelector('#updateNowBtn') && window.app.dom.updateBanner);
    await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
    await page.locator('#updateBanner').waitFor();
    assert.match(await page.locator('#updateBanner').innerText(), /يتوفر إصدار جديد/);

    const banner = await page.locator('#updateBanner').boundingBox();
    const viewport = page.viewportSize();
    assert.ok(banner.x >= 0 && banner.x + banner.width <= viewport.width + 0.5, 'the banner fits the screen');

    await Promise.all([page.waitForEvent('load'), page.click('#updateNowBtn')]);
    await page.waitForSelector('.station-card', { state: 'attached' });
    assert.equal(await page.locator('#updateBanner').isVisible(), false);
  });

  it('the worker reports the version the page runs', async () => {
    ctx = await openApp(browser, server.url, { serviceWorkers: 'allow' });
    const page = ctx.page;
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 });
    const reply = await page.evaluate(() => window.QR_SW.request({ type: 'GET_VERSION' }));
    assert.equal(reply.version, await page.evaluate(() => window.QR_RELEASES[0].version));
  });

  it('comes back on every start while the worker holds a newer version', async () => {
    ctx = await openApp(browser, server.url);
    const page = ctx.page;
    const check = (version) => page.evaluate((v) => {
      window.QR_SW.request = async () => ({ version: v });
      return window.app.checkWorkerVersion();
    }, version);

    await check(await page.evaluate(() => window.QR_RELEASES[0].version));
    assert.equal(await page.locator('#updateBanner').isVisible(), false, 'nothing when the page is current');
    await check('99.0.0');
    assert.equal(await page.locator('#updateBanner').isVisible(), true);
    await check('1.0.0');
    await page.click('#updateLaterBtn');
    assert.equal(await page.locator('#updateBanner').isVisible(), false);
  });

  it('can be closed for now', async () => {
    ctx = await openApp(browser, server.url);
    const page = ctx.page;
    await page.evaluate(() => window.app.showUpdateBanner());
    await page.click('#updateLaterBtn');
    assert.equal(await page.locator('#updateBanner').isVisible(), false);
  });
});

describe('new icon notice', () => {
  const asInstalledApp = (context) => context.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => (query.includes('display-mode: standalone')
      ? { matches: true, media: query, addEventListener() {}, removeEventListener() {} }
      : original(query));
  });

  it('is never shown in a browser tab', async () => {
    ctx = await openApp(browser, server.url);
    await ctx.page.waitForTimeout(3000);
    assert.equal(await ctx.page.locator('#confirmModal.active').count(), 0);
  });

  it('tells installed users once how to get the new icon', async () => {
    ctx = await openApp(browser, server.url);
    const page = ctx.page;
    await asInstalledApp(ctx.context);
    await reload(page);
    await page.locator('#confirmModal.active').waitFor({ timeout: 6000 });
    assert.match(await page.locator('#confirmTitle').innerText(), /أيقونة جديدة للتطبيق/);
    assert.match(await page.locator('#confirmMessage').innerText(), /مراجعة تحديث التطبيق/);

    // "Later" brings it back next time; "OK" does not
    await page.click('#confirmCancelBtn');
    await reload(page);
    await page.locator('#confirmModal.active').waitFor({ timeout: 6000 });
    await page.click('#confirmOkBtn');
    await reload(page);
    await page.waitForTimeout(3000);
    assert.equal(await page.locator('#confirmModal.active').count(), 0);
    assert.deepEqual(ctx.problems, []);
  });
});
