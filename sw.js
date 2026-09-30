/* Service worker : application installable, hors connexion et mises à jour automatiques.
   - Pages et liste des voix : réseau d'abord (les mises à jour arrivent toutes seules), cache en secours.
   - Voix, icônes, polices : cache d'abord (rapide et disponible hors connexion).
   Les voix sont téléchargées en arrière-plan, sauf si le téléphone est en mode « économie de données ». */
const CACHE = 'bgd-v7';
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
  self.skipWaiting();
  // Installation rapide : seulement l'essentiel ; les voix suivent en arrière-plan après l'activation
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});

/* Télécharge toutes les voix en arrière-plan pour un usage hors connexion */
async function precacheAudio() {
  try {
    if (self.navigator && self.navigator.connection && self.navigator.connection.saveData) return;
    const txt = await (await fetch('./audio_map.js', {cache: 'no-cache'})).text();
    const files = [...new Set([...txt.matchAll(/"(audio\/a\d+\.mp3)"/g)].map(m => './' + m[1]))];
    const c = await caches.open(CACHE);
    for (const f of files) {
      if (!(await c.match(f))) { try { const r = await fetch(f); if (r.ok) await c.put(f, r); } catch (e) {} }
    }
  } catch (e) {}
}

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('bgd-')) await caches.delete(k);
    await self.clients.claim();
    precacheAudio();
  })());
});

/* Réponse partielle (Range) pour la lecture audio sur iPhone */
async function rangeResponse(req, res) {
  const range = req.headers.get('range');
  if (!range || !res) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const start = m && m[1] ? +m[1] : 0, end = m && m[2] ? +m[2] : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
    'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes'}});
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same) return;

  const networkFirst = same && (req.mode === 'navigate' || /\/(index\.html|audio_map\.js|config\.js|manifest\.webmanifest)?$/.test(url.pathname));
  if (networkFirst) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? './' : req, cp)); }
      return r;
    }).catch(async () => (await caches.match(req, {ignoreSearch: true})) || caches.match('./')));
    return;
  }

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const key = new Request(url.origin + url.pathname);
    let res = await c.match(key);
    if (!res) {
      try {
        const r = await fetch(key);
        if (r.ok) await c.put(key, r.clone());
        res = r;
      } catch (err) { return Response.error(); }
    }
    return /\.mp3$/.test(url.pathname) ? rangeResponse(req, res) : res;
  })());
});
