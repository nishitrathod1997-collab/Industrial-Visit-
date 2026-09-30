import React from 'react';
import {
  LayoutGrid,
  Users2,
  GraduationCap,
  LineChart,
  Sliders,
  CopyCheck,
  Users,
  CheckSquare,
  FileText,
  Megaphone,
  ShieldAlert,
  Award,
  CalendarCheck,
  Shield,
  MailCheck,
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onSelectTab }) => {
  const sections = [
    {
      title: 'Operations & Catalog',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
        { id: 'experiences', label: 'Industrial Visits', icon: GraduationCap },
                { id: 'announcements', label: 'Announcements', icon: Megaphone },
      ],
    },
    {
      title: 'Students & Enrollment',
      items: [
        { id: 'students', label: 'Students', icon: Users },
        { id: 'registrations', label: 'Registrations', icon: CheckSquare },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'leaves', label: 'Leave Petitions', icon: FileText },
      ],
    },
    {
      title: 'Personnel & Access',
      items: [
        { id: 'faculty', label: 'Faculty', icon: Users2 },
        { id: 'users', label: 'User & Role Management', icon: Shield },
      ],
    },
    {
      title: 'Compliance & Analytics',
      items: [
        { id: 'documents', label: 'Documents & Certificates', icon: Award },
        { id: 'emails', label: 'Email & Notification Logs', icon: MailCheck },
        { id: 'analytics', label: 'Reports & Analytics', icon: LineChart },
        { id: 'settings', label: 'Settings', icon: Sliders },
      ],
    },
    ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0 border-r border-slate-200 bg-white p-3 md:min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0B2545] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};
