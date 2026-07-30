#!/usr/bin/env node
/**
 * La Palme de St Pete — one-shot presentation voting app.
 * Zero dependencies: `node server.js`, then share the printed Wi-Fi URL.
 * Votes are persisted to votes.json next to this file.
 * Claude's end-of-night verdict is read live from verdict.json (see CLAUDE.md).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PORT = Number(process.env.PORT) || 4540;
const DATA_FILE = path.join(__dirname, 'votes.json');
const VERDICT_FILE = path.join(__dirname, 'verdict.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const PRESENTERS = [
  { id: 'herve', name: 'Hervé', emoji: '🦩' },
  { id: 'sebastien', name: 'Sébastien', emoji: '🐊' },
  { id: 'said', name: 'Saïd', emoji: '🌊' },
  { id: 'lionel', name: 'Lionel', emoji: '🐬' },
  { id: 'maite', name: 'Maïté', emoji: '🍹' },
  { id: 'julien', name: 'Julien', emoji: '🌴' },
];

const CRITERIA = [
  { id: 'app', label: '💎 La qualité de l’app', hint: 'Ça marche ? Ça claque ?' },
  { id: 'vendable', label: '💰 Le potentiel business', hint: 'On en lance une business unit ?' },
  { id: 'show', label: '🎤 Le show', hint: 'Le pitch, le charisme, la scène' },
  { id: 'creativite', label: '🌶️ La créativité', hint: 'Le petit truc en plus' },
];

// ---------- persistence ----------
let votes = [];
try {
  votes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(votes)) votes = [];
} catch {
  votes = [];
}

function saveVotes() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(votes, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// One vote per (voter, presenter); re-voting overwrites.
function voterKey(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ---------- request handling ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function serveFile(res, file) {
  const full = path.join(PUBLIC_DIR, file);
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — perdu dans les Everglades 🐊');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
  res.end(fs.readFileSync(full));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET') {
    if (url.pathname === '/') return serveFile(res, 'index.html');
    if (url.pathname === '/results') return serveFile(res, 'results.html');
    if (url.pathname === '/api/config') {
      return sendJson(res, 200, { presenters: PRESENTERS, criteria: CRITERIA });
    }
    if (url.pathname === '/api/results') {
      // Re-read verdict.json on every call so Claude's verdict, written while
      // the server runs, appears in the app within one refresh.
      let verdict = null;
      try {
        verdict = JSON.parse(fs.readFileSync(VERDICT_FILE, 'utf8'));
      } catch {}
      return sendJson(res, 200, { presenters: PRESENTERS, criteria: CRITERIA, votes, verdict });
    }
    return serveFile(res, url.pathname.slice(1));
  }

  if (req.method === 'POST' && url.pathname === '/api/vote') {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) req.destroy();
    });
    req.on('end', () => {
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return sendJson(res, 400, { error: 'JSON invalide' });
      }

      const voter = typeof body.voter === 'string' ? body.voter.replace(/\s+/g, ' ').trim() : '';
      if (voter.length < 2 || voter.length > 40) {
        return sendJson(res, 400, { error: 'Ton prénom, entre 2 et 40 caractères 🙏' });
      }
      const presenter = PRESENTERS.find((p) => p.id === body.presenter);
      if (!presenter) {
        return sendJson(res, 400, { error: 'Choisis un présentateur !' });
      }
      const scores = {};
      for (const c of CRITERIA) {
        const v = body.scores?.[c.id];
        if (!Number.isInteger(v) || v < 1 || v > 5) {
          return sendJson(res, 400, { error: `Note « ${c.label} » de 1 à 5 ⭐` });
        }
        scores[c.id] = v;
      }
      const comment =
        typeof body.comment === 'string' ? body.comment.trim().slice(0, 140) : '';

      const key = voterKey(voter);
      const existing = votes.findIndex(
        (v) => voterKey(v.voter) === key && v.presenter === presenter.id
      );
      const vote = { voter, presenter: presenter.id, scores, comment, at: new Date().toISOString() };
      if (existing >= 0) votes[existing] = vote;
      else votes.push(vote);
      saveVotes();

      console.log(
        `🗳️  ${voter} → ${presenter.name} : ${CRITERIA.map((c) => scores[c.id]).join('/')}` +
          (comment ? ` — « ${comment} »` : '') +
          (existing >= 0 ? ' (mis à jour)' : '')
      );
      return sendJson(res, 200, { ok: true, updated: existing >= 0 });
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('405');
});

server.listen(PORT, '0.0.0.0', () => {
  const urls = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family === 'IPv4' && !iface.internal) urls.push(`http://${iface.address}:${PORT}`);
    }
  }
  console.log('');
  console.log('  🌴🦩 ═══════════════════════════════════════ 🦩🌴');
  console.log('     LA PALME DE ST PETE — Sunshine City, baby !');
  console.log('  ═══════════════════════════════════════════════');
  console.log('');
  console.log('  Partage cette adresse sur le Wi-Fi :');
  for (const u of urls) console.log(`     👉  ${u}`);
  if (!urls.length) console.log(`     👉  http://localhost:${PORT}`);
  console.log('');
  console.log(`  Les résultats en direct :  /results`);
  console.log(`  Les votes sont sauvés dans ${path.basename(DATA_FILE)}`);
  console.log('');
});
