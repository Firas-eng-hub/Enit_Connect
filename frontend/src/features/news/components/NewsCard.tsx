import { useTranslation } from 'react-i18next';
import type { News } from '@/entities/news/types';
import { newsDate, resolveNewsImage } from '@/entities/news/lib';
import { formatDate } from '@/shared/lib/utils';
import { Dialog } from '@/shared/ui/Dialog';

interface NewsCardProps {
  news: News;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  onRead?: (item: News) => void;
}

function NewsDateLabel({ item }: { item: News }) {
  const { t } = useTranslation();
  const value = newsDate(item);
  return value ? (
    <time dateTime={value} className="text-sm text-muted-foreground">{formatDate(value)}</time>
  ) : (
    <span className="text-sm text-muted-foreground">{t('common.noDate')}</span>
  );
}

export function NewsCard({ news, onDelete, showDeleteButton, onRead }: NewsCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveNewsImage(news);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface hover:border-neutral-400">
      {imageUrl && (
        <img src={imageUrl} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <NewsDateLabel item={news} />
        <h3 className="mt-2 text-base">
          {onRead ? (
            <button
              type="button"
              onClick={() => onRead(news)}
              className="text-start group-hover:underline underline-offset-2 after:absolute after:inset-0 after:content-['']"
            >
              {news.title}
            </button>
          ) : (
            news.title
          )}
        </h3>
        <p className="mt-2 text-sm text-body line-clamp-3">{news.content}</p>
        {showDeleteButton && onDelete && (
          <div className="relative z-10 mt-4">
            <button type="button" onClick={onDelete} className="text-sm font-medium text-danger-600 hover:text-danger-700">
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function NewsCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden="true" className="h-48 rounded-lg border border-line bg-surface p-5 space-y-3">
          <div className="h-3 w-24 rounded bg-neutral-100" />
          <div className="h-4 w-3/4 rounded bg-neutral-100" />
          <div className="h-3 w-full rounded bg-neutral-100" />
          <div className="h-3 w-2/3 rounded bg-neutral-100" />
        </div>
      ))}
    </>
  );
}

export function NewsEmpty() {
  const { t } = useTranslation();
  return (
    <p className="rounded-lg border border-line bg-surface px-6 py-10 text-center text-muted-foreground">
      {t('visitor.news.empty')}
    </p>
  );
}

/** Full article in a dialog. */
export function NewsArticleDialog({ news, onClose }: { news: News | null; onClose: () => void }) {
  const imageUrl = news ? resolveNewsImage(news) : null;
  return (
    <Dialog open={!!news} onClose={onClose} title={news?.title} size="full">
      {news && (
        <div className="max-h-[70vh] overflow-y-auto pb-6">
          <NewsDateLabel item={news} />
          {imageUrl && <img src={imageUrl} alt="" className="mt-4 w-full max-h-96 rounded-md object-cover" />}
          <p className="mt-4 whitespace-pre-wrap text-body leading-relaxed max-w-prose">{news.content}</p>
        </div>
      )}
    </Dialog>
  );
}
