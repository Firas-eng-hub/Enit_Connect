import { Bell, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import { formatDateTime } from '@/shared/lib/utils';

interface Notification {
    id: string;
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
    createdAt?: string;
    read: boolean;
}

const NOTIFICATIONS_REFRESH_EVENT = 'notifications:refresh';
const NOTIFICATIONS_NEW_EVENT = 'notifications:new';

interface NotificationsPageProps {
    apiBase: string; // '/api/student' | '/api/company' | '/api/admin'
}

export function NotificationsPageShared({ apiBase }: NotificationsPageProps) {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<Set<string>>(new Set());

    const refresh = useCallback(async (notifyTopbar = true) => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get(`${apiBase}/notifications`);
            setNotifications(response.data);
            if (notifyTopbar) window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
        } catch {
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    }, [apiBase, t]);

    useEffect(() => {
        refresh();
        const handleNew = () => refresh(false);
        window.addEventListener(NOTIFICATIONS_NEW_EVENT, handleNew);
        return () => window.removeEventListener(NOTIFICATIONS_NEW_EVENT, handleNew);
    }, [refresh]);

    /** Single delete — used for both "mark as read" and explicit trash. */
    const remove = async (id: string) => {
        setDeleting(prev => new Set(prev).add(id));
        // Optimistic UI: remove immediately from state
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await httpClient.delete(`${apiBase}/notifications/${id}`);
        } catch {
            // Rollback not practical here; just refresh to re-sync
        } finally {
            setDeleting(prev => { const s = new Set(prev); s.delete(id); return s; });
            // Refresh topbar badge
            window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
        }
    };

    /** Clear all — delete every notification in parallel. */
    const clearAll = async () => {
        const ids = notifications.map(n => n.id);
        setNotifications([]);
        await Promise.allSettled(ids.map(id => httpClient.delete(`${apiBase}/notifications/${id}`)));
        window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
            case 'warning': return <AlertCircle className="w-6 h-6 text-amber-500" />;
            default: return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 pb-5 border-b border-line">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-ink mb-2">{t('notifications.title')}</h1>
                        <p className="text-muted-foreground text-lg">
                            {unreadCount > 0
                                ? t('notifications.unread_other', { count: unreadCount })
                                : t('notifications.allCaughtUp')}
                        </p>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex items-center gap-2">
                            {/* Clear all */}
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-ink rounded-xl transition-colors font-semibold text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t('notifications.clearAll')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
                    <div className="relative text-center">
                        <div className="bg-primary-50 inline-flex items-center justify-center w-10 h-10 rounded-3xl mb-3 text-primary-700">
                            <Bell className="w-5 h-5 text-primary-700" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-3">{t('notifications.noNotifications')}</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{t('notifications.noNotificationsDesc')}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`group bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden hover:shadow-lg ${deleting.has(notification.id) ? 'opacity-50 scale-95' : ''
                                } ${notification.read ? 'border-gray-200' : 'border-primary-300'}`}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <h3 className="text-base font-semibold text-gray-900">{notification.title}</h3>
                                            {!notification.read && (
                                                <span className="shrink-0 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                                                    {t('common.new')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                        <p className="text-xs text-gray-400">
                                            {notification.createdAt ? formatDateTime(notification.createdAt) : t('common.justNow')}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1 shrink-0">
                                        {!notification.read && (
                                            <button
                                                onClick={() => remove(notification.id)}
                                                title={t('notifications.markAsRead')}
                                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => remove(notification.id)}
                                            title={t('common.delete')}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
