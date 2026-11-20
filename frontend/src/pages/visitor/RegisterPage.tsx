import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import httpClient from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { AuthShell } from '@/widgets/auth-shell';

type UserType = 'student' | 'company';

const classes = [
  '1st CS 1', '1st CS 2', '1st CS 3',
  '2nd CS 1', '2nd CS 2', '2nd CS 3',
  '3rd CS 1', '3rd CS 2', '3rd CS 3',
  '1st Tel 1', '1st Tel 2', '1st Tel 3',
  '2nd Tel 1', '2nd Tel 2', '2nd Tel 3',
  '3rd Tel 1', '3rd Tel 2', '3rd Tel 3',
];

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

const selectClass =
  'h-10 w-full rounded-md border border-neutral-400 bg-surface px-3 text-ink hover:border-neutral-500 focus:outline-none focus-visible:outline-none focus-visible:shadow-none focus:border-ink focus:ring-2 focus:ring-gold/40';

function PasswordField({
  id,
  label,
  hint,
  error,
  registration,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  registration: React.InputHTMLAttributes<HTMLInputElement> & { ref: React.Ref<HTMLInputElement> };
}) {
  const describedBy = error ? `${id}-error` : `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <PasswordInput
        id={id}
        autoComplete="new-password"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={cn(
          'h-10 w-full rounded-md border bg-surface ps-3 text-ink',
          'focus:outline-none focus-visible:outline-none focus-visible:shadow-none focus:border-ink focus:ring-2 focus:ring-gold/40',
          error ? 'border-danger-600' : 'border-neutral-400 hover:border-neutral-500'
        )}
        {...registration}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger-600">{error}</p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<UserType>(
    searchParams.get('type') === 'company' ? 'company' : 'student'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const { studentSchema, companySchema } = useMemo(() => {
    const required = t('registerPage.v.required');
    const passwordSchema = z
      .string()
      .min(8, t('registerPage.v.passwordLength'))
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, t('registerPage.v.passwordRules'));
    return {
      studentSchema: z.object({
        firstname: z.string().trim().min(1, required),
        lastname: z.string().trim().min(1, required),
        email: z.string().trim().email(t('registerPage.v.email')),
        password: passwordSchema,
        class: z.string().optional(),
        promotion: z.string().optional(),
      }),
      companySchema: z.object({
        name: z.string().trim().min(1, required),
        email: z.string().trim().email(t('registerPage.v.email')),
        password: passwordSchema,
        website: z.string().trim().url(t('registerPage.v.url')),
        address: z.string().trim().min(1, required),
        city: z.string().trim().min(1, required),
        country: z.string().trim().min(1, required),
        phone: z.string().regex(/^\+?[\d\s\-()]{8,20}$/, t('registerPage.v.phone')),
        about: z.string().optional(),
      }),
    };
  }, [t]);

  type StudentFormData = z.infer<typeof studentSchema>;
  type CompanyFormData = z.infer<typeof companySchema>;

  const studentForm = useForm<StudentFormData>({ resolver: zodResolver(studentSchema) });
  const companyForm = useForm<CompanyFormData>({ resolver: zodResolver(companySchema) });
  const se = studentForm.formState.errors;
  const ce = companyForm.formState.errors;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 5 }, (_, i) => (2000 + i).toString());

  const submit = async (url: string, payload: Record<string, unknown>, email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await httpClient.post(url, payload);
      setSuccessEmail(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('registerPage.v.failed')));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitStudent = (data: StudentFormData) =>
    submit('/api/student/signup', { ...data, type: 'Student' }, data.email);
  const onSubmitCompany = (data: CompanyFormData) => submit('/api/company/signup', data, data.email);

  if (success) {
    const verifyLink = `/verify?type=${selectedType}${successEmail ? `&email=${encodeURIComponent(successEmail)}` : ''}`;
    return (
      <AuthShell title={t('registerPage.allSet')} description={t('registerPage.verificationSent')}>
        <div className="flex flex-col gap-3">
          <Link
            to={verifyLink}
            className="inline-flex h-11 items-center justify-center rounded-md border border-ink bg-ink px-5 font-medium text-white hover:bg-primary-800"
          >
            {t('registerPage.enterVerificationCode')}
          </Link>
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 px-5 font-medium text-ink hover:bg-canvas"
          >
            {t('registerPage.continueToSignIn')}
          </Link>
        </div>
      </AuthShell>
    );
  }

  const typeOptions: { type: UserType; label: string; desc: string }[] = [
    { type: 'student', label: t('registerPage.studentLabel'), desc: t('registerPage.studentDesc') },
    { type: 'company', label: t('registerPage.companyLabel'), desc: t('registerPage.companyDesc') },
  ];

  return (
    <AuthShell
      wide
      title={t('registerPage.createYourAccount')}
      description={
        <>
          {t('registerPage.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-ink underline underline-offset-2 hover:text-primary-700">
            {t('registerPage.signIn')}
          </Link>
        </>
      }
    >
      <fieldset className="mb-6">
        <legend className="mb-1.5 text-sm font-medium text-ink">{t('registerPage.registerAs')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {typeOptions.map(({ type, label, desc }) => (
            <label
              key={type}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60',
                selectedType === type ? 'border-ink bg-primary-50' : 'border-neutral-300 hover:border-neutral-400'
              )}
            >
              <input
                type="radio"
                name="registerType"
                value={type}
                checked={selectedType === type}
                onChange={() => {
                  setSelectedType(type);
                  setError(null);
                }}
                className="mt-1 h-4 w-4 accent-[rgb(var(--ink))]"
              />
              <span>
                <span className="block font-medium text-ink">{label}</span>
                <span className="block text-sm text-muted-foreground">{desc}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <Alert variant="danger" className="mb-5">{error}</Alert>}

      {selectedType === 'student' ? (
        <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="reg-firstname" label={t('registerPage.firstName')} autoComplete="given-name" error={se.firstname?.message} {...studentForm.register('firstname')} />
            <Input id="reg-lastname" label={t('registerPage.lastName')} autoComplete="family-name" error={se.lastname?.message} {...studentForm.register('lastname')} />
          </div>
          <Input id="reg-email" type="email" label={t('registerPage.emailAddress')} autoComplete="email" error={se.email?.message} {...studentForm.register('email')} />
          <PasswordField
            id="reg-password"
            label={t('registerPage.password')}
            hint={t('registerPage.passwordHint')}
            error={se.password?.message}
            registration={studentForm.register('password')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-class" className="mb-1.5 block text-sm font-medium text-ink">{t('registerPage.classLabel')}</label>
              <select id="reg-class" className={selectClass} {...studentForm.register('class')}>
                <option value="">{t('registerPage.selectClass')}</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="reg-promotion" className="mb-1.5 block text-sm font-medium text-ink">{t('registerPage.promotion')}</label>
              <select id="reg-promotion" className={selectClass} {...studentForm.register('promotion')}>
                <option value="">{t('registerPage.selectYear')}</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            {t('registerPage.createStudentAccount')}
          </Button>
        </form>
      ) : (
        <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} noValidate className="space-y-4">
          <Input id="reg-company" label={t('registerPage.companyName')} autoComplete="organization" error={ce.name?.message} {...companyForm.register('name')} />
          <Input id="reg-company-email" type="email" label={t('registerPage.businessEmail')} autoComplete="email" error={ce.email?.message} {...companyForm.register('email')} />
          <PasswordField
            id="reg-company-password"
            label={t('registerPage.password')}
            hint={t('registerPage.passwordHint')}
            error={ce.password?.message}
            registration={companyForm.register('password')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="reg-website" type="url" label={t('registerPage.website')} placeholder="https://" autoComplete="url" error={ce.website?.message} {...companyForm.register('website')} />
            <Input id="reg-phone" type="tel" label={t('registerPage.phone')} autoComplete="tel" error={ce.phone?.message} {...companyForm.register('phone')} />
          </div>
          <Input id="reg-address" label={t('registerPage.address')} autoComplete="street-address" error={ce.address?.message} {...companyForm.register('address')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="reg-city" label={t('registerPage.city')} autoComplete="address-level2" error={ce.city?.message} {...companyForm.register('city')} />
            <Input id="reg-country" label={t('registerPage.country')} autoComplete="country-name" error={ce.country?.message} {...companyForm.register('country')} />
          </div>
          <Textarea id="reg-about" label={t('registerPage.aboutCompany')} rows={4} {...companyForm.register('about')} />
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            {t('registerPage.createCompanyAccount')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
