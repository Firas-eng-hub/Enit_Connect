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
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{t('notifications.title')}</h1>
                        <p className="text-primary-100 text-lg">
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
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-all font-semibold text-sm backdrop-blur"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t('notifications.clearAll')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl border-2 border-dashed border-blue-300 p-16 shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
                    <div className="relative text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-2xl shadow-blue-500/40">
                            <Bell className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">{t('notifications.noNotifications')}</h3>
                        <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">{t('notifications.noNotificationsDesc')}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`group bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden hover:shadow-lg ${deleting.has(notification.id) ? 'opacity-50 scale-95' : ''
                                } ${notification.read ? 'border-gray-200' : 'border-primary-300 shadow-md'}`}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <h3 className="text-base font-bold text-gray-900">{notification.title}</h3>
                                            {!notification.read && (
                                                <span className="shrink-0 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
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
                                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => remove(notification.id)}
                                            title={t('common.delete')}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
