import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchCandidacies();
  }, [id]);

  const fetchCandidacies = async () => {
    try {
      const response = await httpClient.get(`/api/offers/candidacies?id=${id}`);
      setOffer(response.data);
      setCandidacies(response.data.candidacies || []);
    } catch (err) {
      console.error('Failed to fetch candidacies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (candidacy: CandidacyWithStudent) => {
    setSelectedCandidacy(candidacy);
    try {
      const response = await httpClient.get(`/api/company/user/${candidacy.studentId}`);
      setStudentDetails(response.data);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/company/home" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to offers
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Candidacies</h1>
        <p className="text-gray-500 mt-1">
          {offer?.title} - {candidacies.length} application(s)
        </p>
      </div>

      {candidacies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
          <p className="text-gray-500">Applications will appear here when students apply</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidacies.map((candidacy, index) => (
            <div key={candidacy._id || index} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Applicant #{index + 1}</p>
                      <p className="text-sm text-gray-500">
                        Applied {candidacy.createdAt ? formatDate(candidacy.createdAt) : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
                    <p className="text-gray-600">{candidacy.body}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewStudent(candidacy)}
                  className="btn-primary ml-4"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedCandidacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Applicant Profile</h2>

            {studentDetails ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {studentDetails.picture ? (
                    <img
                      src={studentDetails.picture}
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
                      {studentDetails.firstname} {studentDetails.lastname}
                    </h3>
                    <p className="text-gray-500">{studentDetails.type || 'Student'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{studentDetails.email}</span>
                  </div>
                  {studentDetails.class && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm">{studentDetails.class}</span>
                    </div>
                  )}
                  {studentDetails.promotion && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Promotion {studentDetails.promotion}</span>
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

            <button
              onClick={() => {
                setSelectedCandidacy(null);
                setStudentDetails(null);
              }}
              className="w-full btn-secondary mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
