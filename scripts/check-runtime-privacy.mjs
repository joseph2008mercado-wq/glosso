import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
const origin = process.env.GLOSSO_PREVIEW_URL || 'http://127.0.0.1:4321';
try {
  const context = await browser.newContext(); const page = await context.newPage();
  const external = new Set(); const cookies = [];
  page.on('request', (request) => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) external.add(new URL(request.url()).origin); });
  page.on('response', (response) => { if (response.headers()['set-cookie']) cookies.push(new URL(response.url()).pathname); });
  for (const route of ['/', '/read/', '/issues/', '/contributors/', '/about/', '/submissions/', '/contact/', '/legal/', '/legal/privacy/', '/legal/terms/', '/legal/disclaimer/']) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('form').count(), 0, 'No implemented intake form');
    assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://glosso.org' + route);
  }
  assert.deepEqual([...external], [], 'No external requests in current empty local build');
  assert.deepEqual(cookies, []); assert.deepEqual(await context.cookies(), []);
  for (const path of ['/legal-review/PRIVACY-DRAFT.md', '/private-submissions/test.pdf', '/publication-assets/test.png', '/.env', '/.git/config', '/src/content/writing/test.mdx', '/media/unreleased.pdf', '/read/not-published/']) {
    assert.equal((await page.request.get(origin + path)).status(), 404, path);
  }
  const sitemap = await (await page.request.get(origin + '/sitemap.xml')).text();
  assert.match(sitemap, /https:\/\/glosso.org\/about\//); assert.doesNotMatch(sitemap, /legal|private|fixture/);
  assert.match(await (await page.request.get(origin + '/robots.txt')).text(), /Sitemap: https:\/\/glosso.org\/sitemap.xml/);
  console.log('Local privacy/runtime audit passed: 11 routes, no external browser requests, cookies, web storage or forms; private/source paths and missing media return 404; canonical, robots and sitemap checks passed. Cloudflare account/live behavior still unverified.');
} finally { await browser.close(); }
