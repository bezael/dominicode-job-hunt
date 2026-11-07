#!/usr/bin/env node
// Runs every test/*.test.mjs with `node --test`.
// Node 20 does not expand globs in `--test` arguments, and pointing it at the
// test/ directory would also execute fixture files, so the list is built here.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const files = readdirSync('test')
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => join('test', name));

if (files.length === 0) {
  console.error('No test/*.test.mjs files found.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
