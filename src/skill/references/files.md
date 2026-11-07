# Files under `jobs/`

The contract every role reads and writes. Keep field names exactly as written here: other roles and the `status` subcommand parse them.

## Statuses

```
new → review | apply | discarded
review → apply | discarded
apply → applied | discarded
applied → interview → offer → accepted
applied | interview | offer → rejected
applied → no_response      (two follow-ups sent, 7 days after the second, no answer; reopened if they answer)
any open → interview        (the user says they have an interview)
any open → closed           (the offer disappeared, or the user stopped the process)
```

"Open" = `new`, `review`, `apply`, `applied`, `interview`, `offer`. The scout sets the first status; every later change needs the user's OK in the conversation.

- `new`: found, not scored yet (rare: the scout scores on creation).
- `review`: valid but the score is in the middle band, or something must be checked by the user.
- `apply`: high score, no hard rule broken.
- `discarded`: breaks a hard rule, low score, or the user said no. Always with `discard_reason`.

## Offer file — `jobs/offers/YYYY-MM-DD-company-role.md`

Slug: date found + company + role, lowercase, ASCII, hyphens, at most 80 characters.

```markdown
---
company: Acme Analytics
role: Senior Frontend Engineer
url: https://…                     # the page you actually read
source: linkedin | remoteok | <board> | user
found: YYYY-MM-DD
posted: YYYY-MM-DD                 # if the page says it; omit if unknown
applicants: 120                    # LinkedIn only, if shown
location: "Remote — Europe"        # as written in the offer (city for hybrid or on-site)
work_mode: remote | hybrid | onsite
remote_scope: worldwide | region | country | ambiguous | restricted   # remote offers only
hire_from_ok: yes | no | unclear   # can the user be hired from criteria.hire_from?
contract: employee | contractor | eor | unclear
salary_text: "EUR 70,000–85,000"   # as written, or "not published"
salary_yearly: 82000               # normalised to criteria.currency, yearly (see scoring.md)
salary_source: published | estimated
stack: [TypeScript, React, Playwright]
seniority: senior
timezone: "overlap 4 h with UTC-5" # if stated
recruiter: "Name · title"          # only if shown in the offer; never guessed
score: 82
score_breakdown: {salary: 30, location: 25, stack: 17, seniority: 10, company: 0}
status: apply
discard_reason: ""                 # required when status is discarded
# added later by other roles:
score_reviewed: 80
still_open: yes | no | unverifiable
verified: YYYY-MM-DD
application_ready: YYYY-MM-DD
applied: YYYY-MM-DD
follow_up_1: YYYY-MM-DD
follow_up_2: YYYY-MM-DD
follow_up_1_sent: YYYY-MM-DD
follow_up_2_sent: YYYY-MM-DD
---

## Summary
Three to five lines: what the team builds, what the role owns, why it fits or not.

## Evidence
- Work mode and place: "<quote from the offer>"
- Salary: "<quote>" or how it was estimated
- Stack: "<quote>"

## Doubts
What the user must check before applying (time zone, exclusivity, portfolio, language…).

## History
- YYYY-MM-DD — found by search (score 82)
```

Quotes in **Evidence** are copied from the page you read, not paraphrased. If you could not read the page, do not create the file.

## Tracker — `jobs/tracker.md`

Three tables, newest first inside each. The offer files are the source of truth: when they disagree, fix the tracker.

- **Pipeline** — offers in `new`, `review`, `apply`, `applied`, `interview`, `offer`: `Found | Company | Role | Salary | Mode | Score | Status | Next step | File`.
- **Closed** — `discarded`, `rejected`, `accepted`, `closed`, `no_response`: same columns, `Next step` replaced by the reason.
- **Weekly metrics** — `Week (Monday) | Found | Applied | Answers | Interviews`.

## Application — `jobs/applications/<offer-slug>/`

| File | Content |
|---|---|
| `cv.md` | CV tailored to this offer (source of `cv.html`) |
| `cv.html` | Printable one-page CV, generated with `<skill>/scripts/export-cv.mjs` (when available) |
| `cover-letter.md` | Short cover letter |
| `recruiter-message.md` | Message for the recruiter or hiring manager (connection note + follow-up message) |
| `form-answers.md` | Answers for the application form questions |
| `checklist.md` | What to check and in which order before sending, with the exact link to apply |
| `follow-up-<n>.md` | Drafted by `follow-up` |

## Interview — `jobs/interviews/<offer-slug>/`

One file per type (`screening.md`, `technical.md`, `system-design.md`, …) or `full-pack.md`, plus `thanks-<stage>.md` and `post-mortem-<stage>.md`.

## Rank report — `jobs/rank-YYYY-MM-DD.md`

```markdown
---
date: YYYY-MM-DD
status: draft
---

## This week (N)
1. Company — Role — score_reviewed — why it fits — weak spot — next step

## Keep
| Company | Role | Score | Open question |

## Proposed closings
| Company | Role | Reason (closed / stale / hard rule / low score) |
```
