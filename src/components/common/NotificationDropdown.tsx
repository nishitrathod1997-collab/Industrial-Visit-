import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { AppNotification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Calendar,
  QrCode,
  AlertTriangle,
  Award,
  Clock,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExperience?: (experienceId: string) => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onSelectExperience,
}) => {
  const { refreshAuth } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await api.getNotifications();
      setNotifications(list || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
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

  const handleItemClick = async (notif: AppNotification) => {
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

    if (notif.relatedEntityId && onSelectExperience) {
      onSelectExperience(notif.relatedEntityId);
      onClose();
    }
  };

  if (!isOpen) return null;

  const filtered =
    filter === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION_CONFIRMED':
      case 'WAITLIST_PROMOTED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'BOARDING_PASS_READY':
        return <QrCode className="h-4 w-4 text-[#0B2545]" />;
      case 'WAITLIST_JOINED':
      case 'WAITLIST_UPDATE':
      case 'TRIP_REMINDER':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'ANNOUNCEMENT':
      case 'SCHEDULE_UPDATED':
      case 'VENUE_UPDATED':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'EXPERIENCE_CANCELLED':
      case 'REGISTRATION_CANCELLED':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case 'ATTENDANCE_MARKED':
        return <Award className="h-4 w-4 text-indigo-600" />;
      default:
        return <Bell className="h-4 w-4 text-[#0B2545]" />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      id="notification-dropdown-panel"
      className="absolute right-0 top-12 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B2545] text-amber-400">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">System Notifications</h3>
            <p className="text-[10px] text-slate-500">Official visit alerts & status updates</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#0B2545] hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 bg-white text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#0B2545] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
            filter === 'UNREAD'
              ? 'bg-[#0B2545] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
            <p className="text-[11px] text-slate-400 mt-2">Loading updates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-7 w-7 text-slate-300 mb-1" />
            <p className="text-xs font-semibold text-slate-700">No {filter === 'UNREAD' ? 'unread ' : ''}notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              You will be alerted for registrations, waitlist movements, and coordinator notices.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`group flex items-start gap-3 p-3.5 text-xs transition-colors cursor-pointer ${
                item.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
              }`}
            >
              {/* Category Icon */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs border border-slate-200">
                {getCategoryIcon(item.type)}
              </div>

              {/* Body */}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-bold ${item.read ? 'text-slate-900' : 'text-[#0B2545]'}`}>
                    {item.title}
                  </span>
                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  {item.relatedEntityId && (
                    <span className="inline-flex items-center gap-0.5 text-[#0B2545] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      View details <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[10px] text-slate-500">
        Vidyalankar Institute of Technology &bull; Verified Institutional Feeds
      </div>
    </div>
  );
};
