import { useEffect, useId, useRef } from 'react';

/*
 * Eye icon driven by one value, "open" (0 = closed, 1 = open). Both lids are
 * quadratic curves from (2,12) to (22,12); closing moves their control points
 * to the same spot so they meet in a soft curve, and lashes grow out of it.
 * The iris is clipped by the lids, so the lid visibly covers it.
 */
const LID = { upperOpen: 1, lowerOpen: 23, closed: 17 };
const LASHES = [0.18, 0.34, 0.5, 0.66, 0.82];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const quad = (p0: number, p1: number, p2: number, t: number) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

type Props = { open: boolean; blink?: boolean; className?: string };

export function AnimatedEye({ open, blink = true, className }: Props) {
  const clipId = `eye-clip-${useId().replace(/:/g, '')}`;
  const upperRef = useRef<SVGPathElement>(null);
  const lowerRef = useRef<SVGPathElement>(null);
  const shapeRef = useRef<SVGPathElement>(null);
  const lashRefs = useRef<Array<SVGLineElement | null>>([]);
  const valueRef = useRef(open ? 1 : 0);
  const rafRef = useRef(0);

  const render = (o: number) => {
    const uy = lerp(LID.closed, LID.upperOpen, o);
    const ly = lerp(LID.closed, LID.lowerOpen, o);
    upperRef.current?.setAttribute('d', `M2 12 Q12 ${uy} 22 12`);
    lowerRef.current?.setAttribute('d', `M2 12 Q12 ${ly} 22 12`);
    shapeRef.current?.setAttribute('d', `M2 12 Q12 ${uy} 22 12 Q12 ${ly} 2 12 Z`);
    if (lowerRef.current) lowerRef.current.style.opacity = String(Math.min(1, o * 3));

    const c = 1 - o;
    const len = 3.2 * ease(c);
    LASHES.forEach((t, i) => {
      const el = lashRefs.current[i];
      if (!el) return;
      const x = quad(2, 12, 22, t);
      const y = quad(12, uy, 12, t);
      const dx = (t - 0.5) * 1.4;
      const n = Math.hypot(dx, 1);
      el.setAttribute('x1', String(x));
      el.setAttribute('y1', String(y));
      el.setAttribute('x2', String(x + (dx / n) * len));
      el.setAttribute('y2', String(y + (1 / n) * len));
      el.style.opacity = c < 0.05 ? '0' : '1';
    });
  };

  const animateTo = (target: number, duration = 380) =>
    new Promise<void>((resolve) => {
      cancelAnimationFrame(rafRef.current);
      if (prefersReducedMotion()) {
        valueRef.current = target;
        render(target);
        return resolve();
      }
      const from = valueRef.current;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        valueRef.current = lerp(from, target, ease(p));
        render(valueRef.current);
        if (p < 1) rafRef.current = requestAnimationFrame(step);
        else resolve();
      };
      rafRef.current = requestAnimationFrame(step);
    });

  // Open/close on prop change (first run just paints the initial state).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      render(valueRef.current);
      return;
    }
    animateTo(open ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Occasional natural blink while open.
  useEffect(() => {
    if (!open || !blink || prefersReducedMotion()) return;
    let timer: number;
    let cancelled = false;
    const schedule = () => {
      timer = window.setTimeout(async () => {
        if (cancelled) return;
        if (valueRef.current === 1) {
          await animateTo(0, 110);
          if (!cancelled) await animateTo(1, 170);
        }
        if (!cancelled) schedule();
      }, 3500 + Math.random() * 3000);
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, blink]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <clipPath id={clipId}>
          <path ref={shapeRef} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="12" cy="12" r="3.6" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </g>
      <path ref={lowerRef} />
      <path ref={upperRef} />
      <g>
        {LASHES.map((_, i) => (
          <line key={i} ref={(el) => { lashRefs.current[i] = el; }} />
        ))}
      </g>
    </svg>
  );
}
