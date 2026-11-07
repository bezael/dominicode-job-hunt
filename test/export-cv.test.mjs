// TASK-60/62 — src/skill/scripts/export-cv.mjs: CV Markdown → printable HTML (+ optional DOCX).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { markdownToHtml, renderCv, estimateLines, exportCv } from '../src/skill/scripts/export-cv.mjs';

const SCRIPT = 'src/skill/scripts/export-cv.mjs';
const SAMPLE = [
  '# Jane Doe',
  'Senior Engineer · TypeScript',
  '',
  '## Experience',
  '',
  '**Engineer** — *Acme* — 2020–2024',
  '- Cut build time 40 % with [Vite](https://vitejs.dev)',
  '- Led `api` migration',
  '',
  '1. first',
  '2. second',
].join('\n');

const tmp = () => mkdtempSync(join(tmpdir(), 'jobhunt-cv-'));

// ── TASK-60 — Markdown → HTML ────────────────────────────────────────────────

test('headings, paragraphs and lists', () => {
  const html = markdownToHtml(SAMPLE);
  assert.match(html, /<h1>Jane Doe<\/h1>/);
  assert.match(html, /<p>Senior Engineer · TypeScript<\/p>/);
  assert.match(html, /<h2>Experience<\/h2>/);
  assert.match(html, /<ul>\s*<li>Cut build time/);
  assert.match(html, /<ol>\s*<li>first<\/li>\s*<li>second<\/li>\s*<\/ol>/);
});

test('bold, italic, inline code and links', () => {
  const html = markdownToHtml(SAMPLE);
  assert.match(html, /<strong>Engineer<\/strong>/);
  assert.match(html, /<em>Acme<\/em>/);
  assert.match(html, /<code>api<\/code>/);
  assert.match(html, /<a href="https:\/\/vitejs\.dev">Vite<\/a>/);
});

test('a single line break inside a paragraph is kept (title line, contact line)', () => {
  assert.equal(markdownToHtml('one\ntwo').trim(), '<p>one<br>\ntwo</p>');
});

test('content HTML is escaped, including inside links', () => {
  const html = markdownToHtml('<script>alert(1)</script> & "x"\n\n[a](javascript:alert(1)) [b](https://x.dev/?a=1&b="2")');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;x&quot;/);
  assert.doesNotMatch(html, /href="javascript:/i);
  assert.match(html, /href="https:\/\/x\.dev\/\?a=1&amp;b=&quot;2&quot;"/);
});

test('renderCv is a full printable page', () => {
  const page = renderCv(SAMPLE);
  assert.match(page, /^<!doctype html>/i);
  assert.match(page, /<meta charset="utf-8">/i);
  assert.match(page, /<title>Jane Doe<\/title>/);
  assert.match(page, /@page\s*\{[^}]*size:\s*A4/);
  assert.match(page, /@media print/);
  assert.match(renderCv(SAMPLE, { paper: 'letter' }), /size:\s*letter/);
});

// ── TASK-62 — warnings and optional DOCX ─────────────────────────────────────

test('estimateLines grows with content', () => {
  const short = estimateLines(SAMPLE);
  const long = estimateLines(`${SAMPLE}\n${'- a long bullet with plenty of words to wrap across the line\n'.repeat(80)}`);
  assert.ok(short < 30, `short CV estimated at ${short}`);
  assert.ok(long > 80, `long CV estimated at ${long}`);
});

test('exportCv writes cv.html next to the source and warns past one page', () => {
  const dir = tmp();
  const input = join(dir, 'cv.md');
  writeFileSync(input, SAMPLE);
  const ok = exportCv({ input, findPandoc: () => null });
  assert.equal(ok.html, join(dir, 'cv.html'));
  assert.ok(existsSync(ok.html));
  assert.ok(!ok.warnings.some((w) => /one page/i.test(w)));

  writeFileSync(input, `${SAMPLE}\n${'- another real achievement that takes a full line of text in the CV\n'.repeat(70)}`);
  const long = exportCv({ input, findPandoc: () => null });
  assert.ok(long.warnings.some((w) => /one page/i.test(w)), long.warnings.join('\n'));
});

test('without pandoc there is no DOCX and a warning says what is missing, without failing', () => {
  const dir = tmp();
  const input = join(dir, 'cv.md');
  writeFileSync(input, SAMPLE);
  const result = exportCv({ input, findPandoc: () => null });
  assert.equal(result.docx, null);
  assert.ok(result.warnings.some((w) => /pandoc/i.test(w)));
  assert.ok(!existsSync(join(dir, 'cv.docx')));
});

test('with pandoc it is invoked to write cv.docx', () => {
  const dir = tmp();
  const input = join(dir, 'cv.md');
  writeFileSync(input, SAMPLE);
  const calls = [];
  const result = exportCv({
    input,
    findPandoc: () => 'pandoc',
    run: (cmd, args) => {
      calls.push([cmd, ...args]);
      return { status: 0 };
    },
  });
  assert.equal(result.docx, join(dir, 'cv.docx'));
  assert.deepEqual(calls, [['pandoc', input, '-o', join(dir, 'cv.docx')]]);
});

test('a failing pandoc is a warning, not an error', () => {
  const dir = tmp();
  const input = join(dir, 'cv.md');
  writeFileSync(input, SAMPLE);
  const result = exportCv({ input, findPandoc: () => 'pandoc', run: () => ({ status: 1, stderr: 'boom' }) });
  assert.equal(result.docx, null);
  assert.ok(result.warnings.some((w) => /pandoc/i.test(w) && /boom/.test(w)));
});

test('CLI: exports, prints the files and exits 0; missing input exits 1', () => {
  const dir = tmp();
  const input = join(dir, 'cv.md');
  writeFileSync(input, SAMPLE);
  const ok = spawnSync(process.execPath, [SCRIPT, input, '--no-docx'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /cv\.html/);
  assert.match(readFileSync(join(dir, 'cv.html'), 'utf8'), /<h1>Jane Doe<\/h1>/);

  const missing = spawnSync(process.execPath, [SCRIPT, join(dir, 'nope.md')], { encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /nope\.md/);
});

test('with --out, the DOCX goes next to the HTML; an unknown paper size is rejected', () => {
  const dir = tmp();
  const input = join(dir, 'cv.md');
  writeFileSync(input, SAMPLE);
  const calls = [];
  const out = join(dir, 'out', 'jane.html');
  mkdirSync(join(dir, 'out'));
  exportCv({ input, out, findPandoc: () => 'pandoc', run: (cmd, args) => (calls.push(args), { status: 0 }) });
  assert.deepEqual(calls[0], [input, '-o', join(dir, 'out', 'jane.docx')]);
  const bad = spawnSync(process.execPath, [SCRIPT, input, '--paper', 'legal'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /paper/i);
});
