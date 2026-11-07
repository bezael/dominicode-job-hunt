#!/usr/bin/env node
// Turns a CV written in Markdown into a printable one-page HTML file (and a DOCX when pandoc is installed).
// No dependencies: runs with Node 20 or later.
//
//   node export-cv.mjs <cv.md> [--out <file.html>] [--paper a4|letter] [--no-docx]
//
// Open the HTML in a browser → Print → Save as PDF.
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Lines that fit on one printed page with the stylesheet below (A4 and letter are close enough). */
export const LINES_PER_PAGE = 56;
const CHARS_PER_LINE = 95;

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SAFE_URL = /^(?:https?:|mailto:|tel:)/i;

function emphasis(escaped) {
  return escaped
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
    .replace(/__(?=\S)(.+?)(?<=\S)__/g, '<strong>$1</strong>')
    .replace(/(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])/g, '<em>$1</em>')
    .replace(/(?<![\w_])_(?=\S)(.+?)(?<=\S)_(?![\w_])/g, '<em>$1</em>');
}

function textWithLinks(text) {
  const out = [];
  const link = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const match of text.matchAll(link)) {
    out.push(emphasis(escapeHtml(text.slice(last, match.index))));
    const [, label, url] = match;
    out.push(SAFE_URL.test(url) ? `<a href="${escapeHtml(url)}">${emphasis(escapeHtml(label))}</a>` : emphasis(escapeHtml(label)));
    last = match.index + match[0].length;
  }
  out.push(emphasis(escapeHtml(text.slice(last))));
  return out.join('');
}

/** Inline Markdown: code spans, links, bold, italic. Everything else is escaped. */
export function inline(text) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) => (/^`[^`]+`$/.test(part) ? `<code>${escapeHtml(part.slice(1, -1))}</code>` : textWithLinks(part)))
    .join('');
}

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

/** Block-level Markdown subset used by CVs: headings, paragraphs, lists, rules. */
export function markdownToHtml(markdown) {
  const html = [];
  let paragraph = [];
  let list = null; // { tag, items: [] }

  const flushParagraph = () => {
    // A CV relies on single line breaks (title line, contact line), so they are kept.
    if (paragraph.length) html.push(`<p>${paragraph.map(inline).join('<br>\n')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.tag}>\n${list.items.map((i) => `  <li>${inline(i)}</li>`).join('\n')}\n</${list.tag}>`);
    list = null;
  };
  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      flush();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (RULE.test(line)) {
      flush();
      html.push('<hr>');
      continue;
    }
    const item = line.match(BULLET) ?? line.match(NUMBERED);
    if (item) {
      flushParagraph();
      const tag = BULLET.test(line) ? 'ul' : 'ol';
      if (list && list.tag !== tag) flushList();
      list ??= { tag, items: [] };
      list.items.push(item[1]);
      continue;
    }
    if (list && /^\s+\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flush();
  return html.join('\n') + '\n';
}

/** Rough number of printed lines, to warn before the CV spills onto a second page. */
export function estimateLines(markdown) {
  let lines = 0;
  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      lines += 0.4;
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      lines += heading[1].length === 1 ? 3 : 2;
      continue;
    }
    const text = line.replace(/^[-*+]\s+|^\d+[.)]\s+/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    lines += Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
  }
  return Math.round(lines);
}

const STYLE = (paper) => `
  @page { size: ${paper === 'letter' ? 'letter' : 'A4'}; margin: 14mm 16mm; }
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e9e9ea; color: #1b1b1f;
    font: 10.5pt/1.35 "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif; }
  main { background: #fff; max-width: ${paper === 'letter' ? '216mm' : '210mm'}; margin: 24px auto; padding: 14mm 16mm;
    box-shadow: 0 2px 12px rgb(0 0 0 / 0.12); }
  h1 { font-size: 19pt; margin: 0 0 2pt; letter-spacing: -0.01em; }
  h1 + p { margin-top: 0; color: #44444c; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.06em; margin: 11pt 0 4pt;
    padding-bottom: 2pt; border-bottom: 1px solid #c9c9cf; }
  h3 { font-size: 10.5pt; margin: 7pt 0 2pt; }
  h4, h5, h6 { font-size: 10.5pt; margin: 5pt 0 1pt; }
  p { margin: 0 0 4pt; }
  ul, ol { margin: 2pt 0 5pt; padding-left: 15pt; }
  li { margin: 0 0 1.5pt; }
  a { color: inherit; }
  code { font-family: ui-monospace, Consolas, monospace; font-size: 0.95em; }
  hr { border: 0; border-top: 1px solid #c9c9cf; margin: 6pt 0; }
  @media print {
    body { background: #fff; }
    main { margin: 0; padding: 0; max-width: none; box-shadow: none; }
    h2, h3 { break-after: avoid; }
    li { break-inside: avoid; }
  }
`;

/** Full printable HTML page for a CV. */
export function renderCv(markdown, { paper = 'a4' } = {}) {
  const title = markdown.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1] ?? 'CV';
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title.replace(/[*_`]/g, ''))}</title>
<style>${STYLE(paper)}</style>
</head>
<body>
<main>
${markdownToHtml(markdown)}</main>
</body>
</html>
`;
}

/** `pandoc` if it can be run, otherwise null. */
export function findPandoc() {
  const probe = spawnSync('pandoc', ['--version'], { encoding: 'utf8' });
  return probe.status === 0 ? 'pandoc' : null;
}

const runCommand = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' });

/**
 * Writes <name>.html next to the Markdown (or at `out`) and, when pandoc is available, <name>.docx.
 * Never throws for a missing pandoc or a long CV: those come back as warnings.
 */
export function exportCv({ input, out, paper = 'a4', docx = true, findPandoc: find = findPandoc, run = runCommand }) {
  const markdown = readFileSync(input, 'utf8');
  const base = join(dirname(input), basename(input, extname(input)));
  const html = out ?? `${base}.html`;
  writeFileSync(html, renderCv(markdown, { paper }));

  const warnings = [];
  const lines = estimateLines(markdown);
  if (lines > LINES_PER_PAGE) {
    warnings.push(
      `The CV is probably longer than one page (about ${lines} printed lines, ${LINES_PER_PAGE} fit). Shorten older roles or bullets, or check the print preview.`,
    );
  }

  let docxPath = null;
  if (docx) {
    const pandoc = find();
    if (!pandoc) {
      warnings.push('No DOCX: pandoc is not installed (https://pandoc.org/installing.html). The HTML is enough to print a PDF.');
    } else {
      const target = out ? out.replace(/\.html?$/i, '') + '.docx' : `${base}.docx`;
      const result = run(pandoc, [input, '-o', target]);
      if (result.status === 0) docxPath = target;
      else warnings.push(`No DOCX: pandoc failed (${(result.stderr || `exit ${result.status}`).toString().trim()}).`);
    }
  }
  return { html, docx: docxPath, warnings, lines };
}

function parseArgs(argv) {
  const options = { docx: true, paper: 'a4' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') options.out = argv[++i];
    else if (arg === '--paper') options.paper = argv[++i];
    else if (arg === '--no-docx') options.docx = false;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else options.input = arg;
  }
  return options;
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.help || !options.input) {
    console.log('Usage: node export-cv.mjs <cv.md> [--out <file.html>] [--paper a4|letter] [--no-docx]');
    return options.help ? 0 : 1;
  }
  if (!['a4', 'letter'].includes(String(options.paper).toLowerCase())) {
    console.error(`Unknown paper size: ${options.paper} (use a4 or letter)`);
    return 1;
  }
  options.paper = options.paper.toLowerCase();
  const input = resolve(options.input);
  if (!existsSync(input)) {
    console.error(`File not found: ${options.input}`);
    return 1;
  }
  const result = exportCv({ ...options, input, out: options.out && resolve(options.out) });
  console.log(`Wrote ${result.html}`);
  if (result.docx) console.log(`Wrote ${result.docx}`);
  for (const warning of result.warnings) console.log(`Warning: ${warning}`);
  console.log('Print it: open the HTML in a browser → Print → Save as PDF (check that it is one page).');
  return 0;
}

// realpath on both sides: the skill may be reached through a symlink or a junction.
const same = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
const isMain = (() => {
  try {
    return Boolean(process.argv[1]) && same(realpathSync(process.argv[1]), realpathSync(fileURLToPath(import.meta.url)));
  } catch {
    return false;
  }
})();
if (isMain) process.exitCode = main(process.argv.slice(2));
