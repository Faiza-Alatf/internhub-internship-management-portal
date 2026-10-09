import { useEffect } from 'react';

export default function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    const onKey = (e) => e.key === 'Escape' && handler();
    document.addEventListener('mousedown', listener);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', listener); document.removeEventListener('keydown', onKey); };
  }, [ref, handler, active]);
}
