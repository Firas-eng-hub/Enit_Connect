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
});

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmitUser = async (data: UserFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await httpClient.post('/api/admin/users', { ...data, type: 'student' });
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
      await httpClient.post('/api/admin/companies', data);
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

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl mx-auto">
        <div className="p-8">
          {/* Type selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('student')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                  selectedType === 'student'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <User className="w-6 h-6" />
                <span className="font-medium">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('company')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                  selectedType === 'company'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Building2 className="w-6 h-6" />
                <span className="font-medium">Company</span>
              </button>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 p-4 rounded-lg mb-6">
              <CheckCircle className="w-5 h-5" />
              {selectedType === 'student' ? 'Student' : 'Company'} created successfully!
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Student form */}
          {selectedType === 'student' && (
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input {...userForm.register('firstname')} className="input" />
                  {userForm.formState.errors.firstname && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.firstname.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input {...userForm.register('lastname')} className="input" />
                  {userForm.formState.errors.lastname && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.lastname.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...userForm.register('email')} type="email" className="input" />
                {userForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input {...userForm.register('password')} type="password" className="input" />
                {userForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" disabled={submitting} className="w-full btn-primary py-3 mt-6">
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
            <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input {...companyForm.register('name')} className="input" />
                {companyForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...companyForm.register('email')} type="email" className="input" />
                {companyForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input {...companyForm.register('password')} type="password" className="input" />
                {companyForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" disabled={submitting} className="w-full btn-primary py-3 mt-6">
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
