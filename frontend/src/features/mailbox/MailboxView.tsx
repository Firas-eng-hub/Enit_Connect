import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Inbox,
  MailPlus,
  RefreshCw,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  UserLock,
} from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { cn, formatDateTime, getApiErrorMessage } from '@/shared/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';

type MailFolder = 'inbox' | 'sent' | 'drafts';
type MailRole = 'student' | 'company' | 'admin';
type RecipientRole = MailRole | 'group';

interface MailUser {
  id: string;
  type: MailRole | 'system';
  name: string;
  email: string | null;
}

interface MailItem {
  id: string;
  messageId: string;
  folder: MailFolder;
  read: boolean;
  starred: boolean;
  subject: string;
  body: string;
  preview: string;
  sentAt: string;
  sender: MailUser;
  recipients: MailUser[];
}

interface RecipientOption {
  id: string;
  type: RecipientRole;
  name: string;
  email: string;
  status?: string | null;
}

interface MailboxViewProps {
  title: string;
  subtitle: string;
  canModerate?: boolean;
  supportInboxPath?: string;
}

const folderMeta: Array<{ key: MailFolder; label: string; icon: typeof Inbox }> = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'drafts', label: 'Drafts', icon: Archive },
];

const dedupeRecipients = (rows: RecipientOption[]) => {
  const seen = new Set<string>();
  const unique: RecipientOption[] = [];
  rows.forEach((row) => {
    const key = `${row.type}:${row.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(row);
  });
  return unique;
};

export function MailboxView({
  title,
  subtitle,
  canModerate = false,
  supportInboxPath,
}: MailboxViewProps) {
  const { userType } = useAuth();
  const [folder, setFolder] = useState<MailFolder>('inbox');
  const [items, setItems] = useState<MailItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | MailRole>('all');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState<RecipientOption[]>([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientOption[]>([]);

  const selectedRecipientKeys = useMemo(
    () => new Set(selectedRecipients.map((recipient) => `${recipient.type}:${recipient.id}`)),
    [selectedRecipients]
  );

  const recipientTypeOptions = useMemo(() => {
    if (userType === 'company') {
      return [
        { value: 'all' as const, label: 'All' },
        { value: 'student' as const, label: 'Students' },
        { value: 'admin' as const, label: 'Admins' },
      ];
    }

    if (userType === 'student') {
      return [
        { value: 'all' as const, label: 'All' },
        { value: 'student' as const, label: 'Students' },
        { value: 'company' as const, label: 'Companies' },
        { value: 'admin' as const, label: 'Admins' },
      ];
    }

    return [
      { value: 'all' as const, label: 'All' },
      { value: 'student' as const, label: 'Students' },
      { value: 'company' as const, label: 'Companies' },
      { value: 'admin' as const, label: 'Admins' },
    ];
  }, [userType]);

  const resetCompose = () => {
    setComposeSubject('');
    setComposeBody('');
    setRecipientType('all');
    setRecipientQuery('');
    setRecipientResults([]);
    setSelectedRecipients([]);
  };

  const fetchFolder = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get(`/api/mail/folders/${folder}`, {
        params: { q: appliedSearch, limit: 80, offset: 0 },
      });
      const rows = (response.data?.data || []) as MailItem[];
      setItems(rows);

      if (selectedItem) {
        const updated = rows.find((row) => row.id === selectedItem.id) || null;
        setSelectedItem(updated);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load mailbox items.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, appliedSearch]);

  const fetchRecipients = async () => {
    if (!showCompose) return;

    setRecipientLoading(true);
    try {
      const response = await httpClient.get('/api/mail/recipients', {
        params: {
          type: recipientType,
          q: recipientQuery,
          limit: 30,
        },
      });
      setRecipientResults((response.data?.data || []) as RecipientOption[]);
    } catch {
      setRecipientResults([]);
    } finally {
      setRecipientLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompose, recipientType, recipientQuery]);

  const openItem = async (item: MailItem) => {
    setActionError(null);
    setActionSuccess(null);

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
      setActionError(getApiErrorMessage(err, 'Unable to open message details.'));
    }
  };

  const patchItem = async (itemId: string, payload: Partial<Pick<MailItem, 'read' | 'starred' | 'folder'>>) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await httpClient.patch(`/api/mail/${itemId}`, payload);
      const updated = response.data as MailItem;
      setItems((prev) =>
        prev
          .map((row) => (row.id === updated.id ? updated : row))
          .filter((row) => row.folder === folder)
      );
      setSelectedItem((prev) => (prev && prev.id === updated.id ? updated : prev));
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to update message.'));
    }
  };

  const handleDelete = async (itemId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await httpClient.delete(`/api/mail/${itemId}`);
      setActionSuccess(response.data?.message || 'Message updated.');
      setItems((prev) => prev.filter((row) => row.id !== itemId));
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to delete message.'));
    }
  };

  const toggleRecipient = (recipient: RecipientOption) => {
    const key = `${recipient.type}:${recipient.id}`;
    if (selectedRecipientKeys.has(key)) {
      setSelectedRecipients((prev) => prev.filter((row) => `${row.type}:${row.id}` !== key));
      return;
    }
    setSelectedRecipients((prev) => dedupeRecipients([...prev, recipient]));
  };

  const sendMessage = async () => {
    setComposeSending(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await httpClient.post('/api/mail/compose', {
        subject: composeSubject,
        body: composeBody,
        recipients: selectedRecipients.map((recipient) => ({
          id: recipient.id,
          type: recipient.type,
        })),
      });
      setActionSuccess('Message sent successfully.');
      setShowCompose(false);
      resetCompose();
      if (folder === 'sent') {
        fetchFolder();
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to send message.'));
    } finally {
      setComposeSending(false);
    }
  };

  const saveDraft = async () => {
    setComposeSending(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await httpClient.post('/api/mail/drafts', {
        subject: composeSubject,
        body: composeBody,
        recipients: selectedRecipients.map((recipient) => ({
          id: recipient.id,
          type: recipient.type,
        })),
      });
      setActionSuccess('Draft saved.');
      setShowCompose(false);
      resetCompose();
      if (folder === 'drafts') {
        fetchFolder();
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to save draft.'));
    } finally {
      setComposeSending(false);
    }
  };

  const lockSender = async (lock: boolean) => {
    if (!selectedItem?.sender) return;
    if (selectedItem.sender.type === 'system') return;
    if (selectedItem.sender.type === 'admin') return;

    const reason =
      lock && window.prompt('Reason for locking this sender (optional):', '')?.trim();

    setActionError(null);
    setActionSuccess(null);
    try {
      await httpClient.post(
        lock
          ? '/api/mail/admin/moderation/lock-user'
          : '/api/mail/admin/moderation/unlock-user',
        {
          userId: selectedItem.sender.id,
          userType: selectedItem.sender.type,
          reason: reason || undefined,
        }
      );
      setActionSuccess(lock ? 'Sender locked.' : 'Sender unlocked.');
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Moderation action failed.'));
    }
  };

  const hardDeleteMessage = async () => {
    if (!selectedItem) return;
    if (!window.confirm('Permanently delete this message from all mailboxes?')) return;

    setActionError(null);
    setActionSuccess(null);
    try {
      await httpClient.delete(`/api/mail/admin/messages/${selectedItem.messageId}`);
      setActionSuccess('Message permanently deleted.');
      setItems((prev) => prev.filter((row) => row.messageId !== selectedItem.messageId));
      setSelectedItem(null);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to permanently delete message.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
            <p className="text-primary-100 text-lg">{subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={fetchFolder}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<MailPlus className="w-4 h-4" />}
              onClick={() => {
                setShowCompose((prev) => !prev);
                if (showCompose) resetCompose();
              }}
            >
              {showCompose ? 'Close Compose' : 'Compose'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {actionError && (
        <Alert variant="danger" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {actionSuccess && (
        <Alert variant="success" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {showCompose && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Compose Message</h2>

          <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <select
              value={recipientType}
              onChange={(event) => setRecipientType(event.target.value as 'all' | MailRole)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {recipientTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={recipientQuery}
              onChange={(event) => setRecipientQuery(event.target.value)}
              placeholder="Search recipients by name or email"
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="border border-gray-200 rounded-xl p-3 max-h-52 overflow-y-auto bg-gray-50/50">
            {recipientLoading ? (
              <p className="text-sm text-gray-500">Loading recipients...</p>
            ) : recipientResults.length === 0 ? (
              <p className="text-sm text-gray-500">No recipients found.</p>
            ) : (
              <div className="space-y-2">
                {recipientResults.map((recipient) => {
                  const key = `${recipient.type}:${recipient.id}`;
                  const checked = selectedRecipientKeys.has(key);
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-2.5 cursor-pointer',
                        checked ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white'
                      )}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {recipient.name}{' '}
                          <span className="text-xs uppercase text-gray-500">({recipient.type})</span>
                        </p>
                        <p className="text-sm text-gray-600">{recipient.email}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(recipient)}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRecipients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedRecipients.map((recipient) => (
                <span
                  key={`${recipient.type}:${recipient.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-100 text-primary-800 px-3 py-1 text-xs font-semibold"
                >
                  {recipient.name}
                  <button
                    type="button"
                    onClick={() => toggleRecipient(recipient)}
                    className="text-primary-700 hover:text-primary-900"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}

          <input
            value={composeSubject}
            onChange={(event) => setComposeSubject(event.target.value)}
            placeholder="Subject"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <textarea
            value={composeBody}
            onChange={(event) => setComposeBody(event.target.value)}
            placeholder="Write your message..."
            rows={6}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              isLoading={composeSending}
              disabled={!composeSubject.trim() || !composeBody.trim() || selectedRecipients.length === 0}
              onClick={sendMessage}
            >
              Send Message
            </Button>
            <Button
              variant="outline"
              isLoading={composeSending}
              disabled={!composeSubject.trim() && !composeBody.trim()}
              onClick={saveDraft}
            >
              Save Draft
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {folderMeta.map((entry) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setFolder(entry.key)}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border',
                      folder === entry.key
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {entry.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subject or content"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Button variant="outline" onClick={() => setAppliedSearch(search.trim())}>
                Apply
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Loading mailbox...</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No messages in {folder}.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors',
                      selectedItem?.id === item.id && 'bg-primary-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('truncate', !item.read && 'font-semibold text-gray-900')}>
                            {item.subject}
                          </p>
                          {!item.read && folder === 'inbox' && (
                            <span className="inline-block h-2 w-2 rounded-full bg-primary-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {item.sender.name} - {item.preview}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {item.sentAt ? formatDateTime(item.sentAt) : 'N/A'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm min-h-[420px]">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedItem.subject}</h3>
                  <p className="text-sm text-gray-500">{formatDateTime(selectedItem.sentAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => patchItem(selectedItem.id, { starred: !selectedItem.starred })}
                    className={cn(
                      'p-2 rounded-lg border',
                      selectedItem.starred
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => patchItem(selectedItem.id, { read: !selectedItem.read })}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <Inbox className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="font-semibold text-gray-700">From:</span> {selectedItem.sender.name}
                  {selectedItem.sender.email ? ` (${selectedItem.sender.email})` : ''}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">To:</span>{' '}
                  {selectedItem.recipients.map((recipient) => recipient.email || recipient.name).join(', ')}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40 whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                {selectedItem.body}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patchItem(selectedItem.id, { folder: 'inbox' })}
                >
                  Move to Inbox
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patchItem(selectedItem.id, { folder: 'sent' })}
                >
                  Move to Sent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patchItem(selectedItem.id, { folder: 'drafts' })}
                >
                  Move to Drafts
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => handleDelete(selectedItem.id)}
                >
                  Delete Permanently
                </Button>
              </div>

              {canModerate && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2 inline-flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Admin Moderation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<UserLock className="w-4 h-4" />}
                      onClick={() => lockSender(true)}
                      disabled={selectedItem.sender.type === 'admin' || selectedItem.sender.type === 'system'}
                    >
                      Lock Sender
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => lockSender(false)}
                      disabled={selectedItem.sender.type === 'admin' || selectedItem.sender.type === 'system'}
                    >
                      Unlock Sender
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<ShieldAlert className="w-4 h-4" />}
                      onClick={hardDeleteMessage}
                    >
                      Hard Delete Message
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 h-full flex items-center justify-center">
              Select a message to read it.
            </div>
          )}
        </div>
      </div>

      {supportInboxPath && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Public Contact Inbox</p>
            <p className="text-sm text-gray-600">
              Visitor contact form messages are managed separately from internal mailbox messages.
            </p>
          </div>
          <Link to={supportInboxPath}>
            <Button variant="outline">Open Support Inbox</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
