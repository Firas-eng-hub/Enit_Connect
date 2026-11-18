import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage } from '@/shared/lib/utils';

const CONTACT_EMAIL = 'contact@enit.utm.tn';
const CONTACT_PHONE = '+216 71 874 700';
const FAQ_KEYS = ['who', 'cost', 'offers', 'apply', 'companies', 'language'] as const;

export function AboutPage() {
  const { t } = useTranslation();
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('visitor.about.form.nameError')),
        email: z.string().trim().email(t('visitor.about.form.emailError')),
        message: z.string().trim().min(10, t('visitor.about.form.messageError')),
      }),
    [t]
  );

  type ContactFormData = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus(null);
    try {
      await httpClient.post('/api/admin/message', {
        name: data.name,
        email: data.email,
        message: data.message,
        date: new Date().toISOString(),
      });
      setSubmitStatus({ type: 'success', message: t('visitor.about.form.sent') });
      reset();
    } catch (err) {
      setSubmitStatus({ type: 'error', message: getApiErrorMessage(err, t('visitor.about.form.failed')) });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Mission */}
      <section aria-labelledby="about-heading" className="max-w-prose">
        <span className="gold-rule" aria-hidden="true" />
        <h1 id="about-heading" className="mt-5">{t('visitor.about.title')}</h1>
        <p className="mt-4 text-lg text-body">{t('visitor.about.mission1')}</p>
        <p className="mt-3 text-body">{t('visitor.about.mission2')}</p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="mt-14 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <h2 id="faq-heading">{t('visitor.about.faqTitle')}</h2>
        <div className="divide-y divide-line rounded-lg border border-line bg-surface">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 font-medium text-ink hover:bg-canvas">
                {t(`visitor.about.faq.${key}.q`)}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="px-5 pb-5 text-body max-w-prose">{t(`visitor.about.faq.${key}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section aria-labelledby="contact-heading" className="mt-14 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 id="contact-heading">{t('visitor.about.contactTitle')}</h2>
          <p className="mt-2 text-muted-foreground">{t('visitor.about.contactBody')}</p>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-ink">{t('visitor.about.address')}</dt>
              <dd className="mt-0.5 text-body">
                {t('visitor.school')}
                <br />
                BP 37, Le Belvédère, 1002 Tunis
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">{t('visitor.about.email')}</dt>
              <dd className="mt-0.5">
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-700 underline underline-offset-2 hover:text-ink">
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">{t('visitor.about.phone')}</dt>
              <dd className="mt-0.5 text-body" dir="ltr">
                {CONTACT_PHONE}
              </dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-lg border border-line bg-surface p-5 sm:p-6 space-y-4"
        >
          {submitStatus && (
            <Alert variant={submitStatus.type === 'success' ? 'success' : 'danger'}>{submitStatus.message}</Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="contact-name"
              label={t('visitor.about.form.name')}
              autoComplete="name"
              required
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="contact-email"
              type="email"
              label={t('visitor.about.form.email')}
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          <Textarea
            id="contact-message"
            label={t('visitor.about.form.message')}
            rows={5}
            error={errors.message?.message}
            {...register('message')}
          />
          <Button type="submit" isLoading={isSubmitting}>
            {t('visitor.about.form.send')}
          </Button>
        </form>
      </section>
    </div>
  );
}
