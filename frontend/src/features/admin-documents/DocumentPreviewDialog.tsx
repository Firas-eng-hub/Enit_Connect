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
  const href = document?.link || '';
  const kind = getPreviewKind(document);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={document ? `Preview: ${document.title}` : 'Preview'}
      description="Preview is available for common image and PDF files. Otherwise, use Open to download."
      size="full"
      className="max-h-[85vh]"
    >
      <div className="h-[65vh] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
        {kind === 'image' ? (
          <img src={href} alt={document?.title || 'Document preview'} className="h-full w-full object-contain" />
        ) : kind === 'pdf' ? (
          <iframe title="PDF preview" src={href} className="h-full w-full" />
        ) : kind === 'unsupported' ? (
          <div className="h-full w-full flex items-center justify-center p-6 text-sm text-gray-600">
            Preview is not available for this file type.
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center p-6 text-sm text-gray-600">
            No preview available.
          </div>
        )}
      </div>

      <DialogFooter>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            <Button variant="outline">Open in new tab</Button>
          </a>
        ) : null}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

