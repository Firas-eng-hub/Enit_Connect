import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Send, CheckCircle } from 'lucide-react';
import httpClient from '@/shared/api/httpClient';

const emailSchema = z.object({
  to: z.string().email('Please enter a valid email'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Message body is required'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export function SendEmailPage() {
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
      setError(getErrorMessage(err, 'Failed to send email'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Send Email</h1>
        <p className="text-primary-100 text-lg">Communicate with users via email</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-3xl mx-auto">
        <div className="p-8">
          {success && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 shadow-md">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Email sent successfully!</span>
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-700 p-4 rounded-xl mb-6 shadow-md font-medium">
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Email subject"
              />
              {errors.subject && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                {...register('body')}
                className="input h-48 resize-none"
                placeholder="Write your message here..."
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
                  Send Email
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
