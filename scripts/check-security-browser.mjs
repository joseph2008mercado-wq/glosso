import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, relative, extname, isAbsolute } from 'node:path';
import { spawn } from 'node:child_process';

// Exercise built files with the configured headers locally. This is not a
// verification of the Cloudflare account or its live response headers.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
const root = resolve('dist');
const headerText = await readFile(resolve(root, '_headers'), 'utf8');
const headers = Object.fromEntries(headerText.split(/\r?\n/).filter((line) => /^\s+\S/.test(line)).map((line) => {
  const index = line.indexOf(':');
  return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
}));
assert.equal(headers['X-Content-Type-Options'], 'nosniff');
assert.equal(headers['X-Frame-Options'], 'DENY');
assert.match(headers['Content-Security-Policy'], /script-src 'self'/);
assert.doesNotMatch(headers['Content-Security-Policy'].match(/script-src[^;]*/)[0], /unsafe-inline|unsafe-eval/);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + pathname);
    const inside = relative(root, file);
    if (inside.startsWith('..') || isAbsolute(inside) || pathname === '/_headers') throw new Error('Not served');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    response.writeHead(200, { ...headers, 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404, { ...headers, 'Content-Type': 'text/html' });
    response.end(await readFile(resolve(root, '404.html')));
  }
});
await new Promise((accept) => server.listen(0, '127.0.0.1', accept));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
  const errors = [];
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => window.__cspViolations.push(event.violatedDirective));
    });
    for (const route of ['/', '/read/', '/issues/', '/contributors/', '/about/', '/submissions/', '/contact/', '/legal/', '/legal/privacy/', '/legal/cookies/', '/legal/terms/', '/legal/disclaimer/']) {
      assert.equal((await page.goto(origin + route, { waitUntil: 'networkidle' })).status(), 200);
      assert.deepEqual(await page.evaluate(() => window.__cspViolations), [], route);
      assert.equal(await page.locator('script:not([src]):not([type="application/ld+json"])').count(), 0, 'Executable scripts must be external');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: overflow`);
    }
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const script = document.createElement('script'); script.textContent = 'window.__injected = true'; document.body.append(script); });
    assert.equal(await page.evaluate(() => window.__injected), undefined, 'CSP must block injected inline code');
    await page.close();
  }
  assert.deepEqual(errors, []);
  // Reuse the existing behavioral and privacy tests against these same headers.
  for (const script of ['scripts/check-ux-notice.mjs', 'scripts/check-runtime-privacy.mjs']) {
    const exitCode = await new Promise((accept) => {
      const child = spawn(process.execPath, [script], { stdio: 'inherit', env: { ...process.env, GLOSSO_PREVIEW_URL: origin } });
      child.on('error', () => accept(1)); child.on('close', accept);
    });
    assert.equal(exitCode, 0, script);
  }
  console.log('Built-site security browser checks passed: desktop/mobile, CSP enforcement, notice actions, no-JS, private-path 404s and privacy checks. Headers simulated locally; live Cloudflare unverified.');
} finally {
  await browser?.close();
  await new Promise((accept) => server.close(accept));
}
