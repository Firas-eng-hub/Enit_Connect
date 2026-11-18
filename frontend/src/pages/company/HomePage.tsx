import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { formatDate, getApiErrorMessage } from '@/shared/lib/utils';
import type { Offer } from '@/entities/offer/types';
import type { News } from '@/entities/news/types';
import { isNewsVisibleTo } from '@/entities/news/lib';
import { NewsArticleDialog, NewsCard, NewsCardSkeleton, NewsEmpty } from '@/features/news/components/NewsCard';
import { useOfferTypeLabel } from '@/features/offers/components';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Alert } from '@/shared/ui/Alert';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Dialog, DialogFooter, ConfirmDialog } from '@/shared/ui/Dialog';

const OFFER_TYPES = ['PFA', 'PFE', 'Intership', 'Job'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const typeLabel = useOfferTypeLabel();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  const offerSchema = useMemo(
    () =>
      z
        .object({
          title: z.string().trim().min(5, t('companyHome.v.title')),
          content: z.string().trim().min(10, t('companyHome.v.content')),
          type: z.enum(OFFER_TYPES),
          start: z.string().min(1, t('companyHome.v.start')),
          end: z.string().optional(),
        })
        .refine((data) => !data.end || data.end > data.start, {
          message: t('companyHome.v.end'),
          path: ['end'],
        }),
    [t]
  );
  type OfferFormData = z.infer<typeof offerSchema>;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: { type: 'PFA' },
  });

  const fetchOffers = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      if (!companyId) {
        setOffers([]);
        return;
      }
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
  }, []);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(false);
    try {
      const response = await httpClient.get('/api/admin/news');
      const items: News[] = Array.isArray(response.data) ? response.data : [];
      setNews(items.filter((item) => isNewsVisibleTo(item, 'company')));
    } catch {
      setNewsError(true);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchNews();
  }, [fetchOffers, fetchNews]);

  const closeForm = () => {
    setShowForm(false);
    setFormError(null);
  };

  const onSubmit = async (data: OfferFormData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const companyId = localStorage.getItem('company_id');
      const normalizedEnd = data.end && data.end.trim() ? data.end : undefined;
      await httpClient.post('/api/offers', {
        ...data,
        start: data.start || '',
        end: normalizedEnd,
        start_date: data.start || '',
        end_date: normalizedEnd,
        companyid: companyId,
        createdat: new Date().toISOString(),
      });
      reset();
      closeForm();
      fetchOffers();
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('companyHome.createFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await httpClient.delete('/api/offers', { params: { id: pendingDelete._id } });
      setOffers((current) => current.filter((o) => o._id !== pendingDelete._id));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalApplicants = offers.reduce((sum, offer) => sum + (offer.candidacies?.length || 0), 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title={t('home.companyTitle')}
        description={t('home.companySubtitle')}
        className="mb-0"
        actions={
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            {t('home.createOffer')}
          </Button>
        }
      />

      {/* Real counts only */}
      <dl className="grid grid-cols-2 divide-x divide-line rounded-lg border border-line bg-surface rtl:divide-x-reverse">
        <div className="px-5 py-4">
          <dt className="text-sm text-muted-foreground">{t('home.activeOffers')}</dt>
          <dd className="mt-1 text-2xl font-semibold text-ink tabular-nums">{loading ? '–' : offers.length}</dd>
        </div>
        <div className="px-5 py-4">
          <dt className="text-sm text-muted-foreground">{t('home.totalApplicants')}</dt>
          <dd className="mt-1 text-2xl font-semibold text-ink tabular-nums">{loading ? '–' : totalApplicants}</dd>
        </div>
      </dl>

      <section aria-labelledby="your-offers">
        <div className="mb-4">
          <h2 id="your-offers" className="text-lg">{t('home.yourOffers')}</h2>
          <p className="text-sm text-muted-foreground">{t('home.offersSubtitleCompany')}</p>
        </div>

        {loading ? (
          <div className="h-40 rounded-lg border border-line bg-surface" aria-hidden="true" />
        ) : offers.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-6 py-10 text-center">
            <h3 className="text-base">{t('home.noOffersCompany')}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{t('home.noOffersCompanyDesc')}</p>
            <Button className="mt-5" onClick={() => setShowForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
              {t('home.createFirstOffer')}
            </Button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('home.positionTitle')}</th>
                  <th scope="col">{t('home.offerType')}</th>
                  <th scope="col">{t('companyHome.dates')}</th>
                  <th scope="col" className="text-end">{t('companyHome.applicants')}</th>
                  <th scope="col"><span className="sr-only">{t('companyHome.actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer._id}>
                    <td className="font-medium text-ink">{offer.title}</td>
                    <td><Badge variant="primary" size="sm">{typeLabel(offer.type)}</Badge></td>
                    <td className="whitespace-nowrap text-muted-foreground">
                      {offer.start ? formatDate(offer.start) : '–'}
                      {offer.end ? ` – ${formatDate(offer.end)}` : ''}
                    </td>
                    <td className="text-end tabular-nums">{offer.candidacies?.length || 0}</td>
                    <td>
                      <div className="flex justify-end gap-1 whitespace-nowrap">
                        <Link
                          to={`/company/candidacies/${offer._id}`}
                          className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-ink hover:bg-canvas"
                        >
                          {t('home.viewApplications')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(offer)}
                          className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-danger-600 hover:bg-danger-50"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="company-news">
        <div className="mb-4">
          <h2 id="company-news" className="text-lg">{t('home.latestNews')}</h2>
          <p className="text-sm text-muted-foreground">{t('home.updatesForCompanies')}</p>
        </div>
        {newsError && (
          <Alert variant="danger" action={{ label: t('visitor.news.retry'), onClick: fetchNews }}>
            {t('visitor.news.error')}
          </Alert>
        )}
        {newsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NewsCardSkeleton count={3} />
          </div>
        ) : !newsError && news.length === 0 ? (
          <NewsEmpty />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {news.map((item, index) => (
              <NewsCard key={item._id || `${item.title}-${index}`} news={item} onRead={setSelectedNews} />
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={t('home.createNewOffer')}
        description={t('home.fillOfferDetails')}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Input id="offer-title" label={t('home.positionTitle')} error={errors.title?.message} {...register('title')} />
          <div>
            <label htmlFor="offer-type" className="mb-1.5 block text-sm font-medium text-ink">{t('home.offerType')}</label>
            <select
              id="offer-type"
              className="h-10 w-full rounded-md border border-neutral-400 bg-surface px-3 text-ink focus:outline-none focus-visible:outline-none focus-visible:shadow-none focus:border-ink focus:ring-2 focus:ring-gold/40"
              {...register('type')}
            >
              {OFFER_TYPES.map((type) => (
                <option key={type} value={type}>{typeLabel(type)}</option>
              ))}
            </select>
          </div>
          <Textarea id="offer-content" label={t('home.description')} rows={6} error={errors.content?.message} {...register('content')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="offer-start" type="date" label={t('home.startDate')} error={errors.start?.message} {...register('start')} />
            <Input id="offer-end" type="date" label={t('home.endDate')} error={errors.end?.message} {...register('end')} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={submitting}>{t('home.createOffer')}</Button>
          </DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title={t('home.confirmDeleteOffer')}
        description={pendingDelete?.title}
        confirmLabel={t('companyHome.deleteOffer')}
      />

      <NewsArticleDialog news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
