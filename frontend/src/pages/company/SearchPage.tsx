import { useState } from 'react';
import { Search as SearchIcon, User, GraduationCap, Calendar, FileText, Send } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Student } from '@/entities/student/types';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Dialog, DialogFooter } from '@/shared/ui/Dialog';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [promotion, setPromotion] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestStudent, setRequestStudent] = useState<Student | null>(null);
  const [requestForm, setRequestForm] = useState({ title: '', message: '', dueDate: '' });
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFilters = [country, city, promotion, studentClass].some((value) => value.trim());
    if (!query.trim() && !hasFilters) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = hasFilters
        ? await httpClient.get('/api/student/filter', {
          params: {
            country: country.trim() || undefined,
            city: city.trim() || undefined,
            promotion: promotion.trim() || undefined,
            class: studentClass.trim() || undefined,
          },
        })
        : await httpClient.get('/api/student/find', {
          params: { q: query },
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

  const handleOpenRequest = (student: Student) => {
    setRequestStudent(student);
    setRequestForm({
      title: `Documents request for ${student.firstname} ${student.lastname}`,
      message: '',
      dueDate: '',
    });
    setRequestError(null);
    setRequestSuccess(null);
  };

  const handleSendRequest = async () => {
    if (!requestStudent) return;
    if (!requestForm.title.trim()) {
      setRequestError('Request title is required.');
      return;
    }

    setIsRequesting(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      await httpClient.post('/api/company/document-requests', {
        studentId: requestStudent._id,
        title: requestForm.title,
        message: requestForm.message,
        dueDate: requestForm.dueDate || undefined,
      });
      setRequestSuccess('Request sent successfully.');
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setIsRequesting(false);
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
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-14 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <span className="text-lg">Search</span>
              )}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Tunisia"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Tunis"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Promotion</label>
              <input
                type="text"
                value={promotion}
                onChange={(e) => setPromotion(e.target.value)}
                placeholder="e.g., 2026"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="e.g., 2nd Tel 1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
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

                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenRequest(student)}>
                      <span className="inline-flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Request documents
                      </span>
                    </Button>
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

      <Dialog
        open={Boolean(requestStudent)}
        onClose={() => setRequestStudent(null)}
        title="Request documents"
        description="Ask a student to upload specific documents."
        size="lg"
      >
        <div className="space-y-4">
          {requestError && (
            <Alert variant="danger" className="text-sm rounded-xl">
              {requestError}
            </Alert>
          )}
          {requestSuccess && (
            <Alert variant="success" className="text-sm rounded-xl">
              {requestSuccess}
            </Alert>
          )}
          <div>
            <label className="text-sm font-semibold text-gray-700">Title</label>
            <input
              value={requestForm.title}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Message</label>
            <textarea
              value={requestForm.message}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, message: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Due date (optional)</label>
            <input
              type="date"
              value={requestForm.dueDate}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRequestStudent(null)}>
            Close
          </Button>
          <Button onClick={handleSendRequest} isLoading={isRequesting}>
            <span className="inline-flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send request
            </span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
