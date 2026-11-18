import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/PageHeader';
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
    '#14304D', '#C99A3B', '#6A7686', '#8DA5C2',
    '#3E6189', '#DFBA66', '#C3CAD3', '#26354A',
];

const STATUS_COLORS: Record<string, string> = {
    pending: '#BF7716',
    accepted: '#1E7B4F',
    rejected: '#B42318',
};

function formatMonth(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(document.documentElement.lang || 'en', { month: 'short', year: '2-digit' });
}

export function DashboardPage() {
    const { t } = useTranslation();
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
                setError(t('dashboard.loadFailed'));
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [t]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="mb-6 pb-5 border-b border-line" />
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
            { label: t('adminDashboard.students'), value: overview.students },
            { label: t('adminDashboard.companies'), value: overview.companies },
            { label: t('adminDashboard.totalOffers'), value: overview.offers },
            { label: t('adminDashboard.activeOffers'), value: overview.activeOffers },
            { label: t('adminDashboard.candidacies'), value: overview.candidacies },
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
            color: STATUS_COLORS[s.status] || '#8D97A5',
        })) ?? [];

    const typeData =
        trends?.typeDistribution.map((t, i) => ({
            name: t.type,
            value: t.count,
            color: COLORS[i % COLORS.length],
        })) ?? [];

    return (
        <div className="space-y-8">
            <PageHeader title={t('adminDashboard.title')} description={t('adminDashboard.subtitle')} className="mb-0" />

            <dl className="grid grid-cols-2 lg:grid-cols-5 gap-px overflow-hidden rounded-lg border border-line bg-line">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-surface px-5 py-4">
                        <dt className="text-sm text-muted-foreground">{card.label}</dt>
                        <dd className="mt-1 text-2xl font-semibold text-ink tabular-nums">{card.value.toLocaleString()}</dd>
                    </div>
                ))}
            </dl>

            {/* Charts row 1 */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Registration & Offer trend */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('adminDashboard.growth')}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={combinedTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '6px', border: '1px solid #DCE1E7' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="students"
                                stroke="#14304D"
                                strokeWidth={2}
                                dot={{ fill: '#14304D', r: 4 }}
                                name={t('adminDashboard.newStudents')}
                            />
                            <Line
                                type="monotone"
                                dataKey="companies"
                                stroke="#C99A3B"
                                strokeWidth={2}
                                dot={{ fill: '#C99A3B', r: 4 }}
                                name={t('adminDashboard.newCompanies')}
                            />
                            <Line
                                type="monotone"
                                dataKey="offers"
                                stroke="#6A7686"
                                strokeWidth={2}
                                dot={{ fill: '#6A7686', r: 4 }}
                                name={t('adminDashboard.newOffers')}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Candidacy status pie */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('adminDashboard.candidacyStatus')}</h3>
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
                                label={(props: { name?: string; percent?: number }) =>
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
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('adminDashboard.offerTypes')}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={typeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F3" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                            <Tooltip
                                contentStyle={{ borderRadius: '6px', border: '1px solid #DCE1E7' }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} name={t('dashboard.count')}>
                                {typeData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top companies table */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('adminDashboard.topCompanies')}</h3>
                    {trends?.topCompanies.length === 0 ? (
                        <p className="text-gray-500 text-sm">{t('adminDashboard.noCompanies')}</p>
                    ) : (
                        <div className="space-y-3">
                            {trends?.topCompanies.map((company, i) => (
                                <div
                                    key={company.name}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <span className="bg-primary-50 flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold text-primary-700">
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
