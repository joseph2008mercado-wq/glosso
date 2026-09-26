import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
const origin = process.env.GLOSSO_PREVIEW_URL || 'http://127.0.0.1:4321';
const routes = ['/', '/read/', '/issues/', '/contributors/', '/about/', '/submissions/', '/contact/', '/legal/', '/legal/privacy/', '/legal/terms/', '/legal/disclaimer/', '/not-a-real-page/'];
// Focused regression checks, NOT an automated WCAG certification. Publication-specific
// text alternatives, screen-reader experience and finished PDFs need human review.
try {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
  for (const route of routes) {
    const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
    assert.equal(response.status(), route === '/not-a-real-page/' ? 404 : 200);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('main').count(), 1);
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok((await page.title()).trim());
    const defects = await page.evaluate(() => {
      const problems = [];
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      if (new Set(ids).size !== ids.length) problems.push('duplicate IDs');
      for (const img of document.images) if (!img.hasAttribute('alt')) problems.push('missing image alt');
      for (const nav of document.querySelectorAll('nav')) if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) problems.push('unnamed navigation');
      for (const element of document.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls]')) {
        for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
          for (const id of (element.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) if (!document.getElementById(id)) problems.push('broken ARIA reference');
        }
      }
      for (const element of document.querySelectorAll('a, button, summary')) {
        if (!element.checkVisibility() || element.closest('[aria-hidden="true"]')) continue;
        const name = element.getAttribute('aria-label') || element.textContent.trim() || element.querySelector('img')?.alt;
        if (!name) problems.push('unnamed control');
        if (element.tabIndex < 0) problems.push('visible control excluded from tab order');
      }
      const viewport = document.querySelector('meta[name="viewport"]')?.content || '';
      if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/.test(viewport)) problems.push('zoom disabled');
      return problems;
    });
    assert.deepEqual(defects, [], route);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link', route + ' skip first');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'main', route + ' skip moves focus');
    // 320 CSS px reflow (equivalent layout width to a 1280px view at 400% zoom).
    await page.setViewportSize({ width: 320, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + ' reflow');
    await page.setViewportSize({ width: 1280, height: 900 });
    // Additional 200% root text-size test; this is not a browser-zoom simulation.
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const textResize = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      elements: [...document.querySelectorAll('body *')].filter(e => {
        if (!e.checkVisibility() || e.closest('[aria-hidden="true"]')) return false;
        const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0;
      }).slice(0, 12).map(e => e.tagName + '.' + e.className),
    }));
    assert.equal(textResize.overflow, false, route + ' text resize: ' + textResize.elements.join(', '));
  }
  // Verify primary text combinations numerically. Decorative orange strokes/images
  // and future contributor color choices require separate contextual review.
  const luminance = hex => {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const [foreground, background] of [['171918', 'faf9f4'], ['4e5752', 'faf9f4'], ['171918', '00e3c0'], ['171918', 'ff4b1b'], ['00e3c0', '171918'], ['faf9f4', '171918']]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `text contrast ${foreground}/${background}`);
  }
  console.log('Accessibility regression passed: 12 routes including 404; language, landmarks, control labels, alt presence, ARIA targets, keyboard skip focus, 320px reflow, 200% text sizing and six primary text-color pairs. Not a full WCAG or screen-reader audit.');
} finally { await browser.close(); }
