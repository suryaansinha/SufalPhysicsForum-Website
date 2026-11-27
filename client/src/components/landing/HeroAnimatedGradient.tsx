import { lazy, Suspense, useEffect, useState } from 'react';
import type { CustomConfig } from '../ui/animated-gradient';

const HERO_GRADIENT_PRESET: CustomConfig = {
  preset: 'custom',
  color1: '#020617',
  color2: '#1d4ed8',
  color3: '#ca8a04',
  rotation: -18,
  proportion: 54,
  scale: 0.7,
  speed: 16,
  distortion: 16,
  swirl: 36,
  swirlIterations: 7,
  softness: 88,
  offset: 80,
  shape: 'Edge',
  shapeSize: 48,
};

const STATIC_GRADIENT =
  'linear-gradient(135deg, #020617 0%, #1d4ed8 58%, #ca8a04 140%)';

const AnimatedGradient = lazy(() =>
  import('../ui/animated-gradient').then((mod) => ({ default: mod.AnimatedGradient }))
);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function StaticHeroGradient() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ background: STATIC_GRADIENT }}
    />
  );
}

export default function HeroAnimatedGradient() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const useStatic = reducedMotion || prefersReducedMotion();

  useEffect(() => {
    console.info('[hero-gradient]', {
      path: useStatic ? 'static-css-fallback' : 'webgl-shader',
      prefersReducedMotion: reducedMotion,
      canvasMounted: !useStatic,
    });
  }, [useStatic, reducedMotion]);

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {useStatic ? (
        <StaticHeroGradient />
      ) : (
        <Suspense fallback={<StaticHeroGradient />}>
          <AnimatedGradient config={HERO_GRADIENT_PRESET} className="absolute inset-0 h-full w-full" />
        </Suspense>
      )}
    </div>
  );
}
