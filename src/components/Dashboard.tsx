import { useMemo, useState } from 'react';
import BarChart from './BarChart';
import { useChange } from '../hooks';
import { allEntries } from '../lib/db';
import { loadCache, refreshDashboard } from '../lib/dashboard';
import { computeStats, series } from '../lib/stats';
import { fmt, fmt2 } from '../lib/convert';
import type { Cache, JapaEntry } from '../types';
export default function Dashboard({ theme }: { theme: string }) {
  const local = useChange<JapaEntry[]>(allEntries, []);
  const cache = useChange<Cache | null>(loadCache, null);
  const s = useMemo(() => computeStats(cache, local), [cache, local]);
  const [days, setDays] = useState<7 | 30>(7);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const chart = useMemo(() => series(s.perDay, days), [s.perDay, days]);
  const top = s.byTotal[0]?.total || 1;
  const refresh = async () => { setBusy(true); setFailed(!(await refreshDashboard())); setBusy(false); };
  const stale = failed || !cache;
  return (
    <>
      <div className="bar">
        <span className="small">{cache ? `Last updated ${new Date(cache.fetchedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}` : 'Not updated from Google Sheets yet'}</span>
        <button className="btn ghost" onClick={refresh} disabled={busy} aria-label="Refresh dashboard">{busy ? 'Refreshing…' : '⟳ Refresh'}</button>
      </div>
      {stale && <p className="note warn" role="status">{failed ? 'Could not reach the server.' : 'No server data yet.'} Figures shown may be out of date.</p>}
      {s.pending > 0 && <p className="note" role="status">Includes {s.pending} {s.pending === 1 ? 'entry' : 'entries'} waiting to synchronise. These exist only on this device until uploaded; clearing browser data or losing the device first would lose them.</p>}
      <section className="card hero"><p className="label">Lifetime Naam Jaap</p><p className="big">{fmt(s.lifetime)}</p></section>
      <div className="grid">
        <section className="card"><p className="label">Today</p><p className="num">{fmt(s.today)}</p></section>
        <section className="card"><p className="label">This month</p><p className="num">{fmt(s.month)}</p></section>
        <section className="card"><p className="label">Lifetime Mala equivalent</p><p className="num">{fmt2(s.mala)}</p></section>
      </div>
      <section className="card">
        <div className="row"><h2>Daily progress</h2>
          <div className="seg" role="group" aria-label="Chart period">
            {[7, 30].map((n) => <button key={n} className={days === n ? 'on' : ''} aria-pressed={days === n} onClick={() => setDays(n as 7 | 30)}>Last {n} days</button>)}
          </div>
        </div>
        <BarChart labels={chart.labels} values={chart.values} theme={theme} />
      </section>
      <section className="card">
        <h2>Naam-wise lifetime total</h2>
        {s.byTotal.length === 0 ? <p>No entries yet. Add your first one from the Add Entry tab.</p> : (
          <ul className="break">{s.byTotal.map((n) => <li key={n.naam}><div className="row"><span>{n.naam}</span><strong>{fmt(n.total)}</strong></div><div className="meter"><i style={{ width: `${(n.total / top) * 100}%` }} /></div></li>)}</ul>
        )}
      </section>
    </>
  );
}
