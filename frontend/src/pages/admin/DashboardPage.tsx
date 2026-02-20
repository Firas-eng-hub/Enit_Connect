import { useEffect, useState } from 'react';
import {
    Users,
    Building2,
    Briefcase,
    FileText,
    TrendingUp,
    Activity,
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
import { statsApi } from '@/entities/stats/api';
import type {
    StatsOverview,
    StatsTrends,
} from '@/entities/stats/api';

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    accepted: '#10b981',
    rejected: '#ef4444',
};

function formatMonth(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function DashboardPage() {
    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [trends, setTrends] = useState<StatsTrends | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            setError(null);
            try {
                const [overviewRes, trendsRes] = await Promise.all([
                    statsApi.getOverview(),
                    statsApi.getTrends(6),
                ]);
                setOverview(overviewRes.data);
                setTrends(trendsRes.data);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10" />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
                    ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-72 bg-gray-200 rounded-2xl" />
                    <div className="h-72 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
    }

    const statCards = overview
        ? [
            { label: 'Students', value: overview.students, icon: Users, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30' },
            { label: 'Companies', value: overview.companies, icon: Building2, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30' },
            { label: 'Total Offers', value: overview.offers, icon: Briefcase, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/30' },
            { label: 'Active Offers', value: overview.activeOffers, icon: Activity, color: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/30' },
            { label: 'Candidacies', value: overview.candidacies, icon: FileText, color: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/30' },
        ]
        : [];

    // Build a month-keyed map for each series, then merge all three
    const monthSet = new Set([
        ...(trends?.registrationTrend || []).map((p) => p.month),
        ...(trends?.companyTrend || []).map((p) => p.month),
        ...(trends?.offerTrend || []).map((p) => p.month),
    ]);
    const regMap = new Map((trends?.registrationTrend || []).map((p) => [p.month, p.count]));
    const coMap = new Map((trends?.companyTrend || []).map((p) => [p.month, p.count]));
    const ofMap = new Map((trends?.offerTrend || []).map((p) => [p.month, p.count]));

    const combinedTrend = [...monthSet].sort().map((m) => ({
        month: formatMonth(m),
        students: regMap.get(m) ?? 0,
        companies: coMap.get(m) ?? 0,
        offers: ofMap.get(m) ?? 0,
    }));

    const statusData =
        trends?.statusBreakdown.map((s) => ({
            name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
            value: s.count,
            color: STATUS_COLORS[s.status] || '#6b7280',
        })) ?? [];

    const typeData =
        trends?.typeDistribution.map((t, i) => ({
            name: t.type,
            value: t.count,
            color: COLORS[i % COLORS.length],
        })) ?? [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-8 h-8 text-white/80" />
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">Platform Analytics</h1>
                </div>
                <p className="text-primary-100 text-lg">Real-time overview of ENIT-CONNECT activity</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className={`relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 shadow-lg hover:shadow-xl transition-shadow`}
                        >
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

            {/* Charts row 1 */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Registration & Offer trend */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Growth Trends (6 months)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={combinedTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="students"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                name="New Students"
                            />
                            <Line
                                type="monotone"
                                dataKey="companies"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', r: 4 }}
                                name="New Companies"
                            />
                            <Line
                                type="monotone"
                                dataKey="offers"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={{ fill: '#f59e0b', r: 4 }}
                                name="New Offers"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Candidacy status pie */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Candidacy Status</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
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
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Offer type distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Offer Types</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={typeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Count">
                                {typeData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top companies table */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Companies by Offers</h3>
                    {trends?.topCompanies.length === 0 ? (
                        <p className="text-gray-500 text-sm">No companies with offers yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {trends?.topCompanies.map((company, i) => (
                                <div
                                    key={company.name}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-bold shadow-sm">
                                        {i + 1}
                                    </span>
                                    <span className="flex-1 font-medium text-gray-900 truncate">
                                        {company.name}
                                    </span>
                                    <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                                        {company.offerCount} {company.offerCount === 1 ? 'offer' : 'offers'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
