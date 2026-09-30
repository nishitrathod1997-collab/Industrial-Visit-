import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ScanQRModal } from '../../components/common/ScanQRModal';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Users,
  Building2,
  Calendar,
  ShieldCheck, QrCode,
  Award,
  ChevronRight,
  TrendingUp, AlertCircle,
} from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [data, setData] = useState<{ visitSummaries: any[]; totalVisits: number; totalAttendanceMarked: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  
  const [visitFilter, setVisitFilter] = useState<string>('ALL');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.getAdminAttendance();
      setData(res);
    } catch (err) {
      console.error('Error loading attendance summary:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFacultyAttendance = async (experienceId: string, facultyId: string, status: 'PRESENT' | 'ABSENT' | 'NOT_MARKED') => {
    try {
      if (status === 'NOT_MARKED') return;
      await api.markFacultyAttendance(experienceId, [{ facultyId, status }]);
      loadAttendance();
    } catch (err) {
      console.error('Error marking faculty attendance:', err);
    }
  };

  const handleInspectVisit = async (experienceId: string) => {
    setSelectedVisitId(experienceId);
    setLoadingRoster(true);
    try {
      const res = await api.getExperienceRoster(experienceId);
      setRoster(res.registered || []);
    } catch (err) {
      console.error('Error loading visit roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ['Experience ID', 'Visit Title', 'Host Company', 'Date', 'Faculty Lead', 'Registered', 'Capacity', 'Marked', 'Present', 'Late', 'Excused', 'Absent', 'Attendance Rate (%)'];
    const rows = filtered.map((v) => [
      v.experienceId,
      `"${v.title}"`,
      `"${v.organization}"`,
      v.date,
      `"${v.facultyName}"`,
      v.totalRegistered,
      v.capacity,
      v.totalMarked,
      v.presentCount,
      v.lateCount,
      v.excusedCount,
      v.absentCount,
      `${v.attendanceRate}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vit_attendance_telemetry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFaculty = (data?.facultyAttendanceList || []).filter((f: any) => {
    if (visitFilter !== 'ALL' && f.experienceId !== visitFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.facultyName.toLowerCase().includes(q) ||
      f.experienceTitle.toLowerCase().includes(q) ||
      f.organization.toLowerCase().includes(q) ||
      f.role.toLowerCase().includes(q)
    );
  });

  const filtered = (data?.visitSummaries || []).filter((v: any) => {
    if (visitFilter !== 'ALL' && v.experienceId !== visitFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.organization.toLowerCase().includes(q) ||
      v.facultyName.toLowerCase().includes(q)
    );
  });

  // Calculate global totals
  const totalRegisteredAll = (data?.visitSummaries || []).reduce((sum, v: any) => sum + v.totalRegistered, 0);
  const completedVisits = (data?.visitSummaries || []).filter((v: any) => v.visitStatus === 'COMPLETED');
  const totalAttendedAll = completedVisits.reduce((sum, v: any) => sum + v.presentCount, 0);
  const totalApplicableRegistered = completedVisits.reduce((sum, v: any) => sum + v.totalRegistered, 0);
  const globalRate = totalApplicableRegistered > 0 ? Math.round((totalAttendedAll / totalApplicableRegistered) * 100) + '%' : 'N/A';
  

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-0.5 text-[10px] font-bold">
              INSTITUTIONAL ATTENDANCE GOVERNANCE
            </span>
            <span className="text-xs text-slate-500 font-medium">Verified Biometric & Faculty Roll Calls</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            System-Wide Attendance & Physical Presence Telemetry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance monitoring across all industrial immersion tours with student-level audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Attendance (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Global Attendance Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{globalRate}</div>
          <span className="text-xs text-emerald-700 font-medium mt-0.5 block">Exceeds university 85% compliance threshold</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">Verified Attendees</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0B2545]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalAttendedAll} Students</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Confirmed present at factory/site</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Enrolled Registrations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalRegisteredAll}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Across {data?.totalVisits || 0} industrial programs</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={"Search attendance by visit, company, or faculty..."}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={visitFilter}
            onChange={(e) => setVisitFilter(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none"
          >
            <option value="ALL">All Industrial Visits</option>
            {(data?.visitSummaries || []).map((v: any) => (
              <option key={v.experienceId} value={v.experienceId}>
                {v.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Aggregating attendance telemetry...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-12 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-rose-800 mb-1">Unable to load Attendance.</p>
          <button onClick={loadAttendance} className="mt-2 text-xs font-bold text-rose-700 bg-white border border-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors">
            Try Again
          </button>
        </div>
      ) : (
        filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-xs font-semibold text-slate-600">No industrial visit records found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Industrial Visit</th>
                    <th className="px-4 py-3.5">Faculty Coordinator</th>
                    <th className="px-4 py-3.5 text-center">Attendance</th>
                    <th className="px-4 py-3.5 text-center">Present / Registered</th>
                    <th className="px-4 py-3.5 text-center">Status Breakdown</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((v: any) => (
                    <tr key={v.experienceId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{v.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{v.organization}</span>
                          <span>•</span>
                          <span>{v.date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{v.facultyName}</div>
                        {v.facultyId && (
                          <div className="text-[11px] text-slate-400 font-mono">ID: {v.facultyId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center font-bold px-2.5 py-0.5 rounded-full text-xs ${
                          v.attendanceRate !== null 
                            ? (v.attendanceRate >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200')
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {v.attendanceRate !== null ? `${v.attendanceRate}%` : (v.visitStatus === 'UPCOMING' ? 'Not Started' : 'N/A')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                        {v.presentCount} / {v.totalRegistered}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-700 font-bold">Present {v.presentCount}</span>
                          <span className="text-slate-400 font-bold">·</span>
                          <span className="text-amber-700 font-bold">Late {v.lateCount}</span>
                          <span className="text-slate-400 font-bold">·</span>
                          <span className="text-blue-700 font-bold">Excused {v.excusedCount}</span>
                          <span className="text-slate-400 font-bold">·</span>
                          <span className="text-rose-700 font-bold">Absent {v.absentCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`rounded px-2.5 py-1 text-[10px] font-bold ${
                          v.visitStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          v.visitStatus === 'UPCOMING' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {v.visitStatus === 'COMPLETED' ? 'Completed' : v.visitStatus === 'UPCOMING' ? 'Upcoming' : 'No Registrations'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleInspectVisit(v.experienceId)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0B2545] hover:underline cursor-pointer"
                        >
                          <span>View Roster</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Roster Drilldown Modal */}
      {selectedVisitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Detailed Student Attendance Roll Call
                </h3>
                <p className="text-xs text-slate-500">Official log of check-ins and faculty validations</p>
              </div>
              <button onClick={() => setSelectedVisitId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            {loadingRoster ? (
              <div className="p-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
                <p className="text-xs text-slate-500 mt-2">Loading verified student roster...</p>
              </div>
            ) : roster.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No students registered for this tour yet.</p>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1 pr-1 text-xs">
                {roster.map((item: any, idx: number) => {
                  const student = item.student || item;
                  const att = item.attendance;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{student.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {student.prn || student.studentId} • {student.branch} (Yr {student.year})
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`rounded px-2.5 py-1 text-[10px] font-bold ${
                            att?.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : att?.status === 'LATE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : att?.status === 'EXCUSED'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {att?.status || 'PRESENT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedVisitId(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    
      {showQRScanner && selectedVisitId && (
        <ScanQRModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          experienceId={selectedVisitId}
          onScanSuccess={(studentId) => {
             loadAttendance();
          }}
          onScanError={(msg) => console.error(msg)}
        />
      )}
    </div>
  );

};