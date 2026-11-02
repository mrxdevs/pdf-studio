const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(site, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(site, 'styles.css'), 'utf8');

test('page basics: title, viewport, no placeholders', () => {
  assert.match(html, /<title>[^<]*PDF Studio[^<]*<\/title>/);
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
  for (const h of new Set([...js.matchAll(/https?:\/\/([a-z0-9.-]+)/g)].map(m => m[1]))) assert.ok(['cdn.jsdelivr.net', 'unpkg.com', 'www.w3.org'].includes(h), 'app.js fetches from unexpected host ' + h);
  // the page itself may only load scripts/styles from itself or the pinned CDN
  for (const m of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)) assert.ok(/^https:\/\/(cdn\.jsdelivr\.net|pdfstudio\.mrxamjad\.com)\//.test(m[1]) || /rel="(canonical|preconnect|alternate)"/.test(m[0]), 'unexpected external asset ' + m[1]);
  assert.match(js, /pdfjs-dist@4\.10\.38/); assert.match(js, /pdf-lib@1\.17\.1/);
});
test('responsive rules exist for phones', () => {
  assert.match(css, /@media \(max-width:820px\)/);
  assert.match(css, /@media print/);
});

const BASE = 'https://pdfstudio.mrxamjad.com';
const GUIDES = ['how-to-edit-text-in-pdf', 'how-to-sign-pdf-free', 'add-image-to-pdf', 'private-pdf-editor-no-upload', 'about'];
const read = p => fs.readFileSync(path.join(site, p), 'utf8');
const jsonLd = h => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1].replace(/<\\\//g, '</')));

test('landing page SEO: meta, canonical, social cards, JSON-LD, visible FAQ', () => {
  assert.match(html, /<meta name="description" content="[^"]{120,165}">/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${BASE}/">`));
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) assert.match(html, new RegExp(`property="${p}" content="[^"]+"`));
  assert.match(html, new RegExp(`property="og:image" content="${BASE}/og.png"`));
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  const ld = jsonLd(html); assert.equal(ld.length, 1);
  const types = ld[0]['@graph'].map(n => [].concat(n['@type'])).flat();
  for (const t of ['WebApplication', 'SoftwareApplication', 'Person', 'FAQPage', 'WebSite']) assert.ok(types.includes(t), 'JSON-LD missing ' + t);
  const person = ld[0]['@graph'].find(n => n['@type'] === 'Person');
  assert.equal(person.name, 'Amjad Ali'); assert.ok(person.sameAs.length >= 5);
  const faq = ld[0]['@graph'].find(n => n['@type'] === 'FAQPage');
  const visible = [...html.matchAll(/<summary>([^<]+)<\/summary>/g)].map(m => m[1].replace(/&#x27;/g, "'"));
  assert.ok(visible.length >= 5);
  assert.deepEqual(faq.mainEntity.map(q => q.name), visible, 'FAQ JSON-LD must match the visible FAQ');
  assert.match(html, /id="ghLink" href="https:\/\/github.com\/mrxdevs\/pdf-studio"/);
  assert.doesNotMatch(html, /class="byline"/);
});

test('guide pages exist, are complete and link into the tool', () => {
  for (const g of GUIDES) {
    const h = read(`${g}/index.html`);
    assert.match(h, /<title>[^<]{20,65}<\/title>/, g);
    assert.match(h, /<meta name="description" content="[^"]{100,165}">/, g);
    assert.match(h, new RegExp(`<link rel="canonical" href="${BASE}/${g}/">`), g);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, g + ' needs exactly one h1');
    assert.match(h, /<meta name="viewport" content="width=device-width/);
    assert.match(h, /href="\/"/, g + ' must link to the editor');
    assert.doesNotMatch(h, /lorem ipsum|TODO|\{URL\}|\{\{/i);
    const ld = jsonLd(h); assert.ok(ld.length === 1, g);
    const types = ld[0]['@graph'].map(n => n['@type']);
    assert.ok(types.includes('FAQPage') && types.includes('BreadcrumbList'), g);
    for (const r of [...h.matchAll(/(?:src|href)="(\/[^"#]*)"/g)].map(m => m[1])) {
      const f = r.endsWith('/') ? path.join(site, r, 'index.html') : path.join(site, r);
      assert.ok(fs.existsSync(f), `${g}: broken internal link ${r}`);
    }
  }
});

test('sitemap lists every page and only real pages', () => {
  const sm = read('sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(locs.sort(), [BASE + '/', ...GUIDES.map(g => `${BASE}/${g}/`)].sort());
  for (const l of locs) { const p = l.slice(BASE.length); assert.ok(fs.existsSync(path.join(site, p, 'index.html')), 'sitemap points at missing ' + p); }
});

test('robots.txt allows search engines and AI crawlers and names the sitemap', () => {
  const r = read('robots.txt');
  assert.doesNotMatch(r, /Disallow:\s*\/\s*$/m);
  for (const bot of ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']) assert.match(r, new RegExp(`User-agent: ${bot}\\nAllow: /`), bot);
  assert.match(r, new RegExp(`Sitemap: ${BASE}/sitemap.xml`));
});

test('llms.txt follows the llmstxt.org shape; llms-full.txt has the details', () => {
  const l = read('llms.txt');
  assert.match(l, /^# PDF Studio\n\n> .+/);
  assert.match(l, /\n## Guides\n/); assert.match(l, /\n## Optional\n/);
  const links = [...l.matchAll(/\]\((https:\/\/pdfstudio\.mrxamjad\.com[^)]*)\)/g)].map(m => m[1].slice(BASE.length));
  assert.ok(links.length >= 6);
  for (const p of links) { const f = p.endsWith('/') ? path.join(site, p, 'index.html') : path.join(site, p); assert.ok(fs.existsSync(f), 'llms.txt link missing ' + p); }
  const full = read('llms-full.txt');
  for (const s of ['## Features', '## Privacy', '## Limitations', 'Amjad Ali', 'github.com/mrxdevs/pdf-studio', 'MIT']) assert.ok(full.includes(s), s);
});

test('open-source files are present', () => {
  const root = path.join(__dirname, '..');
  for (const f of ['LICENSE', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', '.github/PULL_REQUEST_TEMPLATE.md', '.github/ISSUE_TEMPLATE/bug_report.yml', '.github/ISSUE_TEMPLATE/feature_request.yml']) assert.ok(fs.existsSync(path.join(root, f)), f);
  assert.match(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'), /MIT License\n\nCopyright \(c\) 2026 Amjad Ali/);
  assert.ok(fs.existsSync(path.join(site, '404.html')));
});
