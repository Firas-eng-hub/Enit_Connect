import { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { AdminDocumentListParams } from '@/entities/document/types';
import { Button } from '@/shared/ui/Button';

type Props = {
  value: AdminDocumentListParams;
  onChange: (next: AdminDocumentListParams) => void;
};

export function DocumentFilters({ value, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = (patch: Partial<AdminDocumentListParams>) => onChange({ ...value, ...patch });

  const tagsValue = (value.tags || []).join(', ');

  const clear = () =>
    onChange({
      q: '',
      category: '',
      tags: [],
      type: undefined,
      from: undefined,
      to: undefined,
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      pageSize: value.pageSize || 20,
      emplacement: value.emplacement,
    });

  const hasActiveFilters = !!(value.q || value.category || value.tags?.length || value.type || value.from || value.to);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      {/* Main search row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={value.q || ''}
            onChange={(e) => set({ q: e.target.value, page: 1 })}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="Search documents..."
          />
        </div>
        
        <select
          value={value.type || ''}
          onChange={(e) => set({ type: (e.target.value || undefined) as AdminDocumentListParams['type'], page: 1 })}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <option value="">All Types</option>
          <option value="file">Files</option>
          <option value="folder">Folders</option>
        </select>

        <select
          value={`${value.sort || 'createdAt'}:${value.order || 'desc'}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split(':');
            set({
              sort: sort as AdminDocumentListParams['sort'],
              order: order as AdminDocumentListParams['order'],
              page: 1,
            });
          }}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="title:asc">A-Z</option>
          <option value="title:desc">Z-A</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          leftIcon={showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        >
          {showAdvanced ? 'Less' : 'More'}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            leftIcon={<X className="w-4 h-4" />}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Advanced filters - collapsible */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Category</span>
            <input
              value={value.category || ''}
              onChange={(e) => set({ category: e.target.value, page: 1 })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., Policies"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Tags</span>
            <input
              value={tagsValue}
              onChange={(e) =>
                set({
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                  page: 1,
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="comma,separated"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">From Date</span>
            <input
              type="date"
              value={value.from || ''}
              onChange={(e) => set({ from: e.target.value || undefined, page: 1 })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">To Date</span>
            <input
              type="date"
              value={value.to || ''}
              onChange={(e) => set({ to: e.target.value || undefined, page: 1 })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>
      )}
    </div>
  );
}
