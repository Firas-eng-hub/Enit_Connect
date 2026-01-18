import { useState } from 'react';
import { Search as SearchIcon, User, GraduationCap, Calendar } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Student } from '@/entities/student/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await httpClient.get('/api/student/find', {
        params: { q: query }
      });
      const normalized = response.data.map((student: Student & { id?: string }) => ({
        ...student,
        _id: student._id ?? student.id ?? ''
      }));
      setResults(normalized);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Search Students</h1>
        <p className="text-primary-100 text-lg">Find talented students for your positions</p>
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
              placeholder="Search by name, skills, class..."
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

      {/* Results */}
      {searched && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50 rounded-3xl border-2 border-dashed border-gray-300 p-16 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-100 to-emerald-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
              
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-400 to-gray-500 mb-6 shadow-2xl shadow-gray-500/40">
                  <SearchIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">No Students Found</h3>
                <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">Try different keywords or search criteria to find the right candidates</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((student) => (
                <div key={student._id} className="card p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {student.picture ? (
                      <img
                        src={student.picture}
                        alt={`${student.firstname} ${student.lastname}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student.firstname} {student.lastname}
                      </h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {student.class && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        {student.class}
                      </div>
                    )}
                    {student.promotion && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Promotion {student.promotion}
                      </div>
                    )}
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
          <p className="text-gray-500">Enter keywords to find students</p>
        </div>
      )}
    </div>
  );
}
