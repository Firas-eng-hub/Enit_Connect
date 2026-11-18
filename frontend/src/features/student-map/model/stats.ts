import type { MapPerson, MapStats, RankedItem } from './types';

const TOP_N = 3;

function rank(values: (string | null)[], limit = TOP_N): RankedItem[] {
  const counts = new Map<string, RankedItem>();
  values.forEach((value) => {
    const label = value?.trim();
    if (!label) return;
    const key = label.toLowerCase();
    const item = counts.get(key);
    if (!item) {
      counts.set(key, { label, count: 1 });
      return;
    }
    item.count += 1;
    // Prefer a capitalised spelling ("Tunis" over "tunis") for display.
    if (item.label === item.label.toLowerCase() && label !== label.toLowerCase()) item.label = label;
  });
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function computeStats(people: MapPerson[]): MapStats {
  return {
    total: people.length,
    countries: rank(people.map((p) => p.country), Infinity).length,
    topCities: rank(people.map((p) => p.city)),
    topEmployers: rank(people.map((p) => p.workAt)),
  };
}
