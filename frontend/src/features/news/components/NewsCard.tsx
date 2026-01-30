import { Calendar, FileText, ArrowRight, Newspaper } from 'lucide-react';
import type { News } from '@/entities/news/types';
import { Card, CardContent } from '@/shared/ui/Card';
import { formatDate } from '@/shared/lib/utils';

interface NewsCardProps {
  news: News;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  onRead?: (item: News) => void;
}

export function NewsCard({ news, onDelete, showDeleteButton, onRead }: NewsCardProps) {
  const imageSource = news.picture || news.image || '';
  
  // Build image URL - always use relative path for uploads
  // Vite dev server proxies /uploads to backend automatically
  let imageUrl: string | null = null;
  
  if (imageSource) {
    if (imageSource.startsWith('http')) {
      // Extract just the path from full URL (e.g., http://localhost:3000/uploads/x -> /uploads/x)
      try {
        const url = new URL(imageSource);
        imageUrl = url.pathname;
      } catch {
        imageUrl = imageSource;
      }
    } else {
      // Ensure path starts with /
      imageUrl = imageSource.startsWith('/') ? imageSource : `/${imageSource}`;
    }
  }
  
  // Debug logging
  console.log('NewsCard image debug:', {
    picture: news.picture,
    image: news.image,
    imageSource,
    imageUrl,
  });
  const dateValue = news.date || news.createdAt;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-12 h-12 text-primary-400" />
          </div>
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Calendar className="w-4 h-4 mr-1" />
          {dateValue ? formatDate(dateValue) : 'No date'}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{news.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-3">{news.content}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          {onRead && (
            <button
              type="button"
              onClick={() => onRead(news)}
              className="text-sm font-semibold text-primary-600 inline-flex items-center gap-1 group/btn hover:text-primary-700"
            >
              Read more
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          )}
          {showDeleteButton && onDelete && (
            <button
              onClick={onDelete}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </div>
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
          <div className="aspect-video bg-gray-200 animate-pulse" />
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
