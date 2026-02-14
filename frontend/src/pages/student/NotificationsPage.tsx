import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/api/student/notifications');
      setNotifications(response.data);
      window.dispatchEvent(new Event('notifications:refresh'));
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await httpClient.patch(`/api/student/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await httpClient.patch('/api/student/notifications/read-all');
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 shadow-xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-primary-100 text-lg">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold backdrop-blur"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl border-2 border-dashed border-blue-300 p-16 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-2xl shadow-blue-500/40">
              <Bell className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Notifications</h3>
            <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">You're all caught up! Check back later for new updates.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`group bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden hover:shadow-xl ${
                notification.read ? 'border-gray-200' : 'border-primary-300 shadow-lg'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {notification.createdAt ? formatDateTime(notification.createdAt) : 'Just now'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
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
