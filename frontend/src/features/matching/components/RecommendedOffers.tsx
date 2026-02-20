import { useEffect, useState } from 'react';
import { Sparkles, Building2, MapPin, Calendar, ChevronRight, Star } from 'lucide-react';
import { matchingApi } from '@/entities/matching/api';
import type { Recommendation } from '@/entities/matching/api';
import { formatDate, cn } from '@/shared/lib/utils';

const scoreColor = (score: number) => {
    if (score >= 0.7) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 0.4) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
};

const scoreLabel = (score: number) => {
    if (score >= 0.7) return 'Strong match';
    if (score >= 0.4) return 'Good match';
    return 'Possible match';
};

interface RecommendedOffersProps {
    onSelectOffer?: (offerId: string) => void;
}

export function RecommendedOffers({ onSelectOffer }: RecommendedOffersProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRecs() {
            try {
                const res = await matchingApi.getRecommendations(6);
                setRecommendations(res.data.recommendations);
            } catch (err) {
                console.error('Failed to load recommendations:', err);
                setError('Could not load recommendations');
            } finally {
                setLoading(false);
            }
        }
        fetchRecs();
    }, []);

    if (loading) {
        return (
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                        <p className="text-gray-600">Loading personalized offers...</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || recommendations.length === 0) {
        return null; // Don't show section if no recommendations
    }

    return (
        <section className="mb-12">
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                            <p className="text-gray-600">Offers matching your profile</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recommendations.map((rec) => {
                        const { offer, score, matchReasons } = rec;
                        return (
                            <div
                                key={offer.id}
                                className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                                onClick={() => onSelectOffer?.(offer.id)}
                            >
                                {/* Score badge */}
                                <div className="p-5 pb-0 flex items-start justify-between">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border',
                                            scoreColor(score)
                                        )}
                                    >
                                        <Star className="w-3.5 h-3.5" />
                                        {Math.round(score * 100)}% — {scoreLabel(score)}
                                    </span>
                                </div>

                                <div className="p-5 pt-3">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {offer.title}
                                    </h3>

                                    {/* Company info */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{offer.companyName || 'Unknown Company'}</span>
                                    </div>

                                    {offer.companyCity && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {offer.companyCity}
                                                {offer.companyCountry ? `, ${offer.companyCountry}` : ''}
                                            </span>
                                        </div>
                                    )}

                                    {offer.start && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {formatDate(offer.start)}
                                                {offer.end ? ` — ${formatDate(offer.end)}` : ''}
                                            </span>
                                        </div>
                                    )}

                                    {/* Match reasons */}
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {matchReasons.slice(0, 2).map((reason, i) => (
                                            <span
                                                key={i}
                                                className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium"
                                            >
                                                {reason}
                                            </span>
                                        ))}
                                    </div>

                                    {/* View more */}
                                    <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                        View details
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
