#!/usr/bin/env node
/* Génère la voix MP3 des phrases allemandes qui n'en ont pas encore, puis réécrit audio_map.js.
   Même principe que generate_audio.ps1 (mêmes noms de fichiers aXXXX.mp3, même voix Google),
   mais en Node : il tourne tout seul sur GitHub (voir .github/workflows/voix.yml) à chaque
   modification de index.html. Les MP3 existants sont réutilisés et jamais supprimés.
   Usage local : node tools/voix-manquantes.js   (Node 18 ou plus récent)
   Code de sortie 1 si une voix n'a pas pu être téléchargée (audio_map.js n'est alors pas modifié). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MAP = path.join(ROOT, 'audio_map.js'), DIR = path.join(ROOT, 'audio');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const rx = /(?<![A-Za-z])de\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const phrases = [];
for (const m of html.matchAll(rx)) {
  const de = m[1].replace(/\\"/g, '"');
  if (de.trim() && !phrases.includes(de)) phrases.push(de);
}

let existing = {};
try { existing = JSON.parse(fs.readFileSync(MAP, 'utf8').replace(/^\s*window\.AUDIO\s*=\s*/, '').replace(/;\s*$/, '')); }
catch (e) { console.log('audio_map.js illisible : toutes les voix seront recherchées'); }
let next = 1;
for (const f of [...Object.values(existing), ...fs.readdirSync(DIR)]) {
  const m = /a(\d+)\.mp3/.exec(f); if (m) next = Math.max(next, +m[1] + 1);
}

function chunks(t, max = 190) {
  if (t.length <= max) return [t];
  const out = []; let cur = '';
  for (const w of t.split(' ')) {
    if (cur && cur.length + w.length + 1 > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}
const sleep = ms => new Promise(ok => setTimeout(ok, ms));

(async () => {
  const map = {}, fails = []; let made = 0;
  for (const de of phrases) {
    if (existing[de] && fs.existsSync(path.join(ROOT, existing[de]))) { map[de] = existing[de]; continue; }
    const id = 'a' + String(next++).padStart(4, '0'), parts = chunks(de);
    try {
      const bufs = [];
      for (let i = 0; i < parts.length; i++) {
        const q = encodeURIComponent(parts[i]), tail = `&tl=de&total=${parts.length}&idx=${i}&textlen=${parts[i].length}&q=${q}`;
        let b;
        try { b = await get('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob' + tail); }
        catch (e) { b = await get('https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx' + tail); }
        bufs.push(b); await sleep(350);
      }
      const all = Buffer.concat(bufs);
      if (all.length < 800) throw new Error('fichier trop petit');
      fs.writeFileSync(path.join(DIR, id + '.mp3'), all);
      map[de] = 'audio/' + id + '.mp3'; made++;
      console.log('NOUVELLE VOIX', id, de.slice(0, 60));
    } catch (e) { fails.push(de); console.log('ÉCHEC', id, de.slice(0, 60), '-', e.message); }
  }
  if (fails.length) { console.log(fails.length + ' voix non téléchargée(s) : audio_map.js inchangé.'); process.exit(1); }
  fs.writeFileSync(MAP, 'window.AUDIO = ' + JSON.stringify(map, null, 4) + ';\n');
  console.log(`Terminé : ${Object.keys(map).length} voix, dont ${made} nouvelle(s).`);
})();
