import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import AddEntry from './components/AddEntry';
import { startSync } from './lib/sync';
import { refreshDashboard } from './lib/dashboard';
type Theme = 'light' | 'dark';
export default function App() {
  const [tab, setTab] = useState<'dash' | 'add'>('dash');
  const [theme, setTheme] = useState<Theme>(() => { try { return localStorage.getItem('japa.theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } });
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('japa.theme', theme); } catch { /* storage blocked */ } }, [theme]);
  useEffect(() => { startSync(); void refreshDashboard(); }, []);
  return (
    <>
      <header className="top">
        <div className="wrap head">
          <div><h1>JAPA DIARY</h1><p className="tag">Every Naam. Every Day. Every Moment of Devotion.</p></div>
          <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} aria-pressed={theme === 'dark'}>{theme === 'light' ? '☾' : '☀'}</button>
        </div>
      </header>
      <main className="wrap">
        <nav className="tabs" role="tablist" aria-label="Main">
          <button role="tab" aria-selected={tab === 'dash'} className={tab === 'dash' ? 'on' : ''} onClick={() => setTab('dash')}>Dashboard</button>
          <button role="tab" aria-selected={tab === 'add'} className={tab === 'add' ? 'on' : ''} onClick={() => setTab('add')}>Add Entry</button>
        </nav>
        {tab === 'dash' ? <Dashboard theme={theme} /> : <AddEntry />}
      </main>
    </>
  );
}
