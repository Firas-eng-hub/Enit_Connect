import { useRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { useInView } from './hooks';

/** Rises 32px and fades in the first time it scrolls into view. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, rootMargin: '0px 0px -10% 0px' });
  return (
    <div ref={ref} className={cn('lp-reveal', inView && 'is-in', className)}>
      {children}
    </div>
  );
}
