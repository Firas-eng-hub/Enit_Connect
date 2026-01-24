import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, Lock, Share2, Shield } from 'lucide-react';
import type { AdminDocument, AdminDocumentAudience, AdminDocumentAccessLevel } from '@/entities/document/types';
import {
  useAdminDocumentShares,
  useCreateAdminShare,
  useRevokeAdminShare,
  useUpdateAdminDocument,
} from '@/entities/document/hooks';
import { Button } from '@/shared/ui/Button';
import { Dialog, DialogFooter } from '@/shared/ui/Dialog';

type Props = {
  open: boolean;
  onClose: () => void;
  document: AdminDocument | null;
};

const accessLevelToAudience = (accessLevel?: AdminDocumentAccessLevel): AdminDocumentAudience => {
  if (accessLevel === 'students' || accessLevel === 'companies' || accessLevel === 'internal') return accessLevel;
  return 'internal';
};

const audienceToAccessLevel = (audience: AdminDocumentAudience): AdminDocumentAccessLevel => {
  if (audience === 'internal') return 'private';
  return audience;
};

const formatAudienceLabel = (audience: AdminDocumentAudience) => {
  if (audience === 'students') return 'Students';
  if (audience === 'companies') return 'Companies';
  return 'Internal only';
};

export function DocumentSharePanel({ open, onClose, document }: Props) {
  const docId = document?.id;
  const shares = useAdminDocumentShares(docId);
  const createShare = useCreateAdminShare();
  const revokeShare = useRevokeAdminShare();
  const updateDoc = useUpdateAdminDocument();

  const isBusy = createShare.isPending || revokeShare.isPending || updateDoc.isPending;

  const initialAudience = useMemo(() => accessLevelToAudience(document?.accessLevel), [document?.accessLevel]);
  const [audience, setAudience] = useState<AdminDocumentAudience>(initialAudience);
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [notice, setNotice] = useState<string>('');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setAudience(accessLevelToAudience(document?.accessLevel));
    setExpiresInDays(7);
    setNotice('');
  }, [open, document?.accessLevel]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object') {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      const message = response?.data?.message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const onCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Link copied to clipboard.');
    } catch {
      setNotice('Could not copy automatically. Please copy the link manually.');
    }
  };

  const onSaveVisibility = async () => {
    if (!document) return;
    setNotice('');
    try {
      await updateDoc.mutateAsync({
        id: document.id,
        payload: { accessLevel: audienceToAccessLevel(audience), updatedAt: document.updatedAt ?? null },
      });
      setNotice('Visibility updated.');
    } catch (err: unknown) {
      setNotice(getErrorMessage(err, 'Failed to update visibility.'));
    }
  };

  const onCreateShare = async () => {
    if (!document) return;
    setNotice('');
    try {
      const res = await createShare.mutateAsync({
        id: document.id,
        payload: { expiresInDays, audience },
      });
      const url = res.data.shareUrl;
      setNotice('Share link created.');
      if (url) void onCopy(url);
    } catch (err: unknown) {
      setNotice(getErrorMessage(err, 'Failed to create share link.'));
    }
  };

  const onRevoke = async (shareId: string) => {
    setNotice('');
    try {
      await revokeShare.mutateAsync(shareId);
      setNotice('Share link revoked.');
    } catch (err: unknown) {
      setNotice(getErrorMessage(err, 'Failed to revoke share link.'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isBusy) return;
        onClose();
      }}
      title={document ? `Share: ${document.title}` : 'Share document'}
      description="Visibility controls who can open the shared link. Share links always require login."
      size="lg"
    >
      {notice ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-6">
        <section className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Shield className="h-4 w-4" />
            Visibility
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Select who is allowed to access this document via share links.
          </p>

          <div className="mt-3 flex flex-col md:flex-row md:items-end gap-3">
            <label className="flex-1">
              <span className="text-sm font-semibold text-gray-700">Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as AdminDocumentAudience)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="internal">Internal only</option>
                <option value="students">Students</option>
                <option value="companies">Companies</option>
              </select>
            </label>
            <Button
              variant="outline"
              onClick={onSaveVisibility}
              isLoading={updateDoc.isPending}
              disabled={!document || isBusy}
              leftIcon={<Lock className="h-4 w-4" />}
            >
              Save visibility
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Share2 className="h-4 w-4" />
            Share links
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Create an expiring link. Recipients must be logged in and match the selected audience.
          </p>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <label>
              <span className="text-sm font-semibold text-gray-700">Expiration (days)</span>
              <input
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value || 7))}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-gray-700">Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as AdminDocumentAudience)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="internal">Internal only</option>
                <option value="students">Students</option>
                <option value="companies">Companies</option>
              </select>
            </label>
            <Button
              onClick={onCreateShare}
              isLoading={createShare.isPending}
              disabled={!document || isBusy}
              leftIcon={<Link2 className="h-4 w-4" />}
            >
              Create link
            </Button>
          </div>

          <div className="mt-4">
            {shares.isLoading ? (
              <div className="text-sm text-gray-500">Loading share links…</div>
            ) : shares.data && shares.data.length ? (
              <div className="space-y-3">
                {shares.data.map((share) => {
                  const isRevoked = Boolean(share.revokedAt);
                  const expiresAt = share.expiresAt ? new Date(share.expiresAt).toLocaleString() : 'No expiry';
                  return (
                    <div
                      key={share.id}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {formatAudienceLabel((share.audience as AdminDocumentAudience) || audience)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Expires: {expiresAt}
                          {isRevoked ? ' · Revoked' : ''}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            readOnly
                            value={share.shareUrl}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCopy(share.shareUrl)}
                            disabled={isBusy}
                            leftIcon={<Copy className="h-4 w-4" />}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onRevoke(share.id)}
                          disabled={isBusy || isRevoked}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No share links yet.</div>
            )}
          </div>
        </section>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isBusy}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
