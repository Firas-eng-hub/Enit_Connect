import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, User, GraduationCap, Calendar, FileText, Send } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Student } from '@/entities/student/types';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Dialog, DialogFooter } from '@/shared/ui/Dialog';
import { resolvePictureSrc } from '@/shared/lib/media';

// Must match the backend default page size for /api/student/filter.
const FILTER_PAGE_SIZE = 50;

type FilterParams = { country?: string; city?: string; promotion?: string; class?: string };

const normalizeStudents = (rows: (Student & { id?: string })[]): Student[] =>
  rows.map((student) => ({ ...student, _id: student._id ?? student.id ?? '' }));

export function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [promotion, setPromotion] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  // Filter searches are paged; name search returns the top matches only.
  const [filterParams, setFilterParams] = useState<FilterParams | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requestStudent, setRequestStudent] = useState<Student | null>(null);
  const [requestForm, setRequestForm] = useState({ title: '', message: '', dueDate: '' });
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object') {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      const message = response?.data?.message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFilters = [country, city, promotion, studentClass].some((value) => value.trim());
    if (!query.trim() && !hasFilters) return;

    setLoading(true);
    setSearched(true);
    const params: FilterParams | null = hasFilters
      ? {
          country: country.trim() || undefined,
          city: city.trim() || undefined,
          promotion: promotion.trim() || undefined,
          class: studentClass.trim() || undefined,
        }
      : null;
    setFilterParams(params);
    try {
      const response = params
        ? await httpClient.get('/api/student/filter', { params: { ...params, limit: FILTER_PAGE_SIZE, offset: 0 } })
        : await httpClient.get('/api/student/find', { params: { q: query } });
      const page = normalizeStudents(response.data);
      setResults(page);
      setHasMore(!!params && page.length === FILTER_PAGE_SIZE);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!filterParams) return;
    setLoadingMore(true);
    try {
      const response = await httpClient.get('/api/student/filter', {
        params: { ...filterParams, limit: FILTER_PAGE_SIZE, offset: results.length },
      });
      const page = normalizeStudents(response.data);
      setResults((prev) => [...prev, ...page]);
      setHasMore(page.length === FILTER_PAGE_SIZE);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpenRequest = (student: Student) => {
    setRequestStudent(student);
    setRequestForm({
      title: t('search.defaultRequestTitle', { name: `${student.firstname} ${student.lastname}` }),
      message: '',
      dueDate: '',
    });
    setRequestError(null);
    setRequestSuccess(null);
  };

  const handleSendRequest = async () => {
    if (!requestStudent) return;
    if (!requestForm.title.trim()) {
      setRequestError(t('search.requestTitleRequired'));
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
      setRequestSuccess(t('search.requestSent'));
    } catch (err: unknown) {
      setRequestError(getErrorMessage(err, t('search.requestFailed')));
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('search.searchStudents')}</h1>
        <p className="text-muted-foreground text-lg">{t('search.companySubtitle')}</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.byName')}
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-ink px-4 py-2 text-white rounded-md transition-colors font-medium disabled:opacity-50 hover:bg-primary-800 text-sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border border-white border-t-transparent" />
              ) : (
                <span className="text-lg">{t('search.title')}</span>
              )}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('search.country')}</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Tunisia"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('search.city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Tunis"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('search.promotion')}</label>
              <input
                type="text"
                value={promotion}
                onChange={(e) => setPromotion(e.target.value)}
                placeholder="e.g., 2026"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('search.class')}</label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="e.g., 2nd Tel 1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
            <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
              
              <div className="relative text-center">
                <div className="bg-primary-50 inline-flex items-center justify-center w-10 h-10 rounded-3xl mb-3 text-primary-700">
                  <SearchIcon className="w-5 h-5 text-primary-700" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">{t('search.noStudents')}</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{t('search.noCandidatesHint')}</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((student) => (
                <div key={student._id} className="card p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {resolvePictureSrc(student.picture) ? (
                      <img
                        src={resolvePictureSrc(student.picture) as string}
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
                      <p className="text-sm text-gray-500">
                        {[student.class, student.promotion].filter(Boolean).join(' · ')}
                      </p>
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
                        {t('search.promoLabel', { value: student.promotion })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenRequest(student)}>
                      <span className="inline-flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {t('search.requestDocuments')}
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? t('search.searching') : t('search.loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!searched && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('search.startSearching')}</h3>
          <p className="text-gray-500">{t('search.enterKeywords')}</p>
        </div>
      )}

      <Dialog
        open={Boolean(requestStudent)}
        onClose={() => setRequestStudent(null)}
        title={t('search.requestDocuments')}
        description={t('search.requestDesc')}
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
            <label className="text-sm font-semibold text-gray-700">{t('search.requestTitleField')}</label>
            <input
              value={requestForm.title}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">{t('search.message')}</label>
            <textarea
              value={requestForm.message}
              onChange={(event) => setRequestForm((prev) => ({ ...prev, message: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">{t('search.dueDate')}</label>
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
            {t('search.close')}
          </Button>
          <Button onClick={handleSendRequest} isLoading={isRequesting}>
            <span className="inline-flex items-center gap-2">
              <Send className="w-4 h-4" />
              {t('search.sendRequest')}
            </span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
