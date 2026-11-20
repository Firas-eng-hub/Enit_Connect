import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useScrollProgress } from './hooks';

const STEPS = ['profile', 'match', 'apply'] as const;

/** Three real steps; the line between them draws as the section scrolls by. */
export function HowItWorks() {
  const { t } = useTranslation();
  const ref = useRef<HTMLOListElement>(null);
  const progress = useScrollProgress(ref, 0.8, 0.55);

  return (
    <section aria-labelledby="steps-heading" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 lg:px-8">
      <h2 id="steps-heading" className="heading-4 lg:heading-3">
        {t('landing.steps.title')}
      </h2>
      <ol ref={ref} className="relative mt-12 grid gap-12 md:grid-cols-3 md:gap-8">
        {/* Horizontal rail (md+): from the first node to the last. */}
        <div
          aria-hidden="true"
          className="absolute top-5 hidden h-0.5 bg-line md:block"
          style={{ insetInlineStart: 20, insetInlineEnd: 'calc((100% - 64px) / 3 - 20px)' }}
        >
          <div className="lp-track-fill h-full bg-gold" style={{ transform: `scaleX(${progress})` }} />
        </div>
        {/* Vertical rail (mobile). */}
        <div aria-hidden="true" className="absolute bottom-10 top-5 w-0.5 bg-line md:hidden" style={{ insetInlineStart: 19 }}>
          <div className="lp-track-fill lp-track-fill--v h-full w-full bg-gold" style={{ transform: `scaleY(${progress})` }} />
        </div>

        {STEPS.map((step, i) => {
          const on = progress >= (i / (STEPS.length - 1)) * 0.92;
          return (
            <li key={step} className="relative flex gap-6 md:block">
              <span
                className={cn(
                  'lp-node title-3 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-line bg-canvas text-muted-foreground',
                  on && 'is-on'
                )}
              >
                {i + 1}
              </span>
              <div className="md:mt-6">
                <h3 className="title-1 text-ink">{t(`landing.steps.${step}.title`)}</h3>
                <p className="body-3 mt-2 max-w-sm text-body">{t(`landing.steps.${step}.body`)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
