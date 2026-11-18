import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, MapPin, Phone, User } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Student } from '@/entities/student/types';
import { resolvePictureSrc } from '@/shared/lib/media';

export function StudentPublicProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      try {
        const response = await httpClient.get(`/api/student/${id}`);
        setStudent(response.data);
      } catch (err) {
        console.error(err);
        setError(t('pagesMisc.publicFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  if (!student) {
    return <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">{t('pagesMisc.notFound')}</div>;
  }

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-2">{t('pagesMisc.studentProfile')}</h1>
            <p className="text-muted-foreground text-lg">{t('pagesMisc.publicDetails')}</p>
          </div>
          <Link
            to="/user/search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-canvas text-ink rounded-lg hover:bg-canvas transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('pagesMisc.backToSearch')}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-primary-50 px-8 py-8 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
              {resolvePictureSrc(student.picture) ? (
                <img
                  src={resolvePictureSrc(student.picture) as string}
                  alt={`${student.firstname} ${student.lastname}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{student.firstname} {student.lastname}</h2>
              <p className="text-gray-600">{student.class || t('pagesMisc.student')} · {student.promotion || t('pagesMisc.promotionNA')}</p>
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {student.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-primary-600" />
                <span>{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-primary-600" />
                <span>{student.phone}</span>
              </div>
            )}
            {(student.city || student.country) && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-primary-600" />
                <span>{student.city || t('pagesMisc.city')}{student.country ? `, ${student.country}` : ''}</span>
              </div>
            )}
            {student.workAt && (
              <div className="flex items-center gap-3 text-gray-700">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>{student.workAt}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('pagesMisc.about')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {student.aboutme || t('pagesMisc.noBio')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
