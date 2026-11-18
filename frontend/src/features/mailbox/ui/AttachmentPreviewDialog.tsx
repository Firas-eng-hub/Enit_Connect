import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import type { AttachmentPreview } from '../model/types';

interface AttachmentPreviewDialogProps {
  preview: AttachmentPreview | null;
  kind: 'image' | 'pdf' | 'other' | null;
  onClose: () => void;
}

const toolbarClass = 'flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-2';

function ImagePreview({ preview }: { preview: AttachmentPreview }) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const step = (delta: number) => setZoom((z) => Math.min(4, Math.max(0.25, Number((z + delta).toFixed(2)))));
  return (
    <>
      <div className={toolbarClass}>
        <p className="text-sm font-medium text-ink">{t('mailbox.imageZoom')}</p>
        <div className="flex items-center gap-2">
          <Button size="xs" variant="secondary" onClick={() => step(-0.1)} aria-label={t('mailbox.zoomOut')}>
            <Minus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <span className="w-12 text-center text-xs font-medium tabular-nums text-body">{Math.round(zoom * 100)}%</span>
          <Button size="xs" variant="secondary" onClick={() => step(0.1)} aria-label={t('mailbox.zoomIn')}>
            <Plus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button size="xs" variant="secondary" onClick={() => setZoom(1)} aria-label={t('mailbox.resetZoom')}>
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="flex max-h-[72vh] items-center justify-center overflow-auto rounded-md border border-line bg-canvas p-3">
        <img
          src={preview.url}
          alt={preview.title}
          className="max-h-[68vh] w-auto object-contain"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        />
      </div>
    </>
  );
}

function PdfPreview({ preview }: { preview: AttachmentPreview }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  return (
    <>
      <div className={toolbarClass}>
        <p className="text-sm font-medium text-ink">{t('mailbox.pdfNav')}</p>
        <div className="flex items-center gap-2">
          <Button size="xs" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label={t('mailbox.prevPage')}>
            <ChevronLeft className="h-3 w-3 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
          <input
            type="number"
            min={1}
            value={page}
            aria-label={t('mailbox.page')}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              setPage(Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1);
            }}
            className="h-7 w-16 rounded-md border border-neutral-400 px-2 text-center text-xs"
          />
          <Button size="xs" variant="secondary" onClick={() => setPage((p) => p + 1)} aria-label={t('mailbox.nextPage')}>
            <ChevronRight className="h-3 w-3 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <iframe
        src={`${preview.url}#page=${page}&view=FitH`}
        title={preview.title}
        className="h-[72vh] w-full rounded-md border border-line"
      />
    </>
  );
}

export function AttachmentPreviewDialog({ preview, kind, onClose }: AttachmentPreviewDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={Boolean(preview)} onClose={onClose} title={preview?.title || t('mailbox.attachmentPreview')} size="full">
      {preview && (
        // key resets zoom/page state for each new attachment
        <div key={preview.url} className="space-y-3 pb-6">
          {kind === 'image' ? (
            <ImagePreview preview={preview} />
          ) : kind === 'pdf' ? (
            <PdfPreview preview={preview} />
          ) : (
            <p className="rounded-md border border-line p-5 text-sm text-body">{t('mailbox.noPreview')}</p>
          )}
        </div>
      )}
    </Dialog>
  );
}
