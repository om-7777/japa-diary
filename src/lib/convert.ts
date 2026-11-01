export const NAAM_PER_MALA = 108;
export const toTotal = (unit: 'mala' | 'naam', count: number) => (unit === 'mala' ? count * NAAM_PER_MALA : count);
/** Whole numbers 1..9,999,999 only (no decimals, negatives, zero or exponent forms). */
export function parseCount(s: string): number | null { const t = s.trim(); return /^\d{1,7}$/.test(t) && Number(t) > 0 ? Number(t) : null; }
export const cleanNaam = (s: string) => s.replace(/\s+/g, ' ').trim();
export const normKey = (s: string) => cleanNaam(s).toLocaleLowerCase();
export function istParts(d: Date = new Date()) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return { date: `${p.day}-${p.month}-${p.year}`, time: `${p.hour.padStart(2, '0')}:${p.minute} ${p.dayPeriod.toUpperCase()}`, dayKey: `${p.year}-${p.month}-${p.day}` };
}
export const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
export const fmt2 = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
