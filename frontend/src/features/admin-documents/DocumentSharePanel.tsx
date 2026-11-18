import i18next from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  if (audience === 'students') return i18next.t('adminDocs.students');
  if (audience === 'companies') return i18next.t('adminDocs.companies');
  return i18next.t('adminDocs.internal');
};

export function DocumentSharePanel({ open, onClose, document }: Props) {
  const { t } = useTranslation();
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
      setNotice(t('adminDocs.copied'));
    } catch {
      setNotice(t('adminDocs.copyFailed'));
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
      setNotice(t('adminDocs.visibilityUpdated'));
    } catch (err: unknown) {
      setNotice(getErrorMessage(err, t('adminDocs.visibilityFailed')));
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
      setNotice(t('adminDocs.linkCreated'));
      if (url) void onCopy(url);
    } catch (err: unknown) {
      setNotice(getErrorMessage(err, t('adminDocs.linkFailed')));
    }
  };

  const onRevoke = async (shareId: string) => {
    setNotice('');
    try {
      await revokeShare.mutateAsync(shareId);
      setNotice(t('adminDocs.linkRevoked'));
    } catch (err: unknown) {
      setNotice(getErrorMessage(err, t('adminDocs.revokeFailed')));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isBusy) return;
        onClose();
      }}
      title={document ? t('adminDocs.shareOf', { title: document.title }) : t('adminDocs.shareDoc')}
      description={t('adminDocs.shareDesc')}
      size="lg"
    >
      {notice ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-6">
        <section className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Shield className="h-4 w-4" />
            {t('adminDocs.visibility')}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {t('adminDocs.visibilityHint')}
          </p>

          <div className="mt-3 flex flex-col md:flex-row md:items-end gap-3">
            <label className="flex-1">
              <span className="text-sm font-semibold text-gray-700">{t('adminDocs.audience')}</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as AdminDocumentAudience)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="internal">{t('adminDocs.internal')}</option>
                <option value="students">{t('adminDocs.students')}</option>
                <option value="companies">{t('adminDocs.companies')}</option>
              </select>
            </label>
            <Button
              variant="outline"
              onClick={onSaveVisibility}
              isLoading={updateDoc.isPending}
              disabled={!document || isBusy}
              leftIcon={<Lock className="h-4 w-4" />}
            >
              {t('adminDocs.saveVisibility')}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Share2 className="h-4 w-4" />
            {t('adminDocs.shareLinks')}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {t('adminDocs.shareLinksHint')}
          </p>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <label>
              <span className="text-sm font-semibold text-gray-700">{t('adminDocs.expiration')}</span>
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
              <span className="text-sm font-semibold text-gray-700">{t('adminDocs.audience')}</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as AdminDocumentAudience)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="internal">{t('adminDocs.internal')}</option>
                <option value="students">{t('adminDocs.students')}</option>
                <option value="companies">{t('adminDocs.companies')}</option>
              </select>
            </label>
            <Button
              onClick={onCreateShare}
              isLoading={createShare.isPending}
              disabled={!document || isBusy}
              leftIcon={<Link2 className="h-4 w-4" />}
            >
              {t('adminDocs.createLink')}
            </Button>
          </div>

          <div className="mt-4">
            {shares.isLoading ? (
              <div className="text-sm text-gray-500">{t('adminDocs.loadingLinks')}</div>
            ) : shares.data && shares.data.length ? (
              <div className="space-y-3">
                {shares.data.map((share) => {
                  const isRevoked = Boolean(share.revokedAt);
                  const expiresAt = share.expiresAt ? new Date(share.expiresAt).toLocaleString() : t('adminDocs.noExpiry');
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
                            {t('adminDocs.copy')}
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
                          {t('adminDocs.revoke')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">{t('adminDocs.noLinks')}</div>
            )}
          </div>
        </section>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isBusy}>
          {t('adminDocs.close')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
