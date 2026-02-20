import httpClient from '@/shared/api/httpClient';

export interface SearchFilters {
    q?: string;
    type?: string | string[];
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
    active?: boolean;
    sort?: 'date' | 'title' | 'type';
    limit?: number;
    offset?: number;
}

export interface SearchOffer {
    _id: string;
    id: string;
    title: string;
    type: string;
    content: string;
    start: string;
    end: string;
    companyid: string;
    companyId: string;
    createdAt: string;
}

export interface SearchResponse {
    offers: SearchOffer[];
    totalCount: number;
    limit: number;
    offset: number;
}

export interface SavedSearch {
    id: string;
    userId: string;
    userType: string;
    name: string;
    filters: SearchFilters;
    notify: boolean;
    createdAt: string;
    updatedAt: string;
}

export const searchApi = {
    advancedSearch: (filters: SearchFilters) => {
        const params = new URLSearchParams();
        if (filters.q) params.set('q', filters.q);
        if (filters.type) {
            params.set('type', Array.isArray(filters.type) ? filters.type.join(',') : filters.type);
        }
        if (filters.companyId) params.set('companyId', filters.companyId);
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.set('dateTo', filters.dateTo);
        if (filters.active) params.set('active', 'true');
        if (filters.sort) params.set('sort', filters.sort);
        if (filters.limit) params.set('limit', String(filters.limit));
        if (filters.offset) params.set('offset', String(filters.offset));
        return httpClient.get<SearchResponse>(`/api/search/offers/advanced?${params}`);
    },

    listSaved: () =>
        httpClient.get<SavedSearch[]>('/api/search/saved'),

    createSaved: (data: { name: string; filters: SearchFilters; notify?: boolean }) =>
        httpClient.post<SavedSearch>('/api/search/saved', data),

    updateSaved: (id: string, data: Partial<{ name: string; filters: SearchFilters; notify: boolean }>) =>
        httpClient.patch<SavedSearch>(`/api/search/saved/${id}`, data),

    deleteSaved: (id: string) =>
        httpClient.delete(`/api/search/saved/${id}`),
};
