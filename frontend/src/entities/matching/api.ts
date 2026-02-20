import httpClient from '@/shared/api/httpClient';

export interface MatchedOffer {
    id: string;
    title: string;
    type: string;
    content: string;
    start: string;
    end: string;
    createdAt: string;
    companyId: string;
    companyName: string;
    companyCity: string;
    companyCountry: string;
}

export interface Recommendation {
    offer: MatchedOffer;
    score: number;
    matchReasons: string[];
}

export interface RecommendationsResponse {
    recommendations: Recommendation[];
    total: number;
}

export const matchingApi = {
    getRecommendations: (limit = 6) =>
        httpClient.get<RecommendationsResponse>(
            `/api/student/matching/recommendations?limit=${limit}`
        ),
};
