import type { TFunction } from 'i18next';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Send, CheckCircle } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';

const buildEmailSchema = (t: TFunction) =>
  z.object({
  to: z.string().email(t('pagesMisc.v.email')),
  subject: z.string().min(1, t('pagesMisc.v.subject')),
  body: z.string().min(1, t('pagesMisc.v.body')),
});

type EmailFormData = z.infer<ReturnType<typeof buildEmailSchema>>;

export function SendEmailPage() {
  const { t } = useTranslation();
  const emailSchema = useMemo(() => buildEmailSchema(t), [t]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
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

  const onSubmit = async (data: EmailFormData) => {
    setSending(true);
    setError(null);
    try {
      await httpClient.post('/api/admin/email', data);
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('pagesMisc.emailFailed')));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-line">
        <h1 className="text-2xl font-semibold text-ink mb-2">{t('pagesMisc.sendEmail')}</h1>
        <p className="text-muted-foreground text-lg">{t('pagesMisc.sendEmailSub')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 max-w-3xl mx-auto">
        <div className="p-8">
          {success && (
            <div className="bg-success-50 flex items-center gap-3 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">{t('pagesMisc.emailSent')}</span>
            </div>
          )}

          {error && (
            <div className="bg-danger-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" /> Recipient Email *
              </label>
              <input
                {...register('to')}
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="recipient@example.com"
              />
              {errors.to && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.to.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <input
                {...register('subject')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder={t('pagesMisc.emailSubjectPh')}
              />
              {errors.subject && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pagesMisc.message')}
              </label>
              <textarea
                {...register('body')}
                className="input h-48 resize-none"
                placeholder={t('pagesMisc.writeHere')}
              />
              {errors.body && (
                <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
              )}
            </div>

            <button type="submit" disabled={sending} className="btn-primary w-full py-3">
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('pagesMisc.sendEmail')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
