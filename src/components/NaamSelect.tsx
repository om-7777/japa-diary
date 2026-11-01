import { useState } from 'react';
import { normKey } from '../lib/convert';
export default function NaamSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const shown = options.filter((o) => normKey(o).includes(normKey(filter)));
  const isNew = value.trim() !== '' && !options.some((o) => normKey(o) === normKey(value));
  return (
    <div className="combo">
      <input id="naam" role="combobox" aria-expanded={open} aria-controls="naam-list" aria-autocomplete="list" autoComplete="off" maxLength={100}
        value={value} placeholder="Search, or type a new Naam"
        onFocus={(e) => { setFilter(''); setOpen(true); e.target.select(); }}
        onChange={(e) => { onChange(e.target.value); setFilter(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && shown.length > 0 && (
        <ul id="naam-list" role="listbox" className="list">
          {shown.map((o) => <li key={o} role="option" aria-selected={normKey(o) === normKey(value)} onPointerDown={(e) => { e.preventDefault(); onChange(o); setOpen(false); }}>{o}</li>)}
        </ul>
      )}
      {isNew && <p className="hint">New Naam. It will be remembered once you save.</p>}
    </div>
  );
}
