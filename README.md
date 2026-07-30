# 🌴 La Palme de Miami 🦩

One-shot voting app for the FiveForty° demo night: everyone on the Wi-Fi votes for
the presentations of **Hervé, Sébastien, Saïd, Lionel, Maïté & Julien** — Miami
sunset style, avec une touche de 🥖.

## Run it (one command, zero install)

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
| `/results` | 🏆 Live results — podium, per-criterion averages, comments (auto-refreshes) |

## The 4 criteria

1. 💎 **La qualité de l'app** — ça marche ? ça claque ?
2. 💰 **Vendable ?** — tu sortirais la carte bleue ?
3. 🎤 **Le show** — le pitch, le charisme
4. 🌶️ **La créativité** — le petit truc en plus

## Rules & data

- One vote per person per presenter — re-voting **updates** your previous vote.
- Votes are saved to **`votes.json`** next to `server.js` (survives a restart).
  That file is your raw results — keep it, spreadsheet it, frame it.
- Fresh start: stop the server, delete `votes.json`, start again.
- Different port: `PORT=8080 node server.js` (default is **4540**, bien sûr).
