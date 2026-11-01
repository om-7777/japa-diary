export type Unit = 'mala' | 'naam';
export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';
export interface JapaEntry {
  id: string; date: string; time: string; dayKey: string; ts: string;
  naam: string; unit: Unit; count: number; total: number; remark: string;
  status: SyncState; counted: boolean; attempts: number; error?: string;
}
export interface NaamTotal { naam: string; total: number; last: string }
export interface DashboardResponse { ok: true; perDay: Record<string, number>; perNaam: NaamTotal[]; found: string[] }
export interface AddResponse { ok: true; duplicate?: boolean }
export interface Cache { perDay: Record<string, number>; perNaam: NaamTotal[]; fetchedAt: number }
export interface Stats { perDay: Record<string, number>; lifetime: number; today: number; month: number; mala: number; byTotal: NaamTotal[]; pending: number }
