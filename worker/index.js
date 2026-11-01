// Cloudflare Worker: validates requests, enforces CORS + size + rate limits, and adds the Apps Script secret.
// Environment: ALLOWED_ORIGIN (e.g. https://yourname.github.io), APPS_SCRIPT_URL (text), APPS_SCRIPT_SECRET (secret).
const MAX_BYTES = 32 * 1024;
const hits = new Map(); // best-effort per-isolate limiter; add a Cloudflare Rate Limiting rule for a hard limit
const limited = (ip) => { const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 60000); h.push(now); hits.set(ip, h); if (hits.size > 5000) hits.clear(); return h.length > 60; };
const str = (v, max) => typeof v === 'string' && v.length <= max;
function validate(b) {
  if (!b || typeof b !== 'object') return null;
  if (b.op === 'dashboard') {
    const ids = Array.isArray(b.ids) ? b.ids : [];
    if (ids.length > 500 || !ids.every((i) => typeof i === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(i))) return null;
    return { op: 'dashboard', ids };
  }
  if (b.op === 'add') {
    const e = b.entry || {};
    if (!/^[A-Za-z0-9-]{8,64}$/.test(e.id || '') || !/^\d{2}-\d{2}-\d{4}$/.test(e.date || '') || !/^\d{2}:\d{2} (AM|PM)$/.test(e.time || '')) return null;
    if (!str(e.naam, 100) || !e.naam.trim() || !Number.isInteger(e.total) || e.total < 1 || e.total > 1e9 || !str(e.remark ?? '', 1000)) return null;
    return { op: 'add', entry: { id: e.id, date: e.date, time: e.time, naam: e.naam, total: e.total, remark: e.remark ?? '' } };
  }
  return null;
}
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    const ok = origin && allowed.includes(origin);
    const cors = ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : { Vary: 'Origin' };
    const send = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
    if (origin && !ok) return send({ ok: false, error: 'Origin not allowed' }, 403);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return send({ ok: false, error: 'Method not allowed' }, 405);
    if (limited(req.headers.get('CF-Connecting-IP') || 'unknown')) return send({ ok: false, error: 'Too many requests. Please wait a minute.' }, 429);
    const text = await req.text();
    if (text.length > MAX_BYTES) return send({ ok: false, error: 'Request too large' }, 413);
    let body; try { body = JSON.parse(text); } catch { return send({ ok: false, error: 'Invalid JSON' }, 400); }
    const clean = validate(body);
    if (!clean) return send({ ok: false, error: 'Invalid request' }, 400);
    try {
      const r = await fetch(env.APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...clean, secret: env.APPS_SCRIPT_SECRET }), redirect: 'follow' });
      const j = await r.json();
      if (j && j.ok) return send(j);
      return send({ ok: false, error: j && j.error === 'Unauthorized' ? 'Backend rejected the request' : (j && j.error) || 'Backend error' }, j && j.error === 'Unauthorized' ? 502 : 400);
    } catch { return send({ ok: false, error: 'Backend unavailable' }, 502); }
  },
};
