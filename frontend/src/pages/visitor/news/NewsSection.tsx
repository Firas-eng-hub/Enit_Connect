import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import type { News } from '@/entities/news/types';
import { isNewsVisibleTo, newsDate, resolveNewsImage as resolveImageUrl } from '@/entities/news/lib';
import { NewsArticleDialog } from '@/features/news/components/NewsCard';
import { formatDate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Badge } from '@/shared/ui/Badge';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function NewsDate({ item }: { item: News }) {
  const { t } = useTranslation();
  const value = newsDate(item);
  return value ? (
    <time dateTime={value} className="text-sm text-muted-foreground">
      {formatDate(value)}
    </time>
  ) : (
    <span className="text-sm text-muted-foreground">{t('common.noDate')}</span>
  );
}

function NewBadge({ item, now }: { item: News; now: number }) {
  const { t } = useTranslation();
  const value = newsDate(item);
  if (!value || new Date(value).getTime() < now - WEEK_MS) return null;
  return <Badge variant="accent" size="sm">{t('visitor.news.new')}</Badge>;
}

function FeaturedArticle({ item, now, onRead }: { item: News; now: number; onRead: (item: News) => void }) {
  const { t } = useTranslation();
  const imageUrl = resolveImageUrl(item);
  return (
    <article className="grid overflow-hidden rounded-lg border border-line bg-surface md:grid-cols-2">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-56 w-full object-cover md:h-full md:max-h-80"
        />
      )}
      <div className={imageUrl ? 'p-6 lg:p-8' : 'p-6 lg:p-8 md:col-span-2'}>
        <div className="flex items-center gap-3">
          <NewsDate item={item} />
          <NewBadge item={item} now={now} />
        </div>
        <h3 className="mt-2 text-xl md:text-2xl">{item.title}</h3>
        <p className="mt-3 text-body line-clamp-4 max-w-prose">{item.content}</p>
        <Button variant="secondary" className="mt-5" onClick={() => onRead(item)}>
          {t('visitor.news.readArticle')}
        </Button>
      </div>
    </article>
  );
}

function ArticleCard({ item, now, onRead }: { item: News; now: number; onRead: (item: News) => void }) {
  const imageUrl = resolveImageUrl(item);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface hover:border-neutral-400">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[16/9] w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <NewsDate item={item} />
          <NewBadge item={item} now={now} />
        </div>
        <h3 className="mt-2 text-base">
          {/* Stretched button: the whole card is clickable, one focus stop. */}
          <button
            type="button"
            onClick={() => onRead(item)}
            className="text-start group-hover:underline underline-offset-2 after:absolute after:inset-0 after:content-['']"
          >
            {item.title}
          </button>
        </h3>
        <p className="mt-2 text-sm text-body line-clamp-3">{item.content}</p>
      </div>
    </article>
  );
}

function NewsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-64 rounded-lg border border-line bg-surface" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-lg border border-line bg-surface p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-neutral-100" />
            <div className="h-4 w-3/4 rounded bg-neutral-100" />
            <div className="h-3 w-full rounded bg-neutral-100" />
            <div className="h-3 w-2/3 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsSection() {
  const { t } = useTranslation();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selected, setSelected] = useState<News | null>(null);
  const [now] = useState(() => Date.now());

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const response = await httpClient.get<News[]>('/api/admin/news');
      const items = Array.isArray(response.data) ? response.data : [];
      setNews(items.filter((item) => isNewsVisibleTo(item, 'visitor')));
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <section aria-labelledby="news-heading" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h2 id="news-heading" className="heading-4 lg:heading-3">
          {t('visitor.news.title')}
        </h2>
        <p className="body-3 mt-2 text-muted-foreground">{t('visitor.news.subtitle')}</p>
      </header>

      {loading && <NewsSkeleton />}

      {!loading && hasError && (
        <Alert variant="danger" action={{ label: t('visitor.news.retry'), onClick: fetchNews }}>
          {t('visitor.news.error')}
        </Alert>
      )}

      {!loading && !hasError && news.length === 0 && (
        <p className="rounded-lg border border-line bg-surface px-6 py-10 text-center text-muted-foreground">
          {t('visitor.news.empty')}
        </p>
      )}

      {!loading && !hasError && news.length > 0 && (
        <div className="space-y-6">
          <FeaturedArticle item={news[0]} now={now} onRead={setSelected} />
          {news.length > 1 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {news.slice(1).map((item) => (
                <ArticleCard key={item._id} item={item} now={now} onRead={setSelected} />
              ))}
            </div>
          )}
        </div>
      )}

      <NewsArticleDialog news={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
