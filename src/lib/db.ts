import type { JapaEntry } from '../types';
const S = 'entries';
let dbp: Promise<IDBDatabase> | null = null;
const open = () => (dbp ??= new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open('japa-diary', 1);
  r.onupgradeneeded = () => r.result.createObjectStore(S, { keyPath: 'id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => { dbp = null; rej(r.error); };
}));
const done = (t: IDBTransaction) => new Promise<void>((res, rej) => { t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); });
export async function putEntry(e: JapaEntry) { const t = (await open()).transaction(S, 'readwrite'); t.objectStore(S).put(e); await done(t); }
/** Atomic read-modify-write so sync and dashboard refresh never overwrite each other's fields. */
export async function updateEntry(id: string, patch: Partial<JapaEntry>) {
  const t = (await open()).transaction(S, 'readwrite'); const s = t.objectStore(S); const g = s.get(id);
  g.onsuccess = () => { if (g.result) s.put({ ...g.result, ...patch }); };
  await done(t);
}
export async function allEntries(): Promise<JapaEntry[]> {
  const t = (await open()).transaction(S, 'readonly'); const g = t.objectStore(S).getAll();
  await done(t); return (g.result as JapaEntry[]).sort((a, b) => a.ts.localeCompare(b.ts));
}
