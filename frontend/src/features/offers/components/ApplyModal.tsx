import { useState } from 'react';
import { Send } from 'lucide-react';
import type { Offer } from '@/entities/offer/types';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';

interface ApplyModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offerId: string, coverLetter: string) => Promise<void>;
}

export function ApplyModal({ offer, isOpen, onClose, onSubmit }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!offer || !coverLetter.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(offer._id, coverLetter);
      setSuccess(true);
      setCoverLetter('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to apply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCoverLetter('');
    setSuccess(false);
    onClose();
  };

  if (!offer) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Apply to: ${offer.title}`} size="lg">
      {success ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Sent!</h3>
          <p className="text-gray-500">Your application has been submitted successfully.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-500 mb-4">Write a cover letter for your application</p>

          <Textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell the company why you're a great fit for this position..."
            rows={8}
            className="mb-4"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!coverLetter.trim()}
              className="flex-1"
            >
              Submit Application
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
