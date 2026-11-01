import type { AddResponse, DashboardResponse, JapaEntry } from '../types';
const URL_ = import.meta.env.VITE_API_URL as string | undefined;
export class ApiError extends Error { constructor(m: string, public retryable: boolean) { super(m); } }
async function call<T>(body: object): Promise<T> {
  if (!URL_) throw new ApiError('The app is not connected to a server yet.', true);
  let r: Response;
  try { r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) }); }
  catch { throw new ApiError('Server could not be reached.', true); }
  let j: { ok?: boolean; error?: string };
  try { j = await r.json(); } catch { throw new ApiError('The server sent an unreadable reply.', true); }
  if (!r.ok || !j.ok) throw new ApiError(j.error || `Server error (${r.status})`, r.status >= 500 || r.status === 429 || r.status === 408);
  return j as T;
}
export const addEntry = (e: JapaEntry) => call<AddResponse>({ op: 'add', entry: { id: e.id, date: e.date, time: e.time, naam: e.naam, total: e.total, remark: e.remark } });
export const fetchDashboard = (ids: string[]) => call<DashboardResponse>({ op: 'dashboard', ids });
