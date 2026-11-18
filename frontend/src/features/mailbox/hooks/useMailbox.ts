import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage } from '@/shared/lib/utils';
import { matchesActiveFolder } from '../lib/mail';
import type { MailFeedback, MailFolder, MailItem } from '../model/types';

type MailPatch = Partial<Pick<MailItem, 'read' | 'starred' | 'folder'>>;

/** Folder listing, selection and per-message actions (including admin moderation). */
export function useMailbox(feedback: MailFeedback) {
  const { t } = useTranslation();
  const { setError, setSuccess } = feedback;
  const [folder, setFolder] = useState<MailFolder>('inbox');
  const [items, setItems] = useState<MailItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const fetchFolder = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await httpClient.get(`/api/mail/folders/${folder}`, {
        params: { q: appliedSearch, limit: 80, offset: 0 },
      });
      const rows = (response.data?.data || []) as MailItem[];
      setItems(rows);
      setSelectedItem((current) => (current ? rows.find((row) => row.id === current.id) || null : null));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, t('mailbox.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [folder, appliedSearch, t]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  const openItem = async (item: MailItem) => {
    clearFeedback();
    try {
      const response = await httpClient.get(`/api/mail/${item.id}`);
      const fullItem = response.data as MailItem;
      setSelectedItem(fullItem);
      if (!fullItem.read && fullItem.folder === 'inbox') {
        await httpClient.patch(`/api/mail/${fullItem.id}`, { read: true });
        setItems((prev) => prev.map((row) => (row.id === fullItem.id ? { ...row, read: true } : row)));
        setSelectedItem((prev) => (prev ? { ...prev, read: true } : prev));
      }
    } catch (err) {
      setSelectedItem(item);
      setError(getApiErrorMessage(err, t('mailbox.openFailed')));
    }
  };

  const patchItem = async (itemId: string, payload: MailPatch) => {
    clearFeedback();
    try {
      const response = await httpClient.patch(`/api/mail/${itemId}`, payload);
      const updated = response.data as MailItem;
      setItems((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row)).filter((row) => matchesActiveFolder(row, folder))
      );
      setSelectedItem((prev) => (prev && prev.id === updated.id ? updated : prev));
    } catch (err) {
      setError(getApiErrorMessage(err, t('mailbox.updateFailed')));
    }
  };

  const deleteItem = async (itemId: string) => {
    clearFeedback();
    try {
      const response = await httpClient.delete(`/api/mail/${itemId}`);
      setSuccess(response.data?.message || t('mailbox.updated'));
      setItems((prev) => prev.filter((row) => row.id !== itemId));
      setSelectedItem((prev) => (prev?.id === itemId ? null : prev));
    } catch (err) {
      setError(getApiErrorMessage(err, t('mailbox.deleteFailed')));
    }
  };

  const setSenderLock = async (lock: boolean) => {
    const sender = selectedItem?.sender;
    if (!sender || sender.type === 'system' || sender.type === 'admin') return;
    const reason = lock ? window.prompt(t('mailbox.lockReason'), '')?.trim() : undefined;
    clearFeedback();
    try {
      await httpClient.post(
        lock ? '/api/mail/admin/moderation/lock-user' : '/api/mail/admin/moderation/unlock-user',
        { userId: sender.id, userType: sender.type, reason: reason || undefined }
      );
      setSuccess(lock ? t('mailbox.senderLocked') : t('mailbox.senderUnlocked'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('mailbox.moderationFailed')));
    }
  };

  const hardDeleteMessage = async () => {
    if (!selectedItem || !window.confirm(t('mailbox.confirmHardDelete'))) return;
    const { messageId } = selectedItem;
    clearFeedback();
    try {
      await httpClient.delete(`/api/mail/admin/messages/${messageId}`);
      setSuccess(t('mailbox.hardDeleted'));
      setItems((prev) => prev.filter((row) => row.messageId !== messageId));
      setSelectedItem(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('mailbox.hardDeleteFailed')));
    }
  };

  return {
    folder,
    setFolder,
    items,
    selectedItem,
    loading,
    loadError,
    clearLoadError: () => setLoadError(null),
    search,
    setSearch,
    applySearch: () => setAppliedSearch(search.trim()),
    fetchFolder,
    openItem,
    patchItem,
    deleteItem,
    setSenderLock,
    hardDeleteMessage,
  };
}
