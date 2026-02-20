import httpClient from '@/shared/api/httpClient';

export interface StatsOverview {
    students: number;
    companies: number;
    offers: number;
    activeOffers: number;
    candidacies: number;
}

export interface TrendPoint {
    month: string;
    count: number;
}

export interface StatusCount {
    status: string;
    count: number;
}

export interface TypeCount {
    type: string;
    count: number;
}

export interface TopCompany {
    name: string;
    offerCount: number;
}

export interface StatsTrends {
    registrationTrend: TrendPoint[];
    companyTrend: TrendPoint[];
    offerTrend: TrendPoint[];
    statusBreakdown: StatusCount[];
    typeDistribution: TypeCount[];
    topCompanies: TopCompany[];
}

export const statsApi = {
    getOverview: () =>
        httpClient.get<StatsOverview>('/api/admin/stats/overview'),

    getTrends: (months = 6) =>
        httpClient.get<StatsTrends>(`/api/admin/stats/trends?months=${months}`),
};
