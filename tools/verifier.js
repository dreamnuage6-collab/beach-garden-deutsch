#!/usr/bin/env node
/* Contrôle de l'application avant publication.
   Usage : node tools/verifier.js          (Node 18 ou plus récent, aucune installation)
   Vérifie :
   - que le code de index.html, sw.js, audio_map.js et config.js est valide ;
   - que chaque phrase allemande (phrases, situations, Comptoir) a sa voix MP3, et que le fichier existe ;
   - que les clés des phrases (k:"…") sont uniques : favoris et erreurs à revoir en dépendent ;
   - que chaque phrase du Comptoir correspond à une phrase validée du corpus ;
   - que les fichiers que l'application garde hors connexion existent.
   Code de sortie 1 en cas d'erreur, 0 sinon. Les avertissements ne bloquent pas. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* Repère la fin d'un littéral [...] ou {...} en ignorant chaînes et commentaires */
function literalAt(src, start) {
  const open = src[start], close = open === '[' ? ']' : '}';
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; }
    else if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; if (i <= 0) break; }
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error('littéral non fermé à la position ' + start);
}
function extract(src, name) {
  const m = new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*([\\[{])').exec(src);
  if (!m) return undefined;
  return vm.runInNewContext('(' + literalAt(src, m.index + m[0].length - 1) + ')');
}

/* 1. Syntaxe */
const html = read('index.html');
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!inline.length) err('index.html : aucun script trouvé');
inline.forEach((code, i) => { try { new vm.Script(code, {filename: 'index.html#script' + (i + 1)}); } catch (e) { err('index.html, script ' + (i + 1) + ' : ' + e.message); } });
for (const f of ['sw.js', 'audio_map.js', 'config.js']) {
  try { new vm.Script(read(f), {filename: f}); } catch (e) { err(f + ' : ' + e.message); }
}
const app = inline.join('\n');

/* 2. Données */
let P, FLOWS, COMPTOIR, CP_SITU, CP_TPL, CP_GUIDE;
try {
  P = extract(app, 'P'); FLOWS = extract(app, 'FLOWS'); COMPTOIR = extract(app, 'COMPTOIR'); CP_SITU = extract(app, 'CP_SITU'); CP_TPL = extract(app, 'CP_TPL'); CP_GUIDE = extract(app, 'CP_GUIDE');
} catch (e) { err('lecture des données : ' + e.message); }
if (!Array.isArray(P) || !Array.isArray(FLOWS) || !Array.isArray(COMPTOIR)) {
  err('tableaux P, FLOWS ou COMPTOIR introuvables dans index.html');
  return finish();
}
const sbox = {window: {}};
vm.runInNewContext(read('audio_map.js'), sbox);
const AUDIO = sbox.window.AUDIO || {};

/* Corpus : toutes les phrases validées, avec leur clé */
const corpus = [];
P.forEach((p, i) => corpus.push({where: 'phrase n° ' + i, ...p}));
FLOWS.forEach(f => f.steps.forEach((s, si) => s.blocks.forEach((b, bi) => {
  if (b.t === 'say') corpus.push({where: `situation « ${f.id} », étape ${si + 1}, bloc ${bi + 1}`, ...b});
  if (b.t === 'hear') b.items.forEach((it, ii) => corpus.push({where: `situation « ${f.id} », étape ${si + 1}, phrase du client ${ii + 1}`, client: true, ...it}));
})));

/* 3. Clés uniques et champs obligatoires */
const keys = new Map();
for (const x of corpus) {
  if (!x.k) { err(x.where + ' : clé k manquante'); continue; }
  if (keys.has(x.k)) err(`clé « ${x.k} » en double : ${keys.get(x.k)} et ${x.where}`);
  keys.set(x.k, x.where);
  if (!x.de || !x.fr) err(x.where + ' : texte allemand ou français manquant');
  if (x.de && /\s{2,}|^\s|\s$/.test(x.de)) warn(x.where + ' : espaces en trop dans « ' + x.de + ' »');
}
P.forEach((p, i) => { if (p.k && p.k !== 'p' + i) warn(`phrase n° ${i} : clé « ${p.k} » (attendu « p${i} ») ; ne change jamais une clé existante, ajoute les nouvelles phrases à la fin`); });

/* 4. Voix */
const audioDir = path.join(ROOT, 'audio');
const checked = new Set();
function checkVoice(de, where) {
  if (checked.has(de)) return; checked.add(de);
  const f = AUDIO[de];
  if (!f) { err(`${where} : pas de voix MP3 pour « ${de} » (lance generate_audio.ps1)`); return; }
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) { err(`${where} : fichier ${f} introuvable`); return; }
  const b = fs.readFileSync(fp);
  if (b.length < 1000 || !((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)))
    err(`${where} : ${f} ne ressemble pas à un MP3 valide (${b.length} octets)`);
}
corpus.forEach(x => x.de && checkVoice(x.de, x.where));

/* 5. Comptoir : chaque phrase doit exister dans le corpus validé (sinon la tuile disparaît) */
const byDe = new Map(corpus.map(x => [x.de, x]));
COMPTOIR.forEach(([, title, items]) => items.forEach(([label, de]) => {
  if (!byDe.has(de)) err(`Comptoir « ${title} » → « ${label} » : la phrase n'est pas dans le corpus validé (« ${de} »)`);
}));
if (Array.isArray(CP_SITU)) CP_SITU.forEach(g => (g.items || []).forEach(([label, de]) => {
  if (typeof de === 'string' && !byDe.has(de)) err(`Comptoir ordinateur « ${g.name || g.id} » → « ${label} » : phrase absente du corpus (« ${de} »)`);
}));
if (CP_TPL) for (const [id, t] of Object.entries(CP_TPL)) if (!byDe.has(t.base)) err(`Phrase à compléter « ${id} » : modèle absent du corpus (« ${t.base} »)`);
/* Cartes guidées : toutes les phrases allemandes (champs hear, ask, auth, send, after, client, phone, back, answers, when) */
const GKEYS = new Set(['hear', 'ask', 'auth', 'send', 'after', 'client', 'phone', 'back', 'answers', 'when', 'yes', 'present']);
(function walk(o, inDe) {
  if (typeof o === 'string') { if (inDe && !byDe.has(o)) err(`Carte guidée du Comptoir : phrase absente du corpus (« ${o} »)`); return; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, inDe || GKEYS.has(k) || Array.isArray(o));
})(CP_GUIDE || {}, false);

/* 6. Voix orphelines (avertissement seulement) */
const used = new Set(corpus.map(x => x.de));
const orphanMap = Object.keys(AUDIO).filter(de => !used.has(de));
if (orphanMap.length) warn(orphanMap.length + ' entrée(s) de audio_map.js ne correspondent plus à aucune phrase (sans gravité ; generate_audio.ps1 -Nettoyer les retire)');
const files = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')) : [];
const mapped = new Set(Object.values(AUDIO).map(f => path.basename(f)));
const orphanFiles = files.filter(f => !mapped.has(f));
if (orphanFiles.length) warn(orphanFiles.length + ' fichier(s) MP3 non utilisés dans audio/ (sans gravité)');

/* 7. Fichiers gardés hors connexion */
const sw = read('sw.js');
const shell = /const SHELL\s*=\s*\[([\s\S]*?)\];/.exec(sw);
if (!shell) err('sw.js : liste SHELL introuvable');
else for (const m of shell[1].matchAll(/'\.\/([^']*)'/g)) {
  const f = m[1] || 'index.html';
  if (!fs.existsSync(path.join(ROOT, f))) err('sw.js : le fichier « ' + f + ' » de la liste hors connexion est introuvable (l\'installation échouerait)');
}
const cache = (/const CACHE\s*=\s*'([^']+)'/.exec(sw) || [])[1];

finish();
function finish() {
  const nVoices = typeof AUDIO === 'object' && AUDIO ? Object.keys(AUDIO).length : 0;
  console.log('Beach Garden Deutsch : vérification');
  if (P) console.log(`  ${P.length} phrases, ${FLOWS ? FLOWS.length : 0} situations, ${corpus.length} phrases au total, ${nVoices} voix, cache « ${cache || '?'} »`);
  for (const w of warnings) console.log('  ⚠ ' + w);
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(errors.length ? `\n${errors.length} erreur(s) à corriger avant publication.` : '\n✓ Aucune erreur.');
  process.exitCode = errors.length ? 1 : 0;
}
