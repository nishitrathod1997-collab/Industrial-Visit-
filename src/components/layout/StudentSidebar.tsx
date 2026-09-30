import React from 'react';
import { Home, Compass, CalendarCheck, Bell, FileText, User } from 'lucide-react';

interface StudentSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadCount?: number;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore Experiences', icon: Compass },
    { id: 'my-experiences', label: 'My Experiences', icon: CalendarCheck },
    { id: 'leaves', label: 'Leave Application', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-full md:w-60 flex-shrink-0 border-r border-slate-200 bg-white p-3 md:min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Student Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`student-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0B2545] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
