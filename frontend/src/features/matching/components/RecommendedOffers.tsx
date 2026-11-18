import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { matchingApi } from '@/entities/matching/api';
import type { Recommendation } from '@/entities/matching/api';
import { formatDate } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/Badge';

function matchLevel(score: number): { key: 'strong' | 'good' | 'possible'; variant: 'success' | 'warning' | 'neutral' } {
  if (score >= 0.7) return { key: 'strong', variant: 'success' };
  if (score >= 0.4) return { key: 'good', variant: 'warning' };
  return { key: 'possible', variant: 'neutral' };
}

interface RecommendedOffersProps {
  onSelectOffer?: (offerId: string) => void;
}

/** Offers ranked against the student's profile. Hidden when there are none. */
export function RecommendedOffers({ onSelectOffer }: RecommendedOffersProps) {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    matchingApi
      .getRecommendations(6)
      .then((res) => setRecommendations(res.data?.recommendations ?? []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  if (failed || (!loading && recommendations.length === 0)) return null;

  return (
    <section aria-labelledby="recommended-heading">
      <div className="mb-4">
        <h2 id="recommended-heading" className="text-lg">{t('matching.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('matching.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg border border-line bg-surface" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map(({ offer, score, matchReasons }) => {
            const level = matchLevel(score);
            const title = onSelectOffer ? (
              <button
                type="button"
                onClick={() => onSelectOffer(offer.id)}
                className="text-start hover:underline underline-offset-2 after:absolute after:inset-0 after:content-['']"
              >
                {offer.title}
              </button>
            ) : (
              offer.title
            );
            return (
              <li key={offer.id} className="relative rounded-lg border border-line bg-surface p-5">
                <Badge variant={level.variant} size="sm">
                  {t(`matching.${level.key}`, { percent: Math.round(score * 100) })}
                </Badge>
                <h3 className="mt-3 text-base line-clamp-2">{title}</h3>
                <p className="mt-1 text-sm text-body">
                  {offer.companyName || t('home.unknownCompany')}
                  {offer.companyCity && (
                    <span className="text-muted-foreground">
                      {' · '}
                      {offer.companyCity}
                      {offer.companyCountry ? `, ${offer.companyCountry}` : ''}
                    </span>
                  )}
                </p>
                {offer.start && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(offer.start)}
                    {offer.end ? ` – ${formatDate(offer.end)}` : ''}
                  </p>
                )}
                {matchReasons.length > 0 && (
                  <ul className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                    {matchReasons.slice(0, 2).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
