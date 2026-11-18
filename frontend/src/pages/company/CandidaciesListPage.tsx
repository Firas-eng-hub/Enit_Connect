import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import type { Offer } from '@/entities/offer/types';
import { useOfferTypeLabel } from '@/features/offers/components';
import { formatDate } from '@/shared/lib/utils';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Badge } from '@/shared/ui/Badge';

export function CandidaciesListPage() {
  const { t } = useTranslation();
  const typeLabel = useOfferTypeLabel();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const companyId = localStorage.getItem('company_id');
        if (!companyId) return;
        const response = await httpClient.get('/api/offers/myoffers', { params: { id: companyId } });
        const raw = Array.isArray(response.data) ? response.data : [];
        setOffers(
          raw
            .map((o: Offer & { id?: string }) => ({ ...o, _id: o._id || o.id || '' }))
            .filter((o: Offer) => o._id)
        );
      } catch {
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const totalApplications = offers.reduce((sum, offer) => sum + (offer.candidacies?.length || 0), 0);
  const withApplicants = offers.filter((o) => (o.candidacies?.length || 0) > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader title={t('candidaciesList.title')} description={t('candidaciesList.subtitle')} className="mb-0" />

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {[
          { label: t('candidaciesList.offers'), value: offers.length },
          { label: t('candidaciesList.applications'), value: totalApplications },
          { label: t('candidaciesList.withApplicants'), value: withApplicants },
        ].map((item) => (
          <div key={item.label} className="bg-surface px-5 py-4">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink tabular-nums">{loading ? '–' : item.value}</dd>
          </div>
        ))}
      </dl>

      {loading ? (
        <div className="h-40 rounded-lg border border-line bg-surface" aria-hidden="true" />
      ) : offers.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
          <h2 className="text-base">{t('candidaciesList.emptyTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('candidaciesList.emptyBody')}</p>
          <Link
            to="/company/home"
            className="mt-5 inline-flex h-9 items-center rounded-md border border-ink bg-ink px-4 text-sm font-medium text-white hover:bg-primary-800"
          >
            {t('home.createOffer')}
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('home.positionTitle')}</th>
                <th scope="col">{t('home.offerType')}</th>
                <th scope="col">{t('candidaciesList.posted')}</th>
                <th scope="col" className="text-end">{t('companyHome.applicants')}</th>
                <th scope="col"><span className="sr-only">{t('companyHome.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td>
                    <span className="font-medium text-ink">{offer.title}</span>
                    <span className="mt-0.5 block max-w-xl text-muted-foreground line-clamp-1">{offer.content}</span>
                  </td>
                  <td><Badge variant="primary" size="sm">{typeLabel(offer.type)}</Badge></td>
                  <td className="whitespace-nowrap text-muted-foreground">{offer.createdAt ? formatDate(offer.createdAt) : '–'}</td>
                  <td className="text-end tabular-nums">{offer.candidacies?.length || 0}</td>
                  <td className="text-end">
                    <Link
                      to={`/company/candidacies/${offer._id}`}
                      className="inline-flex h-8 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-ink hover:bg-canvas"
                    >
                      {t('home.viewApplications')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
