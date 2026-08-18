import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '../services/api';

const POLL_INTERVAL_MS = 45000;

export default function NotificationBell({ user }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const refreshUnreadCount = useCallback(() => {
    if (!user?.userID) return;
    notificationService.getUnreadByUser(user.userID).then((unread) => setUnreadCount(unread.length));
  }, [user?.userID]);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && user?.userID) {
      notificationService.getByUser(user.userID).then((all) => {
        setNotifications(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
      });
    }
  };

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    setNotifications((prev) => prev.map((n) => (n.notificationID === notification.notificationID ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationService.markRead(notification);
    } catch {
      // Non-fatal: local read-state already flipped, worst case it reverts on next load.
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative min-w-11 min-h-11 flex items-center justify-center text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-30">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.notificationID}
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition ${!n.read ? 'bg-teal-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" aria-hidden="true" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
