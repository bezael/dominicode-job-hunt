import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseToml } from 'smol-toml';

import { build } from '../scripts/build.mjs';
import { PUBLIC_PATTERNS } from '../scripts/leak-patterns.mjs';
import { parseBlocklist } from '../scripts/check-leaks.mjs';
import { makeFixture, PKG } from './helpers/fixture.mjs';

const PLUGIN = 'plugins/dominicode-job-hunt';
const run = (root, opts = {}) => build({ root, pkg: PKG, patterns: PUBLIC_PATTERNS, ...opts });
const read = (root, path) => readFileSync(join(root, path), 'utf8');

// TASK-20 — Codex output
test('each agent becomes a valid Codex TOML inside the skill', () => {
  const root = makeFixture();
  run(root);
  for (const name of ['job-alpha', 'job-beta']) {
    const toml = parseToml(read(root, `${PLUGIN}/skills/job-hunt/codex-agents/${name}.toml`));
    assert.equal(toml.name, name);
    assert.ok(toml.description.length > 0);
    assert.equal(toml.developer_instructions, read(root, `src/skill/references/${name}.md`));
  }
});

test('the skill folder is copied and the Codex manifest points to it', () => {
  const root = makeFixture();
  run(root);
  assert.equal(read(root, `${PLUGIN}/skills/job-hunt/SKILL.md`), read(root, 'src/skill/SKILL.md'));
  assert.ok(existsSync(join(root, `${PLUGIN}/skills/job-hunt/templates/jobs/criteria.md`)));
  const manifest = JSON.parse(read(root, `${PLUGIN}/.codex-plugin/plugin.json`));
  assert.equal(manifest.name, 'dominicode-job-hunt');
  assert.equal(manifest.version, PKG.version);
  assert.equal(manifest.skills, './skills/');
});

// TASK-22 — strict YAML frontmatter
test('an unquoted description with ": " aborts the build with file:line', () => {
  const root = makeFixture({
    'src/agents/job-alpha.md': '---\nname: job-alpha\ndescription: Scores offers. Use when: ranking.\ntools: [read]\ninstructions: references/job-alpha.md\n---\n',
  });
  assert.throws(() => run(root), (err) => {
    assert.match(err.message, /src\/agents\/job-alpha\.md:3/);
    return true;
  });
  assert.equal(existsSync(join(root, PLUGIN)), false, 'nothing is written');
});

test('a SKILL.md without frontmatter aborts the build', () => {
  const root = makeFixture({ 'src/skill/SKILL.md': '# No frontmatter\n' });
  assert.throws(() => run(root), /src\/skill\/SKILL\.md/);
});

test('an agent without name or description aborts the build', () => {
  const root = makeFixture({
    'src/agents/job-alpha.md': '---\nname: job-alpha\ninstructions: references/job-alpha.md\n---\n',
  });
  assert.throws(() => run(root), /job-alpha\.md.*description/);
});

// TASK-24 — Claude Code output
test('Claude Code manifest and agents with mapped tools', () => {
  const root = makeFixture();
  run(root);
  const manifest = JSON.parse(read(root, `${PLUGIN}/.claude-plugin/plugin.json`));
  assert.equal(manifest.name, 'dominicode-job-hunt');
  assert.equal(manifest.version, PKG.version);

  const alpha = read(root, `${PLUGIN}/agents/job-alpha.md`);
  assert.match(alpha, /^---\nname: job-alpha\n/);
  assert.match(alpha, /\ntools: Read, Edit, Glob, Grep, Bash\n/);
  assert.ok(alpha.endsWith(read(root, 'src/skill/references/job-alpha.md')));
});

test('an agent that needs the browser inherits every tool (no tools line)', () => {
  const root = makeFixture();
  run(root);
  const beta = read(root, `${PLUGIN}/agents/job-beta.md`);
  assert.doesNotMatch(beta, /\ntools:/);
});

test('an unknown neutral tool aborts the build', () => {
  const root = makeFixture({
    'src/agents/job-alpha.md': '---\nname: job-alpha\ndescription: "x"\ntools: [read, teleport]\ninstructions: references/job-alpha.md\n---\n',
  });
  assert.throws(() => run(root), /job-alpha\.md.*teleport/);
});

// TASK-26 — AGENTS.md mirror
test('AGENTS.md mirror: no frontmatter, skill body, every role and template inlined', () => {
  const root = makeFixture();
  run(root);
  const mirror = read(root, `${PLUGIN}/AGENTS.md`);
  assert.doesNotMatch(mirror, /^---/);
  assert.match(mirror, /# Job hunt/);
  assert.match(mirror, /Read `jobs\/criteria\.md` first\./);
  assert.match(mirror, /## Role: job-alpha[\s\S]*Score offers from/);
  assert.match(mirror, /## Role: job-beta[\s\S]*Open the offer URL/);
  assert.match(mirror, /templates\/jobs\/criteria\.md[\s\S]*roles: \[\]/);
  // It explains what <skill> means when there is no skill folder around it.
  const preface = mirror.slice(0, mirror.indexOf('# Job hunt'));
  assert.match(preface, /How to read this file/);
  assert.match(preface, /plugins\/dominicode-job-hunt\/skills\/job-hunt/);
});

// TASK-28 — a leak aborts the build before writing
test('a leak in the source aborts the build and leaves previous outputs intact', () => {
  const root = makeFixture();
  run(root);
  const before = read(root, `${PLUGIN}/skills/job-hunt/references/job-alpha.md`);
  writeFileSync(join(root, 'src/skill/references/job-alpha.md'), '# Alpha\n\nAsk Bezael before applying.\n');
  assert.throws(() => run(root), (err) => {
    assert.match(err.message, /src\/skill\/references\/job-alpha\.md:3.*maintainer-name/);
    return true;
  });
  assert.equal(read(root, `${PLUGIN}/skills/job-hunt/references/job-alpha.md`), before);
});

test('a private blocklist term also aborts the build', () => {
  const root = makeFixture({ 'src/skill/references/job-alpha.md': '# Alpha\n\nLike the Acme Hiring Corp process.\n' });
  const patterns = [...PUBLIC_PATTERNS, ...parseBlocklist('Acme Hiring Corp')];
  assert.throws(() => run(root, { patterns }), /private:/);
  assert.equal(existsSync(join(root, PLUGIN)), false);
});

// TASK-30 — --check detects drift without writing
test('--check passes right after a build', () => {
  const root = makeFixture();
  run(root);
  assert.doesNotThrow(() => run(root, { check: true }));
});

test('--check reports modified, missing and extra files and writes nothing', () => {
  const root = makeFixture();
  run(root);
  const edited = `${PLUGIN}/AGENTS.md`;
  writeFileSync(join(root, edited), 'hand edit\n');
  writeFileSync(join(root, `${PLUGIN}/extra.md`), 'stray\n');
  rmSync(join(root, `${PLUGIN}/agents/job-beta.md`));
  assert.throws(() => run(root, { check: true }), (err) => {
    assert.match(err.message, /modified: plugins\/dominicode-job-hunt\/AGENTS\.md/);
    assert.match(err.message, /extra: plugins\/dominicode-job-hunt\/extra\.md/);
    assert.match(err.message, /missing: plugins\/dominicode-job-hunt\/agents\/job-beta\.md/);
    return true;
  });
  assert.equal(read(root, edited), 'hand edit\n');
});

test('a source tree without src/agents builds the skill with no agents', () => {
  const root = makeFixture({ 'src/agents/job-alpha.md': null, 'src/agents/job-beta.md': null });
  const { files } = run(root);
  assert.ok(files.has(`${PLUGIN}/skills/job-hunt/SKILL.md`));
  assert.equal([...files.keys()].filter((p) => p.endsWith('.toml')).length, 0);
});
