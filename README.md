# 🌴 La Palme de St Pete 🦩

One-shot voting app for the FiveForty° demo week in **St Petersburg, Florida**
(Sunshine City ☀️): everyone on the Wi-Fi votes for the presentations of
**Hervé, Sébastien, Saïd, Lionel, Maïté & Julien** — avec une touche de 🥖.

**The stakes:** the week's goal is to find FiveForty°'s **next business unit**.
At the end of the night, Claude (from Claude Code) analyses the votes and
delivers **le verdict** — displayed right in the app.

## ⚡ Serverless edition (no laptop, no install — the one to use)

`web/vote.html` and `web/results.html` are fully static: votes travel through
the public [ntfy.sh](https://ntfy.sh) pub/sub (anonymous HTTPS, CORS-open), and
the pages aggregate everything client-side. **This repo must be public**, then
the pages are served straight from GitHub via raw.githack:

- Vote: `https://raw.githack.com/JonathanLascaux/new-company/claude/presentation-voting-app-478ctz/web/vote.html`
- Results: `https://raw.githack.com/JonathanLascaux/new-company/claude/presentation-voting-app-478ctz/web/results.html`

Share the vote link with the team (any network, any phone); put the results
link on the big screen. Fresh event: add `?t=some-new-topic` to **both** links.
Claude publishes the end-of-night verdict to the same ntfy topic (see
`CLAUDE.md`) and it appears live on the results page.

> ntfy.sh keeps messages ~12 h — plenty for the evening; Claude archives the
> votes to git at verdict time.

## Self-hosted edition (laptop on the same Wi-Fi)

You only need [Node.js](https://nodejs.org) (any recent version — no `npm install`, no dependencies).

```bash
node server.js
```

The terminal prints your Wi-Fi address, e.g.:

```
Partage cette adresse sur le Wi-Fi :
   👉  http://192.168.1.42:4540
```

Share that URL with the team (same Wi-Fi) — they vote from their phones.

> If phones can't reach it, allow Node through your machine's firewall
> (macOS will simply prompt you; on Windows accept the "Allow access" popup).

## Pages

| URL | What |
| --- | --- |
| `/` | Voting page — name, presenter, 4 criteria (1–5 ⭐), optional comment |
| `/results` | 🏆 Live results — podium, per-criterion averages, comments, and Claude's verdict (auto-refreshes) |

## The 4 criteria

1. 💎 **La qualité de l'app** — ça marche ? ça claque ?
2. 💰 **Le potentiel business** — on en lance une business unit ?
3. 🎤 **Le show** — le pitch, le charisme
4. 🌶️ **La créativité** — le petit truc en plus

## 🤖 Le verdict de Claude (grand finale)

When all votes are in, open Claude Code in this folder (server can keep
running) and say:

> le verdict !

Claude reads `votes.json`, weighs the scores toward the business-unit goal
(💰 counts double — see `CLAUDE.md` for the full jury protocol), names the
winner with a reasoned explanation in French, and writes `verdict.json`.
The `/results` page picks it up live within seconds — a golden verdict card
appears at the top. Roulement de tambour 🥁

## Rules & data

- One vote per person per presenter — re-voting **updates** your previous vote.
- Votes are saved to **`votes.json`** next to `server.js` (survives a restart).
  That file is your raw results — keep it, spreadsheet it, frame it.
- Fresh start: stop the server, delete `votes.json` (and `verdict.json`), start again.
- Different port: `PORT=8080 node server.js` (default is **4540**, bien sûr).
