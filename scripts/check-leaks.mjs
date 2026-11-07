#!/usr/bin/env node
// Detects personal data of the maintainer in files that ship to users.
//
//   node scripts/check-leaks.mjs [paths...]      (default: src)
//
// Exit 0 when clean, 1 when something leaks (prints file:line [pattern] excerpt).
// Private terms are read from LEAK_BLOCKLIST (a file path; empty string disables)
// or, if that variable is unset, from `.leak-blocklist.local` at the repo root.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_PATTERNS } from './leak-patterns.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PRIVATE_FILE = join(REPO, '.leak-blocklist.local');
const SCANNED_EXTENSIONS = ['.md', '.json', '.toml', '.mjs', '.js', '.yml', '.yaml', '.txt', '.html'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One term per line; blank lines and `#` comments are ignored. */
export function parseBlocklist(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((term) => ({
      label: `private:${term.length > 3 ? term.slice(0, 3) + '…' : term}`,
      regex: new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(term)}(?=$|[^\\p{L}\\p{N}])`, 'iu'),
    }));
}

/** Public patterns plus the private blocklist, if any. */
export function loadPatterns({ privateFile } = {}) {
  let file = privateFile;
  if (file === undefined) {
    const env = process.env.LEAK_BLOCKLIST;
    file = env === undefined ? DEFAULT_PRIVATE_FILE : env || null;
  }
  const privatePatterns = file && existsSync(file) ? parseBlocklist(readFileSync(file, 'utf8')) : [];
  return [...PUBLIC_PATTERNS, ...privatePatterns];
}

/**
 * Line indexes where credits are allowed:
 * - inside `<!-- credits -->` … `<!-- /credits -->` (markers included);
 * - inside a JSON `"author"` / `"owner"` object (marketplace), or on an `"author"` / `"owner"` / `"developerName"` line.
 */
function creditLines(lines, { json = false } = {}) {
  const allowed = new Set();
  let inCredits = false;
  let openedAt = -1;
  let authorDepth = 0;
  lines.forEach((line, index) => {
    if (/<!--\s*credits\s*-->/i.test(line)) {
      inCredits = true;
      openedAt = index;
    }
    if (inCredits) allowed.add(index);
    if (/<!--\s*\/credits\s*-->/i.test(line)) inCredits = false;

    if (!json) return;
    if (authorDepth > 0) {
      allowed.add(index);
      authorDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    } else if (/"(author|owner|developerName)"\s*:/.test(line)) {
      allowed.add(index);
      authorDepth = Math.max(0, (line.match(/{/g) || []).length - (line.match(/}/g) || []).length);
    }
  });
  // An unclosed credits block would silence the rest of the file: allow nothing after its marker.
  const unclosed = inCredits ? openedAt : -1;
  if (unclosed >= 0) for (let i = unclosed; i < lines.length; i++) allowed.delete(i);
  return { allowed, unclosed };
}

/** Findings for one text: [{ file, line, pattern, excerpt }]. */
export function scanText(text, { file = '<text>', patterns = loadPatterns() } = {}) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  const { allowed, unclosed } = creditLines(lines, { json: /\.json$/i.test(file) });
  if (unclosed >= 0) {
    findings.push({ file, line: unclosed + 1, pattern: 'unclosed-credits', excerpt: 'missing <!-- /credits -->' });
  }
  lines.forEach((content, index) => {
    if (allowed.has(index)) return;
    for (const { label, regex } of patterns) {
      if (regex.test(content)) {
        findings.push({ file, line: index + 1, pattern: label, excerpt: content.trim().slice(0, 120) });
      }
    }
  });
  return findings;
}

function listFiles(path) {
  const stats = statSync(path);
  if (stats.isFile()) return [path];
  return readdirSync(path)
    .filter((name) => name !== 'node_modules' && name !== '.git')
    .flatMap((name) => listFiles(join(path, name)));
}

/** Findings for files and directories (recursively). */
export function scanPaths(paths, { patterns = loadPatterns() } = {}) {
  return paths
    .flatMap(listFiles)
    .filter((file) => SCANNED_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)) || !basename(file).includes('.'))
    .flatMap((file) => scanText(readFileSync(file, 'utf8'), { file, patterns }));
}

export function formatFindings(findings) {
  return findings.map((f) => `${f.file}:${f.line}  [${f.pattern}]  ${f.excerpt}`).join('\n');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const paths = process.argv.slice(2);
  const findings = scanPaths(paths.length ? paths : ['src']);
  if (findings.length) {
    console.error(`${findings.length} leak(s) found:\n${formatFindings(findings)}`);
    process.exit(1);
  }
  console.log('No leaks found.');
}
