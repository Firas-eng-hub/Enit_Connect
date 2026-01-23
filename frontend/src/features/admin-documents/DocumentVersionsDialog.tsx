import { useMemo } from 'react';
import type { AdminDocument } from '@/entities/document/types';
import { useAdminDocumentVersions, useRestoreAdminDocumentVersion } from '@/entities/document/hooks';
import { Button } from '@/shared/ui/Button';
import { Dialog, DialogFooter } from '@/shared/ui/Dialog';

type Props = {
  open: boolean;
  onClose: () => void;
  document: AdminDocument | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
};

const formatSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

export function DocumentVersionsDialog({ open, onClose, document }: Props) {
  const docId = document?.id;
  const versionsQuery = useAdminDocumentVersions(docId);
  const restore = useRestoreAdminDocumentVersion();

  const isBusy = restore.isPending;

  const versions = useMemo(() => versionsQuery.data || [], [versionsQuery.data]);

  const onRestore = async (versionId: string) => {
    if (!docId) return;
    await restore.mutateAsync({ id: docId, versionId });
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isBusy) return;
        onClose();
      }}
      title={document ? `Versions: ${document.title}` : 'Versions'}
      description="Restoring a version creates a new current version."
      size="lg"
    >
      {versionsQuery.isLoading ? (
        <div className="text-sm text-gray-500">Loading versions…</div>
      ) : versions.length ? (
        <div className="mt-2 space-y-3">
          {versions.map((v) => {
            const createdAt = formatDateTime(v.createdAt);
            const size = formatSize(v.sizeBytes);
            return (
              <div
                key={v.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800">
                    Version {v.version}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {createdAt ? `Created: ${createdAt}` : null}
                    {createdAt && size ? ' · ' : null}
                    {size ? `Size: ${size}` : null}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  {v.link ? (
                    <a href={v.link} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" disabled={isBusy}>
                        Open
                      </Button>
                    </a>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => onRestore(v.id)}
                    isLoading={restore.isPending}
                    disabled={isBusy}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No versions yet.</div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isBusy}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

