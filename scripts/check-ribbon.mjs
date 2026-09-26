import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
const origin = process.env.GLOSSO_PREVIEW_URL || 'http://127.0.0.1:4321';
try {
  // Start at the compact breakpoint so its first draw is also tested while
  // entrance motion initializes; resize-only checks can miss that state.
  const page = await browser.newPage({ viewport: { width: 760, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  for (const width of [760, 1440, 1000, 768, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(800);
    const audit = await page.evaluate(() => {
      const path = document.querySelector('[data-connected-tongue]');
      const matrix = path.getScreenCTM();
      const point = (distance) => path.getPointAtLength(distance).matrixTransform(matrix);
      const center = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
      const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const length = path.getTotalLength();
      const copy = [...document.querySelectorAll('.issue-feature-copy > *, .feature-heading, .feature-card')].map((element) => element.getBoundingClientRect());
      const halfStroke = Number(path.getAttribute('stroke-width')) / 2;
      let collisions = 0;
      for (let i = 0; i <= 1000; i++) {
        const p = point(length * i / 1000);
        if (copy.some((r) => p.x + halfStroke > r.left && p.x - halfStroke < r.right && p.y + halfStroke > r.top && p.y - halfStroke < r.bottom)) collisions++;
      }
      return { startError: distance(point(0), center('[data-ribbon-origin]')), endError: distance(point(length), center('[data-ribbon-destination]')), collisions, overflow: document.documentElement.scrollWidth > innerWidth, paths: document.querySelectorAll('[data-connected-tongue]').length };
    });
    if (process.env.GLOSSO_QA_DIR) await page.screenshot({ path: resolve(process.env.GLOSSO_QA_DIR, `glosso-renovation-${width}.png`), fullPage: true });
    assert.equal(audit.paths, 1);
    assert.ok(audit.startError < 1 && audit.endError < 1, `${width}: exact anchor connections ${JSON.stringify(audit)}`);
    assert.equal(audit.collisions, 0, `${width}: ribbon must not obscure copy`);
    assert.equal(audit.overflow, false, `${width}: overflow`);
  }
  // ResizeObserver must also respond to future editorial content changing height.
  const previousPath = await page.locator('[data-connected-tongue]').getAttribute('d');
  await page.locator('.issue-feature-copy p').evaluate((element) => { element.textContent = Array(12).fill('BLANK').join('\n'); });
  await page.waitForTimeout(800);
  assert.notEqual(await page.locator('[data-connected-tongue]').getAttribute('d'), previousPath, 'Path updates after content growth');
  assert.ok(await page.evaluate(() => {
    const path = document.querySelector('[data-connected-tongue]');
    const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
    const target = document.querySelector('[data-ribbon-destination]').getBoundingClientRect();
    return Math.hypot(end.x - target.x - target.width / 2, end.y - target.y - target.height / 2) < 1;
  }), 'Connection survives content growth');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  assert.deepEqual(errors, []);
  console.log('Connected ribbon passed: six responsive widths, exact endpoints, no copy collisions, no overflow, resize and reduced motion.');
} finally { await browser.close(); }
