import { useEffect, useState } from 'react';
import { Calendar, Newspaper, RefreshCw, Clock, ArrowRight, Sparkles } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { News } from '@/entities/news/types';
import { formatDate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { config } from '@/app/config/env';

// Skeleton loader
function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex items-center gap-2 pt-4">
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// News card component
function NewsCard({ news, featured = false }: { news: News; featured?: boolean }) {
  const imageUrl = news.image
    ? news.image.startsWith('http')
      ? news.image
      : `${config.apiUrl}/${news.image}`
    : null;

  const isRecent = news.createdAt && 
    new Date(news.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (featured) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Image */}
          <div className="aspect-video lg:aspect-auto lg:h-full relative overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={news.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                <Newspaper className="w-20 h-20 text-white/30" />
              </div>
            )}
            {isRecent && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-500 text-white text-xs font-bold shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  New
                </span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sm text-primary-600 font-medium mb-4">
              <Clock className="w-4 h-4" />
              {news.createdAt ? formatDate(news.createdAt) : 'No date'}
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-primary-900 transition-colors">
              {news.title}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6 line-clamp-3">
              {news.content}
            </p>
            <Button className="self-start group/btn">
              Read Full Article
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image */}
      <div className="aspect-video relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <Newspaper className="w-12 h-12 text-primary-400" />
          </div>
        )}
        {isRecent && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-500 text-white text-xs font-bold shadow-md">
              <Sparkles className="w-3 h-3" />
              New
            </span>
          </div>
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-3">
          <Calendar className="w-3.5 h-3.5" />
          {news.createdAt ? formatDate(news.createdAt) : 'No date'}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {news.title}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {news.content}
        </p>
        <button className="text-primary-600 text-sm font-semibold inline-flex items-center gap-1 group/btn hover:text-primary-700">
          Read more
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/api/admin/news');
      setNews(response.data);
    } catch (err) {
      setError('Failed to load news. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-3">
            <Newspaper className="w-4 h-4" />
            Latest Updates
          </div>
          <h2 className="text-3xl font-bold text-gray-900">News & Announcements</h2>
          <p className="text-gray-500 mt-2">Stay informed about the latest opportunities and events</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchNews}
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert 
          variant="danger" 
          title="Error loading news"
          className="mb-8 rounded-xl"
          action={{
            label: 'Try again',
            onClick: fetchNews
          }}
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && news.length === 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-6">
            <Newspaper className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No news yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            There are no news articles to display. Check back later for updates from ENIT Connect.
          </p>
        </div>
      )}

      {/* News Grid */}
      {!loading && !error && news.length > 0 && (
        <div className="space-y-10">
          {/* Featured Article (first one) */}
          {news.length > 0 && (
            <NewsCard news={news[0]} featured />
          )}

          {/* Regular Grid */}
          {news.length > 1 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">More Articles</h3>
                <span className="text-sm text-gray-500">{news.length - 1} more articles</span>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {news.slice(1).map((item) => (
                  <NewsCard key={item._id} news={item} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
