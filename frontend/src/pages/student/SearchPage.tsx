import { useState, useEffect } from 'react';
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
    { value: 'firstname', label: 'First Name' },
    { value: 'lastname', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'city', label: 'City' },
    { value: 'country', label: 'Country' },
    { value: 'type', label: 'Type' },
    { value: 'class', label: 'Class' },
    { value: 'promotion', label: 'Promotion' },
  ];

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Search</h1>
        <p className="text-primary-100 text-lg">Find students and browse offers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'students'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <User className="w-4 h-4" />
          Students
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'offers'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <Briefcase className="w-4 h-4" />
          Offers
        </button>
      </div>

      {/* Offers tab */}
      {activeTab === 'offers' && <AdvancedOfferSearch />}

      {/* Students tab */}
      {activeTab === 'students' && (
        <>
          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search By</label>
                  <select
                    value={searchProperty}
                    onChange={(e) => setSearchProperty(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-all bg-white"
                  >
                    {searchProperties.map((prop) => (
                      <option key={prop.value} value={prop.value}>{prop.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search Term</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      placeholder={`Enter ${searchProperties.find(p => p.value === searchProperty)?.label.toLowerCase()}...`}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  <span className="text-lg">Search Students</span>
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
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 transition-all flex items-center gap-2"
              >
                <MapIcon className="w-5 h-5" />
                {showMap ? 'Hide Map' : 'View All Students on Map'}
              </button>
            </div>
          )}

          {/* View mode toggle */}
          {searched && results.length > 0 && (
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">{results.length} student{results.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'list'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <List className="w-4 h-4" />
                  List View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'map'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <MapIcon className="w-4 h-4" />
                  Map View
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
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-3xl border-2 border-dashed border-gray-300 p-16 shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
                  <div className="relative text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-400 to-gray-500 mb-6 shadow-2xl shadow-gray-500/40">
                      <SearchIcon className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">No Students Found</h3>
                    <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">Try different search terms or change the search property</p>
                  </div>
                </div>
              ) : viewMode === 'list' ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {results.map((student) => (
                    <div key={student.id} className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-600" />
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          {resolvePictureSrc(student.picture) ? (
                            <img
                              src={resolvePictureSrc(student.picture) as string}
                              alt={`${student.firstname} ${student.lastname}`}
                              className="w-16 h-16 rounded-xl object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                              <User className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                              {student.firstname} {student.lastname}
                            </h3>
                            {student.type && (
                              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold mt-1">
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
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="h-[360px] sm:h-[480px] lg:h-[600px]">
                    <StudentMap locations={locations} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map view - before search */}
          {!searched && showMap && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
              <div className="h-[360px] sm:h-[480px] lg:h-[600px]">
                <StudentMap locations={locations} />
              </div>
            </div>
          )}

          {/* Empty state before search */}
          {!searched && !showMap && (
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50 rounded-3xl border-2 border-dashed border-primary-200 p-16 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 mb-6 shadow-2xl shadow-primary-500/40">
                  <SearchIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Start Searching</h3>
                <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                  Select a search property, enter your search term, and click "Search Students" to find your classmates
                </p>
                <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2">
                      <List className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="font-semibold">List View</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <MapIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="font-semibold">Map View</p>
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
