import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const url = process.argv[2];
const label = process.argv[3] || 'scroll';
if (!url) { console.error('Usage: node scroll-shoot.mjs <url> [label]'); process.exit(1); }

const OUT_DIR = './temporary screenshots';
await mkdir(OUT_DIR, { recursive: true });
const existing = (await readdir(OUT_DIR)).filter(f => /^screenshot-\d+/.test(f));
const nextN = existing.reduce((m, f) => {
  const n = parseInt(f.match(/^screenshot-(\d+)/)[1], 10);
  return n >= m ? n + 1 : m;
}, 1);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll all the way to bottom in increments to trigger lazy-loaded / reveal-on-scroll content
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const step = 600;
    let y = 0;
    const max = document.body.scrollHeight;
    while (y < max) {
      window.scrollTo(0, y);
      await sleep(250);
      y += step;
    }
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(800);
    window.scrollTo(0, 0);
    await sleep(800);
  });

  // Capture viewport-by-viewport screenshots while scrolling so we get a sequence
  const vh = 900;
  const total = await page.evaluate(() => document.body.scrollHeight);
  const slices = Math.min(8, Math.ceil(total / vh));
  for (let i = 0; i < slices; i++) {
    const y = Math.min(i * vh, total - vh);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await new Promise(r => setTimeout(r, 600));
    const path = join(OUT_DIR, `screenshot-${nextN}-${label}-${String(i+1).padStart(2,'0')}.png`);
    await page.screenshot({ path });
    console.log(`Saved: ${path}`);
  }
} finally {
  await browser.close();
}
