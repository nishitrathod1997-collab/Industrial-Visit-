import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays,
  Users,
  FileCheck2,
  BarChart3,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Plus,
  AlertTriangle,
  MapPin,
  Megaphone,
  Ticket,
  ChevronRight,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { ExperienceWithMeta } from '../../types';

interface FacultyDashboardProps {
  onNavigate: (tab: string, experienceId?: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigate }) => {
  const { faculty, user } = useAuth();
  const [stats, setStats] = useState<{
    totalAssignedVisits: number;
    upcomingVisits: number;
    completedVisits: number;
    draftVisits: number;
    totalConfirmedStudents: number;
    totalStudentsRegistered: number;
    totalWaitlistedStudents: number;
    totalCapacity: number;
    availableSeats: number;
    pendingLeaves: number;
    avgAttendance: number;
    pendingActions: Array<{
      id: string;
      type: 'LEAVE_REVIEW' | 'ATTENDANCE_PENDING' | 'REGISTRATION_CLOSING' | 'CAPACITY_REACHED';
      title: string;
      description: string;
      experienceId?: string;
      entityId?: string;
      severity: 'HIGH' | 'MEDIUM' | 'INFO';
    }>;
  } | null>(null);

  const [assignedExperiences, setAssignedExperiences] = useState<ExperienceWithMeta[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacultyData();
  }, []);

  const loadFacultyData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, exps, leavesRes] = await Promise.all([
        api.getFacultyDashboard(),
        api.getFacultyExperiences(),
        api.getFacultyLeaves(),
      ]);
      setStats(dashboardStats);
      setAssignedExperiences(exps);
      setLeaves(leavesRes);
    } catch (err) {
      console.error('Error loading faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAssigned = stats?.totalAssignedVisits ?? assignedExperiences.length;
  const upcomingCount =
    stats?.upcomingVisits ?? assignedExperiences.filter((e) => e.status === 'PUBLISHED').length;
  const totalConfirmed =
    stats?.totalConfirmedStudents ??
    assignedExperiences.reduce((acc, exp) => acc + (exp.registeredCount || 0), 0);
  const totalWaitlisted =
    stats?.totalWaitlistedStudents ??
    assignedExperiences.reduce((acc, exp) => acc + (exp.waitlistCount || 0), 0);
  const pendingLeavesList = leaves.filter((l) => l.status === 'PENDING');
  const pendingActions = stats?.pendingActions || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-[#0B2545] p-6 sm:p-8 text-white shadow-md border border-blue-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Faculty Administration Portal
              </span>
              <span className="text-xs text-blue-200">
                {faculty?.department || 'School of Computer Science & Engineering'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {faculty?.name || user?.name || 'Prof. Coordinator'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Monitor assigned industrial tours, conduct physical boarding verification, and manage
              real-time seat allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => onNavigate('create-experience')}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Visit</span>
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#0B2545] hover:bg-slate-100 transition-all shadow-xs cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-[#0B2545]" />
              <span>Mark Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Assigned Visits */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Assigned Visits
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center">
              <CalendarDays className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalAssigned}</div>
          <span className="text-[11px] text-slate-500 block">Total allocated tours</span>
        </div>

        {/* Upcoming Visits */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#0B2545]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2545]">
              Upcoming Visits
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-100 text-[#0B2545] flex items-center justify-center">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0B2545]">{upcomingCount}</div>
          <span className="text-[11px] text-blue-800 font-medium block">Scheduled / Active</span>
        </div>

        {/* Total Confirmed Students */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Confirmed Students
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800">{totalConfirmed}</div>
          <span className="text-[11px] text-emerald-700 font-medium block">Boarding passes issued</span>
        </div>

        {/* Total Waitlisted Students */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Waitlisted Students
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900">{totalWaitlisted}</div>
          <span className="text-[11px] text-amber-800 font-medium block">In FIFO queues</span>
        </div>

        {/* Pending Actions / Leaves */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Pending Actions
            </span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">
            {pendingActions.length || pendingLeavesList.length}
          </div>
          <span className="text-[11px] text-rose-700 font-medium block">
            {pendingLeavesList.length > 0
              ? `${pendingLeavesList.length} leaves awaiting review`
              : 'Requires coordinator review'}
          </span>
        </div>
      </div>

      {/* 3. Action Items Alert Strip (if any items need faculty attention) */}
      {pendingActions.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Pending Coordinator Actions ({pendingActions.length})
            </h2>
            <span className="text-[11px] text-amber-800">Prioritized by system</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingActions.slice(0, 3).map((act) => (
              <div
                key={act.id}
                className="rounded-xl bg-white border border-amber-200 p-3.5 space-y-1.5 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <span
                    className={`rounded px-2 py-0.2 text-[9px] font-bold ${
                      act.severity === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {act.type.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{act.title}</h3>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  {act.type === 'LEAVE_REVIEW' ? (
                    <button
                      onClick={() => onNavigate('leaves')}
                      className="text-[11px] font-bold text-[#0B2545] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Review Leave Request →
                    </button>
                  ) : act.experienceId ? (
                    <button
                      onClick={() => onNavigate('visit-detail', act.experienceId)}
                      className="text-[11px] font-bold text-[#0B2545] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Open Visit Management →
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Main Grid: Assigned Visits & Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Industrial Visits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">My Assigned Industrial Visits</h2>
              <p className="text-xs text-slate-500">
                Authorized visits linked to your coordinator credentials
              </p>
            </div>
            <button
              onClick={() => onNavigate('my-experiences')}
              className="text-xs font-semibold text-[#0B2545] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({assignedExperiences.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
              <p className="text-xs text-slate-500 mt-2">Loading assigned visits...</p>
            </div>
          ) : assignedExperiences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
              <p className="text-xs text-slate-500">No visits currently assigned to your faculty profile.</p>
              <button
                onClick={() => onNavigate('create-experience')}
                className="rounded-lg bg-[#0B2545] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors cursor-pointer shadow-xs"
              >
                Create First Industrial Tour
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {assignedExperiences.map((exp) => {
                const confirmed = exp.registeredCount || 0;
                const capacity = exp.capacity || 40;
                const available = Math.max(0, capacity - confirmed);
                const waitlist = exp.waitlistCount || 0;
                const fillPercent = Math.min(100, Math.round((confirmed / capacity) * 100));

                return (
                  <div
                    key={exp.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                            {exp.experienceType || 'Industrial Visit'}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {exp.organizationIndustry || 'Engineering'}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                              exp.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : exp.status === 'COMPLETED'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {exp.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 hover:text-[#0B2545] transition-colors">
                          {exp.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                          <span className="flex items-center gap-1 font-bold text-slate-900">
                            <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                            {exp.organization}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {exp.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {exp.date}
                          </span>
                        </div>
                      </div>

                      {/* Seat Count Pill */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-right flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Seat Allocation
                        </span>
                        <div className="text-xs font-bold text-slate-900">
                          <strong className="text-emerald-700 text-sm">{confirmed}</strong> / {capacity}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {available} seats open {waitlist > 0 && `• ${waitlist} waitlisted`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            fillPercent >= 100
                              ? 'bg-amber-500'
                              : fillPercent >= 80
                              ? 'bg-emerald-600'
                              : 'bg-[#0B2545]'
                          }`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium">
                        Coordinator: {exp.facultyCoordinator?.name || user?.name || 'Prof. Coordinator'}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate('visit-detail', exp.id)}
                          className="rounded-lg bg-[#0B2545] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#133E87] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <span>VIEW DETAILS</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>

                        {exp.status === 'COMPLETED' ? (
                          <button
                            onClick={() => onNavigate('attendance', exp.id)}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0B2545] hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-[#0B2545]" />
                            <span>Certificates Ledger</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigate('attendance', exp.id)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                            <span>Mark Attendance</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Pending Leave Approvals & System Directives */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Pending Leave Approvals</h2>
            <button
              onClick={() => onNavigate('leaves')}
              className="text-xs font-semibold text-[#0B2545] hover:underline cursor-pointer"
            >
              All Leaves ({leaves.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {pendingLeavesList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800">All leave requests reviewed</h3>
                <p className="text-[11px] text-slate-500">No student exemption requests in queue.</p>
              </div>
            ) : (
              pendingLeavesList.slice(0, 4).map((leave) => (
                <div
                  key={leave.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{leave.studentName}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Roll: {leave.studentRollNo || leave.studentId}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {leave.category && (
                        <span className="rounded bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 text-[9px] font-semibold">
                          {leave.category}
                        </span>
                      )}
                      <span className="rounded bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                        PENDING
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic leading-relaxed">
                    "{leave.reason}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">
                      {leave.experienceTitle || 'Industrial Visit'}
                    </span>
                    <button
                      onClick={() => onNavigate('leaves')}
                      className="font-bold text-[#0B2545] hover:underline cursor-pointer"
                    >
                      Review Request →
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Protocol Notice */}
            <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-200/60 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-[#0B2545] flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5" />
                Automated Waitlist Promotion
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Approving a leave request immediately releases the confirmed seat and escalates the
                #1 waitlisted candidate to confirmed status with automated boarding pass generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
