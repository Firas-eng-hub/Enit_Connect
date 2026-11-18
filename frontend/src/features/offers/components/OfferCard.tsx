import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import type { Offer } from '@/entities/offer/types';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { formatDate } from '@/shared/lib/utils';
import { useOfferTypeLabel } from '../lib/useOfferTypeLabel';

interface OfferCardProps {
  offer: Offer;
  companyName?: string;
  companyLogo?: string;
  companySector?: string;
  onApply?: () => void;
  showApplyButton?: boolean;
}

export function OfferCard({
  offer,
  companyName,
  companyLogo,
  companySector,
  onApply,
  showApplyButton = true,
}: OfferCardProps) {
  const { t } = useTranslation();
  const typeLabel = useOfferTypeLabel();

  return (
    <article className="flex flex-col rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        {companyLogo ? (
          <img
            src={companyLogo}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-10 w-10 rounded-md border border-line object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-canvas" aria-hidden="true">
            <Building2 className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{companyName || t('home.unknownCompany')}</p>
          {companySector && <p className="truncate text-sm text-muted-foreground">{companySector}</p>}
        </div>
        <Badge variant="primary" size="sm">{typeLabel(offer.type)}</Badge>
      </div>

      <h3 className="mt-4 text-base">{offer.title}</h3>
      <p className="mt-1.5 text-sm text-body line-clamp-3">{offer.content}</p>

      {(offer.start || offer.end) && (
        <p className="mt-3 text-sm text-muted-foreground">
          {offer.start && <time dateTime={offer.start}>{formatDate(offer.start)}</time>}
          {offer.start && offer.end && ' – '}
          {offer.end && <time dateTime={offer.end}>{formatDate(offer.end)}</time>}
        </p>
      )}

      {showApplyButton && onApply && (
        <div className="mt-auto pt-5">
          <Button variant="secondary" onClick={onApply} className="w-full">
            {t('home.applyNow')}
          </Button>
        </div>
      )}
    </article>
  );
}
