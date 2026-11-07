# Single-agent mode

Use this when the host has no `job-*` subagents (they are not installed, or the tool does not support custom agents). Every subcommand still works: you play each role yourself.

## How

1. Tell the user once per session: "The job-hunt agents are not available here, so I will do each role myself." In Codex, add that `init` can install them.
2. For a subcommand that names an agent, read `<skill>/references/<role>.md` **in full** and follow it as if you were that agent: same inputs, same output files, same summary at the end. The role file is the same text the agent would receive, so the results must not differ.
3. Keep the role's limits (pages per run, number of offers, never send).
4. When the role ends, go back to the subcommand in `SKILL.md` for what happens next (for example, the approval step in `rank`).

## Long runs

Roles that go through many files (`job-rank`, `job-scout`) can fill your context. To avoid it:

- Work in the same batches the subcommand defines (about 10 offers for `rank`).
- Write each offer's result to its file before reading the next one; do not keep page text after you have written the file.
- After each batch, keep only the short `RANK_RESULT` blocks (or the scout's one-line summaries) and drop the rest.
- If the user stops you halfway, everything written so far is valid: the next run continues from the files.
