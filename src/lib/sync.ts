import { allEntries, updateEntry } from './db';
import { addEntry, ApiError } from './api';
import { emit, refreshDashboard } from './dashboard';
let running = false, failures = 0, timer: number | undefined;
export async function syncNow(retryFailed = false) {
  if (running || !navigator.onLine) return;
  running = true; let retry = false;
  try {
    const todo = (await allEntries()).filter((e) => e.status === 'pending' || e.status === 'syncing' || (retryFailed && e.status === 'failed'));
    for (const e of todo) {
      await updateEntry(e.id, { status: 'syncing' }); emit();
      try { await addEntry(e); await updateEntry(e.id, { status: 'synced', error: undefined }); failures = 0; }
      catch (x) {
        const a = x instanceof ApiError ? x : new ApiError('Unexpected error.', true);
        if (a.retryable) { await updateEntry(e.id, { status: 'pending', attempts: e.attempts + 1, error: a.message }); retry = true; break; }
        await updateEntry(e.id, { status: 'failed', error: a.message });
      }
      emit();
    }
  } catch { retry = true; } finally { running = false; emit(); }
  clearTimeout(timer);
  if (retry) { failures++; timer = window.setTimeout(() => void syncNow(), Math.min(300000, 2000 * 2 ** failures)); }
  else await refreshDashboard();
}
/** Triggers: app open, connectivity regained, app becomes visible. Does not depend on Background Sync. */
export function startSync() {
  void syncNow(true);
  window.addEventListener('online', () => { failures = 0; void syncNow(true); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void syncNow(); });
}
