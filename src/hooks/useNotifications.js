import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    if (!user) return;
    try {
      let list;
      if (isAdmin) {
        list = await base44.entities.Notification.filter({ recipient_type: "admin" }, "-created_date", 50);
      } else {
        list = await base44.entities.Notification.filter({ recipient_id: user.id }, "-created_date", 50);
      }
      setNotifications(list);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Notification.subscribe(() => load());
    return () => unsub();
  }, [user, load]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback(async (id) => {
    await base44.entities.Notification.update(id, { is_read: true, read_date: new Date().toISOString() });
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    const stamp = new Date().toISOString();
    if (isAdmin) {
      await base44.entities.Notification.updateMany(
        { recipient_type: "admin", is_read: false },
        { $set: { is_read: true, read_date: stamp } }
      );
    } else if (user) {
      await base44.entities.Notification.updateMany(
        { recipient_id: user.id, is_read: false },
        { $set: { is_read: true, read_date: stamp } }
      );
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [notifications, isAdmin, user]);

  return { notifications, unreadCount, loading, markAsRead, markAllRead, isAdmin };
}