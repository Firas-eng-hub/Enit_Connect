import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import httpClient from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Input } from '@/shared/ui/Input';
import { AuthShell } from '@/widgets/auth-shell';

type UserType = 'student' | 'company';

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function VerifyPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [selectedType, setSelectedType] = useState<UserType>(
    searchParams.get('type') === 'company' ? 'company' : 'student'
  );
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { verifySchema, resendSchema } = useMemo(() => {
    const email = z.string().trim().email(t('auth.invalidEmail'));
    return {
      verifySchema: z.object({ email, code: z.string().trim().regex(/^\d{6}$/, t('verifyPage.codeError')) }),
      resendSchema: z.object({ email }),
    };
  }, [t]);
  type VerifyFormData = z.infer<typeof verifySchema>;
  type ResendFormData = z.infer<typeof resendSchema>;

  const verifyForm = useForm<VerifyFormData>({ resolver: zodResolver(verifySchema), defaultValues: { email: initialEmail } });
  const resendForm = useForm<ResendFormData>({ resolver: zodResolver(resendSchema), defaultValues: { email: initialEmail } });

  const onVerify = async (data: VerifyFormData) => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      await httpClient.post(`/api/${selectedType}/confirm`, { code: data.code, email: data.email });
      setVerifySuccess(true);
    } catch (err: unknown) {
      setVerifyError(getErrorMessage(err, t('verifyPage.failed')));
    } finally {
      setIsVerifying(false);
    }
  };

  const onResend = async (data: ResendFormData) => {
    setIsResending(true);
    setResendError(null);
    setResendMessage(null);
    try {
      await httpClient.post(`/api/${selectedType}/resend-confirmation`, data);
      setResendMessage(t('verifyPage.resent'));
    } catch (err: unknown) {
      setResendError(getErrorMessage(err, t('verifyPage.resendFailed')));
    } finally {
      setIsResending(false);
    }
  };

  if (verifySuccess) {
    return (
      <AuthShell title={t('verifyPage.doneTitle')} description={t('verifyPage.doneBody')}>
        <Link
          to="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-ink bg-ink px-5 font-medium text-white hover:bg-primary-800"
        >
          {t('auth.signIn')}
        </Link>
      </AuthShell>
    );
  }

  const typeOptions: { type: UserType; label: string }[] = [
    { type: 'student', label: t('auth.student') },
    { type: 'company', label: t('auth.company') },
  ];

  return (
    <AuthShell title={t('verifyPage.title')} description={t('verifyPage.subtitle')}>
      <form onSubmit={verifyForm.handleSubmit(onVerify)} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">{t('auth.iAmA')}</legend>
          <div className="grid grid-cols-2 rounded-md border border-neutral-300 p-0.5">
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
                  name="verifyType"
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

        {verifyError && <Alert variant="danger">{verifyError}</Alert>}

        <Input
          id="verify-email"
          type="email"
          autoComplete="email"
          label={t('auth.emailAddress')}
          error={verifyForm.formState.errors.email?.message}
          {...verifyForm.register('email')}
        />
        <Input
          id="verify-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          label={t('verifyPage.code')}
          className="tracking-[0.3em] tabular-nums"
          dir="ltr"
          error={verifyForm.formState.errors.code?.message}
          {...verifyForm.register('code')}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isVerifying}>
          {t('verifyPage.submit')}
        </Button>
      </form>

      <form
        onSubmit={resendForm.handleSubmit(onResend)}
        noValidate
        className="mt-8 border-t border-line pt-6 space-y-4"
      >
        <div>
          <h2 className="text-base">{t('verifyPage.resendTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('verifyPage.resendBody')}</p>
        </div>
        {resendMessage && <Alert variant="success">{resendMessage}</Alert>}
        {resendError && <Alert variant="danger">{resendError}</Alert>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Input
              id="resend-email"
              type="email"
              autoComplete="email"
              aria-label={t('auth.emailAddress')}
              placeholder={t('auth.emailAddress')}
              error={resendForm.formState.errors.email?.message}
              {...resendForm.register('email')}
            />
          </div>
          <Button type="submit" variant="secondary" className="h-10" isLoading={isResending}>
            {t('verifyPage.resend')}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
