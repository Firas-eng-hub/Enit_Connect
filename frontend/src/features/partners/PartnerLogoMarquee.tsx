import { useTranslation } from 'react-i18next';
import { usePartners } from '@/entities/partner';

/**
 * Partner companies as a calm, static row of logos.
 * Renders nothing while loading, on error, or when there are no partners:
 * the strip is supporting content and should never show a broken state.
 */
export function PartnerLogoMarquee() {
  const { t } = useTranslation();
  const { data: partners = [], isLoading, isError } = usePartners(15000);

  if (isLoading || isError || partners.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="partners-heading" className="border-b border-line bg-surface">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:gap-10">
        <h2 id="partners-heading" className="text-sm font-medium text-muted-foreground shrink-0">
          {t('visitor.partners.title')}
        </h2>
        <ul className="partner-marquee-list">
          {partners.map((partner) => (
            <li key={partner._id} className="partner-marquee-item">
              <img
                src={partner.logoUrl}
                alt={partner.name}
                loading="lazy"
                decoding="async"
                className="h-8 sm:h-9 w-auto max-w-[140px] object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
