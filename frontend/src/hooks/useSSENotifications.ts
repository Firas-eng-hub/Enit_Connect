import { useEffect, useRef, useCallback, useState } from 'react';
import { config } from '@/app/config/env';

interface SSENotification {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
}

interface UseSSENotificationsOptions {
    role: 'student' | 'company' | 'admin';
    onNotification?: (notification: SSENotification) => void;
    enabled?: boolean;
}

export function useSSENotifications({
    role,
    onNotification,
    enabled = true,
}: UseSSENotificationsOptions) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const retryCountRef = useRef(0);
    const [connected, setConnected] = useState(false);

    // Callers pass `onNotification` as an inline arrow, so it has a new
    // identity on every render. Holding it in a ref keeps it out of the
    // `connect` dependency list: without this the effect below tore down and
    // reopened the EventSource on EVERY render of the consuming component,
    // which burns the API rate limit and churns server-side SSE connections.
    const onNotificationRef = useRef(onNotification);
    useEffect(() => {
        onNotificationRef.current = onNotification;
    }, [onNotification]);

    const connectRef = useRef<() => void>(() => {});

    const connect = useCallback(() => {
        if (!enabled) return;

        const url = `${config.apiUrl}/api/${role}/notifications/subscribe`;
        const es = new EventSource(url, { withCredentials: true });

        es.onopen = () => {
            setConnected(true);
            retryCountRef.current = 0;
        };

        es.addEventListener('notification', (event) => {
            try {
                const data = JSON.parse(event.data) as SSENotification;
                onNotificationRef.current?.(data);
            } catch {
                // Ignore malformed events
            }
        });

        es.onerror = () => {
            setConnected(false);
            es.close();
            eventSourceRef.current = null;

            // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
            const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
            retryCountRef.current += 1;

            // Reconnect through a ref so the callback does not reference
            // itself before declaration and always runs the latest version.
            reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), delay);
        };

        eventSourceRef.current = es;
    }, [role, enabled]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        connect();

        return () => {
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return { connected };
}
