import puppeteer from 'puppeteer';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIZE = 180;
const OUT = path.join(__dirname, '..', 'assets', 'apple-touch-icon.png');

const html = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${SIZE}px;height:${SIZE}px}
</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="8" fill="#c8362e"/>
  <text x="32" y="50" font-family="Helvetica,Arial,sans-serif" font-weight="900" font-size="44" letter-spacing="-3" text-anchor="middle" fill="#ffffff">NN</text>
</svg></body></html>`;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
const el = await page.$('svg');
await el.screenshot({ path: OUT, omitBackground: false });
await browser.close();
console.log('Wrote', OUT);
