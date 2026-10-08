import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  GraduationCap,
  Users2,
  Clock,
  ShieldCheck,
  Activity,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  Users,
  Megaphone,
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigate: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminOverview();
  }, []);

  const loadAdminOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err) {
      console.error('Error loading admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data || {};
  const pendingActionsStats = {
    pendingLeaves: Array.isArray(data?.pendingActions) ? data.pendingActions.filter(a => a.type === 'LEAVE_PETITION').length : (kpis.pendingLeaves || 0),
    highWaitlistVisits: Array.isArray(data?.pendingActions) ? data.pendingActions.filter(a => a.type === 'CAPACITY_REACHED').length : 0,
    unassignedVisits: Array.isArray(data?.pendingActions) ? data.pendingActions.filter(a => a.type === 'VISIT_REVIEW').length : 0,
    pendingAttendance: Array.isArray(data?.pendingActions) ? data.pendingActions.filter(a => a.type === 'ATTENDANCE_OVERDUE').length : 0,
  };
  const recentVisits = data?.upcomingVisitsList || data?.recentVisits || [];
  const recentAuditLogs = data?.recentActivity || data?.recentAuditLogs || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0B2545] p-6 sm:p-7 text-white border border-blue-900 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold">
                CENTRAL ADMINISTRATION CONSOLE
              </span>
              <span className="text-xs text-blue-200">Vidyalankar Institute of Technology</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
              Institution Overview & Telemetry Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
              Real-time administrative control across all industrial visits, student enrollments, faculty coordinators, and compliance records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('experiences')}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-2xs cursor-pointer"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Create / Manage Visits</span>
            </button>
            <button
              onClick={() => {
                const btn = document.getElementById('pdf-btn');
                if (btn) btn.innerHTML = '<span class="animate-pulse">Generating...</span>';
                api.downloadAnalyticsPdf().finally(() => {
                  if (btn) btn.innerHTML = '<span>Export PDF Report</span>';
                });
              }}
              id="pdf-btn"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500/50 px-3.5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs"
            >
              <FileText className="h-4 w-4 text-blue-200" />
              <span>Export PDF Report</span>
            </button>
            <button
              onClick={() => onNavigate('announcements')}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Megaphone className="h-4 w-4 text-amber-300" />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Triage Action Strip */}
      {(pendingActionsStats.pendingLeaves > 0 || pendingActionsStats.unassignedVisits > 0 || pendingActionsStats.highWaitlistVisits > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white flex-shrink-0 shadow-2xs">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-amber-950">Administrative Attention Needed: </span>
              <span className="text-amber-900">
                {pendingActionsStats.pendingLeaves > 0 && `${pendingActionsStats.pendingLeaves} student leave petition(s) awaiting review. `}
                {pendingActionsStats.unassignedVisits > 0 && `${pendingActionsStats.unassignedVisits} visit(s) missing faculty leads. `}
                {pendingActionsStats.highWaitlistVisits > 0 && `${pendingActionsStats.highWaitlistVisits} visit(s) with queued waitlists.`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {pendingActionsStats.pendingLeaves > 0 && (
              <button
                onClick={() => onNavigate('leaves')}
                className="rounded-lg bg-white border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
              >
                Review Petitions →
              </button>
            )}
            {pendingActionsStats.unassignedVisits > 0 && (
              <button
                onClick={() => onNavigate('experiences')}
                className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-950 transition-colors shadow-2xs cursor-pointer"
              >
                Assign Faculty →
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Visits</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0B2545]">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.totalExperiences || 4}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">{kpis.activeVisits || 3} published & active</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">Total Registrations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0B2545]">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.totalRegistrations || 108}</div>
          <span className="text-xs text-slate-500 font-medium mt-0.5 block">Across all degree branches</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Active Waitlists</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.waitlistedCount || 1}</div>
          <span className="text-xs text-emerald-700 font-medium mt-0.5 block">Auto-promotion enabled</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Global Attendance</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">{kpis.globalAttendanceRate || 95}%</div>
          <span className="text-xs text-slate-500 mt-0.5 block">{kpis.totalFaculty || 2} faculty leads</span>
        </div>
      </div>

      {/* Grid: Master Experiences Summary & Live System Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Industrial Exposures */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Campus Industrial Exposures</h3>
            <button
              onClick={() => onNavigate('experiences')}
              className="text-xs font-semibold text-[#0B2545] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Master Visit Registry</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentVisits.map((exp: any) => (
              <div
                key={exp.id}
                className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0B2545] transition-all"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                      {exp.experienceType || 'Industrial Visit'}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        exp.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : exp.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                      {exp.organization}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {exp.date}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 text-xs">
                  <span className="font-bold text-slate-900 block">{exp.registeredCount || 0} / {exp.capacity}</span>
                  <span className="text-[11px] text-slate-500">Seats filled</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Audit Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-[#0B2545]" />
              <span>Institutional Audit Feed</span>
            </h3>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-[#0B2545] hover:underline cursor-pointer"
            >
              Full Trail →
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            {recentAuditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent audit records.</p>
            ) : (
              recentAuditLogs.slice(0, 6).map((log: any, idx: number) => (
                <div key={idx} className="border-b border-slate-100 last:border-0 pb-2.5 last:pb-0 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </p>
                  <span className="text-[10px] text-slate-400">By: {log.userName || log.userRole || 'Admin'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

