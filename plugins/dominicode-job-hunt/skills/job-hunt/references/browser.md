# The browser

Some steps (LinkedIn search, reading an offer that needs a session, checking whether an offer is still open) need **a browser the user is logged into**. This package never asks for passwords and never logs in for the user: it reads pages through the user's own browser session.

## What counts as a browser

Any tool available to you that can **open a URL in the user's browser and return the page text** (or let you read it): a browser extension connected to the agent, a browser plugin of the host, or a browser MCP server. You do not need a specific product. If several are connected, use the one the user has LinkedIn open in, and ask if you cannot tell.

A plain HTTP fetch tool is **not** a browser for this purpose: it has no session. It is fine for public pages and for job board APIs.

## Detecting it

1. Look at the tools you have. If none can open a page in the user's browser, the answer is **no browser**: say it once and continue with job boards only.
2. If one exists, open `https://www.linkedin.com/feed/` and check that the page shows a logged-in user (a feed, a profile picture, a "Me" menu). Do not read or store anything from the feed.
3. If the host needs the user to approve the connection or pick a browser window, ask for that once and wait.

## When to stop

Stop using the browser for LinkedIn, tell the user what you saw, and **continue with the job boards** when any of these appears:

- a login wall: "Sign in", "Join now", "Log in to see more", a login form;
- a captcha, a "verify you are human" or security check page;
- a message about unusual activity or a restricted account;
- pages that stop loading or return an error twice in a row.

Never type credentials, never solve or bypass a captcha, never retry in a loop.

## Limits (to protect the user's account)

- Read-only. Never click Apply, Easy Apply, Save, Follow, Connect, Message, or anything that changes the account or contacts someone. The only things you may do besides reading: expand a description ("Show more") and type search keywords into the jobs search box.
- Never open a person's profile (recruiter, interviewer): LinkedIn tells them who viewed it.
- At most **25 offer pages** per `search` run and **10** per `rank` batch. Prefer reading the search results list over opening every offer.
- Do not scroll endlessly: read the first pages of results that match the range (`today` or `week`).
- One tab for the task; close it at the end.

## Job boards without a browser

Public job board APIs and pages are read with a normal fetch tool, no session needed. Which boards and how to query them: `job-scout.md`. If a board fails, say which one and move on; never fill the gap with invented offers.
