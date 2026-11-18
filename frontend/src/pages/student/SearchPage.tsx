import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, Filter, Map as MapIcon, List, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { StudentMap } from '@/widgets/maps/StudentMap';
import { config } from '@/app/config/env';
import { AdvancedOfferSearch } from '@/features/search/components/AdvancedOfferSearch';

interface StudentResult {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  type?: string;
  workAt?: string;
  class?: string;
  promotion?: string;
  linkedin?: string;
  picture?: string;
  aboutme?: string;
}

interface StudentLocation {
  id?: string;
  lat: number | string;
  lng: number | string;
  name: string;
}

export function SearchPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'students' | 'offers'>('students');
  const [searchKey, setSearchKey] = useState('');
  const [searchProperty, setSearchProperty] = useState('firstname');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [locations, setLocations] = useState<StudentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showMap, setShowMap] = useState(false);

  const resolvePictureSrc = (picture?: string | null) => {
    if (!picture) return null;
    const trimmed = picture.trim();
    if (!trimmed) return null;
    const apiBase = config.apiUrl || window.location.origin;

    if (trimmed.startsWith('/uploads')) {
      return config.apiUrl ? `${config.apiUrl}${trimmed}` : trimmed;
    }
    if (trimmed.startsWith('uploads/')) {
      return config.apiUrl ? `${config.apiUrl}/${trimmed}` : `/${trimmed}`;
    }
    if (
      trimmed.startsWith('http://localhost') ||
      trimmed.startsWith('http://127.0.0.1') ||
      trimmed.startsWith('http://0.0.0.0') ||
      trimmed.startsWith('https://localhost') ||
      trimmed.startsWith('https://127.0.0.1')
    ) {
      try {
        const url = new URL(trimmed);
        return `${apiBase}${url.pathname}`;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  };

  useEffect(() => {
    const loadAllLocations = async () => {
      try {
        const response = await httpClient.get('/api/student/location', {
          params: { property: 'firstname', key: '' }
        });
        setLocations(response.data);
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllLocations();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKey.trim()) {
      setSearched(false);
      setResults([]);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await httpClient.get('/api/student/search', {
        params: { property: searchProperty, key: searchKey }
      });
      setResults(response.data);

      const locationResponse = await httpClient.get('/api/student/location', {
        params: { property: searchProperty, key: searchKey }
      });
      setLocations(locationResponse.data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setLocations([]);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('search.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('search.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'students'
              ? 'bg-ink text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <User className="w-4 h-4" />
          {t('search.students')}
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'offers'
              ? 'bg-ink text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
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
          <form onSubmit={handleSearch} className="mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex gap-4 mb-4">
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
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      placeholder={`Enter ${searchProperties.find(p => p.value === searchProperty)?.label.toLowerCase()}...`}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors"
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

          {/* View All Students on Map button */}
          {!searched && (
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="bg-ink px-4 py-2 text-white rounded-md font-medium transition-colors flex items-center gap-2 hover:bg-primary-800 text-sm"
              >
                <MapIcon className="w-4 h-4" />
                {showMap ? t('search.hideMap') : t('search.viewMap')}
              </button>
            </div>
          )}

          {/* View mode toggle */}
          {searched && results.length > 0 && (
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">{results.length} student{results.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'list'
                      ? 'bg-ink text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <List className="w-4 h-4" />
                  {t('search.listView')}
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'map'
                      ? 'bg-ink text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <MapIcon className="w-4 h-4" />
                  {t('search.mapView')}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {searched && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
                  <div className="relative text-center">
                    <div className="bg-primary-50 inline-flex items-center justify-center w-10 h-10 rounded-3xl mb-3 text-primary-700">
                      <SearchIcon className="w-5 h-5 text-primary-700" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">{t('search.noStudents')}</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{t('search.noStudentsHint')}</p>
                  </div>
                </div>
              ) : viewMode === 'list' ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {results.map((student) => (
                    <div key={student.id} className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-400 transition-colors overflow-hidden">
                      <div className="bg-ink h-1.5" />
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          {resolvePictureSrc(student.picture) ? (
                            <img
                              src={resolvePictureSrc(student.picture) as string}
                              alt={`${student.firstname} ${student.lastname}`}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center text-primary-700">
                              <User className="w-8 h-8 text-primary-700" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                              {student.firstname} {student.lastname}
                            </h3>
                            {student.type && (
                              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold mt-1">
                                {student.type}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {student.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm truncate">{student.email}</span>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{student.phone}</span>
                            </div>
                          )}
                          {(student.city || student.country) && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {student.city}{student.city && student.country && ', '}{student.country}
                              </span>
                            </div>
                          )}
                        </div>

                        {(student.class || student.promotion || student.workAt) && (
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2 text-xs">
                              {student.class && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                                  Class: {student.class}
                                </span>
                              )}
                              {student.promotion && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                                  Promo: {student.promotion}
                                </span>
                              )}
                              {student.workAt && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">
                                  @ {student.workAt}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {student.aboutme && (
                          <p className="mt-4 text-sm text-gray-600 line-clamp-2 italic">
                            "{student.aboutme}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="h-[360px] sm:h-[480px] lg:h-[600px]">
                    <StudentMap locations={locations} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map view - before search */}
          {!searched && showMap && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
              <div className="h-[360px] sm:h-[480px] lg:h-[600px]">
                <StudentMap locations={locations} />
              </div>
            </div>
          )}

          {/* Empty state before search */}
          {!searched && !showMap && (
            <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
              <div className="relative text-center">
                <div className="bg-primary-50 inline-flex items-center justify-center w-10 h-10 rounded-3xl mb-3 text-primary-700">
                  <SearchIcon className="w-5 h-5 text-primary-700" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">{t('search.startTitle')}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Select a search property, enter your search term, and click t('search.searchStudents') to find your classmates
                </p>
                <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2">
                      <List className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="font-semibold">{t('search.listView')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <MapIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="font-semibold">{t('search.mapView')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
