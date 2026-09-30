import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Search,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Calendar,
  X,
} from 'lucide-react';

export const AdminRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Cancel Modal state
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Administrative quota adjustment');
  const [cancelling, setCancelling] = useState(false);

  // Promote action state
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error('Error loading registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (waitlistId: string) => {
    setPromotingId(waitlistId);
    try {
      await api.promoteWaitlistStudent(waitlistId);
      setActionSuccess('Student successfully promoted from waitlist to confirmed registration! Digital boarding pass activated.');
      await loadRegistrations();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to promote student');
    } finally {
      setPromotingId(null);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      await api.cancelRegistrationByAdmin(cancelTarget.id, cancelReason);
      setCancelTarget(null);
      setActionSuccess('Registration cancelled and notification dispatched to student.');
      await loadRegistrations();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Type', 'Student ID', 'Student Name', 'Roll Number', 'Email', 'Department', 'Year', 'Visit Title', 'Host Company', 'Status', 'Registered At', 'Boarding Pass'];
    const rows = filtered.map((r) => [
      r.type,
      r.studentId,
      `"${r.studentName}"`,
      r.studentRollNo,
      r.studentEmail,
      `"${r.studentDepartment}"`,
      r.studentYear,
      `"${r.experienceTitle}"`,
      `"${r.organization}"`,
      r.status,
      r.registeredAt,
      r.boardingPassNumber || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vit_registrations_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = registrations.filter((r) => {
    const matchesSearch =
      !search.trim() ||
      (r.studentName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (r.studentEmail?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (r.studentRollNo?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (r.experienceTitle?.toLowerCase() || '').includes(search.toLowerCase()) ||
      r.organization?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'REGISTERED' && r.status === 'REGISTERED') ||
      (statusFilter === 'WAITLISTED' && r.status === 'WAITLISTED') ||
      (statusFilter === 'COMPLETED' && r.status === 'COMPLETED') ||
      (statusFilter === 'CANCELLED' && r.status === 'CANCELLED');

    const matchesDept =
      departmentFilter === 'ALL' ||
      (r.studentDepartment && r.studentDepartment.toLowerCase().includes(departmentFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 border border-blue-200 text-[#0B2545] px-2.5 py-0.5 text-[10px] font-bold">
              SYSTEM-WIDE ENROLLMENT OVERSIGHT
            </span>
            <span className="text-xs text-slate-500 font-medium">{registrations.length} Total Records</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Student Registrations & Waitlist Queue Operations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time enrollment oversight across all campus industrial visits, manual queue promotions, and administrative seat cancellations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Registry (CSV)</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, roll no, visit title, or company..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses (Registered, Waitlist, etc.)</option>
            <option value="REGISTERED">Confirmed Registered</option>
            <option value="WAITLISTED">Waitlisted Queue</option>
            <option value="COMPLETED">Completed Visit</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer">Computer Science & Eng</option>
            <option value="Information">Information Technology</option>
            <option value="Electronics">Electronics & Telecom (EXTC)</option>
            <option value="Biomedical">Biomedical Engineering</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading enrollment records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No registration records matched your filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Student Details</th>
                  <th className="px-4 py-3.5">Industrial Visit</th>
                  <th className="px-4 py-3.5">Enrollment Status</th>
                  <th className="px-4 py-3.5">Boarding Pass</th>
                  <th className="px-4 py-3.5">Registered On</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{r.studentName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[#0B2545] font-semibold">{r.studentRollNo}</span>
                        <span>•</span>
                        <span>{r.studentDepartment} (Yr {r.studentYear})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{r.experienceTitle}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {r.organization}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {r.visitDate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {r.status === 'REGISTERED' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Confirmed Seat
                        </span>
                      ) : r.status === 'WAITLISTED' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                          <Clock className="h-3 w-3 text-amber-600" />
                          Waitlist #{r.waitlistPosition || 1}
                        </span>
                      ) : r.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold">
                          Completed Visit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px] font-bold">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.boardingPassNumber ? (
                        <span className="font-mono text-xs font-bold text-[#0B2545] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {r.boardingPassNumber}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not generated</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      {new Date(r.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {r.status === 'WAITLISTED' && (
                        <button
                          onClick={() => handlePromote(r.id)}
                          disabled={promotingId === r.id}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>{promotingId === r.id ? 'Promoting...' : 'Promote'}</span>
                        </button>
                      )}

                      {r.status === 'REGISTERED' && (
                        <button
                          onClick={() => setCancelTarget(r)}
                          className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Cancel Seat</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Seat Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Cancel Student Seat</h3>
              </div>
              <button onClick={() => setCancelTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div><span className="font-bold text-slate-800">Student: </span>{cancelTarget.studentName} ({cancelTarget.studentRollNo})</div>
              <div><span className="font-bold text-slate-800">Visit: </span>{cancelTarget.experienceTitle}</div>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Administrative Reason for Cancellation</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Specify administrative reason to be included in student notice..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Keep Registration
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="rounded-lg bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
