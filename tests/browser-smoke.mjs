import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
const server = createServer((req, res) => {
  let path = new URL(req.url || '/', 'http://localhost').pathname;
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(root, '.' + decodeURI(path));
  if (!file.startsWith(root + sep) || !existsSync(file)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, {'content-type': mime[extname(file)] || 'application/octet-stream'});
  res.end(readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({headless: true});
mkdirSync(resolve(root, 'artifacts'), {recursive:true});

try {
  for (const [path, label] of [['/', 'home'], ['/stockists/', 'stockists']]) {
    for (const [width, height, mode] of [[1440, 900, 'desktop'], [768, 1024, 'tablet'], [390, 844, 'mobile']]) {
      const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(origin + path, {waitUntil:'load'});
      assert.equal(response.status(), 200, path + ' did not load');
      await page.locator('h1').waitFor();
      const state = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        h1: document.querySelectorAll('h1').length,
      }));
      assert.ok(state.scrollWidth <= width + 1, label + ' ' + mode + ': horizontal overflow ' + state.scrollWidth);
      assert.equal(state.h1, 1, label + ' ' + mode + ': expected one H1');
      await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach(img => { img.loading = 'eager'; });
        await Promise.all(images.map(img => img.decode().catch(() => null)));
        // Trigger IntersectionObserver reveals like a real visitor scrolling down.
        const step = Math.max(300, Math.round(window.innerHeight * .78));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise(resolve => setTimeout(resolve, 35));
        }
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 1300));
      });
      await page.screenshot({path:resolve(root,'artifacts',label+'-'+mode+'-pt.png'),fullPage:true});
      const brokenImages = await page.locator('img').evaluateAll(imgs => imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
      assert.deepEqual(brokenImages, [], label + ' '+mode + ': broken images');
      assert.deepEqual(errors, [], label + ' '+mode + ': JS errors');
      await page.locator('[data-lang-switch="en"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      await page.locator('[data-lang-switch="pt"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'pt-PT');

      if (mode === 'mobile') {
        const menu = page.locator('.menu-button');
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await page.locator('#primary-nav').waitFor({state:'visible', timeout:2000});
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      }
      console.log('PASS', label, mode, width + 'x' + height);
      await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}