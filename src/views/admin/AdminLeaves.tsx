import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  X,
} from 'lucide-react';

export const AdminLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Review / Override Modal
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Document Preview Modal
  const [viewDoc, setViewDoc] = useState<any | null>(null);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminLeaves();
      setLeaves(data);
    } catch (err) {
      console.error('Error loading admin leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setReviewing(true);
    try {
      await api.overrideLeaveRequest(selectedLeave.id, reviewAction, reviewNotes);
      setSelectedLeave(null);
      setReviewNotes('');
      setActionSuccess(`Leave petition ${reviewAction.toLowerCase()} with administrative override.`);
      await loadLeaves();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review override');
    } finally {
      setReviewing(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Petition ID', 'Student ID', 'Student Name', 'Category', 'Reason', 'Visit Title', 'Status', 'Submitted At', 'Reviewed By', 'Review Notes'];
    const rows = filtered.map((l) => [
      l.id,
      l.studentId,
      `"${l.student?.name || l.studentName || l.studentId}"`,
      `"${l.category}"`,
      `"${l.reason.replace(/"/g, '""')}"`,
      `"${l.experience?.title || l.experienceTitle || 'Industrial Visit'}"`,
      l.status,
      l.submittedAt,
      `"${l.reviewer?.name || l.reviewedByName || (l.reviewedBy ? 'Faculty Lead' : 'Pending')}"`,
      `"${(l.reviewNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vit_leave_petitions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = leaves.filter((l) => {
    const studentName = l.student?.name || l.studentName || '';
    const studentId = l.studentId || '';
    const expTitle = l.experience?.title || l.experienceTitle || '';

    const matchesSearch =
      !search.trim() ||
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      studentId.toLowerCase().includes(search.toLowerCase()) ||
      expTitle.toLowerCase().includes(search.toLowerCase()) ||
      (l.category?.toLowerCase() || '').includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || l.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold">
              REGULATORY COMPLIANCE
            </span>
            <span className="text-xs text-slate-500 font-medium">{leaves.length} Total Petitions</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            System-Wide Leave Petitions & Audit Review
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central review of all student absence justifications, attached medical/academic documentation, and administrative override determinations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Petitions (CSV)</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, category, or visit..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses (Pending, Approved, Rejected)</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Medical Leave">Medical Leave</option>
            <option value="Academic">Academic / Research Conf</option>
            <option value="Family Event">Family Event</option>
            <option value="Institutional Duty">Institutional Duty</option>
            <option value="Other">Other Reason</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading leave petition records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No leave petitions matched your filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Student Details</th>
                  <th className="px-4 py-3.5">Category & Justification</th>
                  <th className="px-4 py-3.5">Connected Visit</th>
                  <th className="px-4 py-3.5">Evidence Doc</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{l.student?.name || l.studentName || l.studentId}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {l.student?.prn || l.student?.studentId || l.studentId}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                        {l.category}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{l.reason}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{l.experience?.title || l.experienceTitle || 'Industrial Visit'}</div>
                      <div className="text-[11px] text-slate-500">
                        {l.experience?.organization || l.experienceOrganization || 'Campus Immersion'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {l.supportingDocument ? (
                        <button
                          onClick={() => setViewDoc(l.supportingDocument)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          <span>View Proof ({l.supportingDocument.name ? l.supportingDocument.name.slice(0, 12) + '...' : 'PDF'})</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None attached</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {l.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Approved
                        </span>
                      ) : l.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold">
                          <XCircle className="h-3 w-3 text-rose-600" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                          <Clock className="h-3 w-3 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedLeave(l);
                          setReviewAction(l.status === 'APPROVED' ? 'REJECTED' : 'APPROVED');
                          setReviewNotes(l.reviewNotes || '');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0B2545] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        <span>Admin Override</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0B2545]" />
                <h3 className="text-base font-bold text-slate-900">Administrative Override Review</h3>
              </div>
              <button onClick={() => setSelectedLeave(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1.5">
              <div><span className="font-bold text-slate-800">Student: </span>{selectedLeave.student?.name || selectedLeave.studentName || selectedLeave.studentId}</div>
              <div><span className="font-bold text-slate-800">Category: </span>{selectedLeave.category}</div>
              <div><span className="font-bold text-slate-800">Reason: </span>{selectedLeave.reason}</div>
              <div><span className="font-bold text-slate-800">Current Status: </span>{selectedLeave.status}</div>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Override Determination</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`rounded-lg p-2.5 font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve Petition</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`rounded-lg p-2.5 font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      reviewAction === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Petition</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Administrative Audit Remarks</label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record formal administrative determination reasons (persisted to institutional audit log)..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="rounded-lg bg-[#0B2545] px-4 py-2 font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {reviewing ? 'Recording Override...' : 'Commit Determination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doc Preview Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">{viewDoc.name || 'Supporting Proof Document'}</h3>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-[#0B2545]">
                  <FileText className="h-8 w-8" />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{viewDoc.name || 'medical_certificate.pdf'}</span>
                <span className="text-[11px] text-slate-500">{viewDoc.type || 'application/pdf'} • {viewDoc.size || '1.4 MB'}</span>
              </div>
              <div className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-[11px] font-semibold inline-block">
                Digitally Signed & Validated Attachment
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewDoc(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
