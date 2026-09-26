import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Optional local visual QA. Use an installed Playwright module; no production dependency.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
const origin = process.env.GLOSSO_PREVIEW_URL || 'http://127.0.0.1:4321';
const output = process.env.GLOSSO_QA_DIR;
const routes = ['/', '/read/', '/issues/', '/contributors/', '/about/', '/submissions/', '/contact/', '/legal/', '/legal/privacy/', '/legal/terms/', '/legal/disclaimer/'];
const errors = [];
const links = new Set();
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      assert.equal(await page.locator('h1').count(), 1, route + ' h1');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflow at ${width}`);
      assert.equal(await page.locator('img').evaluateAll((imgs) => imgs.filter((img) => !img.complete || img.naturalWidth === 0).length), 0, route + ' broken images');
      for (const href of await page.locator('a[href]').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')).filter((href) => href.startsWith('/') && !href.startsWith('//')))) links.add(href);
      if (route.startsWith('/legal/') && route !== '/legal/') assert.ok(await page.locator('.legal-draft-notice').count(), 'Legal review notice');
      if (output && (route === '/' || (['/read/', '/about/'].includes(route) && [1440, 390].includes(width)))) {
        await page.screenshot({ path: resolve(output, `glosso-final-${route === '/' ? 'home' : route.replaceAll('/', '')}-${width}.png`), fullPage: true });
      }
    }
    if (width === 390) {
      await page.goto(origin);
      const menu = page.locator('.mobile-menu');
      await menu.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await menu.getAttribute('open'), '', 'Keyboard opens navigation');
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('open'), null, 'Escape closes navigation');
    }
    await page.close();
  }
  const reduced = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  await reduced.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await reduced.evaluate(() => document.getAnimations().length), 0, 'Reduced motion');
  for (const href of links) assert.equal((await reduced.request.get(origin + href)).status(), 200, href);
  await reduced.close();
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJs.goto(origin);
  await noJs.locator('.mobile-menu summary').click();
  assert.equal(await noJs.locator('.mobile-menu').getAttribute('open'), '', 'No-JS menu');
  assert.ok(await noJs.locator('.cover-placeholder').isVisible(), 'No-JS content');
  await noJs.close();
  if (process.env.GLOSSO_QA_HTML) {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.setContent(await readFile(process.env.GLOSSO_QA_HTML, 'utf8'), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Populated layout overflow at ${width}`);
      await page.locator('img').evaluateAll((imgs) => Promise.all(imgs.map((img) => { img.loading = 'eager'; return img.decode(); })));
      const frames = await page.locator('.publication-image').evaluateAll((elements) => elements.map((element) => {
        const style = getComputedStyle(element);
        return { ratio: element.clientWidth / element.clientHeight, expected: style.getPropertyValue('--image-ratio').trim() === '3 / 4' ? .75 : 4 / 3, fit: getComputedStyle(element.querySelector('img')).objectFit };
      }));
      assert.ok(frames.length >= 6, 'Image shape variants rendered');
      for (const frame of frames) assert.ok(Math.abs(frame.ratio - frame.expected) < .015, 'Stable media frame');
      assert.ok(frames.some((frame) => frame.fit === 'cover'), 'Explicit crop supported');
      assert.ok(frames.some((frame) => frame.fit === 'contain'), 'Default uncropped artwork');
      // Decorative motion must not move the real cover or its ribbon anchor.
      if (width === 1440) {
        const sheet = page.locator('.folio-sheet').first();
        const before = await sheet.boundingBox();
        const cover = await sheet.locator('img').getAttribute('src');
        await sheet.locator('a').hover();
        await page.waitForTimeout(350);
        assert.deepEqual(await sheet.boundingBox(), before, 'Cover remains stable on hover');
        assert.equal(await sheet.locator('img').getAttribute('src'), cover, 'Artwork unchanged by interaction');
        const upright = page.locator('.stage-upright').first();
        assert.notEqual(await upright.evaluate(e => getComputedStyle(e).transform), 'none', 'Architectural hover response');
        const countercurve = page.locator('.stage-countercurve').first();
        assert.notEqual(await countercurve.evaluate(e => getComputedStyle(e).transform), 'none', 'Counter-curve opens with the upper curve');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await upright.evaluate(e => getComputedStyle(e).transform), 'none', 'Architectural motion respects reduced motion');
        assert.equal(await countercurve.evaluate(e => getComputedStyle(e).transform), 'none', 'Counter-curve respects reduced motion');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.mouse.move(0, 0);
        await page.waitForTimeout(350);
      }
      if (output) await page.screenshot({ path: resolve(output, `glosso-final-populated-${width}.png`), fullPage: true });
      await page.close();
    }
  }
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log(`Browser QA passed: ${routes.length} routes × 4 widths, ${links.size} internal links, keyboard menu, reduced motion, no JavaScript, populated component layouts.`);
} finally {
  await browser.close();
}
