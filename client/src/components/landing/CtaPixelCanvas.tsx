import { lazy, Suspense, useEffect, useState } from 'react';

const CTA_PIXEL_COLORS = ['#1d4ed8', '#ca8a04', '#ffffff'];
const CTA_PIXEL_SPEED = 0.03;

const PixelCanvas = lazy(() =>
  import('../ui/pixel-canvas').then((mod) => ({ default: mod.PixelCanvas }))
);

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(pointer: coarse)').matches;
}

export default function CtaPixelCanvas() {
  const [coarsePointer, setCoarsePointer] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');
    const sync = () => setCoarsePointer(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  if (coarsePointer || isCoarsePointer()) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Suspense fallback={null}>
        <PixelCanvas
          className="absolute inset-0 h-full w-full"
          colors={CTA_PIXEL_COLORS}
          speed={CTA_PIXEL_SPEED}
          gap={8}
          variant="glow"
          radius={56}
        />
      </Suspense>
    </div>
  );
}
