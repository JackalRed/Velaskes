import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = relative => readFileSync(resolve(root, relative), 'utf8');
const home = read('index.html');
const stockists = read('stockists/index.html');
const css = read('assets/styles.css');
const js = read('assets/site.js');

test('homepage and stockist page include localized, responsive metadata', () => {
  for (const html of [home, stockists]) {
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /name="viewport"/);
    assert.match(html, /name="description"/);
    assert.match(html, /data-lang-switch="pt"/);
    assert.match(html, /data-lang-switch="en"/);
    assert.match(html, /<h1(?:\s|>)/);
    assert.match(html, /general@smthng\.store/);
  }
  assert.match(home, /href="\.\/stockists\/"/);
  assert.match(stockists, /href="\.\.\/"/);
  assert.match(stockists, /CONSIGNAÇÃO/);
  assert.match(stockists, /WHOLESALE/);
});

test('all local images referenced in pages exist and are non-empty', () => {
  for (const [path, html] of [['index.html', home], ['stockists/index.html', stockists]]) {
    const folder = dirname(resolve(root, path));
    const srcs = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
    assert.ok(srcs.length >= 2, 'expected editorial photography');
    for (const src of srcs) {
      assert.ok(!src.startsWith('http'), 'images must use first-party assets');
      const image = resolve(folder, src);
      assert.ok(existsSync(image), 'missing image: ' + image);
      assert.ok(statSync(image).size > 1000, 'empty image: ' + image);
    }
  }
});

test('every image has alt text and there is only one H1 per page', () => {
  for (const html of [home, stockists]) {
    const imageTags = html.match(/<img\b[^>]*>/g) || [];
    assert.ok(imageTags.length >= 2);
    for (const tag of imageTags) assert.match(tag, /\balt="[^"]*"/);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  }
});

test('both locales contain every translation key used by the pages', () => {
  const keys = new Set([...home.matchAll(/data-i18n(?:-html)?="([^"]+)"/g), ...stockists.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map(m => m[1]));
  const pt = js.split(/\bpt:\s*\{/)[1]?.split(/\n\s*\},\n\s*en:\s*\{/)[0] || '';
  const en = js.split(/\ben:\s*\{/)[1]?.split(/\n\s*\}\n\s*\};/)[0] || '';
  assert.ok(pt.length > 1000 && en.length > 1000, 'locale data not found');
  for (const key of keys) {
    const pattern = new RegExp('(?:^|\\n)\\s*' + key + '\\s*:');
    assert.match(pt, pattern, 'missing PT: ' + key);
    assert.match(en, pattern, 'missing EN: ' + key);
  }
});

test('mobile, tablet and reduced-motion rules exist', () => {
  assert.match(css, /@media\s*\(max-width:820px\)/);
  assert.match(css, /@media\s*\(max-width:560px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('no unapproved trade prices are published', () => {
  assert.doesNotMatch(stockists, /€\s*\d/);
  assert.doesNotMatch(stockists, /(?:25|30|35|50)\s*%/);
});

test('outreach email links to the planned stockists page', () => {
  const html = read('outreach/email-template-pt.html');
  assert.match(html, /https:\/\/smthng\.store\/stockists\//);
  assert.match(html, /general@smthng\.store/);
  assert.match(html, /\{\{NOME_DA_LOJA\}\}/);
});