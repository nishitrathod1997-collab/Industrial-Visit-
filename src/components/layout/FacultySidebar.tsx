import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  Users,
  FileCheck2,
  Clock,
  BarChart3,
  UserSquare2,
} from 'lucide-react';

interface FacultySidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingLeavesCount?: number;
}

export const FacultySidebar: React.FC<FacultySidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingLeavesCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { id: 'my-experiences', label: 'Assigned Visits & Tours', icon: CalendarDays },
    { id: 'attendance', label: 'Mark Attendance', icon: UserCheck },
    { id: 'directory', label: 'Student Directory', icon: Users },
    { id: 'leaves', label: 'Leave Requests', icon: FileCheck2, badge: pendingLeavesCount },
    { id: 'timetable', label: 'Visit Timetable', icon: Clock },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'profile', label: 'Faculty Profile', icon: UserSquare2 },
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0 border-r border-slate-200 bg-white p-3 md:min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Faculty Administration
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`faculty-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0B2545] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span
                  className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
