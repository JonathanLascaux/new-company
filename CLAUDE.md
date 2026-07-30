# La Palme de St Pete — notes for Claude Code

One-shot voting app for FiveForty°'s demo week in St Petersburg, Florida.
Six colleagues — Hervé, Sébastien, Saïd, Lionel, Maïté, Julien — each present an
app they built. The team votes from their phones (`node server.js`, port 4540).

**Context of the week:** the goal is to identify FiveForty°'s **next business
unit** — something with real growth potential. That context matters when judging.

## Two editions

- **`web/`** — the serverless edition (the one actually used): static `vote.html` +
  `results.html` served from this repo via raw.githack, votes carried by the
  public ntfy.sh pub/sub. Event topic: **`ffy-palme-stpete-2607-jx4q`**
  (override with `?t=<topic>` on both pages — keep them in sync). Messages are
  JSON: `{t:'vote', voter, presenter, scores, comment, at}`,
  `{t:'retract', voter, presenter, at}` (drops that voter's vote for that presenter) and
  `{t:'verdict', winner, title, explanation, at}`. Latest message per
  (voter, presenter) wins; latest verdict message wins. ntfy caches ~12h, so
  archive votes before they age out (see verdict ritual).
- **`server.js` + `public/`** — the self-hosted edition (laptop on a LAN),
  kept as a fallback. Same design, votes in `votes.json`.

## Data files (runtime, gitignored)

- `votes.json` — array of `{ voter, presenter, scores: { app, vendable, show,
  creativite }, comment, at }`. Scores are 1–5. One entry per (voter, presenter);
  the server holds this in memory, so **never edit it while the server runs**.
- `verdict.json` — Claude's end-of-night verdict. The server re-reads it on every
  `/api/results` call, so it's **safe to write while the server runs**: the
  results page shows it within ~4 seconds.

## The verdict ritual (end of the evening)

When Jon asks for "le verdict", you are the jury. Do this:

1. Get the votes. Serverless edition: poll
   `https://ntfy.sh/ffy-palme-stpete-2607-jx4q/json?poll=1&since=all`, keep the
   latest `t:'vote'` message per (voter key, presenter), and archive the result
   to `votes.json` (commit it — force-add past the gitignore — so the night's
   data outlives ntfy's 12h cache). Self-hosted edition: read `votes.json`.
2. Compute per-presenter averages for each criterion, plus a **weighted score**
   reflecting the week's goal: `vendable` (business potential) counts **double**
   — `(app + 2*vendable + show + creativite) / 5`. Tie-break on `creativite`
   average, then `show`.
3. Pick the winner, but judge like a human, not a spreadsheet: read the
   comments, notice standout criteria (a 5.0 in anything deserves a mention),
   and weave real quotes from the comments into your reasoning.
4. Publish the verdict. Serverless edition: POST the verdict JSON (shape below,
   plus `"t": "verdict"`) as the raw body to
   `https://ntfy.sh/ffy-palme-stpete-2607-jx4q` — the results page shows the
   golden card within one refresh (~8 s). Self-hosted edition: write it to
   `verdict.json`:

```json
{
  "winner": "<presenter id: herve|sebastien|said|lionel|maite|julien>",
  "title": "one punchy French line, e.g. « La future business unit est née ! »",
  "explanation": "3–6 sentences in French, fun but substantive: why this app wins given the business-unit goal, what the scores say, quote a comment or two. Also give an honorable mention to the runner-up.",
  "at": "<ISO timestamp>"
}
```

5. Tell Jon the verdict out loud too (the app displays it automatically on
   `/results` — golden card at the top).

Tone: French, festive, sunshine-city energy 🌴 — but the reasoning must be real:
cite the actual numbers and comments, and explain the business-unit angle.

## Stack rules (if you touch the code)

Zero dependencies, pure Node.js (`node:http`), no build step, no npm install.
Two static pages in `public/`, everything inlined. Keep it that way — this is a
one-shot party app, not a product.
