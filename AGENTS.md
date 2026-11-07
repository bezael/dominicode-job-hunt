# AGENTS.md — dominicode-job-hunt (maintainer lane)

Instructions for any coding agent working **on this repository**. End users get their instructions from the build output in `plugins/dominicode-job-hunt/` (skill, agents, and a self-contained `plugins/dominicode-job-hunt/AGENTS.md` for other tools). This root file is not generated.

## What this repo is

A content package: one skill (`job-hunt`) and five agents (`job-profile`, `job-scout`, `job-rank`, `job-application`, `job-interview`) for remote job hunting, distributed for Codex, Claude Code and AGENTS.md-compatible tools. Specs: `specs/dominicode-job-hunt/` (spec → plan → tasks). Work task by task from `tasks.md`.

## Commands (real, verified)

| Purpose | Command |
|---|---|
| Install | `npm install` (Node ≥ 20) |
| All tests + outputs in sync | `npm test` (unit tests via `scripts/run-tests.mjs`, then `build --check`) |
| One test file | `node --test test/<name>.test.mjs` |
| Build outputs | `npm run build` — run it after any change in `src/` and commit `plugins/` with it |
| Verify outputs are in sync | `npm run check` |
| Leak scan | `node scripts/check-leaks.mjs [paths]` |

The build and the leak scan also read a private blocklist from `.leak-blocklist.local` (gitignored, one term per line) when it exists. CI runs only the public patterns. Never commit that file or copy its terms anywhere.

## Boundaries

- **Edit `src/` only.** Everything under `plugins/` (including `plugins/dominicode-job-hunt/AGENTS.md`) is build output: never edit it by hand.
- **No personal data.** Never copy anything from the private `companyAgents/jobs/` folder (real applications, companies, interviewers). Never put the maintainer's name, paths, browser profile names or salary inside instructions. Credits go only inside `<!-- credits -->` blocks or `author` fields.
- **Never send.** No instruction may make an agent submit an application, click "Apply" or message anyone. The browser is read-only.
- **No runtime dependencies.** Scripts that ship to users (everything in `src/skill/scripts/`, e.g. the Codex agent installer) use Node built-ins only. `devDependencies` are fine for build and tests.
- **Instructions in English.** The conversation follows the user's language; generated documents follow the language of the job offer.
- A task is done only when its `Verify` ran and its Evidence is recorded in `tasks.md`.

<!-- credits -->
Maintained by Bezael Pérez · Dominicode.
<!-- /credits -->
