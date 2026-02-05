import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, GraduationCap } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import type { Offer, Candidacy } from '@/entities/offer/types';
import type { Student } from '@/entities/student/types';
import { formatDate } from '@/shared/lib/utils';

interface CandidacyWithStudent extends Candidacy {
  student?: Student;
}

export function CandidaciesPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [candidacies, setCandidacies] = useState<CandidacyWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidacy, setSelectedCandidacy] = useState<CandidacyWithStudent | null>(null);
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const isValidOfferId = !!id && id !== 'undefined' && (
    /^[a-f\d]{24}$/i.test(id) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  );

  const fetchCandidacies = useCallback(async () => {
    if (!isValidOfferId) {
      setError('Invalid offer id.');
      setLoading(false);
      return;
    }

    try {
      const response = await httpClient.get(`/api/offers/candidacies?id=${id}`);
      setOffer(response.data);
      setCandidacies(response.data.candidacies || []);
    } catch (err) {
      console.error('Failed to fetch candidacies:', err);
      setError('Failed to fetch candidacies.');
    } finally {
      setLoading(false);
    }
  }, [id, isValidOfferId]);

  useEffect(() => {
    fetchCandidacies();
  }, [fetchCandidacies]);

  const handleViewStudent = async (candidacy: CandidacyWithStudent) => {
    setSelectedCandidacy(candidacy);
    setStudentError(null);
    const studentId =
      candidacy.studentId ||
      (candidacy as { student?: string }).student ||
      (candidacy as { userId?: string }).userId ||
      (candidacy as { id?: string }).id;
    if (!studentId) {
      setStudentDetails(null);
      setStudentError('Student profile is unavailable for this application.');
      return;
    }
    try {
      const response = await httpClient.get(`/api/company/user/${studentId}`);
      setStudentDetails(response.data);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      setStudentError('Failed to load student profile.');
    }
  };

  const updateCandidacyStatus = async (candidacy: CandidacyWithStudent, status: 'accepted' | 'rejected') => {
    if (!offer?._id) {
      alert('Offer is missing.');
      return;
    }

    try {
      await httpClient.patch(`/api/offers/candidacies/${offer._id}`, {
        status,
        candidacyId: candidacy._id,
        candidacyIndex: candidacies.indexOf(candidacy)
      });

      setCandidacies((prev) => prev.map((entry) =>
        entry === candidacy ? { ...entry, status } : entry
      ));
    } catch (err) {
      console.error('Failed to update candidacy:', err);
      alert('Failed to update candidacy status.');
    }
  };

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

  return (
    <div>
      <Link to="/company/home" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to offers
      </Link>

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-primary-100 text-sm uppercase tracking-[0.2em] font-semibold">Offer Candidacies</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">
              {offer?.title || 'Applications'}
            </h1>
            <p className="text-primary-100 mt-2">
              {candidacies.length} application{candidacies.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 bg-white/15 rounded-xl border border-white/20 text-white text-sm font-semibold">
              Total: {candidacies.length}
            </div>
            <div className="px-4 py-3 bg-white/15 rounded-xl border border-white/20 text-white text-sm font-semibold">
              Pending: {candidacies.filter((c) => c.status === 'pending').length}
            </div>
          </div>
        </div>
      </div>

      {candidacies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
          <p className="text-gray-500">Applications will appear here when students apply</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {candidacies.map((candidacy, index) => (
            <div
              key={candidacy._id || `${candidacy.studentId || 'student'}-${index}`}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-sky-500" />
              <div className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {candidacy.studentSnapshot?.firstname
                          ? `${candidacy.studentSnapshot.firstname} ${candidacy.studentSnapshot.lastname || ''}`.trim()
                          : `Applicant #${index + 1}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Applied {candidacy.createdAt ? formatDate(candidacy.createdAt) : 'Recently'}
                      </p>
                    </div>
                      {candidacy.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          candidacy.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700'
                            : candidacy.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {candidacy.status}
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Cover Letter</h4>
                      <p className="text-gray-600 leading-relaxed line-clamp-3">{candidacy.body || 'No cover letter provided.'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleViewStudent(candidacy)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-lg shadow-primary-500/30 hover:from-primary-700 hover:to-primary-800 transition-all"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => updateCandidacyStatus(candidacy, 'accepted')}
                      disabled={candidacy.status === 'accepted'}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-emerald-200 text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateCandidacyStatus(candidacy, 'rejected')}
                      disabled={candidacy.status === 'rejected'}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-rose-200 text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedCandidacy && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-between">
              <h2 className="text-xl font-semibold">Applicant Profile</h2>
              <button
                onClick={() => {
                  setSelectedCandidacy(null);
                  setStudentDetails(null);
                }}
                className="text-sm font-semibold text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto">

            {studentError ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl">
                {studentError}
              </div>
            ) : studentDetails || selectedCandidacy.studentSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {(studentDetails?.picture || selectedCandidacy.studentSnapshot?.picture) ? (
                    <img
                      src={studentDetails?.picture || selectedCandidacy.studentSnapshot?.picture}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {studentDetails
                        ? `${studentDetails.firstname} ${studentDetails.lastname}`
                        : `${selectedCandidacy.studentSnapshot?.firstname || ''} ${selectedCandidacy.studentSnapshot?.lastname || ''}`.trim() || 'Student'}
                    </h3>
                    <p className="text-gray-500">{studentDetails?.type || selectedCandidacy.studentSnapshot?.type || 'Student'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{studentDetails?.email || selectedCandidacy.studentSnapshot?.email || 'N/A'}</span>
                  </div>
                  {(studentDetails?.class || selectedCandidacy.studentSnapshot?.class) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm">{studentDetails?.class || selectedCandidacy.studentSnapshot?.class}</span>
                    </div>
                  )}
                  {(studentDetails?.promotion || selectedCandidacy.studentSnapshot?.promotion) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Promotion {studentDetails?.promotion || selectedCandidacy.studentSnapshot?.promotion}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
                  <p className="text-gray-600">{selectedCandidacy.body}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
