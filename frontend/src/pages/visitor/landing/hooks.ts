import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

function subscribeReduced(onChange: () => void) {
  const mq = typeof window !== 'undefined' ? window.matchMedia?.(REDUCED_QUERY) : undefined;
  mq?.addEventListener('change', onChange);
  return () => mq?.removeEventListener('change', onChange);
}

/** True when the visitor asked the OS for reduced motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => (typeof window !== 'undefined' ? !!window.matchMedia?.(REDUCED_QUERY).matches : false),
    () => false
  );
}

/** Tracks whether an element is on screen. With `once`, it stays true after the first hit. */
export function useInView(
  ref: RefObject<Element | null>,
  { once = true, rootMargin = '0px', threshold = 0 }: { once?: boolean; rootMargin?: string; threshold?: number } = {}
): boolean {
  // Without IntersectionObserver (jsdom, very old browsers) treat everything as visible.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once, rootMargin, threshold]);

  return inView;
}

/**
 * 0 → 1 as the element travels through the viewport: 0 when its top reaches
 * `start` (fraction of viewport height), 1 when its bottom reaches `end`.
 * One passive scroll listener, throttled to one measurement per frame.
 */
export function useScrollProgress(ref: RefObject<Element | null>, start = 0.85, end = 0.4): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const travel = rect.height + (start - end) * vh;
      const value = Math.min(1, Math.max(0, (start * vh - rect.top) / travel));
      setProgress(Math.round(value * 200) / 200);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref, start, end]);

  return progress;
}

/** Eases a displayed number toward `target` (used for the fit percentages). */
export function useTweenNumber(target: number, duration = 600, disabled = false): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (disabled) return;
    const from = current.current;
    const begin = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const k = Math.min(1, (now - begin) / duration);
      const next = from + (target - from) * (1 - Math.pow(1 - k, 3));
      current.current = next;
      setValue(next);
      if (k < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration, disabled]);

  return disabled ? target : value;
}

/**
 * FLIP reordering: children marked with data-flip-key glide from their old
 * position to the new one whenever `orderKey` changes. Transform only.
 */
export function useFlip(containerRef: RefObject<HTMLElement | null>, orderKey: string, disabled = false) {
  const positions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const next = new Map<string, number>();
    container.querySelectorAll<HTMLElement>('[data-flip-key]').forEach((el) => {
      const key = el.dataset.flipKey ?? '';
      const top = el.offsetTop;
      next.set(key, top);
      const before = positions.current.get(key);
      if (disabled || before === undefined || before === top) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${before - top}px)`;
      void el.offsetHeight; // commit the inverted position before animating back
      el.style.transition = `transform 600ms ${EASE_OUT}`;
      el.style.transform = '';
    });
    positions.current = next;
  }, [containerRef, orderKey, disabled]);
}
