// Smoke test: loads the game in headless Chrome, presses SPACE to start,
// checks a few clouds, and saves screenshots to /tmp.
import puppeteer from 'puppeteer-core';

const url = process.env.URL ?? 'http://localhost:4173/?debug=1';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1180,820']
});
const page = await browser.newPage();
await page.setViewport({ width: 1180, height: 820 });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));
page.on('requestfailed', (req) => errors.push(`request failed: ${req.url()}`));
page.on('response', (res) => {
  if (res.status() >= 400) errors.push(`${res.status()}: ${res.url()}`);
});

await page.goto(url, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 4000));
await page.screenshot({ path: '/tmp/cloudy-1-start.png' });

await page.keyboard.press('Space');
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: '/tmp/cloudy-2-playing.png' });

// fly right for a bit, then try SPACE near a cloud
await page.keyboard.down('ArrowRight');
await new Promise((r) => setTimeout(r, 1200));
await page.keyboard.up('ArrowRight');
await page.keyboard.press('Space');
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: '/tmp/cloudy-3-checked.png' });

// teleport-check the winning cloud via the debug hook to verify the win flow
await page.evaluate(() => {
  const g = window.cloudyGame;
  g.checkCloud(g.winningIndex);
});
await new Promise((r) => setTimeout(r, 2200));
await page.screenshot({ path: '/tmp/cloudy-4-win.png' });

// SPACE should restart after the game-over screen appears
await page.keyboard.press('Space');
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: '/tmp/cloudy-5-replay.png' });

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
