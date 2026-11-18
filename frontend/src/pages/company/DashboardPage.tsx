import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/PageHeader';
import { MapPin } from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { companyStatsApi } from '@/entities/companyStats/api';
import type {
    CompanyStatsOverview,
    CompanyStatsTrends,
    OfferConversion,
    CompanyDemographics,
} from '@/entities/companyStats/api';

const COLORS = ['#14304D', '#C99A3B', '#6A7686', '#8DA5C2', '#3E6189', '#DFBA66', '#C3CAD3'];

const STATUS_COLORS: Record<string, string> = {
    pending: '#BF7716',
    accepted: '#1E7B4F',
    rejected: '#B42318',
};

function formatDay(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(document.documentElement.lang || 'en', { month: 'short', day: 'numeric' });
}

export function CompanyDashboardPage() {
    const { t } = useTranslation();
    const [overview, setOverview] = useState<CompanyStatsOverview | null>(null);
    const [trends, setTrends] = useState<CompanyStatsTrends | null>(null);
    const [offerPerf, setOfferPerf] = useState<OfferConversion[]>([]);
    const [demographics, setDemographics] = useState<CompanyDemographics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [ovRes, trRes, coRes, deRes] = await Promise.all([
                    companyStatsApi.getOverview(),
                    companyStatsApi.getTrends(30),
                    companyStatsApi.getConversions(),
                    companyStatsApi.getDemographics(),
                ]);
                setOverview(ovRes.data);
                setTrends(trRes.data);
                setOfferPerf(coRes.data);
                setDemographics(deRes.data);
            } catch (err) {
                console.error('Failed to load company stats:', err);
                setError(t('dashboard.loadFailed'));
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [t]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="mb-6 pb-5 border-b border-line" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-72 bg-gray-200 rounded-2xl" />
                    <div className="h-72 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">{error}</div>;
    }

    const statCards = overview
        ? [
            { label: t('analytics.totalOffers'), value: overview.totalOffers },
            { label: t('analytics.activeOffers'), value: overview.activeOffers },
            { label: t('analytics.totalViews'), value: overview.totalViews },
            { label: t('analytics.totalApplications'), value: overview.totalCandidacies },
        ]
        : [];

    // Merge view + application trends
    const viewMap = new Map((trends?.viewTrend || []).map((p) => [p.day, p.views || 0]));
    const appMap = new Map((trends?.applicationTrend || []).map((p) => [p.day, p.applications || 0]));
    const allDays = new Set([...viewMap.keys(), ...appMap.keys()]);
    const combinedTrend = [...allDays]
        .sort()
        .map((day) => ({
            day: formatDay(day),
            views: viewMap.get(day) || 0,
            applications: appMap.get(day) || 0,
        }));

    const statusData =
        demographics?.statusBreakdown.map((s) => ({
            name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
            value: s.count,
            color: STATUS_COLORS[s.status] || '#8D97A5',
        })) ?? [];

    const topCities =
        demographics?.byCity.map((c, i) => ({
            name: c.city || t('dashboard.unknown'),
            value: c.count,
            color: COLORS[i % COLORS.length],
        })) ?? [];

    // Top promotions for the bar chart
    const topPromotions =
        demographics?.byPromotion.map((p, i) => ({
            name: p.promotion || t('dashboard.unknown'),
            value: p.count,
            color: COLORS[i % COLORS.length],
        })) ?? [];

    return (
        <div className="space-y-8">
            <PageHeader title={t('analytics.title')} description={t('analytics.subtitle')} className="mb-0" />

            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-lg border border-line bg-line">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-surface px-5 py-4">
                        <dt className="text-sm text-muted-foreground">{card.label}</dt>
                        <dd className="mt-1 text-2xl font-semibold text-ink tabular-nums">{card.value.toLocaleString()}</dd>
                    </div>
                ))}
            </dl>

            {/* Trends chart + Status pie */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.trends')}</h3>
                    {combinedTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={combinedTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F3" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #DCE1E7' }} />
                                <Legend />
                                <Line type="monotone" dataKey="views" stroke="#14304D" strokeWidth={2} dot={{ fill: '#14304D', r: 3 }} name={t('analytics.views')} />
                                <Line type="monotone" dataKey="applications" stroke="#C99A3B" strokeWidth={2} dot={{ fill: '#C99A3B', r: 3 }} name={t('analytics.applications')} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                            No activity in the last 30 days
                        </div>
                    )}
                </div>

                {/* Application status pie */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.statusBreakdown')}</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={105}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={(props: { name?: string; percent?: number }) =>
                                        `${props.name || ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`
                                    }
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val) => [`${val} applications`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                            {t('analytics.noApplications')}
                        </div>
                    )}
                </div>
            </div>

            {/* Offers performance table — views + applications only, no conversion */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.offerPerf')}</h3>
                {offerPerf.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">{t('analytics.noOffers')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('analytics.offer')}</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('analytics.type')}</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('analytics.views')}</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('analytics.applications')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offerPerf.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate">{item.title}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center font-semibold text-cyan-600">{item.views}</td>
                                        <td className="py-3 px-4 text-center font-semibold text-amber-600">{item.applications}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Cities + Promotions */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top cities */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">{t('analytics.topCities')}</h3>
                    </div>
                    {topCities.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={topCities} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F3" />
                                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                                <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #DCE1E7' }} formatter={(val) => [`${val} applicants`]} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} name={t('companyHome.applicants')}>
                                    {topCities.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                            {t('analytics.noGeo')}
                        </div>
                    )}
                </div>

                {/* Promotions breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.byPromotion')}</h3>
                    {topPromotions.length > 0 ? (
                        <div className="space-y-3 mt-2">
                            {topPromotions.map((item, i) => {
                                const max = topPromotions[0]?.value || 1;
                                const pct = Math.round((item.value / max) * 100);
                                return (
                                    <div key={item.name} className="flex items-center gap-3">
                                        <div className="w-16 text-sm font-semibold text-gray-700 shrink-0">{item.name}</div>
                                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-colors"
                                                style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 w-8 text-right">{item.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                            {t('analytics.noPromo')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
