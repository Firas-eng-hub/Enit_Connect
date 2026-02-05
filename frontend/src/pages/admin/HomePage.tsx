import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Newspaper, Trash2, Calendar, Image, Filter, Search, Users, Pencil, MessageSquare } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { News } from '@/entities/news/types';
import { formatDate, getApiErrorMessage } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';

const newsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['draft', 'published']),
  audience: z.array(z.enum(['student', 'company', 'visitor'])).min(1, 'Select at least one audience'),
  category: z.string().optional(),
  tags: z.string().optional(),
});

type NewsFormData = z.infer<typeof newsSchema>;

type MessagePreview = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  message: string;
  date?: string;
  read?: boolean;
  archived?: boolean;
};

export function HomePage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [recentUnread, setRecentUnread] = useState<MessagePreview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageSize, setPageSize] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      status: 'published',
      audience: ['student', 'company', 'visitor'],
    },
  });

  useEffect(() => {
    fetchNews();
    fetchMessages();
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

  const fetchMessages = async () => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const response = await httpClient.get('/api/admin/message');
      const unread = (response.data as MessagePreview[])
        .filter((msg) => !msg.read && !msg.archived)
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        .slice(0, 3);
      setRecentUnread(unread);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessagesError(getApiErrorMessage(err, 'Failed to load messages.'));
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setImageRemoved(false);
    }
  };

  const onSubmit = async (data: NewsFormData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      // For simplicity, just sending JSON data
      // In a full implementation, you'd use FormData for image upload
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];
      let pictureValue = editingNews?.picture || editingNews?.image || '';

      if (selectedImage) {
        const extension = selectedImage.name.split('.').pop() || 'png';
        const formData = new FormData();
        formData.append('file', selectedImage);
        const uploadResponse = await httpClient.post(`/api/admin/newsdoc?type=${extension}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        pictureValue = uploadResponse.data?.link || pictureValue;
      } else if (imageRemoved) {
        pictureValue = '';
      }

      const payload = {
        title: data.title,
        content: data.content,
        date: new Date(data.date).toISOString(),
        status: data.status,
        audience: data.audience,
        category: data.category,
        tags,
        picture: pictureValue || undefined,
      };

      if (editingNews) {
        await httpClient.patch(`/api/admin/news/${editingNews._id}`, payload);
      } else {
        await httpClient.post('/api/admin/news', payload);
      }
      reset();
      setShowForm(false);
      setSelectedImage(null);
      setImagePreview(null);
      setImageRemoved(false);
      setEditingNews(null);
      fetchNews();
    } catch (err) {
      console.error('Failed to create news:', err);
      setFormError(getApiErrorMessage(err, 'Failed to create news. Please try again.'));
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

  const handleEdit = (item: News) => {
    setEditingNews(item);
    const imageSource = item.picture || item.image || '';
    
    // Build image URL - same logic as NewsCard
    let imageUrl: string | null = null;
    if (imageSource) {
      if (imageSource.startsWith('http')) {
        try {
          const url = new URL(imageSource);
          imageUrl = url.pathname;
        } catch {
          imageUrl = imageSource;
        }
      } else {
        imageUrl = imageSource.startsWith('/') ? imageSource : `/${imageSource}`;
      }
    }
    
    setImagePreview(imageUrl);
    setSelectedImage(null);
    setImageRemoved(false);
    reset({
      title: item.title,
      content: item.content,
      date: (item.date || item.createdAt || new Date().toISOString()).slice(0, 10),
      status: (item.status || 'published') as 'draft' | 'published',
      audience: (item.audience || ['student', 'company', 'visitor']) as ('student' | 'company' | 'visitor')[],
      category: item.category || '',
      tags: (item.tags || []).join(', '),
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const normalizedNews = news.map((item) => ({
    ...item,
    date: item.date || item.createdAt || '',
    status: item.status || 'published',
    audience: item.audience || ['student', 'company', 'visitor'],
  }));

  const filteredNews = normalizedNews
    .filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const haystack = `${item.title} ${item.content}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (!item.date || new Date(item.date) < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (!item.date || new Date(item.date) > toDate) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-6 shadow-xl flex-1 mr-6">
          <h1 className="text-3xl font-bold text-white">News Management</h1>
          <p className="text-primary-100 mt-1">Create and manage platform news</p>
        </div>
        <button
          onClick={() => {
            setEditingNews(null);
            reset({
              title: '',
              content: '',
              date: new Date().toISOString().slice(0, 10),
              status: 'published',
              audience: ['student', 'company', 'visitor'],
              category: '',
              tags: '',
            });
            setSelectedImage(null);
            setImagePreview(null);
            setImageRemoved(false);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Create News
        </button>
      </div>

      {/* Create News Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">{editingNews ? 'Edit News' : 'Create News'}</h2>
              <p className="text-primary-100 mt-1">Share important updates with the community</p>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                {formError && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 rounded-xl p-4">
                    {formError}
                  </div>
                )}
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                    {errors.date && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.date.message}</p>}
                  </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  {errors.status && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.status.message}</p>}
                  <p className="mt-2 text-xs text-gray-500">Drafts are visible only in the admin dashboard.</p>
                </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Visible To *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['student', 'company', 'visitor'] as const).map((audience) => (
                      <label key={audience} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          value={audience}
                          {...register('audience')}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                        {audience.charAt(0).toUpperCase() + audience.slice(1)}
                      </label>
                    ))}
                  </div>
                  {errors.audience && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.audience.message}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category (optional)</label>
                    <input
                      {...register('category')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Announcements, Events, Careers..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (optional)</label>
                    <input
                      {...register('tags')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="internship, hackathon, alumni"
                    />
                  </div>
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
                            setImageRemoved(true);
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
                      setImageRemoved(false);
                      setEditingNews(null);
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
                        {editingNews ? 'Save Changes' : 'Publish News'}
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Search by title or content"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as typeof statusFilter);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
              <div className="min-w-[140px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Page Size</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                >
                  {[6, 12, 24].map((size) => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4 text-gray-400" />
              Showing {filteredNews.length} result{filteredNews.length === 1 ? '' : 's'}
            </div>
          </div>

          {paginatedNews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 lg:p-10 text-center text-gray-600">
              No news matched your filters.
            </div>
          ) : (
            paginatedNews.map((item) => {
            const imageSource = item.picture || item.image || '';
            
            // Build image URL - same logic as NewsCard
            let imageUrl: string | null = null;
            if (imageSource) {
              if (imageSource.startsWith('http')) {
                try {
                  const url = new URL(imageSource);
                  imageUrl = url.pathname;
                } catch {
                  imageUrl = imageSource;
                }
              } else {
                imageUrl = imageSource.startsWith('/') ? imageSource : `/${imageSource}`;
              }
            }
            
            return (
            <div key={item._id} className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-600" />
              <div className="p-8">
                <div className="flex items-start gap-6">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-32 h-32 rounded-xl object-cover flex-shrink-0 shadow-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                    <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">{item.content}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{item.date ? formatDate(item.date) : 'N/A'}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        item.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.status === 'draft' ? 'Draft' : 'Published'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        <Users className="w-3.5 h-3.5" />
                        {(item.audience || []).length} audience
                      </span>
                      {item.category && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all border-2 border-transparent hover:border-primary-200"
                    aria-label="Edit news"
                  >
                    <Pencil className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
                    aria-label="Delete news"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Page {currentPageSafe} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPageSafe === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Messages Center</h2>
              <p className="mt-2 text-gray-600">Manage incoming contact messages, reply quickly, and keep your inbox organized.</p>
            </div>
          </div>
          <Link to="/admin/messages">
            <Button variant="outline" size="sm">Open Inbox</Button>
          </Link>
        </div>

        <div className="mt-6">
          {messagesLoading ? (
            <div className="flex items-center gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
              Loading recent messages...
            </div>
          ) : messagesError ? (
            <div className="text-sm text-red-600">{messagesError}</div>
          ) : recentUnread.length === 0 ? (
            <div className="text-sm text-gray-500">No unread messages right now.</div>
          ) : (
            <div className="grid gap-3">
              {recentUnread.map((msg) => (
                <div key={msg.id || msg._id} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{msg.name}</span>
                    <span>•</span>
                    <span>{msg.email}</span>
                    <span>•</span>
                    <span>{msg.date ? formatDate(msg.date) : 'N/A'}</span>
                  </div>
                  <p className="mt-2 text-gray-700 line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
