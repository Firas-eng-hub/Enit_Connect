import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search as SearchIcon, User, Building2, RefreshCw, Users, LayoutGrid, Table2 } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Student } from '@/entities/student/types';
import type { Company } from '@/entities/company/types';

type StudentSearchResult = Student & { resultType: 'student' };
type CompanySearchResult = Company & { resultType: 'company' };
type SearchResult = StudentSearchResult | CompanySearchResult;
type UserFilter = 'all' | 'students' | 'companies';
type ViewMode = 'cards' | 'table';

type BrowseUsersResponse = {
  data: SearchResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const PAGE_SIZE = 50;

const getDisplayName = (result: SearchResult) =>
  result.resultType === 'student'
    ? `${(result as Student).firstname} ${(result as Student).lastname}`.trim()
    : (result as Company).name;

export function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const apiType = filter === 'students' ? 'students' : filter === 'companies' ? 'companies' : 'all';

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['admin-users-browse', apiType, debouncedQuery],
    queryFn: async ({ pageParam }) => {
      const response = await httpClient.get<BrowseUsersResponse>('/api/admin/users', {
        params: {
          type: apiType,
          q: debouncedQuery,
          limit: PAGE_SIZE,
          offset: pageParam,
        },
      });
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const results = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;
  const loadedStudents = results.filter((item) => item.resultType === 'student').length;
  const loadedCompanies = results.filter((item) => item.resultType === 'company').length;

  useEffect(() => {
    if (!hasNextPage || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || isFetchingNextPage) return;
        fetchNextPage();
      },
      { rootMargin: '240px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('search.browseUsers')}</h1>
        <p className="text-muted-foreground text-lg">{t('search.browseUsersSub')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('search.usersPlaceholder')}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${(isLoading || isRefetching) ? 'animate-spin' : ''}`} />
              {t('search.refresh')}
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-semibold">{t('search.userType')}</span>
              {(['all', 'students', 'companies'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filter === option
                      ? 'bg-ink text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option === 'all' ? t('search.all') : option === 'students' ? t('search.students') : t('search.companies')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-semibold">{t('search.view')}</span>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-ink text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                {t('search.cards')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-ink text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Table2 className="w-4 h-4" />
                {t('search.table')}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
            <Users className="w-4 h-4" />
            Total: {total}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">Loaded Students: {loadedStudents}</span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">Loaded Companies: {loadedCompanies}</span>
          <span className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700">
            Loaded: {results.length}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">
          {t('search.usersFailed')}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-gray-200">
          <SearchIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">{t('search.noUsers')}</h3>
          <p className="text-gray-500">{t('search.tryAnother')}</p>
        </div>
      ) : (
        <div>
          {viewMode === 'cards' ? (
            <div className="space-y-4">
              {results.map((result) => (
                <article key={result._id} className="card p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        result.resultType === 'student' ? 'bg-blue-100' : 'bg-green-100'
                      }`}
                    >
                      {result.resultType === 'student' ? (
                        <User className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Building2 className="w-6 h-6 text-green-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 truncate">{getDisplayName(result)}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            result.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {result.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        <span>{result.email}</span>
                        <span className="capitalize">{result.resultType}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm border-separate border-spacing-0">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="sticky left-0 z-20 text-left font-semibold text-gray-700 px-4 py-3 bg-gray-50 border-r border-gray-200">
                        {t('search.name')}
                      </th>
                      <th className="text-left font-semibold text-gray-700 px-4 py-3">{t('search.type')}</th>
                      <th className="text-left font-semibold text-gray-700 px-4 py-3">{t('search.status')}</th>
                      <th className="text-left font-semibold text-gray-700 px-4 py-3">{t('search.email')}</th>
                      <th className="text-left font-semibold text-gray-700 px-4 py-3">{t('search.extra')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result._id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40">
                        <td className="sticky left-0 z-10 px-4 py-3 text-gray-900 font-medium bg-white border-r border-gray-100">
                          {getDisplayName(result)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              result.resultType === 'student'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {result.resultType === 'student' ? (
                              <User className="w-3.5 h-3.5" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5" />
                            )}
                            {result.resultType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              result.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{result.email}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {result.resultType === 'student'
                            ? `${(result as Student).class || t('search.noClass')}${(result as Student).promotion ? ` • ${(result as Student).promotion}` : ''}`
                            : (result as Company).website || t('search.noWebsite')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div ref={loadMoreRef} className="h-6" />
          {isFetchingNextPage && (
            <div className="text-center text-sm text-gray-500 py-2">{t('search.loadingMore')}</div>
          )}
          {!isFetchingNextPage && hasNextPage && (
            <div className="text-center text-sm text-gray-500 py-2">{t('search.scrollMore')}</div>
          )}
          {!hasNextPage && (
            <div className="text-center text-sm text-gray-500 py-2">{t('search.allLoaded')}</div>
          )}
        </div>
      )}
    </div>
  );
}
