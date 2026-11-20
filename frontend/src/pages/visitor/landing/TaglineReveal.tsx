import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useScrollProgress } from './hooks';

/** The core promise in large type; words light up in reading order on scroll. */
export function TaglineReveal() {
  const { t } = useTranslation();
  const ref = useRef<HTMLParagraphElement>(null);
  const progress = useScrollProgress(ref, 0.85, 0.45);
  const words = t('landing.tagline').split(' ');
  const lit = Math.floor(progress * (words.length + 1));

  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 lg:px-8">
        <p ref={ref} className="heading-3 lg:heading-2 max-w-[760px] text-ink">
          {words.map((word, i) => (
            <span key={i} className={cn('lp-word', i < lit && 'is-on')}>
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
