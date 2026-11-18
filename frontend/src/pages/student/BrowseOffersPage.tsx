import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import type { Offer } from '@/entities/offer/types';
import { OfferCard, ApplyModal, useOfferTypeLabel } from '@/features/offers/components';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Alert } from '@/shared/ui/Alert';
import { cn } from '@/shared/lib/utils';

interface CompanyInfo {
  _id: string;
  name: string;
  logo?: string;
  sector?: string;
}

const FILTERS = ['all', 'PFA', 'PFE', 'Intership', 'Job'] as const;

export function BrowseOffersPage() {
  const { t } = useTranslation();
  const typeLabel = useOfferTypeLabel();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [companiesInfo, setCompaniesInfo] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await httpClient.get('/api/offers');
        const raw = Array.isArray(response.data) ? response.data : [];
        const offersData: Offer[] = raw.map((offer: Offer & { id?: string }) => ({
          ...offer,
          _id: offer._id || offer.id || '',
        }));
        setOffers(offersData);

        if (offersData.length > 0) {
          const companiesResponse = await httpClient.post('/api/student/companiesinfo', {
            companies: offersData.map((o) => o.companyid),
          });
          setCompaniesInfo(Array.isArray(companiesResponse.data) ? companiesResponse.data : []);
        }
      } catch {
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleApply = async (offerId: string, coverLetter: string) => {
    await httpClient.post(`/api/student/apply/${offerId}`, { body: coverLetter });
  };

  const companyFor = (companyId: string) => companiesInfo.find((c) => c._id === companyId);
  const filteredOffers = filter === 'all' ? offers : offers.filter((o) => o.type === filter);

  return (
    <div>
      <PageHeader title={t('offers.browseOffers')} description={t('offers.browseOffersSubtitle')} />

      {hasError && <Alert variant="danger">{t('errors.pageBody')}</Alert>}

      {!loading && !hasError && offers.length > 0 && (
        <div role="group" aria-label={t('offers.filterByType')} className="mb-6 flex flex-wrap items-center gap-2">
          <span className="me-1 text-sm font-medium text-muted-foreground">{t('offers.filterByType')}</span>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'h-8 rounded-md border px-3 text-sm font-medium',
                filter === f
                  ? 'border-ink bg-ink text-white'
                  : 'border-neutral-300 bg-surface text-body hover:border-neutral-400 hover:text-ink'
              )}
            >
              {f === 'all' ? t('offers.allOffers') : typeLabel(f)}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-lg border border-line bg-surface" />
          ))}
        </div>
      )}

      {!loading && !hasError && filteredOffers.length === 0 && (
        <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
          <h2 className="text-base">
            {filter === 'all' ? t('home.noOffers') : t('offers.noFilterOffers', { type: typeLabel(filter) })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === 'all' ? t('home.noOffersDesc') : t('offers.noFilterOffersHint')}
          </p>
        </div>
      )}

      {!loading && filteredOffers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOffers.map((offer, index) => {
            const company = companyFor(offer.companyid);
            return (
              <OfferCard
                key={offer._id || `${offer.companyid}-${index}`}
                offer={offer}
                companyName={company?.name}
                companyLogo={company?.logo}
                companySector={company?.sector}
                onApply={() => setSelectedOffer(offer)}
              />
            );
          })}
        </div>
      )}

      <ApplyModal
        offer={selectedOffer}
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onSubmit={handleApply}
      />
    </div>
  );
}
