import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Reveal } from './Reveal';

export function FinalCta() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="final-cta-heading" className="bg-ink">
      <Reveal className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 lg:px-8">
        <h2 id="final-cta-heading" className="heading-4 lg:heading-3 max-w-[680px] text-white">
          {t('landing.final.title')}
        </h2>
        <p className="body-7 mt-4 text-white/75">{t('landing.final.body')}</p>
        <Link to="/register" className="lp-btn lp-btn--gold button-md mt-8">
          {t('landing.hero.student.cta')}
        </Link>
      </Reveal>
    </section>
  );
}
