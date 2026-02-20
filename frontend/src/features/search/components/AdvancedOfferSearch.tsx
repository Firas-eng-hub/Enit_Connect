import { useState, useEffect, useCallback } from 'react';
import {
    Search as SearchIcon,
    Filter,
    ChevronDown,
    ChevronUp,
    Bookmark,
    BookmarkPlus,
    Building2,
    Calendar,
    X,
} from 'lucide-react';
import { searchApi } from '@/entities/search/api';
import type { SearchFilters, SearchOffer, SavedSearch } from '@/entities/search/api';
import { cn, formatDate } from '@/shared/lib/utils';
import httpClient from '@/shared/api/httpClient';

const OFFER_TYPES = ['PFA', 'PFE', 'Intership', 'Job'];

const typeColors: Record<string, string> = {
    PFA: 'bg-blue-100 text-blue-700 border-blue-200',
    PFE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Intership: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Job: 'bg-amber-100 text-amber-700 border-amber-200',
};

interface CompanyOption {
    _id: string;
    name: string;
}

interface AdvancedOfferSearchProps {
    onSelectOffer?: (offer: SearchOffer) => void;
}

export function AdvancedOfferSearch({ onSelectOffer }: AdvancedOfferSearchProps) {
    const [query, setQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [companyId, setCompanyId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [results, setResults] = useState<SearchOffer[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');

    const PAGE_SIZE = 12;

    useEffect(() => {
        httpClient.get('/api/company/list').then((res) => setCompanies(res.data || [])).catch(() => { });
        searchApi.listSaved().then((res) => setSavedSearches(res.data || [])).catch(() => { });
    }, []);

    const buildFilters = useCallback(
        (page = 0): SearchFilters => ({
            q: query || undefined,
            type: selectedTypes.length > 0 ? selectedTypes : undefined,
            companyId: companyId || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            active: activeOnly || undefined,
            sort: 'date',
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
        }),
        [query, selectedTypes, companyId, dateFrom, dateTo, activeOnly]
    );

    const performSearch = useCallback(
        async (page = 0) => {
            setLoading(true);
            setSearched(true);
            try {
                const res = await searchApi.advancedSearch(buildFilters(page));
                setResults(res.data.offers);
                setTotalCount(res.data.totalCount);
                setCurrentPage(page);
            } catch (err) {
                console.error('Search failed:', err);
                setResults([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        },
        [buildFilters]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(0);
    };

    const toggleType = (type: string) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const clearFilters = () => {
        setQuery('');
        setSelectedTypes([]);
        setCompanyId('');
        setDateFrom('');
        setDateTo('');
        setActiveOnly(false);
        setSearched(false);
        setResults([]);
    };

    const handleSaveSearch = async () => {
        if (!saveName.trim()) return;
        try {
            const res = await searchApi.createSaved({
                name: saveName,
                filters: buildFilters(0),
            });
            setSavedSearches((prev) => [res.data, ...prev]);
            setShowSaveModal(false);
            setSaveName('');
        } catch {
            alert('Failed to save search');
        }
    };

    const loadSavedSearch = (saved: SavedSearch) => {
        const f = saved.filters;
        setQuery(f.q || '');
        setSelectedTypes(
            Array.isArray(f.type) ? f.type : f.type ? [f.type] : []
        );
        setCompanyId(f.companyId || '');
        setDateFrom(f.dateFrom || '');
        setDateTo(f.dateTo || '');
        setActiveOnly(f.active || false);
        setTimeout(() => performSearch(0), 0);
    };

    const deleteSavedSearch = async (id: string) => {
        try {
            await searchApi.deleteSaved(id);
            setSavedSearches((prev) => prev.filter((s) => s.id !== id));
        } catch {
            alert('Failed to delete search');
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const hasActiveFilters = selectedTypes.length > 0 || companyId || dateFrom || dateTo || activeOnly;

    return (
        <div>
            {/* Saved searches bar */}
            {savedSearches.length > 0 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    <Bookmark className="w-4 h-4 text-gray-400 shrink-0" />
                    {savedSearches.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium shrink-0 cursor-pointer hover:bg-primary-100 transition-colors group"
                        >
                            <span onClick={() => loadSavedSearch(s)}>{s.name}</span>
                            <button
                                onClick={() => deleteSavedSearch(s.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
                <div className="flex gap-3 mb-4">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search offers by title or description..."
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-all"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-3 border-2 rounded-xl font-semibold transition-all',
                            hasActiveFilters
                                ? 'border-primary-400 text-primary-700 bg-primary-50'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                        )}
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Collapsible filters */}
                {showFilters && (
                    <div className="border-t border-gray-200 pt-4 space-y-4">
                        {/* Type checkboxes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Type</label>
                            <div className="flex flex-wrap gap-2">
                                {OFFER_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => toggleType(type)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-sm font-bold border transition-all',
                                            selectedTypes.includes(type)
                                                ? typeColors[type]
                                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Company + date range */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                                <select
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                >
                                    <option value="">All companies</option>
                                    {companies.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Posted After</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Posted Before</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        {/* Active toggle */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={activeOnly}
                                onChange={(e) => setActiveOnly(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Active offers only</span>
                        </label>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}

                <div className="flex gap-3 mt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search Offers'}
                    </button>
                    {searched && (
                        <button
                            type="button"
                            onClick={() => setShowSaveModal(true)}
                            className="px-4 py-3 border-2 border-primary-300 text-primary-700 rounded-xl hover:bg-primary-50 transition-all font-semibold flex items-center gap-2"
                        >
                            <BookmarkPlus className="w-4 h-4" />
                            Save
                        </button>
                    )}
                </div>
            </form>

            {/* Results header */}
            {searched && !loading && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">
                        {totalCount} offer{totalCount !== 1 ? 's' : ''} found
                    </p>
                </div>
            )}

            {/* Results grid */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : searched && results.length === 0 ? (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-4">
                        <SearchIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No offers found</h3>
                    <p className="text-gray-600">Try adjusting your filters or search terms</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.map((offer) => (
                        <div
                            key={offer.id}
                            className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                            onClick={() => onSelectOffer?.(offer)}
                        >
                            <div
                                className={cn(
                                    'h-1.5',
                                    offer.type === 'PFA' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                        offer.type === 'PFE' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                                            offer.type === 'Intership' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                                'bg-gradient-to-r from-amber-500 to-amber-600'
                                )}
                            />
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border', typeColors[offer.type] || 'bg-gray-100 text-gray-700 border-gray-200')}>
                                        {offer.type}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(offer.createdAt)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                                    {offer.title}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{offer.content}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">Company</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                        onClick={() => performSearch(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-all"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 px-4">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => performSearch(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Save search modal */}
            {showSaveModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowSaveModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Save Search</h3>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Give this search a name..."
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSearch}
                                disabled={!saveName.trim()}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
