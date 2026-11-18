import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { resolvePictureSrc } from '@/shared/lib/media';

export interface StudentResult {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  type?: string;
  workAt?: string;
  class?: string;
  promotion?: string;
  linkedin?: string;
  picture?: string;
  aboutme?: string;
}

export function StudentResultCard({ student }: { student: StudentResult }) {
  const { t } = useTranslation();
  const pictureSrc = resolvePictureSrc(student.picture);

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-400 transition-colors overflow-hidden">
      <div className="bg-ink h-1.5" />
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {pictureSrc ? (
            <img
              src={pictureSrc}
              alt={`${student.firstname} ${student.lastname}`}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center text-primary-700">
              <User className="w-8 h-8 text-primary-700" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              <Link to={`/user/student/${encodeURIComponent(student.id)}`} className="hover:underline">
                {student.firstname} {student.lastname}
              </Link>
            </h3>
            {student.type && (
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold mt-1">
                {student.type}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {student.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm truncate">{student.email}</span>
            </div>
          )}
          {student.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{student.phone}</span>
            </div>
          )}
          {(student.city || student.country) && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {student.city}{student.city && student.country && ', '}{student.country}
              </span>
            </div>
          )}
        </div>

        {(student.class || student.promotion || student.workAt) && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 text-xs">
              {student.class && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                  {t('search.classLabel', { value: student.class })}
                </span>
              )}
              {student.promotion && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                  {t('search.promoLabel', { value: student.promotion })}
                </span>
              )}
              {student.workAt && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">
                  @ {student.workAt}
                </span>
              )}
            </div>
          </div>
        )}

        {student.aboutme && (
          <p className="mt-4 text-sm text-gray-600 line-clamp-2 italic">
            "{student.aboutme}"
          </p>
        )}
      </div>
    </div>
  );
}
