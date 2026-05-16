import { useState, useEffect, useCallback } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../api";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // fail silently — don't interrupt UX for notification errors
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    setLoading(true);
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    setUnreadCount(0);
    setLoading(false);
  };

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications, loading };
}
