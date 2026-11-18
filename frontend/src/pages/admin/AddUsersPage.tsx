import type { TFunction } from 'i18next';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, User, Building2, CheckCircle } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/utils';

const buildUserSchema = (t: TFunction) =>
  z.object({
  firstname: z.string().min(1, t('addUsers.v.firstname')),
  lastname: z.string().min(1, t('addUsers.v.lastname')),
  email: z.string().email(t('addUsers.v.email')),
  password: z.string().min(8, t('addUsers.v.password')),
  type: z.string().min(1, t('addUsers.v.type')),
});

const buildCompanySchema = (t: TFunction) =>
  z.object({
  name: z.string().min(1, t('addUsers.v.company')),
  email: z.string().email(t('addUsers.v.email')),
  password: z.string().min(8, t('addUsers.v.password')),
  website: z.string().min(1, t('addUsers.v.website')),
  address: z.string().min(1, t('addUsers.v.address')),
  city: z.string().min(1, t('addUsers.v.city')),
  country: z.string().min(1, t('addUsers.v.country')),
  phone: z.string().min(1, t('addUsers.v.phone')),
  about: z.string().optional(),
});

type UserFormData = z.infer<ReturnType<typeof buildUserSchema>>;
type CompanyFormData = z.infer<ReturnType<typeof buildCompanySchema>>;
type UserType = 'student' | 'company';

export function AddUsersPage() {
  const { t } = useTranslation();
  const userSchema = useMemo(() => buildUserSchema(t), [t]);
  const companySchema = useMemo(() => buildCompanySchema(t), [t]);
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

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object') {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      const message = response?.data?.message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const onSubmitUser = async (data: UserFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await httpClient.post('/api/admin/student/add', { students: [data] });
      setSuccess(true);
      userForm.reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('addUsers.userFailed')));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('addUsers.companyFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('addUsers.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('addUsers.subtitle')}</p>
      </div>

      <div className="relative bg-white rounded-3xl border border-gray-200 max-w-3xl mx-auto overflow-hidden">
        <div className="relative p-6 sm:p-8 md:p-10">
          {/* Type selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('addUsers.userType')}</h2>
                <p className="text-sm text-gray-500">{t('addUsers.userTypeDesc')}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  {t('addUsers.adminOnly')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedType('student')}
                className={cn(
                  'group flex items-center gap-4 p-5 rounded-2xl border transition-colors text-left',
                  selectedType === 'student'
                    ? 'bg-primary-50 border-primary-600'
                    : 'border-gray-200 hover:border-primary-200'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                  selectedType === 'student' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                )}>
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t('addUsers.student')}</div>
                  <div className="text-sm text-gray-500">{t('addUsers.studentDesc')}</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('company')}
                className={cn(
                  'group flex items-center gap-4 p-5 rounded-2xl border transition-colors text-left',
                  selectedType === 'company'
                    ? 'bg-primary-50 border-primary-600'
                    : 'border-gray-200 hover:border-primary-200'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                  selectedType === 'company' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                )}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t('addUsers.company')}</div>
                  <div className="text-sm text-gray-500">{t('addUsers.companyDesc')}</div>
                </div>
              </button>
            </div>
          </div>

          {success && (
            <div className="bg-success-50 flex items-center gap-2 text-green-700 p-4 rounded-xl mb-6 border border-green-200">
              <CheckCircle className="w-5 h-5" />
              {selectedType === 'student' ? t('addUsers.studentCreated') : t('addUsers.companyCreated')}
            </div>
          )}

          {error && (
            <div className="bg-danger-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
              {error}
            </div>
          )}

          {/* Student form */}
          {selectedType === 'student' && (
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.firstName')}</label>
                  <input {...userForm.register('firstname')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                  {userForm.formState.errors.firstname && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.firstname.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.lastName')}</label>
                  <input {...userForm.register('lastname')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                  {userForm.formState.errors.lastname && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.lastname.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.email')}</label>
                <input {...userForm.register('email')} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                {userForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.type')}</label>
                <input {...userForm.register('type')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" placeholder={t('addUsers.student')} />
                {userForm.formState.errors.type && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.password')}</label>
                <input {...userForm.register('password')} type="password" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                {userForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" disabled={submitting} className="bg-ink w-full px-4 py-2 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary-800 text-sm">
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('addUsers.createStudent')}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Company form */}
          {selectedType === 'company' && (
            <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.companyName')}</label>
                <input {...companyForm.register('name')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                {companyForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.email')}</label>
                <input {...companyForm.register('email')} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                {companyForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.website')}</label>
                <input {...companyForm.register('website')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" placeholder="https://example.com" />
                {companyForm.formState.errors.website && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.website.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.address')}</label>
                <input {...companyForm.register('address')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                {companyForm.formState.errors.address && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.city')}</label>
                  <input {...companyForm.register('city')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                  {companyForm.formState.errors.city && (
                    <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.country')}</label>
                  <input {...companyForm.register('country')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                  {companyForm.formState.errors.country && (
                    <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.country.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.phone')}</label>
                <input {...companyForm.register('phone')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                {companyForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.description')}</label>
                <textarea {...companyForm.register('about')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors h-28 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addUsers.password')}</label>
                <input {...companyForm.register('password')} type="password" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                {companyForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" disabled={submitting} className="bg-ink w-full px-4 py-2 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary-800 text-sm">
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('addUsers.createCompany')}
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
