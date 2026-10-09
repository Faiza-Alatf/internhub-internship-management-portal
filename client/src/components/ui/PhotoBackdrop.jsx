import { useState } from 'react';

// Royalty-free Unsplash photos. If a photo cannot load (offline / blocked) nothing breaks:
// the gradient behind it stays visible.
export const IMAGES = {
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=70',
  laptops: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=70',
  meeting: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=70',
};

// variant "fade": decorative photo fading out to the left (banners)
// variant "cover": photo fills its container (cards)
export default function PhotoBackdrop({ src, alt = '', variant = 'fade' }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  const cls = variant === 'fade'
    ? 'pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover opacity-30 mix-blend-luminosity [mask-image:linear-gradient(to_left,black,transparent_80%)]'
    : 'absolute inset-0 h-full w-full object-cover';
  return <img src={src} alt={alt} aria-hidden={alt ? undefined : true} loading="lazy" onError={() => setFailed(true)} className={cls} />;
}