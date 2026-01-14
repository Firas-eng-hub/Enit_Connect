import { Calendar, FileText } from 'lucide-react';
import type { News } from '@/entities/news/types';
import { Card, CardContent } from '@/shared/ui/Card';
import { formatDate } from '@/shared/lib/utils';
import { config } from '@/app/config/env';

interface NewsCardProps {
  news: News;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export function NewsCard({ news, onDelete, showDeleteButton }: NewsCardProps) {
  const imageUrl = news.image
    ? news.image.startsWith('http')
      ? news.image
      : `${config.apiUrl}/${news.image}`
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={news.title}
          className="w-full h-48 object-cover"
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Calendar className="w-4 h-4 mr-1" />
          {news.createdAt ? formatDate(news.createdAt) : 'No date'}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{news.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-3">{news.content}</p>

        {showDeleteButton && onDelete && (
          <button
            onClick={onDelete}
            className="mt-4 text-sm text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        )}
      </CardContent>
    </Card>
  );
}

interface NewsCardSkeletonProps {
  count?: number;
}

export function NewsCardSkeleton({ count = 3 }: NewsCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="w-full h-48 bg-gray-200 animate-pulse" />
          <CardContent className="p-6">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mt-1" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function NewsEmpty() {
  return (
    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">No news yet</h3>
      <p className="text-gray-500">Check back later for updates</p>
    </div>
  );
}
