/* Service worker : application installable, hors connexion et mises à jour automatiques.
   - Pages et liste des voix : réseau d'abord (les mises à jour arrivent toutes seules), cache en secours.
   - Voix, icônes, polices : cache d'abord (rapide et disponible hors connexion).
   - Le noyau de l'application est mis en cache entièrement avant d'activer une nouvelle version :
     si un fichier manque, l'installation échoue et la version précédente reste en place.
   - Les voix ont leur propre cache, conservé d'une version à l'autre (chaque fichier a un nom unique).
     Elles sont téléchargées après l'activation (sauf en mode « économie de données ») ;
     l'application affiche l'état réel dans Profil et permet de reprendre le téléchargement. */
const CACHE = 'bgd-v9';
const AUDIO_CACHE = 'bgd-audio';
const SHELL = ['./', './index.html', './audio_map.js', './config.js', './manifest.webmanifest',
  './vendor/qrcode.js', './brand/logo.png', './brand/emblem-white.png', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './fonts/inter-latin-400-normal.woff2', './fonts/inter-latin-500-normal.woff2', './fonts/inter-latin-600-normal.woff2',
  './fonts/inter-latin-700-normal.woff2', './fonts/playfair-display-latin-600-normal.woff2'];

self.window = self;
try { importScripts('./config.js'); } catch (e) {}
const CFG = self.BGD_CONFIG || {};
if (CFG.onesignalAppId) {
  try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}
}

self.addEventListener('install', e => {
  // Pas de « catch » : si le noyau est incomplet, cette version n'est pas installée.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

/* Liste des voix de la version en cache */
async function audioFiles() {
  const r = (await caches.match('./audio_map.js')) || await fetch('./audio_map.js');
  const txt = await r.text();
  return [...new Set([...txt.matchAll(/"(audio\/a\d+\.mp3)"/g)].map(m => './' + m[1]))];
}
/* Télécharge les voix manquantes (4 à la fois), puis retire celles qui ne servent plus */
let precaching = null;
function precacheAudio(force) {
  if (precaching) return precaching;
  precaching = (async () => {
    if (!force && self.navigator && self.navigator.connection && self.navigator.connection.saveData) return;
    const files = await audioFiles();
    const c = await caches.open(AUDIO_CACHE);
    const have = new Set((await c.keys()).map(k => './' + new URL(k.url).pathname.split('/').slice(-2).join('/')));
    const todo = files.filter(f => !have.has(f));
    let failed = 0;
    const worker = async () => { while (todo.length) { const f = todo.shift(); try { const r = await fetch(f); if (r.ok) await c.put(f, r); else failed++; } catch (e) { failed++; } } };
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (!failed) {
      const keep = new Set(files);
      for (const k of await c.keys()) { const p = './' + new URL(k.url).pathname.split('/').slice(-2).join('/'); if (!keep.has(p)) await c.delete(k); }
    }
  })().catch(() => {}).finally(() => { precaching = null; });
  return precaching;
}

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ac = await caches.open(AUDIO_CACHE);
    for (const k of await caches.keys()) if (k !== CACHE && k !== AUDIO_CACHE && k.startsWith('bgd-')) {
      // Reprend les voix déjà téléchargées par l'ancienne version, pour ne pas tout retélécharger
      const old = await caches.open(k);
      for (const r of await old.keys()) if (/\.mp3$/.test(new URL(r.url).pathname) && !(await ac.match(r))) { const v = await old.match(r); if (v) await ac.put(r, v); }
      await caches.delete(k);
    }
    await self.clients.claim();
    await precacheAudio(false);
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'precache-audio') e.waitUntil(precacheAudio(true));
});

/* Réponse partielle (Range) pour la lecture audio sur iPhone */
async function rangeResponse(req, res) {
  const range = req.headers.get('range');
  if (!range || !res || !res.ok) return res;
  const buf = await res.arrayBuffer(), size = buf.byteLength;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start, end;
  if (!m || (m[1] === '' && m[2] === '')) start = NaN;
  else if (m[1] === '') { start = Math.max(0, size - +m[2]); end = size - 1; }        // bytes=-500 : les 500 derniers octets
  else { start = +m[1]; end = m[2] === '' ? size - 1 : Math.min(+m[2], size - 1); }
  if (!(start >= 0) || start >= size || end < start)
    return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${size}`}});
  return new Response(buf.slice(start, end + 1), {status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
    'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes'}});
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const networkFirst = req.mode === 'navigate' || /\/(index\.html|audio_map\.js|config\.js|manifest\.webmanifest)?$/.test(url.pathname);
  if (networkFirst) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? './' : req, cp)); }
      return r;
    }).catch(async () => (await caches.match(req, {ignoreSearch: true})) || caches.match('./')));
    return;
  }

  const isAudio = /\.mp3$/.test(url.pathname);
  e.respondWith((async () => {
    const c = await caches.open(isAudio ? AUDIO_CACHE : CACHE);
    const key = new Request(url.origin + url.pathname);
    let res = (await c.match(key)) || (isAudio ? null : await caches.match(key));
    if (!res) {
      try {
        const r = await fetch(key);
        if (r.ok) await c.put(key, r.clone());
        res = r;
      } catch (err) { return Response.error(); }
    }
    return isAudio ? rangeResponse(req, res) : res;
  })());
});
