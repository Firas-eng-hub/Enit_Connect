import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Offer } from '@/entities/offer/types';
import { Dialog } from '@/shared/ui/Dialog';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';

interface ApplyModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offerId: string, coverLetter: string) => Promise<void>;
}

export function ApplyModal({ offer, isOpen, onClose, onSubmit }: ApplyModalProps) {
  const { t } = useTranslation();
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClose = () => {
    setCoverLetter('');
    setSuccess(false);
    setFailed(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!offer || !coverLetter.trim()) return;
    setIsLoading(true);
    setFailed(false);
    try {
      await onSubmit(offer._id, coverLetter);
      setSuccess(true);
      setCoverLetter('');
    } catch {
      setFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!offer) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      title={success ? t('home.applicationSent') : t('home.applyTo', { title: offer.title })}
      description={success ? undefined : t('home.coverLetterSubtitle')}
      size="xl"
    >
      {success ? (
        <div className="pb-6">
          <p className="text-body">{t('home.applicationSentDesc')}</p>
          <div className="mt-5 flex justify-end">
            <Button onClick={handleClose}>{t('common.close')}</Button>
          </div>
        </div>
      ) : (
        <div className="pb-6 space-y-4">
          {failed && <Alert variant="danger">{t('offers.applyFailed')}</Alert>}
          <Textarea
            id="apply-cover-letter"
            label={t('offers.coverLetter')}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder={t('home.coverLetterPlaceholder')}
            rows={8}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading} disabled={!coverLetter.trim()}>
              {t('home.submitApplication')}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
