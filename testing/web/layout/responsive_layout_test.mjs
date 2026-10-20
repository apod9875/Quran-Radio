// Real-browser layout checks at phone, tablet and desktop widths, in Arabic (RTL) and English (LTR).
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { launchBrowser, openApp } from '../helpers/browser.mjs';
import { startStaticServer } from '../helpers/static-server.mjs';

const WIDTHS = [320, 360, 375, 393, 412, 430, 768, 1280];
const LANGS = ['ar', 'eng'];
const TOLERANCE = 1.5;

let server;
let browser;

before(async () => {
  server = await startStaticServer();
  browser = await launchBrowser();
});

after(async () => {
  await browser.close();
  await server.close();
});

const box = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
}, selector);

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= TOLERANCE, `${message}: ${actual} vs ${expected}`);
}

for (const width of WIDTHS) {
  for (const lang of LANGS) {
    describe(`${width}px / ${lang}`, () => {
      let ctx;

      before(async () => { ctx = await openApp(browser, server.url, { width, lang }); });
      after(async () => { await ctx.context.close(); });

      it('has no horizontal scroll and nothing sticks out of the viewport', async () => {
        const result = await ctx.page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const offenders = [];
          document.querySelectorAll('body *').forEach((el) => {
            if (el.closest('.categories-bar')) return;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;
            const r = el.getBoundingClientRect();
            if (r.width > 0 && (r.right > vw + 0.5 || r.left < -0.5)) {
              offenders.push(`${el.id || el.className || el.tagName} [${Math.round(r.left)}..${Math.round(r.right)}]`);
            }
          });
          return { vw, scrollWidth: document.documentElement.scrollWidth, offenders };
        });
        assert.equal(result.scrollWidth, result.vw);
        assert.deepEqual(result.offenders, []);
        assert.deepEqual(ctx.problems, []);
      });

      it('aligns header, search, categories and cards to the same gutter', async () => {
        const header = await box(ctx.page, '.header-container');
        const search = await box(ctx.page, '.search-input');
        const chips = await box(ctx.page, '.categories-bar');
        const card = await box(ctx.page, '.station-card');
        if (width < 960) {
          for (const [name, item] of [['search', search], ['categories', chips], ['card', card]]) {
            near(item.left, header.left, `${name} left edge`);
            near(item.right, header.right, `${name} right edge`);
          }
        } else {
          const grid = await box(ctx.page, '.layout-grid');
          near(header.left, grid.left, 'header vs content left edge');
          near(header.right, grid.right, 'header vs content right edge');
        }
      });

      it('keeps the title and the station name readable', async () => {
        if (width <= 480) {
          const title = await box(ctx.page, '.brand-text h1');
          assert.ok(title.width >= 90, `header title is only ${title.width}px wide`);
        }
        const name = await box(ctx.page, '.station-card .station-name');
        if (width <= 480) assert.ok(name.width >= 90, `station name is only ${name.width}px wide`);
        const actions = await ctx.page.locator('.station-card').first().locator('.btn-card-action').count();
        assert.equal(actions, 3, 'cards show save, favorite and play only');
      });

      it('keeps the sticky header on screen after scrolling', async () => {
        await ctx.page.evaluate(() => window.scrollTo(0, 600));
        const header = await box(ctx.page, '.app-header');
        near(header.top, 0, 'header top');
        await ctx.page.evaluate(() => window.scrollTo(0, 0));
      });

      it('lines the mini player up with the cards and clears the last card', async function () {
        if (width >= 960) return; // the mini player only exists below 960px
        await ctx.page.evaluate(() => window.app.player.play(window.app.stations[2]));
        await ctx.page.waitForSelector('.mobile-player-bar.visible');
        const bar = await box(ctx.page, '.mobile-player-bar');
        const card = await box(ctx.page, '.station-card');
        if (width <= 600) {
          near(bar.left, card.left, 'mini player left edge');
          near(bar.right, card.right, 'mini player right edge');
        }
        await ctx.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const lastCard = await ctx.page.evaluate(() => {
          const cards = document.querySelectorAll('.station-card');
          const r = cards[cards.length - 1].getBoundingClientRect();
          return { bottom: r.bottom };
        });
        const barNow = await box(ctx.page, '.mobile-player-bar');
        assert.ok(lastCard.bottom <= barNow.top, `last card (${lastCard.bottom}) hides behind the mini player (${barNow.top})`);
        await ctx.page.evaluate(() => window.app.player.stop());
      });

      it('keeps the riwaya filter and the volume control on the gutter', async () => {
        await ctx.page.click('.cat-chip[data-id="RIWAYAT"]');
        const bar = await box(ctx.page, '#riwayaBar');
        const tabs = await box(ctx.page, '.categories-bar');
        near(bar.left, tabs.left, 'riwaya bar left edge');
        near(bar.right, tabs.right, 'riwaya bar right edge');
        await ctx.page.click('.cat-chip[data-id="ALL"]');

        if (width >= 960) return; // the full player only exists below 960px
        await ctx.page.evaluate(() => window.app.player.play(window.app.stations[3]));
        await ctx.page.waitForSelector('.mobile-player-bar.visible');
        await ctx.page.click('#mobilePlayerBar .mini-bar-info');
        const volume = await box(ctx.page, '#mobileFullPlayerOverlay [data-volume-control]');
        assert.ok(volume.left >= 0 && volume.right <= width, `volume row spans ${volume.left}..${volume.right}`);
        const slider = await box(ctx.page, '#mobileFullPlayerOverlay .volume-slider');
        assert.ok(slider.width >= 100, `slider is only ${slider.width}px wide`);
        await ctx.page.click('#closeFullPlayerBtn');
        await ctx.page.evaluate(() => window.app.player.stop());
      });

      it('keeps the toast and the modals inside the viewport', async () => {
        await ctx.page.evaluate(() => window.app.showToast('رسالة طويلة جداً '.repeat(12)));
        await ctx.page.waitForSelector('.toast-notification.show');
        const toast = await box(ctx.page, '.toast-notification');
        assert.ok(toast.left >= 0 && toast.right <= width, `toast spans ${toast.left}..${toast.right}`);

        for (const trigger of ['#cacheBtn', '#infoBtn', '#devicesBtn']) {
          await ctx.page.click(trigger);
          const card = await box(ctx.page, '.modal-overlay.active .modal-card');
          assert.ok(card.left >= 0 && card.right <= width, `${trigger} modal spans ${card.left}..${card.right}`);
          await ctx.page.keyboard.press('Escape');
        }
      });
    });
  }
}
