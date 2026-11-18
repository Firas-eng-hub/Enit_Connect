import { useTranslation } from 'react-i18next';
import { Building2, Globe2, MapPin, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MapStats, RankedItem } from '../model/types';

function StatTile({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3">
      <div className="mt-0.5 text-gold-600" aria-hidden="true">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-ink">{children}</div>
      </div>
    </div>
  );
}

function RankedList({ items, empty }: { items: RankedItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <p className="truncate text-sm font-medium">
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className="text-neutral-400"> · </span>}
          {item.label} <span className="text-muted-foreground">({item.count})</span>
        </span>
      ))}
    </p>
  );
}

export function MapStatsStrip({ stats }: { stats: MapStats }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile icon={<Users className="h-5 w-5" />} label={t('studentMap.statsPeople')}>
        <p className="text-xl font-semibold tabular-nums">{stats.total}</p>
      </StatTile>
      <StatTile icon={<Globe2 className="h-5 w-5" />} label={t('studentMap.statsCountries')}>
        <p className="text-xl font-semibold tabular-nums">{stats.countries}</p>
      </StatTile>
      <StatTile icon={<MapPin className="h-5 w-5" />} label={t('studentMap.topCities')}>
        <RankedList items={stats.topCities} empty={t('studentMap.noneYet')} />
      </StatTile>
      <StatTile icon={<Building2 className="h-5 w-5" />} label={t('studentMap.topEmployers')}>
        <RankedList items={stats.topEmployers} empty={t('studentMap.noneYet')} />
      </StatTile>
    </div>
  );
}
