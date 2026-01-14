import { useEffect, useState } from 'react';
import { User, Building2, Search, Filter, Users, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { getInitials } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';

interface Member {
  _id: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  email: string;
  picture?: string;
  logo?: string;
  type?: string;
  class?: string;
  sector?: string;
}

// Student card component
function StudentCard({ student }: { student: Member }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        {student.picture ? (
          <img
            src={student.picture}
            alt={`${student.firstname} ${student.lastname}`}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-gray-50 group-hover:ring-primary-50 transition-all"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-gray-50 group-hover:ring-primary-50 transition-all">
            <span className="text-white font-bold text-lg">
              {getInitials(`${student.firstname} ${student.lastname}`)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
            {student.firstname} {student.lastname}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{student.class || student.type || 'Student'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Company card component
function CompanyCard({ company }: { company: Member }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        {company.logo ? (
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-gray-50 group-hover:ring-emerald-50 transition-all"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-4 ring-gray-50 group-hover:ring-emerald-50 transition-all">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
            {company.name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{company.sector || 'Company'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ type }: { type: 'students' | 'companies' }) {
  const isStudents = type === 'students';
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${isStudents ? 'bg-blue-50' : 'bg-emerald-50'} mb-6`}>
        {isStudents ? (
          <User className="w-10 h-10 text-blue-400" />
        ) : (
          <Building2 className="w-10 h-10 text-emerald-400" />
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        No {isStudents ? 'students' : 'companies'} to display
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        {isStudents 
          ? 'Student profiles will appear here once they register and complete their profiles.'
          : 'Partner companies will appear here once they join the platform.'}
      </p>
    </div>
  );
}

export function MembersPage() {
  const [students] = useState<Member[]>([]);
  const [companies] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'companies'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Note: This would need an API endpoint to list public members
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const currentList = activeTab === 'students' ? students : companies;

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-3">
          <Users className="w-4 h-4" />
          Community
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Our Members</h2>
        <p className="text-gray-500 mt-2">Explore our community of students and partner companies</p>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'students'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              Students
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'students' ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {students.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'companies'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Companies
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'companies' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {companies.length}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-primary-500 focus:outline-none transition-all"
            />
          </div>

          {/* Filter button */}
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Filters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <User className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold">{students.length || '500+'}</div>
          <div className="text-white/80 font-medium">Registered Students</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <Building2 className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold">{companies.length || '50+'}</div>
          <div className="text-white/80 font-medium">Partner Companies</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white">
          <MapPin className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-3xl font-bold">15+</div>
          <div className="text-white/80 font-medium">Countries Represented</div>
        </div>
      </div>

      {/* Members Grid */}
      {currentList.length === 0 ? (
        <EmptyState type={activeTab} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeTab === 'students'
            ? students.map((student) => <StudentCard key={student._id} student={student} />)
            : companies.map((company) => <CompanyCard key={company._id} company={company} />)
          }
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-3xl p-10 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-3">Join Our Community</h3>
          <p className="text-white/70 max-w-xl mx-auto mb-6">
            Create your profile and connect with students, companies, and opportunities across Tunisia and beyond.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary-900 hover:bg-white/90">
              <User className="w-5 h-5 mr-2" />
              Register as Student
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Building2 className="w-5 h-5 mr-2" />
              Register as Company
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
