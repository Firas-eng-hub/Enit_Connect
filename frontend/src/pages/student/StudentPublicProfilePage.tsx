import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, MapPin, Phone, User } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Student } from '@/entities/student/types';
import { config } from '@/app/config/env';

export function StudentPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvePictureSrc = (picture?: string | null) => {
    if (!picture) return null;
    const trimmed = picture.trim();
    if (!trimmed) return null;
    const apiBase = config.apiUrl || window.location.origin;

    if (trimmed.startsWith('/uploads')) {
      return config.apiUrl ? `${config.apiUrl}${trimmed}` : trimmed;
    }
    if (trimmed.startsWith('uploads/')) {
      return config.apiUrl ? `${config.apiUrl}/${trimmed}` : `/${trimmed}`;
    }
    if (
      trimmed.startsWith('http://localhost') ||
      trimmed.startsWith('http://127.0.0.1') ||
      trimmed.startsWith('http://0.0.0.0') ||
      trimmed.startsWith('https://localhost') ||
      trimmed.startsWith('https://127.0.0.1')
    ) {
      try {
        const url = new URL(trimmed);
        return `${apiBase}${url.pathname}`;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  };

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      try {
        const response = await httpClient.get(`/api/student/${id}`);
        setStudent(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

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
    return <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">Student not found.</div>;
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Student Profile</h1>
            <p className="text-primary-100 text-lg">Public profile details</p>
          </div>
          <Link
            to="/user/search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-50 to-emerald-50 px-8 py-8 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border border-gray-200 flex items-center justify-center">
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
              <h2 className="text-2xl font-bold text-gray-900">{student.firstname} {student.lastname}</h2>
              <p className="text-gray-600">{student.class || 'Student'} · {student.promotion || 'Promotion N/A'}</p>
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-primary-600" />
              <span>{student.email}</span>
            </div>
            {student.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-primary-600" />
                <span>{student.phone}</span>
              </div>
            )}
            {(student.city || student.country) && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-primary-600" />
                <span>{student.city || 'City'}{student.country ? `, ${student.country}` : ''}</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-gray-600 leading-relaxed">
              {student.aboutme || 'No bio provided yet.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
