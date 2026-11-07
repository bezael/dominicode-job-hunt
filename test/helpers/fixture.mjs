// Builds a minimal, leak-free source tree in a temp directory for build tests.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

export const PKG = { name: 'dominicode-job-hunt', version: '0.0.1', description: 'Test package.', license: 'MIT', author: 'Test Author' };

export const FILES = {
  'src/skill/SKILL.md': [
    '---',
    'name: job-hunt',
    'description: "Remote job hunting. Use when: the user wants to find, rank or apply to remote jobs."',
    '---',
    '',
    '# Job hunt',
    '',
    'Read `jobs/criteria.md` first.',
    '',
  ].join('\n'),
  'src/skill/references/job-alpha.md': '# Alpha role\n\nScore offers from `jobs/criteria.md`.\n',
  'src/skill/references/job-beta.md': "# Beta role\n\nOpen the offer URL in the connected browser.\nA line with ''' triple quotes.\n",
  'src/skill/templates/jobs/criteria.md': '# Criteria\n\nroles: []\n',
  'src/agents/job-alpha.md': [
    '---',
    'name: job-alpha',
    'description: "Scores offers. Use when: ranking."',
    'tools: [read, edit, search, shell]',
    'instructions: references/job-alpha.md',
    '---',
    '',
  ].join('\n'),
  'src/agents/job-beta.md': [
    '---',
    'name: job-beta',
    'description: "Reads offers in the browser."',
    'tools: [read, write, web, browser]',
    'instructions: references/job-beta.md',
    '---',
    '',
  ].join('\n'),
};

export function makeFixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'jobhunt-build-'));
  for (const [path, content] of Object.entries({ ...FILES, ...overrides })) {
    if (content === null) continue;
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}
