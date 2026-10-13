import { useCallback, useEffect, useRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface PixelCanvasProps extends HTMLAttributes<HTMLDivElement> {
  gap?: number;
  speed?: number;
  colors?: string[];
  noFocus?: boolean;
  variant?: 'default' | 'trail' | 'glow';
  radius?: number;
}

interface Pixel {
  x: number;
  y: number;
  size: number;
  intensity: number;
  targetIntensity: number;
  colorPhase: number;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

export function PixelCanvas({
  className,
  gap = 6,
  speed = 0.02,
  colors = ['#e879f9', '#a78bfa', '#38bdf8', '#22d3ee'],
  noFocus = false,
  variant = 'default',
  radius,
  ...props
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[][]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const getColorFromIntensity = useCallback(
    (intensity: number, phase: number) => {
      if (colors.length === 0) return '#ffffff';
      if (colors.length === 1) return colors[0]!;

      const t = (phase + intensity) % 1;
      const index = Math.floor(t * (colors.length - 1));
      const nextIndex = Math.min(index + 1, colors.length - 1);
      const localT = (t * (colors.length - 1)) % 1;

      const color1 = colors[index];
      const color2 = colors[nextIndex];

      if (!color1) return '#ffffff';
      if (!color2) return color1;

      return lerpColor(color1, color2, localT);
    },
    [colors]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    const pixelSize = Math.max(gap, 4);
    let inView = true;
    let pageVisible = document.visibilityState === 'visible';

    const shouldRun = () => inView && pageVisible;

    const initPixels = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(rect.width / pixelSize);
      rows = Math.ceil(rect.height / pixelSize);

      const newPixels: Pixel[][] = [];
      for (let i = 0; i < cols; i++) {
        const row: Pixel[] = [];
        for (let j = 0; j < rows; j++) {
          const existing = pixelsRef.current[i]?.[j];
          row.push({
            x: i * pixelSize,
            y: j * pixelSize,
            size: pixelSize - 1,
            intensity: existing?.intensity ?? 0,
            targetIntensity: 0,
            colorPhase: Math.random(),
          });
        }
        newPixels.push(row);
      }
      pixelsRef.current = newPixels;
    };

    const draw = (timestamp: number) => {
      if (!shouldRun()) {
        animationRef.current = 0;
        return;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const { x: mouseX, y: mouseY } = mouseRef.current;
      const pixels = pixelsRef.current;
      const influenceRadius = radius ?? (variant === 'glow' ? 120 : 80);
      const glowPasses = variant === 'glow' ? 2 : 1;

      for (let i = 0; i < cols; i++) {
        const col = pixels[i];
        if (!col) continue;

        for (let j = 0; j < rows; j++) {
          const pixel = col[j];
          if (!pixel) continue;

          const centerX = pixel.x + pixel.size / 2;
          const centerY = pixel.y + pixel.size / 2;
          const dx = mouseX - centerX;
          const dy = mouseY - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < influenceRadius) {
            const falloff = 1 - distance / influenceRadius;
            pixel.targetIntensity = Math.pow(falloff, 1.5);
          } else {
            pixel.targetIntensity = 0;
          }

          const lerpSpeed = pixel.targetIntensity > pixel.intensity ? 0.3 : speed;
          pixel.intensity += (pixel.targetIntensity - pixel.intensity) * lerpSpeed;
          pixel.colorPhase = (pixel.colorPhase + 0.001 * (deltaTime / 16)) % 1;

          if (pixel.intensity > 0.01) {
            const color = getColorFromIntensity(pixel.intensity, pixel.colorPhase);

            if (variant === 'glow' && pixel.intensity > 0.2) {
              for (let g = glowPasses; g > 0; g--) {
                const glowSize = pixel.size + g * 4;
                const glowOffset = (glowSize - pixel.size) / 2;
                ctx.globalAlpha = (pixel.intensity * 0.15) / g;
                ctx.fillStyle = color;
                ctx.fillRect(pixel.x - glowOffset, pixel.y - glowOffset, glowSize, glowSize);
              }
            }

            ctx.globalAlpha = pixel.intensity * 0.9;
            ctx.fillStyle = color;

            if (variant === 'trail') {
              const cornerRadius = pixel.size * 0.3;
              ctx.beginPath();
              ctx.roundRect(pixel.x, pixel.y, pixel.size, pixel.size, cornerRadius);
              ctx.fill();
            } else {
              ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size);
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    const startLoop = () => {
      if (animationRef.current === 0 && shouldRun()) {
        lastTimeRef.current = performance.now();
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    const stopLoop = () => {
      if (animationRef.current !== 0) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };

    const syncLoop = () => {
      if (shouldRun()) startLoop();
      else stopLoop();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouseRef.current = { x: -1000, y: -1000 };
        return;
      }
      mouseRef.current = { x, y };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    initPixels();
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(draw);

    const resizeObserver = new ResizeObserver(initPixels);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const rect = entry?.boundingClientRect;
        const hasSize = Boolean(rect && rect.width > 0 && rect.height > 0);
        inView = hasSize ? Boolean(entry?.isIntersecting) : true;
        syncLoop();
      },
      { threshold: 0, rootMargin: '80px' }
    );
    intersectionObserver.observe(container);

    const onVisibility = () => {
      pageVisible = document.visibilityState === 'visible';
      syncLoop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (!noFocus) {
      window.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [gap, speed, noFocus, variant, radius, getColorFromIntensity]);

  return (
    <div ref={containerRef} className={cn('h-full w-full relative overflow-hidden', className)} {...props}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
