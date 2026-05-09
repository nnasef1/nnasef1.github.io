import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const url = process.argv[2];
const label = process.argv[3];
if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label]');
  process.exit(1);
}

const OUT_DIR = './temporary screenshots';
await mkdir(OUT_DIR, { recursive: true });

const existing = (await readdir(OUT_DIR)).filter(f => /^screenshot-\d+/.test(f));
const nextN = existing.reduce((m, f) => {
  const n = parseInt(f.match(/^screenshot-(\d+)/)[1], 10);
  return n >= m ? n + 1 : m;
}, 1);

const filename = label
  ? `screenshot-${nextN}-${label}.png`
  : `screenshot-${nextN}.png`;
const outPath = join(OUT_DIR, filename);

const widthArg = process.argv.find(a => a.startsWith('--w='));
const heightArg = process.argv.find(a => a.startsWith('--h='));
const width = widthArg ? parseInt(widthArg.slice(4), 10) : 1440;
const height = heightArg ? parseInt(heightArg.slice(4), 10) : 900;
const fullPage = process.argv.includes('--full');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  // Allow webfonts + Tailwind CDN runtime to settle
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: outPath, fullPage });
  console.log(`Saved: ${outPath}  (${width}x${height}${fullPage ? ', full page' : ''})`);
} finally {
  await browser.close();
}
