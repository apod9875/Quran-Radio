// "What's new": shown once after an update, never on a first visit, and from the About window.
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

const modal = (page) => page.locator('#whatsNewModal.active');
const reload = async (page) => {
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.station-card', { state: 'attached' });
};

describe("what's new", () => {
  it('is not shown on a first visit', async () => {
    ctx = await openApp(browser, server.url, { whatsNew: true });
    await ctx.page.waitForTimeout(2500);
    assert.equal(await modal(ctx.page).count(), 0);
  });

  it('shows the notes once after an update, in the current language', async () => {
    ctx = await openApp(browser, server.url, { whatsNew: true });
    const page = ctx.page;
    await page.evaluate(() => localStorage.setItem('qr_seen_version', '3.6.0'));
    await reload(page);
    await modal(page).waitFor({ timeout: 6000 });
    const latest = await page.evaluate(() => window.QR_RELEASES[0]);
    assert.match(await page.locator('.whats-new-version').first().innerText(), new RegExp(`الإصدار ${latest.version}`));
    assert.equal(await page.locator('.whats-new-release').first().locator('li').count(), latest.ar.length);
    assert.ok((await page.locator('#whatsNewList').innerText()).includes(latest.ar[0]));

    await page.click('#whatsNewOkBtn');
    assert.equal(await page.evaluate(() => localStorage.getItem('qr_seen_version')), latest.version);
    await reload(page);
    await page.waitForTimeout(2500);
    assert.equal(await modal(page).count(), 0, 'shown only once');
    assert.deepEqual(ctx.problems, []);
  });

  it('shows English notes to English users and closes with Escape', async () => {
    ctx = await openApp(browser, server.url, { whatsNew: true, lang: 'eng' });
    const page = ctx.page;
    await page.evaluate(() => localStorage.setItem('qr_seen_version', '3.6.0'));
    await reload(page);
    await modal(page).waitFor({ timeout: 6000 });
    const latest = await page.evaluate(() => window.QR_RELEASES[0]);
    assert.ok((await page.locator('#whatsNewList').innerText()).includes(latest.eng[0]));
    await page.keyboard.press('Escape');
    await modal(page).waitFor({ state: 'detached' });
  });

  it('opens from the About window at any time', async () => {
    ctx = await openApp(browser, server.url);
    const page = ctx.page;
    await page.click('#infoBtn');
    await page.click('#whatsNewBtn');
    await modal(page).waitFor();
    assert.equal(await page.locator('#aboutModal.active').count(), 0);
    assert.ok(await page.locator('#whatsNewList li').count() > 0);
  });
});
