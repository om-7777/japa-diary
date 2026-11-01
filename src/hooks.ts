import { useEffect, useState } from 'react';
/** Re-runs `load` whenever the app emits a "japa-change" event (saves, syncs, refreshes). */
export function useChange<T>(load: () => Promise<T> | T, init: T): T {
  const [v, set] = useState<T>(init);
  useEffect(() => {
    let live = true;
    const run = () => { Promise.resolve(load()).then((x) => { if (live) set(x); }).catch(() => {}); };
    run(); window.addEventListener('japa-change', run);
    return () => { live = false; window.removeEventListener('japa-change', run); };
  }, []);
  return v;
}
