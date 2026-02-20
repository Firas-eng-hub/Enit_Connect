import httpClient from '@/shared/api/httpClient';

export interface CompanyStatsOverview {
    totalOffers: number;
    activeOffers: number;
    totalCandidacies: number;
    totalViews: number;
}

export interface TrendPoint {
    day: string;
    views?: number;
    applications?: number;
}

export interface CompanyStatsTrends {
    viewTrend: TrendPoint[];
    applicationTrend: TrendPoint[];
}

export interface OfferConversion {
    id: string;
    title: string;
    type: string;
    createdAt: string;
    views: number;
    applications: number;
    conversionRate: number;
}

export interface DemographicItem {
    type?: string;
    city?: string;
    promotion?: string;
    count: number;
}

export interface StatusItem {
    status: string;
    count: number;
}

export interface CompanyDemographics {
    byType: DemographicItem[];
    byCity: DemographicItem[];
    byPromotion: DemographicItem[];
    statusBreakdown: StatusItem[];
}

export const companyStatsApi = {
    getOverview: () =>
        httpClient.get<CompanyStatsOverview>('/api/company/stats/overview'),

    getTrends: (days = 30) =>
        httpClient.get<CompanyStatsTrends>(`/api/company/stats/trends?days=${days}`),

    getConversions: () =>
        httpClient.get<OfferConversion[]>('/api/company/stats/conversions'),

    getDemographics: () =>
        httpClient.get<CompanyDemographics>('/api/company/stats/demographics'),
};
