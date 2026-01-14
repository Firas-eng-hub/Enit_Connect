import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Newspaper, Trash2, Calendar, Image } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { News } from '@/entities/news/types';
import { formatDate } from '@/shared/lib/utils';

const newsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

type NewsFormData = z.infer<typeof newsSchema>;

export function HomePage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await httpClient.get('/api/admin/news');
      setNews(response.data);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: NewsFormData) => {
    setSubmitting(true);
    try {
      // For simplicity, just sending JSON data
      // In a full implementation, you'd use FormData for image upload
      await httpClient.post('/api/admin/news', data);
      reset();
      setShowForm(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchNews();
    } catch (err) {
      console.error('Failed to create news:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (newsId: string) => {
    if (!confirm('Are you sure you want to delete this news?')) return;

    try {
      await httpClient.delete(`/api/admin/news/${newsId}`);
      setNews(news.filter((n) => n._id !== newsId));
    } catch (err) {
      console.error('Failed to delete news:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-6 shadow-xl flex-1 mr-6">
          <h1 className="text-3xl font-bold text-white">News Management</h1>
          <p className="text-primary-100 mt-1">Create and manage platform news</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl flex items-center gap-2 shrink-0">
          <Plus className="w-5 h-5" />
          Create News
        </button>
      </div>

      {/* Create News Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Create News</h2>
              <p className="text-primary-100 mt-1">Share important updates with the community</p>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input {...register('title')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="Enter news title" />
                  {errors.title && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                  <textarea {...register('content')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none" rows={6} placeholder="Write the news content..." />
                  {errors.content && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.content.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Image (optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-3">
                          <Image className="w-8 h-8 text-primary-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 mb-1">Click to upload an image</span>
                        <span className="text-xs text-gray-500">PNG, JPG up to 10MB</span>
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Newspaper className="w-5 h-5" />
                        Publish News
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* News list */}
      {news.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50 rounded-3xl border-2 border-dashed border-primary-300 p-16 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-100 to-purple-100 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 mb-6 shadow-2xl shadow-primary-500/40 animate-pulse">
              <Newspaper className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No News Posted Yet</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">Create your first news article to keep users informed about important updates and announcements</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold text-lg shadow-2xl shadow-primary-500/40 hover:shadow-3xl hover:shadow-primary-500/50 hover:scale-105 transform">
              <Plus className="w-6 h-6" />
              Create First News
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {news.map((item) => (
            <div key={item._id} className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-600" />
              <div className="p-8">
                <div className="flex items-start gap-6">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-32 h-32 rounded-xl object-cover flex-shrink-0 shadow-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                    <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">{item.content}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 inline-flex">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{item.createdAt ? formatDate(item.createdAt) : 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
