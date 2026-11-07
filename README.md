# dominicode-job-hunt

**English** · [Español](README.es.md)

A remote job search run by your coding agent. You write down what you are looking for once; the agent finds offers, scores them against your criteria, prepares a tailored application for the ones worth it, gets you ready for interviews and reminds you to follow up.

Works in **Codex**, **Claude Code** and any tool that reads **`AGENTS.md`**. Free, MIT licensed.

> **It never sends anything.** No applications, no messages, no connection requests. It prepares; you decide and send.

## What you get

| Command | What it does |
|---|---|
| `init` | Creates `jobs/` and interviews you about your criteria: roles, stack, minimum salary, where you can be hired from, contract types, time zones, exclusions |
| `profile` | Turns your CV into a candidate profile, a one-page base CV and LinkedIn texts written for recruiters. Missing facts come back as `[PENDING]`, never invented |
| `search [today\|week]` | Finds remote offers on LinkedIn (read-only, through your own browser session, if your agent has one) and on public job boards (RemoteOK, Remotive, Himalayas). One file per offer with a score and the evidence behind it |
| `rank [N]` | Re-checks pending offers (still open? still a fit?) and gives you this week's shortlist. Nothing is closed without your OK |
| `apply <offer>` | Tailored CV (Markdown + printable HTML, DOCX if pandoc is installed), short cover letter, recruiter message, form answers and a send checklist |
| `interview <offer> [type]` | Company research, likely technical questions for the offer's stack, live coding, system design, STAR answers from your real stories, questions to ask, negotiation script |
| `follow-up` | Drafts follow-ups that are due and thank-you notes after interviews |
| `status` | Pipeline, due follow-ups, stale offers, weekly metrics |

Commands also work in Spanish: `perfil`, `buscar`, `priorizar`, `aplicar`, `entrevista`, `seguimiento`, `estado`.

## Install

You need Node 20 or later for the small scripts (CV export, Codex agent installer). Nothing else.

### Codex

```bash
codex plugin marketplace add bezael/dominicode-job-hunt
codex plugin add dominicode-job-hunt@dominicode-job-hunt
```

Then, in your job search folder, start Codex and run `$job-hunt init` (or just ask "set up my job search").

Codex plugins cannot ship custom agents yet, so `init` offers to install the five `job-*` agents into `~/.codex/agents/` (it asks first, never overwrites a file of yours, and you restart Codex afterwards). If you say no, everything still works: the main agent plays each role itself.

Without the plugin system, copy the folder `plugins/dominicode-job-hunt/skills/job-hunt` of this repository to `~/.codex/skills/job-hunt` (or to `.agents/skills/job-hunt` inside your job search folder).

### Claude Code

```
/plugin marketplace add bezael/dominicode-job-hunt
/plugin install dominicode-job-hunt@dominicode-job-hunt
```

Then run `/dominicode-job-hunt:job-hunt init`, or ask "set up my job search".

### Any tool that reads AGENTS.md

Copy [`plugins/dominicode-job-hunt/AGENTS.md`](plugins/dominicode-job-hunt/AGENTS.md) to the root of your job search folder (or append it to the `AGENTS.md` you already have). It contains the skill, the five roles and the templates in one file. For the CV export, clone this repository; the file explains where the script is.

### ChatGPT

The ChatGPT chat cannot load plugins or keep a `jobs/` folder, so the full package runs in **Codex** (included in ChatGPT plans, same account; see above). For a lighter version inside ChatGPT:

1. Create a **Project** (or a custom GPT) and upload [`plugins/dominicode-job-hunt/AGENTS.md`](plugins/dominicode-job-hunt/AGENTS.md) as a file.
2. Add this instruction: *"Follow the instructions in AGENTS.md. Files under `jobs/` do not exist here: I paste their content, and you give me back each file you would write so I can save it."*
3. Paste your criteria and your CV, then use `profile`, `apply` (paste the offer text) and `interview`.

What you lose: no LinkedIn search with your browser session, no tracker that persists between chats (you keep the files yourself), and no HTML/DOCX CV export (you get the Markdown CV).

## First run

1. `init` — answer the questions (5 minutes). Your criteria go to `jobs/criteria.md`; edit it any time.
2. Paste your CV (or the text of your LinkedIn PDF export) into `jobs/profile/cv-source.md`.
3. `profile` — then apply its top three LinkedIn changes the same day.
4. `search today` → `apply` to the best one or two.

A good weekly rhythm: `follow-up` and `search today` each morning, `rank` on Mondays, `status` on Fridays.

## Privacy

- Everything lives in a local `jobs/` folder in plain Markdown. A `jobs/.gitignore` keeps it out of git, even inside a repository.
- Your agent sends your CV and offers to its model provider while it works, as with anything else you do with it.
- The browser is used only to read. The package never asks for passwords and never logs in for you.

## About LinkedIn

Automated browsing can get a LinkedIn account restricted. The package keeps it small and read-only: at most 25 offer pages per search and 10 per rank batch, no clicks that change anything, and it stops at the first login wall or captcha and falls back to the public boards. Use it at your own risk; if you prefer, skip the browser entirely and use the boards only.

## Honest limits

- Scores are as good as your criteria. Read the evidence quotes in each offer file before applying.
- Estimated salaries are marked as estimated. Treat them as a guess.
- Job boards and LinkedIn change their pages often. When a source breaks, the agent says so instead of inventing offers.
- "Never sends anything" is a rule written into every instruction, and the agents that need no browser only get the tools they need. The agents that read pages with your browser (search and rank) get the browser tools your agent has, because each tool names them differently. If you have connected tools that can send email or messages, keep an eye on what they do, as with any agent.

## Contributing

Edit `src/` only and run `npm test`. Everything under `plugins/` is generated by `npm run build`. Rules for agents working on this repository: [`AGENTS.md`](AGENTS.md).

<!-- credits -->
---

Made by **Bezael Pérez · [Dominicode](https://dominicode.com)** — AI for developers, in Spanish. MIT licensed.
<!-- /credits -->
