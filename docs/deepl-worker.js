/* Relais DeepL pour le traducteur de Beach Garden Deutsch (Cloudflare Worker).
   La clé DeepL reste secrète ici, jamais dans l'application publique.
   Variables à définir dans Cloudflare : DEEPL_KEY (secret), ALLOWED_ORIGIN (ex. https://deutsch.lesmediterranees.com). */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!ok || request.method !== 'POST') return new Response('Forbidden', { status: 403, headers: cors });

    let body;
    try { body = await request.json(); } catch (e) { return new Response('Bad request', { status: 400, headers: cors }); }
    const langs = { fr: 'FR', de: 'DE' };
    const text = String(body.text || '').slice(0, 1000);
    const source = langs[body.source], target = langs[body.target];
    if (!text || !source || !target) return new Response('Bad request', { status: 400, headers: cors });

    const host = env.DEEPL_KEY.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
    const r = await fetch(`https://${host}/v2/translate`, {
      method: 'POST',
      headers: { 'Authorization': `DeepL-Auth-Key ${env.DEEPL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: [text], source_lang: source, target_lang: target, formality: 'prefer_more' })
    });
    if (!r.ok) return new Response('DeepL error', { status: 502, headers: cors });
    const j = await r.json();
    const out = j.translations && j.translations[0] && j.translations[0].text;
    return new Response(JSON.stringify({ text: out || '' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
