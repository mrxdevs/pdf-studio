const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(site, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(site, 'styles.css'), 'utf8');

test('page basics: title, viewport, no placeholders', () => {
  assert.match(html, /<title>PDF Studio[^<]+<\/title>/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1/);
  assert.doesNotMatch(html + js, /lorem ipsum|TODO|FIXME|\{\{.*\}\}/i);
  assert.match(html, /<main[\s>]/); assert.match(html, /<header[\s>]/);
});
test('all local assets referenced by the page exist', () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]);
  for (const r of refs) assert.ok(fs.existsSync(path.join(site, r)), 'missing ' + r);
  assert.ok(fs.existsSync(path.join(site, 'og.png')));
  const fonts = [...js.matchAll(/'([A-Za-z]+-(?:Regular|Bold|Italic|BoldItalic)\.ttf)'/g)].map(m => m[1]);
  assert.ok(fonts.length >= 4);
  for (const f of fonts) assert.ok(fs.existsSync(path.join(site, 'fonts', f)), 'missing font ' + f);
  for (const w of ['arimo', 'tinos', 'cousine']) for (const v of ['400-normal', '700-normal', '400-italic', '700-italic']) assert.ok(fs.existsSync(path.join(site, 'fonts', `${w}-latin-${v}.woff2`)));
});
test('core editor features are wired', () => {
  for (const t of ['select', 'text', 'edittext', 'image', 'whiteout', 'highlight', 'rect', 'draw']) assert.match(html, new RegExp(`data-tool="${t}"`));
  for (const id of ['btnDownload', 'btnPrint', 'btnUndo', 'btnRedo', 'filePdf', 'fileImg', 'dropzone', 'thumbs']) assert.match(html, new RegExp(`id="${id}"`));
  for (const fn of ['buildPdf', 'drawText', 'drawImage', 'embedFont', 'printPdf', 'replaceTextItem', 'getTextContent', 'copyPages', 'setRotation', 'undo', 'redo']) assert.ok(js.includes(fn), 'missing ' + fn);
  assert.match(js, /-edited\.pdf/);
});
test('privacy promise is on the page and no network upload exists', () => {
  assert.match(html, /never leaves your device/i);
  assert.doesNotMatch(js, /method:\s*['"]POST|XMLHttpRequest|sendBeacon/);
  // only pinned open-source libraries/fonts from public CDNs are fetched; nothing is sent anywhere
  const hosts = new Set([...(html + js).matchAll(/https?:\/\/([a-z0-9.-]+)/g)].map(m => m[1]));
  for (const h of hosts) assert.ok(['amjad-pdf.sites.tab.bot', 'cdn.jsdelivr.net', 'unpkg.com', 'www.w3.org'].includes(h), 'unexpected host ' + h);
  assert.match(js, /pdfjs-dist@4\.10\.38/); assert.match(js, /pdf-lib@1\.17\.1/);
});
test('responsive rules exist for phones', () => {
  assert.match(css, /@media \(max-width:820px\)/);
  assert.match(css, /@media print/);
});
