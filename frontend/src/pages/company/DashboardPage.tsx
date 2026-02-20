import { useEffect, useState } from 'react';
import {
    Briefcase,
    Eye,
    FileText,
    Activity,
    TrendingUp,
    MapPin,
} from 'lucide-react';
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    accepted: '#10b981',
    rejected: '#ef4444',
};

function formatDay(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CompanyDashboardPage() {
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
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 h-32" />
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
            { label: 'Total Offers', value: overview.totalOffers, icon: Briefcase, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30' },
            { label: 'Active Offers', value: overview.activeOffers, icon: Activity, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30' },
            { label: 'Total Views', value: overview.totalViews, icon: Eye, color: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/30' },
            { label: 'Total Applications', value: overview.totalCandidacies, icon: FileText, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/30' },
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
            color: STATUS_COLORS[s.status] || '#6b7280',
        })) ?? [];

    const topCities =
        demographics?.byCity.map((c, i) => ({
            name: c.city || 'Unknown',
            value: c.count,
            color: COLORS[i % COLORS.length],
        })) ?? [];

    // Top promotions for the bar chart
    const topPromotions =
        demographics?.byPromotion.map((p, i) => ({
            name: p.promotion || 'Unknown',
            value: p.count,
            color: COLORS[i % COLORS.length],
        })) ?? [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-8 h-8 text-white/80" />
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">Company Analytics</h1>
                </div>
                <p className="text-primary-100 text-lg">Track your offers' performance and applicant insights</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 shadow-lg hover:shadow-xl transition-shadow">
                            <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${card.color} rounded-full opacity-10`} />
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} ${card.shadow} shadow-lg mb-3`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Trends chart + Status pie */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Views & Applications (30 days)</h3>
                    {combinedTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={combinedTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <Legend />
                                <Line type="monotone" dataKey="views" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} name="Views" />
                                <Line type="monotone" dataKey="applications" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Applications" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                            No activity in the last 30 days
                        </div>
                    )}
                </div>

                {/* Application status pie */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Application Status Breakdown</h3>
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
                                    label={(props: any) =>
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
                            No applications yet
                        </div>
                    )}
                </div>
            </div>

            {/* Offers performance table — views + applications only, no conversion */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Offer Performance</h3>
                {offerPerf.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No offers yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Offer</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Type</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Views</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Applications</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offerPerf.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate">{item.title}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
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
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-900">Top Applicant Cities</h3>
                    </div>
                    {topCities.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={topCities} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(val) => [`${val} applicants`]} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Applicants">
                                    {topCities.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                            No geographic data yet
                        </div>
                    )}
                </div>

                {/* Promotions breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Applicants by Promotion Year</h3>
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
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800 w-8 text-right">{item.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                            No promotion data yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
