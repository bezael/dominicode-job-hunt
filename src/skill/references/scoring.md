# Scoring an offer

Every number comes from `jobs/criteria.md`: weights, thresholds, salary floor, currency, exchange rates. Never use values from an example or from memory. If a field the score needs is empty, say which one and score that block as 0 with a note in **Doubts**.

## 1. Hard rules first

An offer that breaks any of these is `discarded`, **whatever its score**. The score orders valid offers; it never rescues an invalid one.

| Rule | Breaks when |
|---|---|
| Work mode | The offer is hybrid or on-site and `work_mode` is `remote` |
| Hiring location | `hire_from_ok: no` — remote restricted to countries the user cannot be hired from (for example "US only" with no contractors) |
| Salary | `salary_source: published` and `salary_yearly` < `salary_min`, with no sign of room to negotiate |
| Seniority | The role's seniority is not in `seniority` and is clearly below it (intern, junior for a senior search) |
| Role | The main stack is outside the search (for example backend-only or native mobile for a frontend search) — judge from title, description and stack together |
| Exclusions | It matches an item of `exclusions` |
| Age | The offer is older than `max_offer_age_days`, counted from `posted`, or from `found` if `posted` is unknown |

When a rule cannot be checked (the offer does not say), it is not broken: set `hire_from_ok: unclear` or similar and lower the matching block instead.

## 2. Normalise the salary

- Convert to **yearly** in `criteria.currency`: monthly × 12; hourly × `hours_per_year`; daily × (`hours_per_year` / 8).
- Convert currencies with `exchange_rates` from `criteria.md`. If a rate is missing, ask the user for it once per session, or score the salary block as estimated and say so.
- Ranges: use the middle of the range for the score and keep the text in `salary_text`.
- **Estimated** salaries (no range published): estimate from company size, country and seniority, write the basis in **Evidence** in one line, round to thousands, and set `salary_source: estimated`. Never present an estimate as published.

## 3. Blocks

Each block scores from 0 to its weight in `criteria.weights`. Sum the blocks; cap at 100.

| Block | Full weight | Partial | Zero |
|---|---|---|---|
| `salary` | Published ≥ `salary_min` | Estimated ≥ `salary_min`: 60 % | Estimated < `salary_min`; or not published and impossible to estimate |
| `remote` | Worldwide, or a region/country that includes `hire_from` | Overlapping region with contractors or EOR accepted: 60 % · Ambiguous: 20 % | Restricted |
| `stack` | Every `stack.must` present and at least half of `stack.plus` | Every `stack.must` present: 60 % · Some of them: 30 % | None of `stack.must` |
| `seniority` | In `seniority` | Undefined in the offer: 40 % · One level below: 60 % | — (below that is a hard rule) |
| `company` | Product company, recruiter identifiable, offer under 7 days old, under 100 applicants (all four) | Proportional to how many of the four hold | — |

Then apply `criteria.md` → **Preferences** (free text): each preference the offer clearly meets adds up to 5 points, each one it clearly breaks subtracts up to 5. Write the adjustment in `score_breakdown` as `preferences: +3` and say which preference in one word.

## 4. Status from the score

- `score ≥ thresholds.apply` → `apply`
- `thresholds.review ≤ score < thresholds.apply` → `review`
- `score < thresholds.review` → `discarded` with `discard_reason: low score (N)`
- Any hard rule broken → `discarded` with the rule as `discard_reason`, regardless of the above.
