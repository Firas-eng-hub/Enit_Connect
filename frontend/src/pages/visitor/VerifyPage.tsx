import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle, Mail, RefreshCw, ShieldCheck, User } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import enitLogo from '@/assets/img/ENIT.png';
import bgImage from '@/assets/img/Acceuil.BG.jpg';

const verifySchema = z.object({
  email: z.string().email('Please enter a valid email'),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type VerifyFormData = z.infer<typeof verifySchema>;
type ResendFormData = z.infer<typeof resendSchema>;
type UserType = 'student' | 'company';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const initialType = useMemo(() => {
    const type = searchParams.get('type');
    return type === 'company' ? 'company' : 'student';
  }, [searchParams]);
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [selectedType, setSelectedType] = useState<UserType>(initialType);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: initialEmail },
  });

  const resendForm = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
  });

  const onVerify = async (data: VerifyFormData) => {
    setIsVerifying(true);
    setVerifyError(null);
    setVerifySuccess(false);

    try {
      await httpClient.post(`/api/${selectedType}/confirm`, { code: data.code, email: data.email });
      setVerifySuccess(true);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setVerifyError(err.response.data.message);
      } else {
        setVerifyError('Verification failed. Please check the code and try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const onResend = async (data: ResendFormData) => {
    setIsResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const response = await httpClient.post(`/api/${selectedType}/resend-confirmation`, data);
      setResendMessage(response.data?.message || 'Check your inbox for a new code.');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setResendError(err.response.data.message);
      } else {
        setResendError('Unable to resend the code right now.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const typeOptions = [
    { type: 'student' as UserType, label: 'Student', icon: User, gradient: 'from-blue-500 to-indigo-600' },
    { type: 'company' as UserType, label: 'Company', icon: Building2, gradient: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-accent-900/95" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full relative z-10 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <Link to="/visitor/news" className="inline-flex flex-col items-center gap-3">
              <img src={enitLogo} alt="ENIT" className="w-14 h-14 object-contain drop-shadow-lg" />
              <span className="text-xl font-bold text-white">ENIT-Connect</span>
            </Link>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />

            <div className="relative space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30 mb-4">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Verify your account</h2>
                <p className="text-gray-500 mt-2">
                  Enter the 6-digit code we sent to your email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Account type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {typeOptions.map(({ type, label, icon: Icon, gradient }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 border-2',
                        selectedType === type
                          ? `bg-gradient-to-br ${gradient} text-white shadow-lg shadow-primary-500/25 scale-105 border-transparent`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <Icon className={cn('w-6 h-6', selectedType === type && 'drop-shadow-md')} />
                      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-4">
                {verifyError && (
                  <Alert variant="danger" className="text-sm rounded-xl">
                    {verifyError}
                  </Alert>
                )}
                {verifySuccess && (
                  <Alert variant="success" className="text-sm rounded-xl">
                    Your account is verified. You can sign in now.
                  </Alert>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    {...verifyForm.register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="you@enit.utm.tn"
                    className={cn(
                      'w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/50 text-gray-900 placeholder:text-gray-400',
                      'focus:outline-none focus:ring-0 focus:border-primary-500 focus:bg-white',
                      'transition-all duration-200 font-medium',
                      verifyForm.formState.errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-100'
                    )}
                  />
                  {verifyForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {verifyForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    {...verifyForm.register('code')}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className={cn(
                      'w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/50 text-gray-900 placeholder:text-gray-400',
                      'focus:outline-none focus:ring-0 focus:border-primary-500 focus:bg-white',
                      'transition-all duration-200 font-semibold tracking-[0.35em] text-center',
                      verifyForm.formState.errors.code ? 'border-red-300 bg-red-50/50' : 'border-gray-100'
                    )}
                  />
                  {verifyForm.formState.errors.code && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {verifyForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold shadow-lg shadow-primary-500/30"
                  size="lg"
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Account'}
                </Button>
              </form>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-4">
                  <Mail className="w-4 h-4" />
                  Didn&apos;t get the code?
                </div>
                <form onSubmit={resendForm.handleSubmit(onResend)} className="space-y-4">
                  {resendError && (
                    <Alert variant="danger" className="text-sm rounded-xl">
                      {resendError}
                    </Alert>
                  )}
                  {resendMessage && (
                    <Alert variant="success" className="text-sm rounded-xl">
                      {resendMessage}
                    </Alert>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      {...resendForm.register('email')}
                      type="email"
                      autoComplete="email"
                      placeholder="you@enit.utm.tn"
                      className={cn(
                        'w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/50 text-gray-900 placeholder:text-gray-400',
                        'focus:outline-none focus:ring-0 focus:border-primary-500 focus:bg-white',
                        'transition-all duration-200 font-medium',
                        resendForm.formState.errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-100'
                      )}
                    />
                    {resendForm.formState.errors.email && (
                      <p className="mt-2 text-sm text-red-600 font-medium">
                        {resendForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full py-4 rounded-xl font-bold"
                    size="lg"
                    disabled={isResending}
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className={cn('w-4 h-4', isResending && 'animate-spin')} />
                      {isResending ? 'Sending...' : 'Resend Code'}
                    </span>
                  </Button>
                </form>
              </div>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary-600 font-semibold hover:text-primary-700">
                  <CheckCircle className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
