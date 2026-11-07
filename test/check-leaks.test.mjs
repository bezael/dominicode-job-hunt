import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { scanText, scanPaths, loadPatterns, parseBlocklist } from '../scripts/check-leaks.mjs';

const FAKE_PRIVATE = parseBlocklist('# fictional terms for tests\nAcme Hiring Corp\n\nJane Recruiter\n');
const patterns = [...loadPatterns({ privateFile: null }), ...FAKE_PRIVATE];

const labelsFor = (text, file = 'x.md') => scanText(text, { file, patterns }).map((f) => f.pattern);

test('flags the maintainer name', () => {
  assert.ok(labelsFor('Prepare Bezael for the interview.').includes('maintainer-name'));
});

test('allows the repo path in install commands, nothing else', () => {
  assert.deepEqual(labelsFor('codex plugin marketplace add bezael/dominicode-job-hunt'), []);
  assert.deepEqual(labelsFor('https://github.com/bezael/dominicode-job-hunt'), []);
  assert.ok(labelsFor('github.com/bezael/other-repo').includes('maintainer-name'));
});

test('flags the named browser profile', () => {
  assert.ok(labelsFor('Select the window called "Bezael Browser".').includes('maintainer-name'));
});

test('flags absolute Windows paths', () => {
  assert.ok(labelsFor('Copy E:\\PROD-REPOS\\something\\export.sh').includes('windows-path'));
});

test('flags references to the private brand folder', () => {
  assert.ok(labelsFor('Read `_brand/social-networks.md`.').includes('brand-folder'));
});

test('flags a bare brand mention but allows the package identifier', () => {
  assert.ok(labelsFor('Mention the Dominicode community.').includes('brand-name'));
  assert.deepEqual(labelsFor('Install the dominicode-job-hunt plugin.'), []);
});

test('flags the original salary floor', () => {
  assert.ok(labelsFor('Only offers paying USD 60k or more.').includes('salary-floor'));
});

test('flags terms from the private blocklist, case-insensitively', () => {
  assert.ok(labelsFor('Applied to acme hiring corp last week.').some((l) => l.startsWith('private:')));
  assert.ok(labelsFor('Thank Jane Recruiter.').some((l) => l.startsWith('private:')));
});

test('reports file and 1-based line number', () => {
  const [finding] = scanText('clean line\nsecond line mentions Bezael', { file: 'a.md', patterns });
  assert.equal(finding.file, 'a.md');
  assert.equal(finding.line, 2);
});

test('clean text has no findings', () => {
  assert.deepEqual(labelsFor('Read jobs/criteria.md and score each offer.'), []);
});

test('scanPaths walks directories and the CLI exits 1 on findings', () => {
  const dir = mkdtempSync(join(tmpdir(), 'leaks-'));
  mkdirSync(join(dir, 'nested'));
  writeFileSync(join(dir, 'ok.md'), 'nothing to see');
  writeFileSync(join(dir, 'nested', 'bad.md'), 'ask Bezael');
  const findings = scanPaths([dir], { patterns });
  assert.equal(findings.length, 1);
  assert.match(findings[0].file, /bad\.md$/);

  const cli = spawnSync(process.execPath, ['scripts/check-leaks.mjs', dir], {
    encoding: 'utf8',
    env: { ...process.env, LEAK_BLOCKLIST: '' },
  });
  assert.equal(cli.status, 1);
  assert.match(cli.stdout + cli.stderr, /bad\.md:1/);

  const clean = mkdtempSync(join(tmpdir(), 'leaks-clean-'));
  writeFileSync(join(clean, 'ok.md'), 'nothing to see');
  const ok = spawnSync(process.execPath, ['scripts/check-leaks.mjs', clean], {
    encoding: 'utf8',
    env: { ...process.env, LEAK_BLOCKLIST: '' },
  });
  assert.equal(ok.status, 0);
});

test('credits blocks are allowed, but the same name outside them is flagged', () => {
  const text = [
    'Use the criteria file.',
    '<!-- credits -->',
    'Made by Bezael Pérez · Dominicode.',
    '<!-- /credits -->',
    'Ask Bezael before sending.',
  ].join('\n');
  const findings = scanText(text, { file: 'SKILL.md', patterns });
  assert.deepEqual(findings.map((f) => f.line), [5]);
});

test('author and developerName in a JSON manifest are allowed', () => {
  const json = JSON.stringify(
    {
      name: 'dominicode-job-hunt',
      author: { name: 'Bezael Pérez · Dominicode', url: 'https://dominicode.com' },
      interface: { developerName: 'Bezael Pérez · Dominicode', shortDescription: 'Ask Bezael' },
    },
    null,
    2,
  );
  const findings = scanText(json, { file: 'plugin.json', patterns });
  assert.equal(findings.length, 1);
  assert.match(findings[0].excerpt, /shortDescription/);
});

test('the owner of a marketplace is allowed', () => {
  const json = JSON.stringify({ name: 'x', owner: { name: 'Bezael Pérez · Dominicode' }, plugins: [{ description: 'Ask Bezael' }] }, null, 2);
  const findings = scanText(json, { file: 'marketplace.json', patterns });
  assert.equal(findings.length, 1);
  assert.match(findings[0].excerpt, /description/);
});

test('an unclosed credits block is itself a finding and silences nothing', () => {
  const findings = scanText('<!-- credits -->\nBy Bezael\nAsk Bezael', { file: 'README.md', patterns });
  const labels = findings.map((f) => f.pattern);
  assert.ok(labels.includes('unclosed-credits'));
  assert.equal(labels.filter((l) => l === 'maintainer-name').length, 2);
});

test('"author" lines are allowed only in JSON files', () => {
  assert.equal(scanText('"author": "Bezael"', { file: 'notes.md', patterns }).length, 1);
  assert.equal(scanText('"author": "Bezael"', { file: 'plugin.json', patterns }).length, 0);
});

test('flags forward-slash Windows paths and home folders, not URLs', () => {
  assert.ok(labelsFor('see E:/PROD-REPOS/x').includes('windows-path'));
  assert.ok(labelsFor('cat /Users/someone/cv.md').includes('home-path'));
  assert.ok(labelsFor('cd /home/someone').includes('home-path'));
  assert.deepEqual(labelsFor('https://remoteok.com/api and C# and jobs/criteria.md'), []);
});

test('files without an extension (templates/jobs/gitignore) are scanned', () => {
  const dir = mkdtempSync(join(tmpdir(), 'leaks-noext-'));
  writeFileSync(join(dir, 'gitignore'), 'Bezael\n');
  assert.equal(scanPaths([dir], { patterns }).length, 1);
});
