// Structure of the real content in src/ (not fixtures).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const SKILL_DIR = 'src/skill';
const read = (path) => readFileSync(path, 'utf8');
const skill = () => read(join(SKILL_DIR, 'SKILL.md'));
const frontmatter = (raw) => parseYaml(raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Text of the `## <heading>` section (until the next `## `). */
function section(markdown, heading) {
  const start = markdown.search(new RegExp(`^## ${heading}\\b`, 'm'));
  assert.ok(start >= 0, `missing section "## ${heading}"`);
  const rest = markdown.slice(start + 3);
  const end = rest.search(/^## /m);
  return end === -1 ? rest : rest.slice(0, end);
}

// ── TASK-50 — orchestrator, single-agent mode, browser, scoring ──────────────

test('SKILL.md is the job-hunt skill and is no longer the placeholder', () => {
  const raw = skill();
  assert.equal(frontmatter(raw).name, 'job-hunt');
  assert.doesNotMatch(raw, /work in progress/i);
});

const SUBCOMMANDS = [
  ['init'],
  ['profile', 'perfil'],
  ['search', 'buscar'],
  ['rank', 'priorizar'],
  ['apply', 'aplicar'],
  ['interview', 'entrevista'],
  ['follow-up', 'seguimiento'],
  ['status', 'estado'],
];

test('SKILL.md documents every subcommand with its Spanish alias', () => {
  const raw = skill();
  for (const names of SUBCOMMANDS) {
    const heading = names.map((n) => `\`${n}\``).join(' · ');
    assert.match(raw, new RegExp(`^### ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'), `subcommand ${names[0]}`);
  }
  assert.match(raw, /^### No argument/m);
});

test('shared references exist', () => {
  for (const name of ['single-agent.md', 'browser.md', 'scoring.md']) {
    assert.ok(existsSync(join(SKILL_DIR, 'references', name)), name);
  }
});

test('the skill detects capabilities before running a subcommand', () => {
  const caps = section(skill(), 'Capabilities');
  assert.match(caps, /job-\*/);
  assert.match(caps, /single-agent\.md/);
  assert.match(caps, /browser\.md/);
  assert.match(caps, /parallel/i);
});

test('hard rules: never send, criteria first, stop on login or captcha', () => {
  const rules = section(skill(), 'Rules');
  assert.match(rules, /never (submit|send)/i);
  assert.match(rules, /criteria\.md/);
  assert.match(rules, /`init`/);
  const browser = read(join(SKILL_DIR, 'references', 'browser.md'));
  assert.match(browser, /captcha/i);
  assert.match(browser, /log ?in/i);
  assert.match(browser, /boards?/i);
});

test('no content names a host-specific tool', () => {
  for (const file of walk(SKILL_DIR)) {
    assert.doesNotMatch(read(file), /mcp__/, file);
  }
  for (const file of existsSync('src/agents') ? walk('src/agents') : []) {
    assert.doesNotMatch(read(file), /mcp__/, file);
  }
});

test('every agent points to an existing role file in references/', () => {
  for (const file of (existsSync('src/agents') ? walk('src/agents') : []).filter((f) => f.endsWith('.md'))) {
    const meta = frontmatter(read(file));
    assert.ok(meta.instructions, `${file} has no instructions`);
    assert.ok(existsSync(join(SKILL_DIR, meta.instructions)), `${file} → ${meta.instructions}`);
  }
});

// ── TASK-52 — init templates ─────────────────────────────────────────────────

const TEMPLATES = join(SKILL_DIR, 'templates', 'jobs');

test('init templates exist', () => {
  for (const path of ['criteria.md', 'tracker.md', 'profile/README.md', 'gitignore']) {
    assert.ok(existsSync(join(TEMPLATES, path)), path);
  }
});

test('criteria template has every field the agents read', () => {
  const meta = frontmatter(read(join(TEMPLATES, 'criteria.md')));
  for (const key of [
    'roles',
    'stack',
    'seniority',
    'salary_min',
    'currency',
    'work_mode',
    'hire_from',
    'contract_types',
    'timezones',
    'languages',
    'exclusions',
    'max_offer_age_days',
    'thresholds',
    'weights',
  ]) {
    assert.ok(key in meta, `criteria.md frontmatter is missing "${key}"`);
  }
  const body = read(join(TEMPLATES, 'criteria.md'));
  assert.match(body, /## Statuses/);
});

test('the jobs/.gitignore template keeps personal data out of git', () => {
  const ignore = read(join(TEMPLATES, 'gitignore'));
  assert.match(ignore, /^\*$/m);
});

test('init never overwrites, writes gitignore as jobs/.gitignore and installs Codex agents only with confirmation', () => {
  const init = section(skill(), 'Subcommands').split(/^### /m).find((s) => s.startsWith('`init`'));
  assert.ok(init, 'init subsection');
  assert.match(init, /never overwrite/i);
  assert.match(init, /install-codex-agents\.mjs/);
  assert.match(init, /confirm/i);
  assert.match(init, /--project/);
  assert.ok(init.includes('`gitignore` is written as `jobs/.gitignore`'));
});

// ── TASK-54 — the five roles: criteria come from jobs/criteria.md, never from the role ──

const ROLES = ['job-profile', 'job-scout', 'job-rank', 'job-application', 'job-interview'];
const roleFile = (role) => join(SKILL_DIR, 'references', `${role}.md`);

/** Drops `Example (fictional candidate)` sections: from that heading to the next heading of the same or higher level. */
function withoutExamples(markdown) {
  const out = [];
  let skipLevel = 0;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,6}) /);
    if (heading && skipLevel && heading[1].length <= skipLevel) skipLevel = 0;
    if (heading && /Example \(fictional candidate\)/.test(line)) {
      skipLevel = heading[1].length;
      continue;
    }
    if (!skipLevel) out.push(line);
  }
  return out.join('\n');
}

test('withoutExamples drops only the example sections', () => {
  const md = ['# Role', 'keep 1', '## Example (fictional candidate)', 'USD 90k', '### deeper', 'React', '## Next', 'keep 2'].join('\n');
  assert.equal(withoutExamples(md), ['# Role', 'keep 1', '## Next', 'keep 2'].join('\n'));
});

test('the five agents exist and point to their role file', () => {
  for (const role of ROLES) {
    const file = join('src/agents', `${role}.md`);
    assert.ok(existsSync(file), file);
    const meta = frontmatter(read(file));
    assert.equal(meta.name, role);
    assert.equal(meta.instructions, `references/${role}.md`);
    assert.ok(existsSync(roleFile(role)), roleFile(role));
  }
});

const HARDCODED = [
  ['salary figure', /\b(?:USD|EUR|GBP|US\$)\s?\d|[$€£]\s?\d|\b\d{2,3}\s?k\b|\b\d{2,3},000\b/i],
  ['framework', /\b(?:Angular|React|Vue|Svelte|Next\.js|RxJS|Nx)\b/],
  ['country or zone', /\b(?:Spain|España|Europe|EMEA|LATAM|CET|United States|Canada|India)\b/],
  ['LinkedIn geoId', /geoId=/],
];

test('no role hardcodes criteria outside the fictional examples', () => {
  for (const role of ROLES) {
    const raw = read(roleFile(role));
    assert.match(raw, /jobs\/criteria\.md/, `${role} must read jobs/criteria.md`);
    const text = withoutExamples(raw);
    for (const [what, pattern] of HARDCODED) {
      const hit = text.match(pattern);
      assert.equal(hit, null, `${role}: hardcoded ${what} "${hit?.[0]}"`);
    }
  }
});

test('roles that touch employers or pages never send or submit', () => {
  for (const role of ['job-scout', 'job-rank', 'job-application', 'job-interview']) {
    assert.match(read(roleFile(role)), /never (?:submit|send|apply)/i, role);
  }
});

test('roles mark missing facts as [PENDING] instead of inventing them', () => {
  for (const role of ['job-profile', 'job-application', 'job-interview']) {
    assert.match(read(roleFile(role)), /\[PENDING/, role);
  }
});

// ── Review (TASK-80) — one contract: statuses and offer fields come from files.md ──

const FILES_MD = () => read(join(SKILL_DIR, 'references', 'files.md'));
const CONTRACT_TEXTS = () => [
  ['SKILL.md', skill()],
  ...ROLES.map((r) => [r, read(roleFile(r))]),
  ['scoring.md', read(join(SKILL_DIR, 'references', 'scoring.md'))],
];

const STATUSES = ['new', 'review', 'apply', 'discarded', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'closed', 'no_response'];

test('every status set anywhere is a status of files.md', () => {
  const block = section(FILES_MD(), 'Statuses').match(/```\n([\s\S]*?)```/)[1];
  for (const s of STATUSES) assert.match(block, new RegExp(`\\b${s}\\b`), `files.md lacks status ${s}`);
  const known = new Set(STATUSES);
  for (const [name, text] of CONTRACT_TEXTS()) {
    for (const [, value] of text.matchAll(/status: `?([a-z_]+)`?/g)) {
      assert.ok(known.has(value), `${name} uses unknown status "${value}"`);
    }
  }
});

test('every offer field a role writes in a yaml block exists in the files.md offer template', () => {
  const template = FILES_MD().match(/## Offer file[\s\S]*?```markdown\n---\n([\s\S]*?)\n---/)[1];
  const fields = new Set([...template.matchAll(/^([a-z_0-9]+):/gm)].map((m) => m[1]));
  for (const role of ROLES) {
    for (const [, yaml] of read(roleFile(role)).matchAll(/```yaml\n([\s\S]*?)```/g)) {
      for (const [, key] of yaml.matchAll(/^\s*([a-z_0-9]+):/gm)) {
        assert.ok(fields.has(key), `${role} writes "${key}", missing from files.md`);
      }
    }
  }
});

test('roles reach shared references through <skill>/ and list <skill> as an input', () => {
  for (const role of ROLES) {
    const raw = read(roleFile(role));
    assert.doesNotMatch(raw, /(?<![\w/>])(?:references\/)?(?:files|scoring|browser|single-agent)\.md/, `${role}: bare reference path`);
    assert.match(section(raw, 'Inputs'), /`<skill>`/, `${role}: <skill> in Inputs`);
  }
});

test('stale offers and offer age use the criteria, not numbers in the skill', () => {
  assert.doesNotMatch(skill(), /older than \d+ days/);
  const meta = frontmatter(read(join(TEMPLATES, 'criteria.md')));
  assert.equal(typeof meta.stale_after_days, 'number');
  assert.match(read(join(SKILL_DIR, 'references', 'scoring.md')), /`found` if `posted`/);
});
