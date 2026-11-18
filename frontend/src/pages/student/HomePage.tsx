import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import type { Offer } from '@/entities/offer/types';
import type { News } from '@/entities/news/types';
import { isNewsVisibleTo } from '@/entities/news/lib';
import { NewsArticleDialog, NewsCard, NewsCardSkeleton, NewsEmpty } from '@/features/news/components/NewsCard';
import { RecommendedOffers } from '@/features/matching/components/RecommendedOffers';
import { OfferCard, ApplyModal } from '@/features/offers/components';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Alert } from '@/shared/ui/Alert';

interface CompanyInfo {
  _id: string;
  name: string;
  logo?: string;
  sector?: string;
}

const LATEST_OFFERS = 6;

export function HomePage() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [companiesInfo, setCompaniesInfo] = useState<CompanyInfo[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offersError, setOffersError] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(false);
    try {
      const response = await httpClient.get('/api/admin/news');
      const items: News[] = Array.isArray(response.data) ? response.data : [];
      setNews(items.filter((item) => isNewsVisibleTo(item, 'student')));
    } catch {
      setNewsError(true);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await httpClient.get('/api/offers');
        const offersData: Offer[] = Array.isArray(response.data) ? response.data : [];
        setOffers(offersData);
        if (offersData.length > 0) {
          const companiesResponse = await httpClient.post('/api/student/companiesinfo', {
            companies: offersData.map((o) => o.companyid),
          });
          setCompaniesInfo(Array.isArray(companiesResponse.data) ? companiesResponse.data : []);
        }
      } catch {
        setOffersError(true);
      } finally {
        setOffersLoading(false);
      }
    };
    fetchOffers();
    fetchNews();
  }, [fetchNews]);

  const handleApply = async (offerId: string, coverLetter: string) => {
    await httpClient.post(`/api/student/apply/${offerId}`, { body: coverLetter });
  };

  const companyFor = (companyId: string) => companiesInfo.find((c) => c._id === companyId);

  return (
    <div className="space-y-10">
      <PageHeader title={t('home.studentTitle')} description={t('home.studentSubtitle')} className="mb-0" />

      <RecommendedOffers />

      <section aria-labelledby="latest-offers">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="latest-offers" className="text-lg">{t('home.availableOffers')}</h2>
            <p className="text-sm text-muted-foreground">{t('home.offersSubtitle')}</p>
          </div>
          {offers.length > LATEST_OFFERS && (
            <Link to="/user/offers" className="shrink-0 text-sm font-medium text-ink underline underline-offset-2 hover:text-primary-700">
              {t('home.seeAllOffers')}
            </Link>
          )}
        </div>

        {offersError && <Alert variant="danger">{t('home.offersError')}</Alert>}

        {offersLoading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 rounded-lg border border-line bg-surface" />
            ))}
          </div>
        )}

        {!offersLoading && !offersError && offers.length === 0 && (
          <div className="rounded-lg border border-line bg-surface px-6 py-10 text-center">
            <h3 className="text-base">{t('home.noOffers')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('home.noOffersDesc')}</p>
          </div>
        )}

        {!offersLoading && offers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.slice(0, LATEST_OFFERS).map((offer, index) => {
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
      </section>

      <section aria-labelledby="campus-news">
        <div className="mb-4">
          <h2 id="campus-news" className="text-lg">{t('home.latestNews')}</h2>
          <p className="text-sm text-muted-foreground">{t('home.newsSubtitle')}</p>
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

      <ApplyModal
        offer={selectedOffer}
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onSubmit={handleApply}
      />
      <NewsArticleDialog news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
