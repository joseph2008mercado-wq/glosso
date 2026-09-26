import { createRequire } from 'node:module';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.GLOSSO_PLAYWRIGHT_PATH || 'playwright');
if (!process.env.GLOSSO_QA_DIR) throw new Error('Set GLOSSO_QA_DIR outside public output');
const browser = await chromium.launch({ headless: true, ...(process.env.GLOSSO_CHROME_PATH ? { executablePath: process.env.GLOSSO_CHROME_PATH } : {}) });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    for (const route of ['/', '/read/', '/about/']) {
      await page.goto((process.env.GLOSSO_PREVIEW_URL || 'http://127.0.0.1:4321') + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const filename = `${process.env.GLOSSO_QA_STAGE || 'polish'}-${route === '/' ? 'home' : route.replaceAll('/', '')}-${width}.png`;
      await page.screenshot({ path: join(process.env.GLOSSO_QA_DIR, filename), fullPage: true });
      console.log(filename);
    }
    await page.close();
  }
} finally { await browser.close(); }
