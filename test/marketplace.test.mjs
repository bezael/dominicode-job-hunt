// TASK-70 — the two marketplaces at the repo root point at the generated plugin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PLUGIN = './plugins/dominicode-job-hunt';
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const pkg = json('package.json');

test('Codex marketplace lists the plugin with a local ./ path and the required policy fields', () => {
  const market = json('.agents/plugins/marketplace.json');
  assert.equal(typeof market.name, 'string');
  assert.ok(market.interface?.displayName);
  const entry = market.plugins.find((p) => p.name === 'dominicode-job-hunt');
  assert.ok(entry, 'plugin entry');
  assert.deepEqual(entry.source, { source: 'local', path: PLUGIN });
  assert.ok(entry.policy?.installation);
  assert.ok(entry.policy?.authentication);
  assert.ok(entry.category);
});

test('Claude Code marketplace lists the plugin', () => {
  const market = json('.claude-plugin/marketplace.json');
  assert.equal(typeof market.name, 'string');
  assert.ok(market.owner?.name);
  const entry = market.plugins.find((p) => p.name === 'dominicode-job-hunt');
  assert.ok(entry, 'plugin entry');
  assert.equal(entry.source, PLUGIN);
});

test('both plugin manifests exist with name and the package version; Codex declares skills', () => {
  const codex = json(join(PLUGIN, '.codex-plugin/plugin.json'));
  const claude = json(join(PLUGIN, '.claude-plugin/plugin.json'));
  for (const manifest of [codex, claude]) {
    assert.equal(manifest.name, 'dominicode-job-hunt');
    assert.equal(manifest.version, pkg.version);
  }
  assert.equal(codex.skills, './skills/');
  assert.ok(existsSync(join(PLUGIN, 'skills/job-hunt/SKILL.md')));
});
