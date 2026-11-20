import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AudienceSwitch } from './AudienceSwitch';
import { PathMap } from './PathMap';
import { REGISTER_LINK, type Audience } from './pathData';

export function LandingHero() {
  const { t } = useTranslation();
  const [audience, setAudience] = useState<Audience>('student');
  const base = `landing.hero.${audience}`;
  const titleLines = t(`${base}.title`).split('\n');

  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:px-8 lg:pb-24 lg:pt-16">
      <div>
        <AudienceSwitch value={audience} onChange={setAudience} />
        {/* Keyed so the copy rises in again whenever the audience changes. */}
        <div key={audience} className="lp-swap">
          <h1 className="lp-hero-title heading-3 lg:heading-2 mt-8 max-w-[680px] pb-2">
            {titleLines.map((line, i) => (
              // Meaningful break on wider screens; natural balanced wrap on phones.
              <span key={i} className="sm:block">
                {line}
                {i < titleLines.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <p className="body-7 mt-4 max-w-[680px] text-body">{t(`${base}.body`)}</p>
          <Link to={REGISTER_LINK[audience]} className="lp-btn lp-btn--primary button-md mt-8">
            {t(`${base}.cta`)}
          </Link>
          <p className="caption-5 mt-4 text-muted-foreground">{t(`${base}.proof`)}</p>
        </div>
      </div>
      <PathMap audience={audience} />
    </section>
  );
}
