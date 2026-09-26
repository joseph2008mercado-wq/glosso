import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
const origin = process.env.GLOSSO_PREVIEW_URL || 'http://127.0.0.1:4321';
const supplied = 'Human UI Designer Needed! Want UI Experience? Be a part of Glosso.';
try {
  for (const width of [1440, 1100, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const notice = page.locator('[data-ux-notice]');
    assert.equal((await notice.locator('p').textContent()).replace(/\s+/g, ' ').trim(), supplied);
    assert.ok(await notice.isVisible());
    assert.equal(await page.locator('[role="dialog"], [role="alert"], [aria-modal="true"]').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: overflow`);
    const title = await page.locator('.home-heading h1').boundingBox();
    const box = await notice.boundingBox();
    const archive = await page.locator('.home-heading .quiet-link').boundingBox();
    if (width > 1100) {
      assert.ok(box.x > title.x + title.width && box.x + box.width < archive.x, 'Notice between heading and archive');
    } else {
      assert.ok(box.y >= Math.max(title.y + title.height, archive.y + archive.height), 'Notice has its own narrow-screen row');
    }
    if (process.env.GLOSSO_QA_DIR) await page.locator('.home-heading').screenshot({ path: join(process.env.GLOSSO_QA_DIR, `ux-notice-${width}.png`) });
    const mail = notice.locator('[data-ux-mail]');
    assert.equal(await mail.getAttribute('href'), 'mailto:contact@glosso.org');
    assert.ok(await notice.locator('[data-ux-email]').isHidden());
    // Observe the native mailto action, but prevent launching an OS application
    // during unattended QA. No email is composed or sent by the test.
    await mail.evaluate(element => element.addEventListener('click', event => {
      window.__mailtoDefaultWasAllowed = !event.defaultPrevented;
      event.preventDefault();
    }));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedEmail = value; } } }));
    await mail.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.__mailtoDefaultWasAllowed), true);
    const address = notice.locator('#ux-contact-email');
    assert.ok(await address.isVisible());
    assert.equal(await address.inputValue(), 'contact@glosso.org');
    assert.ok(await address.evaluate(element => element.readOnly));
    await notice.locator('[data-copy-ux]').click();
    assert.equal(await page.evaluate(() => window.__copiedEmail), 'contact@glosso.org');
    assert.equal(await notice.locator('[data-copy-status]').textContent(), 'Copied');
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); }; });
    await notice.locator('[data-copy-ux]').click();
    assert.equal(await address.evaluate(element => element.selectionEnd - element.selectionStart), 'contact@glosso.org'.length);
    assert.equal(await notice.locator('[data-copy-status]').textContent(), 'Select and copy the email address.');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: expanded email overflow`);
    if (process.env.GLOSSO_QA_DIR) await page.locator('.home-heading').screenshot({ path: join(process.env.GLOSSO_QA_DIR, `ui-email-${width}.png`) });
    assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
    await notice.locator('.window-close').focus();
    await page.keyboard.press('Enter');
    assert.ok(await notice.isHidden());
    assert.equal(await page.locator(':focus').getAttribute('href'), '/issues/');
    await page.reload({ waitUntil: 'networkidle' });
    assert.ok(await notice.isVisible(), 'Dismissal is not persisted');
    await notice.locator('.window-close').click();
    assert.ok(await notice.isHidden(), 'Title-bar close works');
    await page.close();
  }
  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  await page.goto(origin);
  assert.ok(await page.locator('[data-ux-notice]').isVisible());
  assert.equal(await page.locator('[data-ux-notice] button:visible').count(), 0, 'No dead controls without JavaScript');
  assert.ok(await page.locator('#ux-contact-email').isVisible(), 'Address remains available without JavaScript');
  assert.equal(await page.locator('[data-ux-mail]').getAttribute('href'), 'mailto:contact@glosso.org');
  await page.goto(origin + '/contact/');
  assert.equal(await page.locator('a[href="mailto:contact@glosso.org"]').textContent(), 'contact@glosso.org');
  console.log('UI notice passed: supplied text, five widths, mailto action, selectable address, clipboard success/failure, contact page, keyboard dismissal, no storage and no-JavaScript fallback.');
} finally { await browser.close(); }
