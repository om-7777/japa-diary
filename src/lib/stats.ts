import { istParts, normKey, NAAM_PER_MALA } from './convert';
import type { Cache, JapaEntry, NaamTotal, Stats, SyncState } from '../types';
/** Server figures + local entries the server has not yet confirmed (matched by unique ID). */
export function computeStats(cache: Cache | null, local: JapaEntry[]): Stats {
  const perDay: Record<string, number> = { ...(cache?.perDay ?? {}) };
  const names = new Map<string, NaamTotal>();
  for (const n of cache?.perNaam ?? []) names.set(normKey(n.naam), { ...n });
  let pending = 0;
  for (const e of local) {
    if (e.counted) continue;
    pending++; perDay[e.dayKey] = (perDay[e.dayKey] ?? 0) + e.total;
    const k = normKey(e.naam), cur = names.get(k);
    if (cur) { cur.total += e.total; if (Date.parse(e.ts) > Date.parse(cur.last)) cur.last = e.ts; }
    else names.set(k, { naam: e.naam, total: e.total, last: e.ts });
  }
  const today = istParts().dayKey;
  const lifetime = Object.values(perDay).reduce((a, b) => a + b, 0);
  const month = Object.entries(perDay).filter(([k]) => k.startsWith(today.slice(0, 7))).reduce((a, [, v]) => a + v, 0);
  return { perDay, lifetime, today: perDay[today] ?? 0, month, mala: lifetime / NAAM_PER_MALA, byTotal: [...names.values()].sort((a, b) => b.total - a.total), pending };
}
/** Distinct Naam, most recently used first (server history + everything saved on this device). */
export function namesList(cache: Cache | null, local: JapaEntry[]): string[] {
  const m = new Map<string, NaamTotal>();
  const add = (naam: string, last: string) => { const k = normKey(naam), c = m.get(k); if (!c) m.set(k, { naam, total: 0, last }); else if (Date.parse(last) > Date.parse(c.last)) { c.last = last; } };
  for (const n of cache?.perNaam ?? []) add(n.naam, n.last);
  for (const e of local) add(e.naam, e.ts);
  return [...m.values()].sort((a, b) => Date.parse(b.last) - Date.parse(a.last)).map((x) => x.naam);
}
/** Daily totals for the last n IST days, with zeros for empty days. */
export function series(perDay: Record<string, number>, n: number) {
  const [y, m, d] = istParts().dayKey.split('-').map(Number);
  const labels: string[] = [], values: number[] = [];
  for (let i = n - 1; i >= 0; i--) { const k = new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10); labels.push(`${k.slice(8)}-${k.slice(5, 7)}`); values.push(perDay[k] ?? 0); }
  return { labels, values };
}
export const statusLabel = (s: SyncState) => ({ pending: 'Pending synchronisation', syncing: 'Synchronising…', synced: 'Synchronised', failed: 'Synchronisation failed' }[s]);
