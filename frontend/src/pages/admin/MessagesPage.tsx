import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Mail,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  Archive,
  Inbox,
  RotateCcw,
} from 'lucide-react';
import httpClient from '@/shared/api/httpClient';
import { formatDate, getApiErrorMessage } from '@/shared/lib/utils';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

interface MessageItem {
  _id: string;
  id: string;
  name: string;
  email: string;
  message: string;
  date?: string;
  read?: boolean;
  archived?: boolean;
}

type StatusFilter = 'all' | 'unread' | 'read' | 'archived';

export function MessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/api/admin/message?includeArchived=true');
      setMessages(response.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load messages.'));
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const isArchived = Boolean(msg.archived);
      const isRead = Boolean(msg.read);
      if (statusFilter === 'archived' && !isArchived) return false;
      if (statusFilter === 'unread' && (isRead || isArchived)) return false;
      if (statusFilter === 'read' && (!isRead || isArchived)) return false;
      if (statusFilter === 'all' && isArchived) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const haystack = `${msg.name} ${msg.email} ${msg.message}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (senderFilter.trim()) {
        const sender = senderFilter.trim().toLowerCase();
        const senderHaystack = `${msg.name} ${msg.email}`.toLowerCase();
        if (!senderHaystack.includes(sender)) return false;
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (!msg.date || new Date(msg.date) < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (!msg.date || new Date(msg.date) > toDate) return false;
      }

      return true;
    });
  }, [messages, statusFilter, searchTerm, senderFilter, dateFrom, dateTo]);

  const unreadCount = messages.filter((msg) => !msg.read && !msg.archived).length;
  const latestMessage = messages.reduce<MessageItem | null>((latest, current) => {
    if (!current.date) return latest;
    if (!latest?.date) return current;
    return new Date(current.date) > new Date(latest.date) ? current : latest;
  }, null);

  const allSelected = filteredMessages.length > 0 && filteredMessages.every((msg) => selectedIds.has(msg.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map((msg) => msg.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateLocalMessages = (ids: string[], patch: Partial<MessageItem>) => {
    setMessages((prev) => prev.map((msg) => (ids.includes(msg.id) ? { ...msg, ...patch } : msg)));
    if (selectedMessage && ids.includes(selectedMessage.id)) {
      setSelectedMessage({ ...selectedMessage, ...patch });
    }
  };

  const handleMarkRead = async (read: boolean, ids?: string[]) => {
    const targetIds = ids || Array.from(selectedIds);
    if (!targetIds.length) return;
    setActionError(null);

    try {
      if (targetIds.length === 1) {
        await httpClient.patch(`/api/admin/message/${targetIds[0]}/read`, { read });
      } else {
        await httpClient.patch('/api/admin/message/bulk', { ids: targetIds, read });
      }
      updateLocalMessages(targetIds, { read });
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to update message status.'));
    }
  };

  const handleArchive = async (archived: boolean, ids?: string[]) => {
    const targetIds = ids || Array.from(selectedIds);
    if (!targetIds.length) return;
    setActionError(null);

    try {
      if (targetIds.length === 1) {
        await httpClient.patch(`/api/admin/message/${targetIds[0]}/archive`, { archived });
      } else {
        await httpClient.patch('/api/admin/message/bulk', { ids: targetIds, archived });
      }
      updateLocalMessages(targetIds, { archived });
      if (archived) {
        setSelectedIds(new Set());
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to update messages.'));
    }
  };

  const handleDelete = async (ids?: string[]) => {
    const targetIds = ids || Array.from(selectedIds);
    if (!targetIds.length) return;
    if (!confirm(`Delete ${targetIds.length} message${targetIds.length > 1 ? 's' : ''}?`)) return;
    setActionError(null);

    try {
      await Promise.all(targetIds.map((id) => httpClient.delete(`/api/admin/message/${id}`)));
      setMessages((prev) => prev.filter((msg) => !targetIds.includes(msg.id)));
      setSelectedIds(new Set());
      if (selectedMessage && targetIds.includes(selectedMessage.id)) {
        setSelectedMessage(null);
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to delete messages.'));
    }
  };

  const markAll = async (read: boolean) => {
    setActionError(null);
    try {
      await httpClient.patch(read ? '/api/admin/message/read-all' : '/api/admin/message/unread-all');
      setMessages((prev) =>
        prev.map((msg) => (msg.archived ? msg : { ...msg, read }))
      );
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to update messages.'));
    }
  };

  const openReply = (msg: MessageItem) => {
    const subject = encodeURIComponent(`Re: Your message to ENIT Connect`);
    const body = encodeURIComponent(`Hello ${msg.name},\n\nThanks for reaching out. \n\n---\n${msg.message}`);
    window.location.href = `mailto:${msg.email}?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-8 py-10 shadow-xl mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Messages</h1>
        <p className="text-primary-100 text-lg">View and manage platform messages</p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{messages.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Unread</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{unreadCount}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Latest Message</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {latestMessage?.date ? formatDate(latestMessage.date) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {latestMessage ? `${latestMessage.name} · ${latestMessage.email}` : 'No messages yet'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Search by sender or content"
                  />
                </div>
              </div>
              <div className="min-w-[180px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="all">Inbox</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sender</label>
                <input
                  value={senderFilter}
                  onChange={(e) => setSenderFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Name or email"
                />
              </div>
              <div className="min-w-[160px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              <div className="min-w-[160px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4 text-gray-400" />
              Showing {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </div>
          </div>

          {actionError && (
            <Alert variant="danger" className="mb-2" onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  Select all
                </label>
                <span className="text-sm text-gray-500">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => markAll(true)}>
                  Mark all read
                </Button>
                <Button size="sm" variant="outline" onClick={() => markAll(false)}>
                  Mark all unread
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleMarkRead(true)}>
                Mark read
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleMarkRead(false)}>
                Mark unread
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleArchive(true)}>
                Archive
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleArchive(false)}>
                Unarchive
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete()}>
                Delete
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600">
                No messages match your filters.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedIds.has(msg.id);
                const isActive = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.read && !msg.archived) {
                        handleMarkRead(true, [msg.id]);
                      }
                    }}
                    className={`w-full text-left border rounded-2xl p-5 transition-all ${
                      isActive ? 'border-primary-500 bg-primary-50/60' : 'border-gray-200 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(msg.id);
                        }}
                        className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {msg.read ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-amber-500" />
                          )}
                          <p className="font-semibold text-gray-900 truncate">{msg.name}</p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-500 truncate">{msg.email}</p>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {msg.date ? formatDate(msg.date) : 'N/A'}
                          {msg.archived && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                              <Archive className="w-3 h-3" />
                              Archived
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {selectedMessage ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">Message Detail</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedMessage.name}</h2>
                <p className="text-sm text-gray-500">{selectedMessage.email}</p>
              </div>

              <div className="grid gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedMessage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedMessage.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{selectedMessage.date ? formatDate(selectedMessage.date) : 'N/A'}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500 font-semibold mb-2">THREAD</p>
                <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
                  <p className="text-gray-700 whitespace-pre-line">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openReply(selectedMessage)}>
                  Quick Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleMarkRead(false, [selectedMessage.id])}>
                  Mark unread
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleArchive(true, [selectedMessage.id])}>
                  Archive
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleArchive(false, [selectedMessage.id])}>
                  Unarchive
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete([selectedMessage.id])}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select a message</h3>
              <p className="text-sm text-gray-500 mt-2">Choose a message to see details and reply.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={fetchMessages}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh inbox
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
