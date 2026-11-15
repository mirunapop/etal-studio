// Renders og-image.png (1200×630) and apple-touch-icon.png (180×180) into the repo root
// from the HTML templates in this folder, using Playwright.
//   cd tools && npm install && npx playwright install chromium && npm run images
// Already have Chrome? PW_CHANNEL=chrome npm run images   (skips the chromium download)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

// Serve the repo over http (not file://) so the @font-face URLs load like on the real site.
const server = createServer(async (req, res) => {
  try {
    const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const body = await readFile(join(root, p));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const jobs = [
  { page: '/tools/og-image.html', out: 'og-image.png', width: 1200, height: 630, fonts: ['Source Serif 4'] },
  { page: '/tools/apple-touch-icon.html', out: 'apple-touch-icon.png', width: 180, height: 180, fonts: [] },
];

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
try {
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: 1 });
    await page.goto(base + j.page, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    for (const f of j.fonts) {
      const ok = await page.evaluate(name => [...document.fonts].some(x => x.family.replace(/"/g, '') === name && x.status === 'loaded'), f);
      if (!ok) throw new Error(`font "${f}" did not load for ${j.page}`);
    }
    await page.screenshot({ path: join(root, j.out), clip: { x: 0, y: 0, width: j.width, height: j.height } });
    console.log('wrote', j.out);
    await page.close();
  }
} finally { await browser.close(); server.close(); }
