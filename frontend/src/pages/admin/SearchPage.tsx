import { useState } from 'react';
import { Search as SearchIcon, User, Building2, Mail } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Student } from '@/entities/student/types';
import type { Company } from '@/entities/company/types';

type SearchResult = (Student | Company) & { resultType: 'student' | 'company' };

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState<'all' | 'students' | 'companies'>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const isEmail = query.includes('@');
      const studentProps = isEmail ? ['email'] : ['firstname', 'lastname'];
      const companyProps = isEmail ? ['email'] : ['name'];

      const studentRequests = studentProps.map((property) =>
        httpClient.get('/api/admin/search/student', {
          params: { property, key: query }
        })
      );
      const companyRequests = companyProps.map((property) =>
        httpClient.get('/api/admin/search/company', {
          params: { property, key: query }
        })
      );

      const [studentResponses, companyResponses] = await Promise.all([
        Promise.all(studentRequests),
        Promise.all(companyRequests),
      ]);

      const combined: SearchResult[] = [];
      const addUnique = (items: Array<Student | Company>, resultType: 'student' | 'company') => {
        items.forEach((item) => {
          const id = (item as Student & { id?: string })._id ?? (item as Student & { id?: string }).id ?? '';
          if (!id) return;
          if (combined.some((entry) => entry._id === id && entry.resultType === resultType)) return;
          combined.push({ ...(item as Student | Company), _id: id, resultType });
        });
      };

      studentResponses.forEach((response) => addUnique(response.data, 'student'));
      companyResponses.forEach((response) => addUnique(response.data, 'company'));
      setResults(combined);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter((r) => 
        filter === 'students' ? r.resultType === 'student' : r.resultType === 'company'
      );

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Search Users</h1>
        <p className="text-primary-100 text-lg">Find students and companies in the platform</p>
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
              placeholder="Search by name, email..."
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
          <span className="text-sm font-semibold text-gray-700">Filter by Type:</span>
          {(['all', 'students', 'companies'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
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
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-purple-50 rounded-3xl border-2 border-dashed border-gray-300 p-16 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-100 to-purple-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
              
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-400 to-gray-500 mb-6 shadow-2xl shadow-gray-500/40">
                  <SearchIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">No Results Found</h3>
                <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">Try different keywords to find users</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div key={result._id} className="card p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      result.resultType === 'student' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {result.resultType === 'student' ? (
                        <User className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Building2 className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {result.resultType === 'student' 
                            ? `${(result as Student).firstname} ${(result as Student).lastname}`
                            : (result as Company).name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          result.status === 'Active' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {result.email}
                        </span>
                        <span className="capitalize">{result.resultType}</span>
                      </div>
                    </div>
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
          <p className="text-gray-500">Enter keywords to find users</p>
        </div>
      )}
    </div>
  );
}
