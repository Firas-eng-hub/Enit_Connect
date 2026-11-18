import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/ui';
import { resolvePictureSrc } from '@/shared/lib/media';
import { cn } from '@/shared/lib/utils';
import type { MapPerson } from '../model/types';

interface PeopleListProps {
  people: MapPerson[];
  activeId: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onHover: (person: MapPerson | null) => void;
  onFocus: (person: MapPerson) => void;
}

export function PeopleList({ people, activeId, hasMore, loadingMore, onLoadMore, onHover, onFocus }: PeopleListProps) {
  const { t } = useTranslation();
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  // Keep the active row in view.
  useEffect(() => {
    if (!activeId) return;
    itemRefs.current.get(activeId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  // Infinite scroll: fetch the next page when the sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingMore) onLoadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  if (people.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t('studentMap.emptyArea')}</p>;
  }

  return (
    <ul className="divide-y divide-line" onMouseLeave={() => onHover(null)}>
      {people.map((person) => {
        const subtitle = person.workAt
          ? t('studentMap.worksAt', { company: person.workAt })
          : [person.promotion && t('search.promoLabel', { value: person.promotion }), person.class]
              .filter(Boolean)
              .join(' · ');
        const place = [person.city, person.country].filter(Boolean).join(', ');
        return (
          <li key={person.id}>
            <button
              type="button"
              ref={(el) => {
                if (el) itemRefs.current.set(person.id, el);
                else itemRefs.current.delete(person.id);
              }}
              onMouseEnter={() => onHover(person)}
              onFocus={() => onHover(person)}
              onClick={() => onFocus(person)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-canvas focus:outline-none focus-visible:bg-canvas',
                person.id === activeId && 'bg-primary-50 hover:bg-primary-50'
              )}
            >
              <Avatar src={resolvePictureSrc(person.picture)} alt={person.name} fallback={person.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
                {subtitle && <p className="truncate text-xs text-body">{subtitle}</p>}
                {place && <p className="truncate text-xs text-muted-foreground">{place}</p>}
              </div>
            </button>
          </li>
        );
      })}
      {hasMore && (
        <li ref={sentinelRef} className="px-4 py-3 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-sm font-medium text-primary-700 hover:underline disabled:opacity-60"
          >
            {loadingMore ? t('studentMap.loading') : t('studentMap.loadMore')}
          </button>
        </li>
      )}
    </ul>
  );
}
