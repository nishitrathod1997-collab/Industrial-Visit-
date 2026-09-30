import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Bell, LogOut, Search, SlidersHorizontal } from 'lucide-react';
import { NotificationDropdown } from '../common/NotificationDropdown';

interface HeaderProps {
  onOpenAssistant: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onNavigateToProfile?: (isEdit?: boolean) => void;
  onNavigateToSettings?: () => void;
  onGlobalSearch?: (query: string) => void;
  onSelectExperience?: (experienceId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAssistant,
  unreadCount,
  onOpenNotifications,
  onNavigateToProfile,
  onNavigateToSettings,
  onGlobalSearch,
  onSelectExperience,
}) => {
  const { role, user, student, faculty, quickSwitchRole, logout, unreadNotificationsCount } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const finalUnread = unreadCount !== undefined ? unreadCount : unreadNotificationsCount;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onGlobalSearch && searchQuery.trim()) {
      onGlobalSearch(searchQuery.trim());
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = () => {
    if (role === 'ADMIN') return 'Central Admin Console';
    if (role === 'FACULTY') return 'Faculty Coordinator Portal';
    return 'Student Academic Portal';
  };

  const getRoleBadgeStyle = () => {
    if (role === 'ADMIN') return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
    if (role === 'FACULTY') return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40';
    return 'bg-blue-400/20 text-blue-200 border-blue-400/40';
  };

  const getUserDisplayName = () => {
    if (role === 'STUDENT') return user?.name || student?.name || 'Nishit Rathod';
    if (role === 'FACULTY') return faculty?.name || user?.name || 'Dr. Arvind Swaminathan';
    return user?.name || 'Dr. K. Rajeshwar';
  };

  const getUserRoleSubtitle = () => {
    if (role === 'STUDENT') return 'Student';
    if (role === 'FACULTY') return 'Faculty Coordinator';
    return 'Dean / Administrator';
  };

  const getAvatarUrl = () => {
    if (role === 'STUDENT') {
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
    }
    if (role === 'FACULTY') {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b border-blue-900 bg-[#0B2545] px-4 sm:px-6 text-white shadow-md">
      {/* Left: VIT Institutional Brand */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black tracking-wider shadow-md border border-amber-300/30">
          <span className="text-sm font-black tracking-tight">VIT</span>
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
              VIT Industrial Exposure
            </h1>
            <span className={`hidden lg:inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide ${getRoleBadgeStyle()}`}>
              {getRoleLabel()}
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-blue-200 tracking-wide font-normal">
            Vidyalankar Institute of Technology • Experiential Learning Cell
          </p>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-300 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search visits, companies, sectors..."
            className="w-full rounded-lg border border-blue-800 bg-[#133E87]/60 pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-blue-300/60 focus:bg-[#133E87] focus:border-amber-400 focus:outline-none transition-all"
          />
        </div>
      </form>

      {/* Right: Action Controls & User Role Menu */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* ✨ VIT AI Assistant Button */}
        <button
          id="header-assistant-btn"
          onClick={onOpenAssistant}
          className="group relative flex h-9 items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer shadow-sm"
          title="Open VIT Assistant ✨"
          aria-label="Open VIT Assistant"
        >
          <Sparkles className="h-4 w-4 text-amber-300 group-hover:scale-110 group-hover:rotate-6 transition-all" strokeWidth={2.2} />
          <span className="hidden sm:inline tracking-wider uppercase text-[11px] font-bold">AI ASSISTANT</span>
        </button>

        {/* 🔔 Notifications Button & Centralized Panel */}
        <div className="relative">
          <button
            id="header-notifications-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (onOpenNotifications) onOpenNotifications();
            }}
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              showNotifications
                ? 'border-amber-400 bg-blue-800 text-amber-300'
                : 'border-blue-800 bg-[#133E87] text-white hover:bg-blue-800'
            }`}
            title="Official Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-blue-200" />
            {finalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#0B2545]">
                {finalUnread > 9 ? '9+' : finalUnread}
              </span>
            )}
          </button>

          {/* Centralized Notification Dropdown Panel */}
          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onSelectExperience={onSelectExperience}
          />
        </div>

        {/* User Profile & Role Switcher (Matching Navy Header Theme) */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="header-user-profile-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 rounded-xl border border-blue-700/80 bg-[#133E87] px-3 py-1.5 text-left text-white shadow-sm hover:bg-blue-800 hover:border-amber-400/50 transition-all cursor-pointer"
            title="Switch user role mode"
          >
            <img
              src={getAvatarUrl()}
              alt="User Avatar"
              className="h-8 w-8 rounded-full object-cover ring-1 ring-blue-400/30 flex-shrink-0"
            />
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-bold text-white tracking-tight">{getUserDisplayName()}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-200/90 font-medium mt-0.5">
                <span>{getUserRoleSubtitle()}</span>
                <SlidersHorizontal className="h-2.5 w-2.5 text-amber-300" />
              </div>
            </div>
          </button>

          {/* Role Mode Menu Dropdown (Themed Dark Navy with Golden/Emerald Accents) */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-blue-800/90 bg-[#0B2545] p-3 shadow-2xl text-white z-50 animate-in fade-in zoom-in-95 duration-100">
              <p className="px-2 py-1 text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                {role === 'ADMIN' ? 'Admin Profile' : role === 'FACULTY' ? 'Faculty Profile' : 'Student Profile'}
              </p>
              <div className="px-2 py-1 mb-1 border-b border-blue-900/80 pb-3 text-center">
                <p className="text-sm font-bold text-white">{getUserDisplayName()}</p>
                <p className="text-[11px] text-blue-200/80 font-medium mt-0.5">{getUserRoleSubtitle()}</p>
                <p className="text-[10px] text-amber-300 font-mono mt-1 truncate">{user?.email}</p>
              </div>
              
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    if (onNavigateToProfile) onNavigateToProfile(false);
                  }}
                  className="w-full flex items-center justify-start rounded-xl px-3 py-2 text-xs transition-all cursor-pointer text-blue-100/90 hover:bg-[#133E87]/60 hover:text-white font-medium"
                >
                  <span>View Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    if (onNavigateToProfile) onNavigateToProfile(true);
                  }}
                  className="w-full flex items-center justify-start rounded-xl px-3 py-2 text-xs transition-all cursor-pointer text-blue-100/90 hover:bg-[#133E87]/60 hover:text-white font-medium"
                >
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    if (onNavigateToSettings) onNavigateToSettings();
                  }}
                  className="w-full flex items-center justify-start rounded-xl px-3 py-2 text-xs transition-all cursor-pointer text-blue-100/90 hover:bg-[#133E87]/60 hover:text-white font-medium"
                >
                  <span>Settings</span>
                </button>
              </div>
              
              <div className="border-t border-blue-900/80 my-2"></div>
              
              <button
                onClick={() => {
                  setShowRoleMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
