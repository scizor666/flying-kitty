// PWA offline test: load the game once so the service worker precaches
// everything, then go offline and reload — the game must still work.
import puppeteer from 'puppeteer-core';

const url = process.env.URL ?? 'http://localhost:4173/Cloudy/';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1180,820']
});
const page = await browser.newPage();
await page.setViewport({ width: 1180, height: 820 });

await page.goto(url, { waitUntil: 'load' });
await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  // wait until the active worker has finished installing/activating
  if (reg.active?.state !== 'activated') {
    await new Promise((resolve) => {
      reg.active?.addEventListener('statechange', function check() {
        if (reg.active?.state === 'activated') resolve();
      });
    });
  }
});
// give workbox a moment to finish writing the precache
await new Promise((r) => setTimeout(r, 3000));

const cacheInfo = await page.evaluate(async () => {
  const names = await caches.keys();
  const out = {};
  for (const name of names) {
    const cache = await caches.open(name);
    out[name] = (await cache.keys()).length;
  }
  return out;
});
console.log('cache storage:', cacheInfo);

const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

await page.setOfflineMode(true);
await page.reload({ waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 4000));
await page.screenshot({ path: '/tmp/cloudy-8-offline.png' });

const title = await page.title();
console.log('offline reload: title =', JSON.stringify(title));
console.log('page errors offline:', errors.length ? errors : 'none');
await browser.close();
