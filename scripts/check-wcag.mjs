import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
const axePath = require.resolve('axe-core/axe.min.js');
const origin = process.env.GLOSSO_PREVIEW_URL || 'http://127.0.0.1:4321';
const routes = ['/', '/read/', '/issues/', '/contributors/', '/about/', '/submissions/', '/contact/', '/legal/', '/legal/privacy/', '/legal/terms/', '/legal/disclaimer/', '/not-a-real-page/'];
const browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
const violations = [], incomplete = [], keyboard = [], spacing = [], pdfs = new Set();
let scans = 0, forms = 0;
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  async function scan(label) {
    const results = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }));
    scans++;
    for (const result of results.violations) violations.push({ label, rule: result.id, impact: result.impact, targets: result.nodes.map(n => n.target), help: result.helpUrl });
    for (const result of results.incomplete) incomplete.push({ label, rule: result.id, targets: result.nodes.map(n => n.target) });
  }
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      forms += await page.locator('form').count();
      for (const href of await page.locator('a[href]').evaluateAll(nodes => nodes.map(n => n.href).filter(href => /\.pdf(?:[?#]|$)/i.test(href)))) pdfs.add(href);
      await page.addScriptTag({ path: axePath });
      await scan(`${route} ${width}`);
      if (process.env.GLOSSO_QA_DIR && route === '/') await page.screenshot({ path: join(process.env.GLOSSO_QA_DIR, `wcag-home-${width}.png`), fullPage: true });
      if (width === 320) {
        await page.locator('.mobile-menu summary').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.mobile-menu').getAttribute('open'), '');
        await scan(`${route} ${width} menu open`);
        if (process.env.GLOSSO_QA_DIR && route === '/') await page.screenshot({ path: join(process.env.GLOSSO_QA_DIR, 'wcag-home-menu.png') });
        // Tabbing out of the disclosure must not leave page links hidden behind it.
        for (let step = 0; step <= await page.locator('.mobile-menu nav a').count(); step++) await page.keyboard.press('Tab');
        const outside = await page.evaluate(() => {
          const e = document.activeElement, r = e.getBoundingClientRect();
          const hit = document.elementFromPoint(Math.min(innerWidth - 1, r.x + r.width / 2), Math.min(innerHeight - 1, r.y + r.height / 2));
          return { label: e.textContent.trim().slice(0, 60), visible: hit === e || e.contains(hit) };
        });
        if (!outside.visible) keyboard.push({ route, width, state: 'tabbed out of open menu', ...outside });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.mobile-menu').getAttribute('open'), null);
      }
      // Keyboard focus visibility/obscuration sample for every reachable control.
      await page.locator('.skip-link').focus();
      const seen = new Set();
      for (let step = 0; step < 70; step++) {
        const state = await page.evaluate(() => {
          const e = document.activeElement;
          if (!e || e === document.body) return null;
          const r = e.getBoundingClientRect(), s = getComputedStyle(e);
          const x = Math.max(0, Math.min(innerWidth - 1, r.x + r.width / 2));
          const y = Math.max(0, Math.min(innerHeight - 1, r.y + r.height / 2));
          const hit = document.elementFromPoint(x, y);
          return { key: [...document.querySelectorAll('*')].indexOf(e), label: e.getAttribute('aria-label') || e.textContent.trim().slice(0, 60), visible: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth, hit: hit === e || e.contains(hit), outlined: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 || s.boxShadow !== 'none' };
        });
        if (state) {
          if (seen.has(state.key)) break;
          seen.add(state.key);
          if (!state.visible || !state.hit || !state.outlined) keyboard.push({ route, width, ...state });
        }
        await page.keyboard.press('Tab');
      }
      // WCAG 1.4.12 overrides; no copy is changed.
      const style = await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) spacing.push({ route, width, problem: 'horizontal overflow under text-spacing overrides', elements: await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.checkVisibility() && !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map(e => e.tagName + '.' + e.className)) });
      if (process.env.GLOSSO_QA_DIR && route === '/') {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: join(process.env.GLOSSO_QA_DIR, `wcag-home-spacing-${width}.png`), fullPage: true });
      }
      await style.evaluate(e => e.remove());
    }
  }
  const report = { axeVersion: require('axe-core/package.json').version, scans, violations, incomplete, keyboard, spacing, formInstances: forms, pdfLinks: [...pdfs] };
  if (process.env.GLOSSO_QA_DIR) await writeFile(join(process.env.GLOSSO_QA_DIR, 'wcag-results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, incomplete: incomplete.map(({ label, rule, targets }) => ({ label, rule, count: targets.length })) }, null, 2));
  assert.deepEqual(violations, [], 'Automated WCAG A/AA violations');
  assert.deepEqual(keyboard, [], 'Keyboard visibility/obscuration findings require review');
  assert.deepEqual(spacing, [], 'Text-spacing overflow findings');
  console.log('WCAG automated and targeted interaction checks passed. Incomplete rules require manual review; this does not establish full WCAG 2.2 AA conformance. Forms/PDFs are only tested if actually present; no sample publication was created.');
} finally { await browser.close(); }
