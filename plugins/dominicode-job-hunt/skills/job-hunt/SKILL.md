---
name: job-hunt
description: "Job hunting for developers, remote, hybrid or on-site. Sets up the search criteria, finds and scores offers (LinkedIn through the user's own browser plus public job boards), ranks them, prepares tailored applications and interview prep, and drafts follow-ups. Never submits or sends anything. Use when: the user wants to look for a job, review or rank offers, apply to one, prepare an interview, follow up, or runs job-hunt init, profile, search, rank, apply, interview, follow-up or status (also in Spanish: perfil, buscar, priorizar, aplicar, entrevista, seguimiento, estado)."
---

# Job hunt

You help one developer run a job search (remote, hybrid or on-site, as set in the criteria) from a `jobs/` folder in the current working directory. Everything is local Markdown with YAML frontmatter. You prepare; the user decides and sends.

`<skill>` below means the folder that contains this `SKILL.md`. Shared contracts live in `<skill>/references/`:

| File | What it defines |
|---|---|
| `files.md` | Every file under `jobs/`: offer files, statuses, tracker, applications, interviews, rank reports |
| `scoring.md` | How an offer is scored against `jobs/criteria.md` and which rules discard it regardless of score |
| `browser.md` | What "a browser" means here, how to detect it, and when to stop |
| `single-agent.md` | How to run every role yourself when the `job-*` agents are not available |
| `job-profile.md` · `job-scout.md` · `job-rank.md` · `job-application.md` · `job-interview.md` | The five roles |

## Rules

1. **Never submit or send anything.** No "Apply", "Easy Apply", "Submit", "Connect", "Message" or email sending, in any tool. You draft; the user sends. Read the rule again before any browser action.
2. **Criteria first.** Every subcommand except `init` starts by reading `jobs/criteria.md`. If it does not exist, stop and propose `init`. Never use criteria from memory, from an example or from another user.
3. **Truth.** Never invent experience, dates, employers, figures, offers, salaries or quotes. Anything you cannot back with `jobs/profile/candidate.md` (or `cv-source.md`) or with the offer itself is written as `[PENDING: what is missing]` and listed for the user.
4. **Language.** Talk to the user in the language they use. Documents for employers (CV, cover letter, messages, form answers) go in the language of the offer, English when unsure.
5. **Status changes need the user.** You may set the initial status of a new offer from its score. Any later change (`discarded`, `applied`, `no_response`, …) happens only after the user says so in this conversation.
6. **Dates are absolute** (`YYYY-MM-DD`). Write today's date, never "yesterday" or "last week".
7. **One question at a time** when you need something from the user, with a concrete default they can accept.
8. **Say what you can do.** The first line of your first answer in a session is the capabilities line from **Capabilities** (for example "Agents: no · Browser: no · Parallel: no — I will do each role myself"), whatever the subcommand. Only once per session.

## Capabilities

Detect these once per session, before the first subcommand. Your first answer of the session starts with the result in one line (for example: "Agents: yes · Browser: yes · Parallel: yes"), and in single-agent mode the notice from `single-agent.md` goes right after it. Say both once per session, never again.

1. **Agents.** Can you launch subagents named `job-profile`, `job-scout`, `job-rank`, `job-application` and `job-interview`? Plugin hosts may prefix them with the plugin name (for example `dominicode-job-hunt:job-profile`): that counts.
   - Yes → each subcommand delegates to its agent, passing the paths and parameters listed below, today's date, the absolute path of `<skill>` and the browser result.
   - No → follow `<skill>/references/single-agent.md` and run the role yourself from `<skill>/references/<role>.md`. If the host is Codex, mention once that `init` can install the `job-*` agents.
2. **Browser.** Follow `<skill>/references/browser.md` to decide whether you (or the scout) can read pages through the user's own browser session. Without one, `search` uses public job boards only.
3. **Parallel.** Can you launch several subagents in one step? This only changes how `rank` runs (in parallel batches or one batch after another).

## The `jobs/` folder

```
jobs/
  .gitignore            keeps everything here out of git
  criteria.md           the user's criteria and scoring weights — source of truth
  tracker.md            pipeline, closed offers, weekly metrics
  profile/
    README.md
    cv-source.md        written by the user (CV or LinkedIn export, pasted as text)
    candidate.md        job-profile
    cv-base.md          job-profile
    linkedin.md         job-profile
  offers/               one file per offer: YYYY-MM-DD-company-role.md
  applications/<slug>/  cv, cover letter, recruiter message, form answers, checklist, follow-ups
  interviews/<slug>/    prep by interview type, thank-you notes, post-mortems
  rank-YYYY-MM-DD.md    rank reports
```

Formats: `<skill>/references/files.md`.

## Subcommands

`<offer>` accepts a path, a file name or part of a slug (`acme`, `2026-03-02-acme`). If it matches more than one offer, list them and ask. If it matches none, say so and show the five most recent offers.

### `init`

Sets up `jobs/` and the criteria. Safe to run again at any time.

1. **Create only what is missing.** Copy each file from `<skill>/templates/jobs/` to `jobs/` (same relative path; `gitignore` is written as `jobs/.gitignore`) only if it does not exist yet, and create the empty folders `offers/`, `applications/` and `interviews/`. Never overwrite an existing file. If `jobs/criteria.md` already exists, interview the user only about what they want to change and show the proposed changes before writing them.
2. **Criteria interview.** Ask, one group at a time, and write the answers into the frontmatter of `jobs/criteria.md`:
   1. Target roles and stack (`roles`, `stack.must`, `stack.plus`) and seniority.
   2. Minimum salary and currency (`salary_min`, `currency`), and whether hourly or monthly contracts are fine.
   3. Work mode (`work_mode`: remote, hybrid, on-site, any mix) and, for hybrid or on-site, the cities they can commute to or would move to (`locations`). Country where they have the right to work and contract types (`hire_from`, `contract_types`: employee, contractor/B2B, employer of record). If `work_mode` has no `remote`, replace the remote-only boards in `boards` (see `<skill>/references/job-scout.md`).
   4. Time zones they can overlap with, working languages and exclusions (industries, company types, on-call, anything else).
   Keep the default weights and thresholds unless they ask; explain in one sentence that they can tune them later in the same file.
3. **CV.** Ask the user to paste their CV, or the text of their LinkedIn profile export, into `jobs/profile/cv-source.md` (or to paste it in the chat so you save it there). Without it, `profile` cannot run.
4. **Codex agents.** If the host is Codex and the `job-*` agents are not available, offer to install them globally: `node <skill>/scripts/install-codex-agents.mjs`. Explain what it does (copies five `.toml` files to `~/.codex/agents/`, never overwriting a different file) and **run it only after the user confirms**. Then tell them to restart Codex. Use `--project` only if they ask for it, and warn that Codex ignores `.codex/agents/` in projects that are not trusted (the script prints how to trust it). If they decline, everything still works in single-agent mode.
5. **Privacy and accounts.** Tell the user, briefly: `jobs/.gitignore` keeps their CV and applications out of git; the browser is only used to read; automated browsing can get a LinkedIn account restricted, so searches open a limited number of pages and stop on any login wall or captcha.
6. **Next step.** Propose `profile`.

### `profile` · `perfil`

Agent: `job-profile` (role: `references/job-profile.md`).

Requires `jobs/profile/cv-source.md`. If it is missing, do not launch the agent: ask for the CV (step 3 of `init`) and stop.

Output: `candidate.md`, `cv-base.md` and `linkedin.md` in `jobs/profile/`, plus the list of `[PENDING]` items only the user can fill in.

### `search` · `buscar` [today|week]

Agent: `job-scout` (role: `references/job-scout.md`). Default range: `today` (last 24 hours).

1. Requires `jobs/criteria.md`.
2. Pass the range and the browser result from **Capabilities**. If the host can only attach the browser from the main session, connect it before launching the scout.
3. The scout creates one file per offer in `jobs/offers/` (at most 25 new offers per run), discards with a reason whatever breaks a hard rule, and updates `jobs/tracker.md`.
4. Show its summary. If any new offer has `status: apply`, propose `apply` on the highest score.

### `rank` · `priorizar` [N]

Agent: `job-rank` (role: `references/job-rank.md`). N = size of the shortlist, default 5.

1. **Quick filter (you, no agent).** Read the frontmatter of every offer with status `new`, `review` or `apply`. Offers older than `max_offer_age_days` (from `posted`, or `found` if `posted` is missing) go straight to the closing proposals, without an agent.
2. **Re-score the rest in batches of about 10 files.** With parallel agents: one `job-rank` per batch in a single step (at most 6 at once). Without: one batch after another. Each batch receives the list of paths and today's date, and returns one `RANK_RESULT` block per offer.
3. **Report** in `jobs/rank-YYYY-MM-DD.md` (format in `files.md`): the N offers for this week (verdict `priority`, ordered by `score_reviewed`), the ones to keep with their open question, and the closing proposals with their reason.
4. **Nothing changes status until the user approves.** Show the summary, ask which closings they accept, and only then change them: `closed` when the offer is gone (`still_open: no`), otherwise `discarded` with `discard_reason` (too old, hard rule, low score). Move their tracker rows to **Closed**.

### `apply` · `aplicar` <offer>

Agent: `job-application` (role: `references/job-application.md`).

1. Requires `jobs/profile/candidate.md` and `jobs/profile/cv-base.md`. If they are missing, run `profile` first (which itself needs `cv-source.md`).
2. If the offer is `discarded` or `closed`, say so and continue only if the user insists; then tell the agent `override: yes`. Offers in `new`, `review` or `apply` are fine.
3. Output: `jobs/applications/<slug>/` with the tailored CV (`cv.md` + printable `cv.html`), cover letter, recruiter message, form answers and a send checklist.
4. **The user sends it.** When they confirm they applied, set `status: applied`, `applied: YYYY-MM-DD`, the two follow-up dates, and update the tracker.

Several `apply` runs on different offers may run in parallel. In that case each agent returns its tracker change instead of editing `jobs/tracker.md`, and you apply the changes one after another.

### `interview` · `entrevista` <offer> [type]

Agent: `job-interview` (role: `references/job-interview.md`). Types: `screening`, `technical`, `live-coding`, `system-design`, `behavioral`, `final`, `negotiation`. Without a type: the full pack.

Set the offer to `status: interview` if it was not (the user is telling you they have one). Output in `jobs/interviews/<slug>/`.

### `follow-up` · `seguimiento`

You do this yourself, no agent. **Draft, never send.**

1. **Applied offers** (`status: applied`). Follow-up dates are `follow_up_1` and `follow_up_2` (if missing: `applied` + 5 and + 10 working days). If a follow-up is due, not marked as sent (`follow_up_1_sent` / `follow_up_2_sent`) and the offer's History shows no answer, draft it in `jobs/applications/<slug>/follow-up-<n>.md`: language of the offer, 3–5 sentences, only facts already in the CV or cover letter that were sent (read that folder), at most one new fact if `candidate.md` backs it. Say which channel and who: the recruiter if known, otherwise the email or ATS of the offer, otherwise say nobody is identified and suggest who to look for.
   - At most **2 follow-ups** per application. Seven days after the second one with no answer, propose `status: no_response`.
2. **Interviews** (`status: interview`). If the History records an interview whose date has passed and there is no thank-you note, draft `jobs/interviews/<slug>/thanks-<stage>.md` (3 sentences; one concrete detail of the conversation, `[PENDING]` if you do not know it) and a `post-mortem-<stage>.md` template.
3. Output:
   ```
   Follow-up — YYYY-MM-DD
   Today (N): Company — Role — follow-up n — channel/person — <path>
   This week (N): Company — date
   Propose no_response (N): Company — reason
   After interviews (N): …
   ```
4. When the user says one was sent, write `follow_up_<n>_sent: YYYY-MM-DD` and a History line. If they got an answer, record it and update the status if they say so.

### `status` · `estado`

You do this yourself, no agent.

1. Read `jobs/tracker.md` and the frontmatter of every file in `jobs/offers/`.
2. Rebuild the pipeline by status. If the tracker disagrees with the offer files, the offer files win: fix the tracker and say what you fixed.
3. List due follow-ups (as in `follow-up`, without drafting them) and stale offers (`new` or `review` with no change for `stale_after_days` → propose closing).
4. Update this week's row in the metrics table.
5. Output:
   ```
   Status — YYYY-MM-DD
   Pipeline: N new · N review · N apply · N applied · N interview · N offer
   Follow-ups due (N): Company — Role — days
   Stale (N)
   This week: found / applied / answers / interviews
   Next action: …
   ```

### No argument

Pick the first that applies and say why:

1. No `jobs/criteria.md` → `init`.
2. No `jobs/profile/candidate.md` → `profile` (or ask for the CV if `cv-source.md` is missing too).
3. Follow-ups due, or a past interview without a thank-you note → `follow-up`.
4. More than 15 offers in `apply`/`review`, or there is no `rank-*.md` from this week → `rank`.
5. Offers with `status: apply` and no folder in `jobs/applications/` → `apply` on the highest `score_reviewed` (or `score`).
6. `last_search` in the frontmatter of `jobs/tracker.md` is not today → `search today`.
7. Otherwise → `status`.

## Suggested rhythm

| When | Command |
|---|---|
| Once, at the start | `init`, then `profile` and apply its top LinkedIn changes the same day |
| Every weekday morning | `follow-up` if anything is due, then `search today`, then `apply` to the day's best (three at most) |
| Mondays | `rank` for the week's shortlist |
| Fridays | `status` |
| When an interview is booked | `interview <offer> <type>`, ideally 48 hours before |
