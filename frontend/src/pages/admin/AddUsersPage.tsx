import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, User, Building2, CheckCircle } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/utils';

const userSchema = z.object({
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  type: z.string().min(1, 'Type is required'),
});

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  website: z.string().min(1, 'Website is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone is required'),
  about: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;
type CompanyFormData = z.infer<typeof companySchema>;
type UserType = 'student' | 'company';

export function AddUsersPage() {
  const [selectedType, setSelectedType] = useState<UserType>('student');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      type: 'Student',
    },
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmitUser = async (data: UserFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await httpClient.post('/api/admin/student/add', { students: [data] });
      setSuccess(true);
      userForm.reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitCompany = async (data: CompanyFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await httpClient.post('/api/admin/company/add', data);
      setSuccess(true);
      companyForm.reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Add Users</h1>
        <p className="text-primary-100 text-lg">Create new student or company accounts</p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-3xl mx-auto overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary-50 to-emerald-50 rounded-full blur-3xl opacity-80 -mr-32 -mt-32"></div>
        <div className="relative p-8 md:p-10">
          {/* Type selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Type</h2>
                <p className="text-sm text-gray-500">Choose the account you want to create</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Admin-only action
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedType('student')}
                className={cn(
                  'group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left',
                  selectedType === 'student'
                    ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-white shadow-lg shadow-primary-500/20'
                    : 'border-gray-200 hover:border-primary-200 hover:shadow-md'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                  selectedType === 'student' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                )}>
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Student</div>
                  <div className="text-sm text-gray-500">Create a student account</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('company')}
                className={cn(
                  'group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left',
                  selectedType === 'company'
                    ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-white shadow-lg shadow-primary-500/20'
                    : 'border-gray-200 hover:border-primary-200 hover:shadow-md'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                  selectedType === 'company' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                )}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Company</div>
                  <div className="text-sm text-gray-500">Create a company profile</div>
                </div>
              </button>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 p-4 rounded-xl mb-6 border border-green-200">
              <CheckCircle className="w-5 h-5" />
              {selectedType === 'student' ? 'Student' : 'Company'} created successfully!
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
              {error}
            </div>
          )}

          {/* Student form */}
          {selectedType === 'student' && (
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input {...userForm.register('firstname')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                  {userForm.formState.errors.firstname && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.firstname.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input {...userForm.register('lastname')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                  {userForm.formState.errors.lastname && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.lastname.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input {...userForm.register('email')} type="email" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                {userForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <input {...userForm.register('type')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="Student" />
                {userForm.formState.errors.type && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input {...userForm.register('password')} type="password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                {userForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" disabled={submitting} className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Student
                  </>
                )}
              </button>
            </form>
          )}

          {/* Company form */}
          {selectedType === 'company' && (
            <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input {...companyForm.register('name')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                {companyForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input {...companyForm.register('email')} type="email" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                {companyForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                <input {...companyForm.register('website')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="https://example.com" />
                {companyForm.formState.errors.website && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.website.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input {...companyForm.register('address')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                {companyForm.formState.errors.address && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input {...companyForm.register('city')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                  {companyForm.formState.errors.city && (
                    <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input {...companyForm.register('country')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                  {companyForm.formState.errors.country && (
                    <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.country.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input {...companyForm.register('phone')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                {companyForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea {...companyForm.register('about')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all h-28 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input {...companyForm.register('password')} type="password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" />
                {companyForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" disabled={submitting} className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Company
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
