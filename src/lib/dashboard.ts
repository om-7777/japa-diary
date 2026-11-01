import { allEntries, updateEntry } from './db';
import { fetchDashboard } from './api';
import type { Cache } from '../types';
export const emit = () => window.dispatchEvent(new Event('japa-change'));
export const loadCache = (): Cache | null => { try { return JSON.parse(localStorage.getItem('japa.dash') || 'null'); } catch { return null; } };
/** Fetches fresh totals. Entries the server confirms are marked `counted` so they are never added twice. */
export async function refreshDashboard(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const ids = (await allEntries()).filter((e) => !e.counted).map((e) => e.id).slice(0, 500);
    const r = await fetchDashboard(ids);
    localStorage.setItem('japa.dash', JSON.stringify({ perDay: r.perDay, perNaam: r.perNaam, fetchedAt: Date.now() } satisfies Cache));
    await Promise.all(r.found.map((id) => updateEntry(id, { counted: true })));
    emit(); return true;
  } catch { return false; }
}
