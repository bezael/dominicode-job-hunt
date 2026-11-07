import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { installAgents, defaultTarget, trustKey, GENERATED_MARK } from '../src/skill/scripts/install-codex-agents.mjs';

const SCRIPT = 'src/skill/scripts/install-codex-agents.mjs';
const tmp = (prefix) => mkdtempSync(join(tmpdir(), prefix));

function sourceWithAgents() {
  const dir = tmp('codex-agents-src-');
  writeFileSync(join(dir, 'job-alpha.toml'), 'name = "job-alpha"\n');
  writeFileSync(join(dir, 'job-beta.toml'), 'name = "job-beta"\n');
  writeFileSync(join(dir, 'README.md'), 'not an agent\n');
  return dir;
}

// TASK-40 — copies to the global or the project folder
test('installs every .toml into the target folder, creating it', () => {
  const source = sourceWithAgents();
  const target = join(tmp('codex-home-'), 'agents');
  const result = installAgents({ source, target });
  assert.deepEqual(result.copied.sort(), ['job-alpha.toml', 'job-beta.toml']);
  assert.deepEqual(readdirSync(target).sort(), ['job-alpha.toml', 'job-beta.toml']);
});

test('global target honours CODEX_HOME; --project targets ./.codex/agents', () => {
  assert.equal(defaultTarget({ project: false, env: { CODEX_HOME: '/x/codex' }, cwd: '/w' }), join('/x/codex', 'agents'));
  assert.equal(defaultTarget({ project: true, env: { CODEX_HOME: '/x/codex' }, cwd: '/w' }), join('/w', '.codex', 'agents'));
});

test('CLI installs into CODEX_HOME/agents', () => {
  const source = sourceWithAgents();
  const home = tmp('codex-home-cli-');
  const run = spawnSync(process.execPath, [SCRIPT, '--source', source], {
    encoding: 'utf8',
    env: { ...process.env, CODEX_HOME: home },
  });
  assert.equal(run.status, 0, run.stderr);
  assert.ok(existsSync(join(home, 'agents', 'job-alpha.toml')));
  assert.match(run.stdout, /copied.*job-alpha\.toml/);
});

test('CLI --project installs into ./.codex/agents of the working directory', () => {
  const source = sourceWithAgents();
  const project = tmp('codex-project-');
  const run = spawnSync(process.execPath, [join(process.cwd(), SCRIPT), '--project', '--source', source], {
    encoding: 'utf8',
    cwd: project,
  });
  assert.equal(run.status, 0, run.stderr);
  assert.ok(existsSync(join(project, '.codex', 'agents', 'job-beta.toml')));
});

// TASK-42 — never overwrite a different file without --force
test('a different existing file is skipped; an identical one is reported as identical', () => {
  const source = sourceWithAgents();
  const target = tmp('codex-agents-existing-');
  writeFileSync(join(target, 'job-alpha.toml'), 'name = "my-own-alpha"\n');
  writeFileSync(join(target, 'job-beta.toml'), 'name = "job-beta"\n');
  const result = installAgents({ source, target });
  assert.deepEqual(result, { copied: [], updated: [], skipped: ['job-alpha.toml'], identical: ['job-beta.toml'] });
  assert.equal(readFileSync(join(target, 'job-alpha.toml'), 'utf8'), 'name = "my-own-alpha"\n');
});

test('--force overwrites the different file', () => {
  const source = sourceWithAgents();
  const target = tmp('codex-agents-force-');
  writeFileSync(join(target, 'job-alpha.toml'), 'name = "my-own-alpha"\n');
  const result = installAgents({ source, target, force: true });
  assert.deepEqual(result.updated, ['job-alpha.toml']);
  assert.deepEqual(result.copied, ['job-beta.toml']);
  assert.equal(readFileSync(join(target, 'job-alpha.toml'), 'utf8'), 'name = "job-alpha"\n');
});

test('CLI explains how to overwrite skipped files', () => {
  const source = sourceWithAgents();
  const home = tmp('codex-home-skip-');
  mkdirSync(join(home, 'agents'));
  writeFileSync(join(home, 'agents', 'job-alpha.toml'), 'different\n');
  const run = spawnSync(process.execPath, [SCRIPT, '--source', source], {
    encoding: 'utf8',
    env: { ...process.env, CODEX_HOME: home },
  });
  assert.equal(run.status, 2, 'skipping must not look like success');
  assert.match(run.stdout, /skipped.*job-alpha\.toml/);
  assert.match(run.stdout, /--force/);
});

// TASK-45 — project installs only load in trusted Codex projects
test('CLI --project warns that Codex ignores agents of untrusted projects', () => {
  const source = sourceWithAgents();
  const project = tmp('codex-project-warn-');
  const run = spawnSync(process.execPath, [join(process.cwd(), SCRIPT), '--project', '--source', source], {
    encoding: 'utf8',
    cwd: project,
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /trust_level = "trusted"/);
  assert.match(run.stdout, /without --project/);
});

test('the global install does not print the trust warning', () => {
  const source = sourceWithAgents();
  const run = spawnSync(process.execPath, [SCRIPT, '--source', source], {
    encoding: 'utf8',
    env: { ...process.env, CODEX_HOME: tmp('codex-home-nowarn-') },
  });
  assert.doesNotMatch(run.stdout, /trust_level/);
});

test('an older file generated by this package is updated without --force', () => {
  const source = sourceWithAgents();
  const target = tmp('codex-agents-upgrade-');
  writeFileSync(join(target, 'job-alpha.toml'), `${GENERATED_MARK} (old version)\nname = "job-alpha"\n`);
  const result = installAgents({ source, target });
  assert.deepEqual(result.updated, ['job-alpha.toml']);
  assert.equal(readFileSync(join(target, 'job-alpha.toml'), 'utf8'), 'name = "job-alpha"\n');
});

test('trust key: lowercase only on Windows, quoted as a TOML basic string', () => {
  assert.equal(trustKey('C:/Users/Ana/Jobs', 'win32'), '[projects."c:/users/ana/jobs"]');
  assert.equal(trustKey("/home/Ana/o'neil", 'linux'), `[projects."/home/Ana/o'neil"]`);
});

test('CLI works when the script is reached through a symlink or junction', (t) => {
  const link = join(tmp('codex-link-'), 'skill');
  try {
    symlinkSync(join(process.cwd(), 'src/skill'), link, 'junction');
  } catch {
    t.skip('cannot create links here');
    return;
  }
  const run = spawnSync(process.execPath, [join(link, 'scripts/install-codex-agents.mjs'), '--bogus'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Unknown option/);
});
