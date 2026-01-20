import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Briefcase, Users, Trash2, Calendar, Eye } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage } from '@/shared/lib/utils';
import type { Offer } from '@/entities/offer/types';
import type { News } from '@/entities/news/types';
import { NewsCard, NewsCardSkeleton, NewsEmpty } from '@/features/news/components/NewsCard';
import { formatDate, cn } from '@/shared/lib/utils';
import { config } from '@/app/config/env';

const offerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Description is required'),
  type: z.enum(['PFA', 'PFE', 'Intership', 'Job'] as const),
  start: z.string().min(1, 'Start date is required'),
  end: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

export function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: { type: 'PFA' },
  });

  useEffect(() => {
    fetchOffers();
    fetchNews();
  }, []);

  const fetchOffers = async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      if (!companyId) {
        setOffers([]);
        return;
      }
      const response = await httpClient.get('/api/offers/myoffers', {
        params: { id: companyId },
      });
      const normalized = response.data
        .map((o: Offer & { id?: string }) => ({
          ...o,
          _id: o._id || o.id || '',
        }))
        .filter((o: Offer) => o._id);
      setOffers(normalized);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const response = await httpClient.get('/api/admin/news');
      const visibleNews = response.data.filter((item: News) => {
        const statusValue = typeof item.status === 'string'
          ? item.status.toLowerCase().trim()
          : 'published';
        const audienceValue = Array.isArray(item.audience)
          ? item.audience.map((value: string) => value.toLowerCase().trim())
          : typeof item.audience === 'string'
            ? item.audience.split(',').map((value: string) => value.toLowerCase().trim()).filter(Boolean)
            : ['student', 'company', 'visitor'];
        const audienceList = audienceValue.length > 0 ? audienceValue : ['student', 'company', 'visitor'];
        return statusValue !== 'draft' && audienceList.includes('company');
      });
      setNews(visibleNews);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setNewsError('Failed to load news');
    } finally {
      setNewsLoading(false);
    }
  };

  const onSubmit = async (data: OfferFormData) => {
    setSubmitting(true);
    try {
      const companyId = localStorage.getItem('company_id');
      const offerData = {
        ...data,
        start: data.start || '', // Ensure start is never undefined
        companyid: companyId,
        createdat: new Date().toISOString(),
      };
      await httpClient.post('/api/offers', offerData);
      reset();
      setShowForm(false);
      fetchOffers();
    } catch (err) {
      console.error('Failed to create offer:', err);
      alert(getApiErrorMessage(err, 'Failed to create offer. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      await httpClient.delete('/api/offers', { params: { id: offerId } });
      setOffers(offers.filter((o) => o._id !== offerId));
    } catch (err) {
      console.error('Failed to delete offer:', err);
    }
  };

  const typeColors: Record<string, string> = {
    PFA: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400',
    PFE: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400',
    Intership: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400',
    Job: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const totalOffers = offers.length;
  const totalApplicants = offers.reduce((sum, offer) => sum + (offer.candidacies?.length || 0), 0);

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-3xl px-8 py-10 shadow-xl mb-8">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-emerald-300/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Company Dashboard</h1>
            <p className="text-primary-100 text-lg">Post opportunities, review applicants, and follow campus updates</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold shadow-lg hover:bg-primary-50 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Offer
          </button>
        </div>
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-white/30 shadow-lg">
            <div className="text-sm text-gray-500 mb-2">Active Offers</div>
            <div className="text-3xl font-bold text-gray-900">{totalOffers}</div>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-white/30 shadow-lg">
            <div className="text-sm text-gray-500 mb-2">Total Applicants</div>
            <div className="text-3xl font-bold text-gray-900">{totalApplicants}</div>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-white/30 shadow-lg">
            <div className="text-sm text-gray-500 mb-2">News for Companies</div>
            <div className="text-3xl font-bold text-gray-900">{news.length}</div>
          </div>
        </div>
      </div>

      <section className="mb-12">
        <div className="rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-sky-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold uppercase tracking-wide mb-3">
                Company Feed
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Latest News</h2>
              <p className="text-gray-600">Updates curated for companies</p>
            </div>
            <button
              onClick={fetchNews}
              className="px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6">
            {newsError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{newsError}</div>}
            {newsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <NewsCardSkeleton count={3} />
              </div>
            ) : news.length === 0 ? (
              <NewsEmpty />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {news.map((item, index) => {
                  const newsKey = item._id || (item as { id?: string }).id || `${item.title}-${index}`;
                  return <NewsCard key={newsKey} news={item} onRead={setSelectedNews} />;
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedNews && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700">
              <h3 className="text-lg font-bold text-white">Full Article</h3>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="px-3 py-1.5 text-sm font-semibold text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              {(() => {
                const imageSource = selectedNews.picture || selectedNews.image;
                const imageUrl = imageSource
                  ? imageSource.startsWith('http')
                    ? imageSource
                    : `${config.apiUrl}/${imageSource}`
                  : null;
                return imageUrl ? (
                  <div className="rounded-2xl overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={selectedNews.title}
                      className="w-full max-h-96 object-cover"
                    />
                  </div>
                ) : null;
              })()}
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedNews.title}</h4>
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" />
                  {selectedNews.date || selectedNews.createdAt
                    ? formatDate((selectedNews.date || selectedNews.createdAt)!)
                    : 'No date'}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNews.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Offer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Create New Offer</h2>
              <p className="text-primary-100 mt-1">Fill in the details to post a new opportunity</p>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                {/* Basic Information Section */}
                <div className="space-y-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position Title *</label>
                      <input 
                        {...register('title')} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" 
                        placeholder="e.g., Full Stack Developer Intern" 
                      />
                      {errors.title && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.title.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Type *</label>
                      <select {...register('type')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white">
                        <option value="PFA">PFA - Projet de Fin d'Année</option>
                        <option value="PFE">PFE - Projet de Fin d'Études</option>
                        <option value="Intership">Internship</option>
                        <option value="Job">Full-time Job</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                      <textarea 
                        {...register('content')} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none" 
                        rows={5}
                        placeholder="Describe the role, responsibilities, required skills, and what makes this opportunity exciting..."
                      />
                      {errors.content && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.content.message}</p>}
                    </div>
                  </div>
                </div>

              {/* Timeline Section */}
              <div className="space-y-6 mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  Timeline
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                    <input 
                      {...register('start')} 
                      type="date" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" 
                    />
                    {errors.start && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.start.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date (Optional)</label>
                    <input 
                      {...register('end')} 
                      type="date" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Offer
                    </>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      <section className="mb-12">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wide mb-3">
                Hiring Pipeline
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Offers</h2>
              <p className="text-gray-600">Track, edit, and manage recruitment opportunities</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Offer
            </button>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-purple-50 rounded-3xl border-2 border-dashed border-primary-300 p-16 shadow-xl">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-100 to-blue-100 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>
            
            <div className="relative text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 mb-6 shadow-2xl shadow-primary-500/40 animate-pulse">
                <Briefcase className="w-12 h-12 text-white" />
              </div>
              
              {/* Title */}
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Start Your Recruitment Journey</h3>
              
              {/* Description */}
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Post your first job offer and connect with talented students from ENIT. 
                Build your team with the best candidates in engineering and technology.
              </p>
              
              {/* Features grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Reach Students</h4>
                  <p className="text-sm text-gray-600">Access talented engineering students</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Manage Offers</h4>
                  <p className="text-sm text-gray-600">Create PFA, PFE, internships & jobs</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Track Applications</h4>
                  <p className="text-sm text-gray-600">Review and manage candidacies easily</p>
                </div>
              </div>
              
              {/* CTA Button */}
              <button 
                onClick={() => setShowForm(true)} 
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold text-lg shadow-2xl shadow-primary-500/40 hover:shadow-3xl hover:shadow-primary-500/50 hover:scale-105 transform"
              >
                <Plus className="w-6 h-6" />
                Create Your First Offer
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {offers.map((offer, index) => {
              const offerKey = offer._id || (offer as { id?: string }).id || `${offer.companyid}-${offer.title}-${index}`;
              return (
              <div key={offerKey} className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Colored top bar based on type */}
                <div className={cn(
                  'h-1.5',
                  offer.type === 'PFA' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  offer.type === 'PFE' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                  offer.type === 'Intership' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                  'bg-gradient-to-r from-amber-500 to-amber-600'
                )} />
                
                <div className="p-8">
                  <div className="flex items-start gap-8">
                    {/* Left side - Offer info */}
                    <div className="flex-1 min-w-0">
                      {/* Type badge and title */}
                      <div className="flex items-center gap-4 mb-4">
                        <span className={cn('px-4 py-1.5 rounded-lg text-sm font-bold tracking-wide', typeColors[offer.type])}>
                          {offer.type}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{offer.title}</h3>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-600 leading-relaxed mb-6 text-base line-clamp-3">{offer.content}</p>
                      
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-6">
                        {(offer.start || offer.end) && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold text-gray-700 text-sm">
                              {offer.start && formatDate(offer.start)}
                              {offer.start && offer.end && ' → '}
                              {offer.end && formatDate(offer.end)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                          <Users className="w-5 h-5 text-emerald-600" />
                          <span className="font-bold text-emerald-700 text-lg">
                            {offer.candidacies?.length || 0}
                          </span>
                          <span className="text-emerald-600 font-medium text-sm">applicant{offer.candidacies?.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex flex-col gap-3 shrink-0">
                    <Link
                      to={`/company/candidacies/${offer._id || (offer as { id?: string }).id}`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 transform"
                    >
                        <Eye className="w-5 h-5" />
                        View Applications
                      </Link>
                      <button
                        onClick={() => handleDelete(offer._id)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-400 hover:text-red-600 transition-all font-semibold text-sm hover:scale-105 transform"
                      >
                        <Trash2 className="w-5 h-5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
