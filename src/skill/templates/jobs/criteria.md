---
# Search criteria — the source of truth for every job-hunt agent.
# `init` fills this in with you. Edit it any time; agents read it on every run.
updated: null              # YYYY-MM-DD

roles: []                  # e.g. ["Senior Frontend Engineer", "Full-stack Engineer (frontend-heavy)"]
stack:
  must: []                 # every offer needs these, e.g. [TypeScript]
  plus: []                 # nice to have, e.g. [React, Angular, Playwright]
seniority: []              # accepted levels, e.g. [senior, staff, lead]

salary_min: null           # yearly, in `currency`, e.g. 60000
currency: USD
exchange_rates: {}         # 1 unit of each currency in `currency`, e.g. {EUR: 1.17, GBP: 1.35}
hours_per_year: 1800       # to turn hourly rates into a yearly figure

work_mode: [remote]        # any of: remote, hybrid, onsite — offers in other modes are discarded
locations: []              # for hybrid/onsite: cities you can commute to or would move to, e.g. ["Madrid", "Barcelona"]
hire_from: null            # country where you have the right to work, e.g. "Spain"
contract_types: [employee, contractor, eor]   # eor = employer of record (Deel, Remote.com…)
timezones: []              # time zones you can overlap with, e.g. ["UTC-5", "UTC+0", "UTC+2"]
languages: [English]       # working languages

exclusions: []             # discarded on sight, e.g. ["agencies", "gambling", "on-call"]
max_offer_age_days: 30     # older offers break a hard rule (age from `posted`, or `found` if unknown)
stale_after_days: 14       # `new` or `review` offers untouched this long are proposed for closing by `status`

thresholds:
  apply: 75                # score ≥ apply → status apply
  review: 55               # review ≤ score < apply → status review; below → discarded
weights:                   # must add up to 100
  salary: 30
  location: 25
  stack: 25
  seniority: 10
  company: 10

boards: [remoteok, remotive, himalayas]   # public job boards searched besides LinkedIn; these three list remote jobs only (arbeitnow also lists on-site jobs, mostly in Germany)
---

# Search criteria

How each field is used: `references/scoring.md` in the job-hunt skill. The short version:

- **Hard rules** (discard whatever the score): work mode not in `work_mode` · hybrid or on-site away from `locations` · cannot be hired from `hire_from` · published salary below `salary_min` · seniority clearly below `seniority` · main stack outside the search · anything in `exclusions` · older than `max_offer_age_days`.
- **Score** (0–100) = the five `weights` blocks + preferences below. `thresholds` turn it into a status.

## Preferences

Free text. Each preference an offer clearly meets adds up to 5 points; each one it clearly breaks subtracts up to 5. Examples (delete them and write yours):

- Product companies over agencies and consultancies.
- Async teams, or overlap in my afternoon at most.
- Companies that use AI in their development workflow.

## Notes for the agents

Anything else they should know: exceptions you accept, offers you already rejected and why, situations to flag.

## Statuses

`new → review | apply | discarded` · `review → apply | discarded` · `apply → applied | discarded` · `applied → interview → offer → accepted` · `applied | interview | offer → rejected` · `applied → no_response` · any open → `interview` or `closed`

Agents may set the first status of a new offer from its score. Every later change needs your OK.
