import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FilePlus2, Inbox, MessagesSquare } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useInView } from './hooks';
import { Reveal } from './Reveal';

const FLOW = [
  { id: 'publish', Icon: FilePlus2 },
  { id: 'review', Icon: Inbox },
  { id: 'reply', Icon: MessagesSquare },
] as const;

export function CompaniesBand() {
  const { t } = useTranslation();
  const flowRef = useRef<HTMLOListElement>(null);
  const inView = useInView(flowRef, { once: true, rootMargin: '0px 0px -15% 0px' });

  return (
    <section aria-labelledby="companies-heading" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 id="companies-heading" className="heading-4 lg:heading-3">
            {t('landing.companies.title')}
          </h2>
          <p className="body-7 mt-4 max-w-[560px] text-body">{t('landing.companies.body')}</p>
          <Link to="/register?type=company" className="lp-btn lp-btn--primary button-md mt-8">
            {t('landing.companies.cta')}
          </Link>
        </div>

        {/* Publish, review, reply: the connector draws, then each step lands in order. */}
        <ol ref={flowRef} className="relative grid grid-cols-3 gap-4">
          <span aria-hidden="true" className="absolute top-8 h-0.5 bg-line" style={{ insetInlineStart: '16.66%', insetInlineEnd: '16.66%' }}>
            <span className="lp-track-fill block h-full bg-gold" style={{ transform: `scaleX(${inView ? 1 : 0})`, transitionDuration: '900ms' }} />
          </span>
          {FLOW.map(({ id, Icon }, i) => (
            <li
              key={id}
              className={cn('lp-flow-step relative flex flex-col items-center text-center', inView && 'is-in')}
              style={{ transitionDelay: `${200 + i * 250}ms` }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface text-ink">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="title-3 mt-4 text-ink">{t(`landing.companies.flow.${id}`)}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
