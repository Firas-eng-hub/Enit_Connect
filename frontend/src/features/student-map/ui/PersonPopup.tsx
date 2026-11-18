import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin } from 'lucide-react';
import { Avatar, Badge } from '@/shared/ui';
import { resolvePictureSrc } from '@/shared/lib/media';
import type { MapPerson } from '../model/types';

interface PersonPopupProps {
  person: MapPerson;
}

export function PersonPopup({ person }: PersonPopupProps) {
  const { t } = useTranslation();
  const place = [person.city, person.country].filter(Boolean).join(', ');
  const typeLabel =
    person.type === 'Alumni' ? t('studentMap.typeAlumni') : person.type ? t('studentMap.typeStudent') : null;

  return (
    <div className="w-60 p-3 text-start">
      <div className="flex items-center gap-3">
        <Avatar src={resolvePictureSrc(person.picture)} alt={person.name} fallback={person.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
          {typeLabel && (
            <Badge variant={person.type === 'Alumni' ? 'accent' : 'primary'} size="sm" className="mt-1">
              {typeLabel}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-neutral-700">
        {person.workAt && (
          <p className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 shrink-0 text-gold-600" aria-hidden="true" />
            <span className="truncate">{t('studentMap.worksAt', { company: person.workAt })}</span>
          </p>
        )}
        {place && (
          <p className="flex items-center gap-1.5" title={t('studentMap.approxLocation')}>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-500" aria-hidden="true" />
            <span className="truncate">{place}</span>
          </p>
        )}
      </div>

      {(person.promotion || person.class) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {person.promotion && (
            <Badge variant="neutral" size="sm">{t('search.promoLabel', { value: person.promotion })}</Badge>
          )}
          {person.class && (
            <Badge variant="neutral" size="sm">{t('search.classLabel', { value: person.class })}</Badge>
          )}
        </div>
      )}

      <Link
        to={`/user/student/${encodeURIComponent(person.id)}`}
        className="mt-3 flex h-8 items-center justify-center rounded-md bg-ink text-xs font-semibold !text-white hover:bg-primary-800"
      >
        {t('studentMap.viewProfile')}
      </Link>
    </div>
  );
}
