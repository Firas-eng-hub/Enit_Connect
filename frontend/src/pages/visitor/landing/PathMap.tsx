import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useInView, useReducedMotion } from './hooks';
import { STOPS, type Audience } from './pathData';
import { useAutoAdvance } from './useAutoAdvance';

const ROW = 56; // px, height of one stop row; the marker moves in these steps

/**
 * A route that draws itself through the real stages of the audience's path.
 * It advances by itself until the visitor hovers, focuses or picks a stop.
 */
export function PathMap({ audience }: { audience: Audience }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: false, threshold: 0.35 });
  const stops = STOPS[audience];

  const [picked, setPicked] = useState<{ audience: Audience; index: number }>({ audience, index: 0 });
  const [userControl, setUserControl] = useState(false);
  const [hovered, setHovered] = useState(false);
  // Switching audience starts the new route from its first stop.
  const active = picked.audience === audience ? picked.index : 0;

  const advance = useCallback(
    () => setPicked((p) => ({ audience, index: p.audience === audience ? (p.index + 1) % stops.length : 1 })),
    [audience, stops.length]
  );
  useAutoAdvance(inView && !reduced && !userControl && !hovered, advance, audience);

  const base = `landing.path.${audience}`;
  const stop = stops[active];
  const caption = (i: number) =>
    audience === 'student' ? t(`${base}.stops.${stops[i]}.when`) : t('landing.path.step', { n: i + 1 });

  return (
    <div
      ref={rootRef}
      className="lp-board rounded-xl p-6"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setUserControl(true)}
    >
      <h2 className="title-2 text-white">{t(`${base}.title`)}</h2>

      <ol key={audience} className="relative mt-6">
        {/* Rail, its travelled part, and the "you are here" marker. */}
        <span aria-hidden="true" className="lp-rail absolute w-0.5" style={{ top: ROW / 2, bottom: ROW / 2, insetInlineStart: 15 }}>
          <span className="lp-rail-fill block h-full w-full" style={{ transform: `scaleY(${active / (stops.length - 1)})` }} />
        </span>
        <span
          aria-hidden="true"
          className="lp-marker absolute h-6 w-6 rounded-full"
          style={{ top: ROW / 2 - 12, insetInlineStart: 4, transform: `translateY(${active * ROW}px)` }}
        />

        {stops.map((id, i) => (
          <li key={id} className="lp-stop" style={{ height: ROW, animationDelay: `${i * 60}ms` }}>
            <button
              type="button"
              aria-current={i === active ? 'step' : undefined}
              onClick={() => {
                setUserControl(true);
                setPicked({ audience, index: i });
              }}
              className={cn('lp-stop-btn flex h-full w-full items-center gap-4 pe-2 text-start', i === active && 'is-active')}
            >
              <span className="flex w-8 shrink-0 justify-center">
                <span className={cn('lp-dot h-3 w-3 rounded-full', i <= active && 'is-passed')} />
              </span>
              <span className="title-3 flex-1">{t(`${base}.stops.${id}.label`)}</span>
              <span className="caption-5 hidden text-white/50 sm:inline">{caption(i)}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="lp-detail mt-6 p-4" aria-live="polite">
        <div key={`${audience}-${stop}`} className="lp-swap">
          <p className="caption-4 text-gold-300">{caption(active)}</p>
          <p className="title-1 mt-1 text-white">{t(`${base}.stops.${stop}.label`)}</p>
          <p className="body-6 mt-2 text-white/75">{t(`${base}.stops.${stop}.body`)}</p>
        </div>
      </div>
    </div>
  );
}
