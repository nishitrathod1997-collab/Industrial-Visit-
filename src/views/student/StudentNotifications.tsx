import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AppNotification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Calendar,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface StudentNotificationsProps {
  onNavigateToExperience?: (experienceId: string) => void;
}

export const StudentNotifications: React.FC<StudentNotificationsProps> = ({
  onNavigateToExperience,
}) => {
  const { refreshAuth } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await api.getNotifications();
      setNotifications(list || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshAuth();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkSingleRead = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        refreshAuth();
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }

    if (notif.relatedEntityId && onNavigateToExperience) {
      onNavigateToExperience(notif.relatedEntityId);
    }
  };

  const filtered =
    filter === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION_CONFIRMED':
      case 'WAITLIST_PROMOTED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'BOARDING_PASS_READY':
        return <QrCode className="h-4 w-4 text-[#0B2545]" />;
      case 'WAITLIST_JOINED':
      case 'WAITLIST_UPDATE':
      case 'TRIP_REMINDER':
        return <Calendar className="h-4 w-4 text-amber-600" />;
      case 'EXPERIENCE_CANCELLED':
      case 'REGISTRATION_CANCELLED':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      default:
        return <Bell className="h-4 w-4 text-[#0B2545]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notifications & Notices</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time event alerts, waitlist progressions, and verified administrative notifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-[#0B2545] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-[#0B2545] text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <CheckCheck className="h-4 w-4 text-[#0B2545]" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 mt-2">No {filter === 'UNREAD' ? 'unread ' : ''}notifications.</p>
          <p className="text-xs text-slate-500 mt-1">You will be alerted when new tours open or your waitlist status changes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkSingleRead(item)}
              className={`rounded-xl border p-4 shadow-xs transition-all flex items-start gap-4 cursor-pointer ${
                item.read
                  ? 'bg-white border-slate-200 opacity-80 hover:opacity-100'
                  : 'bg-blue-50/40 border-blue-200'
              }`}
            >
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs flex-shrink-0">
                {getNotificationIcon(item.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold ${item.read ? 'text-slate-800' : 'text-slate-900'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.read && (
                <span className="h-2 w-2 rounded-full bg-[#0B2545] flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
