import { useState } from 'react';
import { Search as SearchIcon, Filter } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Offer } from '@/entities/offer/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await httpClient.post('/api/student/search', { query });
      setResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter((r) => r.type === filter);

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Search Offers</h1>
        <p className="text-primary-100 text-lg">Find your next opportunity</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for offers, companies, keywords..."
              className="w-full pl-14 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg"
            />
          </div>
          <button type="submit" disabled={loading} className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            ) : (
              <span className="text-lg">Search</span>
            )}
          </button>
        </div>
      </form>

      {/* Filters */}
      {searched && results.length > 0 && (
        <div className="flex items-center gap-3 mb-8 bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filter by Type:</span>
          {['all', 'PFA', 'PFE', 'Intership', 'Job'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All Offers' : f}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-3xl border-2 border-dashed border-gray-300 p-16 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
              
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-400 to-gray-500 mb-6 shadow-2xl shadow-gray-500/40">
                  <SearchIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">No Results Found</h3>
                <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">Try different keywords, check spelling, or remove filters to see more results</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((offer) => (
                <div key={offer._id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                        offer.type === 'PFA' ? 'bg-blue-100 text-blue-700' :
                        offer.type === 'PFE' ? 'bg-purple-100 text-purple-700' :
                        offer.type === 'Intership' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {offer.type}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                      <p className="text-gray-600 mt-2 line-clamp-2">{offer.content}</p>
                    </div>
                    <button className="btn-primary">Apply</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!searched && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Start searching</h3>
          <p className="text-gray-500">Enter keywords to find offers and opportunities</p>
        </div>
      )}
    </div>
  );
}
