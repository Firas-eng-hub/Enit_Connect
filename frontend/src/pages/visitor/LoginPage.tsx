import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Input } from '@/shared/ui/Input';
import { AuthShell } from '@/widgets/auth-shell';

type UserType = 'student' | 'company' | 'admin';

const REDIRECTS: Record<UserType, string> = {
  student: '/user/home',
  company: '/company/home',
  admin: '/admin/home',
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [selectedType, setSelectedType] = useState<UserType>(
    location.pathname.startsWith('/admin') ? 'admin' : 'student'
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingVerify, setPendingVerify] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(t('auth.invalidEmail')),
        password: z.string().min(1, t('auth.passwordRequired')),
      }),
    [t]
  );
  type LoginFormData = z.infer<typeof loginSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setPendingVerify(false);

    try {
      await login(selectedType, data);
      navigate(REDIRECTS[selectedType]);
    } catch (err: unknown) {
      const message = getErrorMessage(err, t('auth.loginFailed'));
      setError(message);
      if (message.toLowerCase().includes('verify')) {
        setPendingVerify(true);
        setPendingEmail(data.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions: { type: UserType; label: string }[] = [
    { type: 'student', label: t('auth.student') },
    { type: 'company', label: t('auth.company') },
    { type: 'admin', label: t('auth.admin') },
  ];

  return (
    <AuthShell title={t('auth.welcomeBack')} description={t('auth.signInContinue')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">{t('auth.iAmA')}</legend>
          <div className="grid grid-cols-3 rounded-md border border-neutral-300 p-0.5">
            {typeOptions.map(({ type, label }) => (
              <label
                key={type}
                className={cn(
                  'cursor-pointer rounded px-2 py-1.5 text-center text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60',
                  selectedType === type ? 'bg-ink text-white' : 'text-body hover:bg-canvas hover:text-ink'
                )}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={type}
                  checked={selectedType === type}
                  onChange={() => setSelectedType(type)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <Alert variant="danger">
            {error}
            {pendingVerify && (
              <div className="mt-2">
                <Link
                  to={`/verify?type=${selectedType}${pendingEmail ? `&email=${encodeURIComponent(pendingEmail)}` : ''}`}
                  className="font-medium underline underline-offset-2"
                >
                  {t('auth.verifyNow')}
                </Link>
              </div>
            )}
          </Alert>
        )}

        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          label={t('auth.emailAddress')}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink">
            {t('auth.password')}
          </label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className={cn(
              'h-10 w-full rounded-md border bg-surface ps-3 text-ink',
              'focus:outline-none focus-visible:outline-none focus-visible:shadow-none focus:border-ink focus:ring-2 focus:ring-gold/40',
              errors.password ? 'border-danger-600' : 'border-neutral-400 hover:border-neutral-500'
            )}
            {...register('password')}
          />
          {errors.password && (
            <p id="login-password-error" className="mt-1.5 text-sm text-danger-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          {t('auth.signIn')}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t('auth.newToEnitConnect')}{' '}
        <Link to="/register" className="font-medium text-ink underline underline-offset-2 hover:text-primary-700">
          {t('auth.createAccount')}
        </Link>
      </p>
    </AuthShell>
  );
}
