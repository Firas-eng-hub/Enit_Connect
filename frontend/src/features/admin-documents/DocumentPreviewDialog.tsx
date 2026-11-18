import { useTranslation } from 'react-i18next';
import type { AdminDocument } from '@/entities/document/types';
import { Button } from '@/shared/ui/Button';
import { Dialog, DialogFooter } from '@/shared/ui/Dialog';

type Props = {
  open: boolean;
  onClose: () => void;
  document: AdminDocument | null;
};

const getPreviewKind = (doc: AdminDocument | null) => {
  if (!doc?.link) return 'none';
  const mime = String(doc.mimeType || '').toLowerCase();
  const ext = String(doc.extension || '').toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  return 'unsupported';
};

export function DocumentPreviewDialog({ open, onClose, document }: Props) {
  const { t } = useTranslation();
  const href = document?.link || '';
  const kind = getPreviewKind(document);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={document ? t('adminDocs.previewOf', { title: document.title }) : t('adminDocs.preview')}
      description={t('adminDocs.previewDesc')}
      size="full"
      className="max-h-[85vh]"
    >
      <div className="h-[65vh] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
        {kind === 'image' ? (
          <img src={href} alt={document?.title || t('adminDocs.previewAlt')} className="h-full w-full object-contain" />
        ) : kind === 'pdf' ? (
          <iframe title="PDF preview" src={href} className="h-full w-full" />
        ) : kind === 'unsupported' ? (
          <div className="h-full w-full flex items-center justify-center p-6 text-sm text-gray-600">
            {t('adminDocs.noPreviewType')}
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center p-6 text-sm text-gray-600">
            {t('adminDocs.noPreview')}
          </div>
        )}
      </div>

      <DialogFooter>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            <Button variant="outline">{t('adminDocs.openNewTab')}</Button>
          </a>
        ) : null}
        <Button variant="outline" onClick={onClose}>
          {t('adminDocs.close')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

