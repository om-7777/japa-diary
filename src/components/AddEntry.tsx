import { useEffect, useMemo, useState } from 'react';
import NaamSelect from './NaamSelect';
import { useChange } from '../hooks';
import { allEntries, putEntry } from '../lib/db';
import { loadCache, emit } from '../lib/dashboard';
import { syncNow } from '../lib/sync';
import { namesList, statusLabel } from '../lib/stats';
import { cleanNaam, fmt, istParts, newId, normKey, parseCount, toTotal } from '../lib/convert';
import type { Cache, JapaEntry, Unit } from '../types';
export default function AddEntry() {
  const local = useChange<JapaEntry[]>(allEntries, []);
  const cache = useChange<Cache | null>(loadCache, null);
  const names = useMemo(() => namesList(cache, local), [cache, local]);
  const [naam, setNaam] = useState('');
  const [touched, setTouched] = useState(false);
  const [unit, setUnit] = useState<Unit>('mala');
  const [count, setCount] = useState('1');
  const [remark, setRemark] = useState('');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState<JapaEntry | null>(null);
  useEffect(() => { if (!touched && !naam && names[0]) setNaam(names[0]); }, [names]);
  const n = parseCount(count);
  const total = n ? toTotal(unit, n) : 0;
  const word = unit === 'mala' ? 'Mala' : 'Naam';
  const countErr = count.trim() !== '' && n === null ? 'Enter a whole number greater than zero.' : '';
  const step = (d: number) => { setCount(String(Math.max(0, Math.floor(Number(count) || 0) + d))); setErr(''); };

  async function save() {
    const name = cleanNaam(naam);
    if (!name) return setErr('Choose a Naam or type a new one.');
    if (n === null) return setErr('Enter a whole number greater than zero.');
    const t = istParts();
    const entry: JapaEntry = { id: newId(), date: t.date, time: t.time, dayKey: t.dayKey, ts: new Date().toISOString(), naam: names.find((x) => normKey(x) === normKey(name)) ?? name, unit, count: n, total: toTotal(unit, n), remark, status: 'pending', counted: false, attempts: 0 };
    try { await putEntry(entry); } catch { return setErr('This device could not store the entry, so nothing was saved. Please try again.'); }
    setErr(''); setSaved(entry); emit(); void syncNow();
  }
  function reset() { setSaved(null); setUnit('mala'); setCount('1'); setRemark(''); setErr(''); setTouched(false); setNaam(names[0] ?? ''); }

  if (saved) {
    const e = local.find((x) => x.id === saved.id) ?? saved;
    return (
      <section className="card" aria-live="polite">
        <h2>Entry saved</h2>
        <dl className="sum">
          <dt>Naam Jaap</dt><dd>{e.naam}</dd>
          <dt>Counting unit</dt><dd>{e.unit === 'mala' ? 'Mala' : 'Naam'}</dd>
          <dt>Number entered</dt><dd>{fmt(e.count)}</dd>
          <dt>Total Naam recorded</dt><dd><strong>{fmt(e.total)}</strong></dd>
          <dt>Date</dt><dd>{e.date}</dd><dt>Time</dt><dd>{e.time}</dd>
          <dt>Status</dt><dd>{statusLabel(e.status)}</dd>
        </dl>
        {e.status === 'synced' ? <p className="note ok">Stored in Google Sheets.</p> : <p className="note warn">Saved on this device — Waiting for synchronisation.{e.status === 'failed' && e.error ? ` (${e.error})` : ''}</p>}
        <button className="btn" onClick={reset}>New Entry</button>
      </section>
    );
  }
  return (
    <section className="card">
      <h2>Record Naam Jaap</h2>
      <label htmlFor="naam">Naam Jaap</label>
      <NaamSelect value={naam} onChange={(v) => { setTouched(true); setNaam(v); setErr(''); }} options={names} />
      <p className="lab" id="unit-l">Counting unit</p>
      <div className="seg wide" role="radiogroup" aria-labelledby="unit-l">
        {(['mala', 'naam'] as Unit[]).map((u) => <button key={u} role="radio" aria-checked={unit === u} className={unit === u ? 'on' : ''} onClick={() => setUnit(u)}>{u === 'mala' ? 'Mala' : 'Naam'}</button>)}
      </div>
      <label htmlFor="count">Number of {word}</label>
      <div className="stepper">
        <button type="button" onClick={() => step(-1)} aria-label="Decrease by one">−</button>
        <input id="count" inputMode="numeric" autoComplete="off" value={count} onChange={(e) => { setCount(e.target.value); setErr(''); }} aria-invalid={!!countErr} />
        <button type="button" onClick={() => step(1)} aria-label="Increase by one">+</button>
      </div>
      {countErr && <p className="hint err">{countErr}</p>}
      <p className="preview" aria-live="polite">{n ? `${fmt(n)} ${word}${unit === 'mala' && n !== 1 ? 's' : ''} = ${fmt(total)} Naam` : 'Total will appear here'}</p>
      <label htmlFor="remark">Remarks <span className="small">(optional)</span></label>
      <textarea id="remark" rows={3} maxLength={1000} value={remark} onChange={(e) => setRemark(e.target.value)} />
      {err && <p className="note err" role="alert">{err}</p>}
      <button className="btn big-btn" onClick={save} disabled={n === null || !cleanNaam(naam)}>Save Entry</button>
    </section>
  );
}
