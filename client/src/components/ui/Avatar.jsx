import { useState } from 'react';
import { initials } from '../../utils/format';

const COLORS = ['bg-brand-600', 'bg-sky-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-emerald-600', 'bg-indigo-600'];
const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base', xl: 'h-24 w-24 text-3xl' };

// Shows a photo if available, otherwise coloured initials (so the UI never breaks if an image fails)
export default function Avatar({ name = '?', src, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);
  const color = COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];
  if (src && !failed) {
    return <img src={src} alt={name} onError={() => setFailed(true)} className={`${SIZES[size]} shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span aria-label={name} className={`${SIZES[size]} ${color} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}>
      {initials(name)}
    </span>
  );
}
