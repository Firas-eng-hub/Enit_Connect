import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, Filter, Map as MapIcon, List, User, Briefcase } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { AdvancedOfferSearch } from '@/features/search/components/AdvancedOfferSearch';
import { NetworkMapPanel } from '@/features/student-map';
import { StudentResultCard, type StudentResult } from './components/StudentResultCard';

type ViewMode = 'list' | 'map';

// Must match the backend default page size for /api/student/search.
const PAGE_SIZE = 50;

const tabClass = (active: boolean) =>
  `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
    active ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }`;

const viewClass = (active: boolean) =>
  `px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
    active ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }`;

export function SearchPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'students' | 'offers'>('students');
  const [searchKey, setSearchKey] = useState('');
  const [searchProperty, setSearchProperty] = useState('firstname');
  // The query the map follows: empty key shows everyone.
  const [submitted, setSubmitted] = useState({ property: 'firstname', key: '' });
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = (property: string, key: string, offset: number) =>
    httpClient
      .get<StudentResult[]>('/api/student/search', { params: { property, key, limit: PAGE_SIZE, offset } })
      .then((response) => response.data);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = searchKey.trim();
    setSubmitted({ property: searchProperty, key });
    if (!key) {
      setSearched(false);
      setResults([]);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const page = await fetchPage(searchProperty, key, 0);
      setResults(page);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await fetchPage(submitted.property, submitted.key, results.length);
      setResults((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const searchProperties = [
    { value: 'firstname', label: t('search.firstName') },
    { value: 'lastname', label: t('search.lastName') },
    { value: 'city', label: t('search.city') },
    { value: 'country', label: t('search.country') },
    { value: 'type', label: t('search.type') },
    { value: 'class', label: t('search.class') },
    { value: 'promotion', label: t('search.promotion') },
  ];
  const propertyLabel = searchProperties.find((p) => p.value === searchProperty)?.label ?? '';

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('search.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('search.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('students')} className={tabClass(activeTab === 'students')}>
          <User className="w-4 h-4" />
          {t('search.students')}
        </button>
        <button onClick={() => setActiveTab('offers')} className={tabClass(activeTab === 'offers')}>
          <Briefcase className="w-4 h-4" />
          {t('search.offers')}
        </button>
      </div>

      {/* Offers tab */}
      {activeTab === 'offers' && <AdvancedOfferSearch />}

      {/* Students tab */}
      {activeTab === 'students' && (
        <>
          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex flex-col gap-4 mb-4 sm:flex-row">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('search.searchBy')}</label>
                  <select
                    value={searchProperty}
                    onChange={(e) => setSearchProperty(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors bg-white"
                  >
                    {searchProperties.map((prop) => (
                      <option key={prop.value} value={prop.value}>{prop.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('search.searchTerm')}</label>
                  <div className="relative">
                    <SearchIcon className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      placeholder={t('search.enterTerm', { field: propertyLabel.toLowerCase() })}
                      className="w-full ps-12 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-ink w-full px-4 py-2 text-white rounded-md transition-colors font-medium disabled:opacity-50 hover:bg-primary-800 text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border border-white border-t-transparent" />
                    <span>{t('search.searching')}</span>
                  </div>
                ) : (
                  <span className="text-lg">{t('search.searchStudents')}</span>
                )}
              </button>
            </div>
          </form>

          {/* View mode toggle: always available */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">
                {searched ? t('search.studentsFound', { count: results.length }) : t('search.everyone')}
              </span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode('list')} className={viewClass(viewMode === 'list')}>
                <List className="w-4 h-4" />
                {t('search.listView')}
              </button>
              <button type="button" onClick={() => setViewMode('map')} className={viewClass(viewMode === 'map')}>
                <MapIcon className="w-4 h-4" />
                {t('search.mapView')}
              </button>
            </div>
          </div>

          {viewMode === 'map' ? (
            // A new search starts the map fresh (filters, list scope, selection).
            <NetworkMapPanel
              key={`${submitted.property}:${submitted.key}`}
              property={submitted.property}
              searchKey={submitted.key}
            />
          ) : searched ? (
            loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
                <div className="bg-primary-50 inline-flex items-center justify-center w-10 h-10 rounded-3xl mb-3 text-primary-700">
                  <SearchIcon className="w-5 h-5 text-primary-700" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">{t('search.noStudents')}</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{t('search.noStudentsHint')}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {results.map((student) => (
                    <StudentResultCard key={student.id} student={student} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="rounded-md border border-line bg-surface px-5 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-60"
                    >
                      {loadingMore ? t('search.searching') : t('search.loadMore')}
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
              <div className="bg-primary-50 inline-flex items-center justify-center w-10 h-10 rounded-3xl mb-3 text-primary-700">
                <SearchIcon className="w-5 h-5 text-primary-700" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">{t('search.startTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{t('search.startHint')}</p>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
              >
                <MapIcon className="w-4 h-4" />
                {t('search.exploreMap')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
