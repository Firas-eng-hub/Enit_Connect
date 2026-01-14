import type { News } from '@/entities/news/types';
import { NewsCard, NewsCardSkeleton, NewsEmpty } from './NewsCard';

interface NewsListProps {
  news: News[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
}

export function NewsList({ news, loading, onDelete, showDeleteButton }: NewsListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NewsCardSkeleton count={6} />
      </div>
    );
  }

  if (news.length === 0) {
    return <NewsEmpty />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {news.map((item) => (
        <NewsCard
          key={item._id}
          news={item}
          onDelete={() => onDelete?.(item._id)}
          showDeleteButton={showDeleteButton}
        />
      ))}
    </div>
  );
}
