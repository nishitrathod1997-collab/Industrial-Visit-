import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { LeaveRequest, SupportingDocument } from '../../types';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  MapPin,
  Mail,
  User,
  GraduationCap,
  Paperclip,
  Eye,
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  Send,
  X,
  UserCheck,
  Download,
} from 'lucide-react';

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recently';
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const getCategoryBadgeClass = (cat?: string) => {
  switch (cat) {
    case 'Medical Leave':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Family Event':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Academic':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Competition':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Personal Work':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const FacultyLeaveManagement: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [visitFilter, setVisitFilter] = useState<string>('ALL');

  // Modals
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [facultyRemarks, setFacultyRemarks] = useState<string>('');
  const [viewingDoc, setViewingDoc] = useState<SupportingDocument | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const data = await api.getFacultyLeaveRequests();
      setLeaves(data || []);
    } catch (err) {
      console.error('Error loading leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate top statistics
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => (l.status || '').toUpperCase() === 'PENDING').length;
    const approved = leaves.filter((l) => (l.status || '').toUpperCase() === 'APPROVED').length;
    const rejected = leaves.filter((l) => (l.status || '').toUpperCase() === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [leaves]);

  // Unique list of visits for the dropdown
  const uniqueVisits = useMemo(() => {
    const map = new Map<string, string>();
    leaves.forEach((l) => {
      const id = l.experienceId;
      const title = l.experienceTitle || l.experience?.title || 'Industrial Visit';
      if (id && !map.has(id)) {
        map.set(id, title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [leaves]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sName = (l.studentName || l.student?.name || '').toLowerCase();
        const sRoll = (l.studentRollNo || l.studentId || '').toLowerCase();
        const sEmail = (l.studentEmail || l.student?.email || '').toLowerCase();
        const expTitle = (l.experienceTitle || l.experience?.title || '').toLowerCase();
        const expOrg = (l.experienceOrganization || l.experience?.organization || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();

        const match =
          sName.includes(q) ||
          sRoll.includes(q) ||
          sEmail.includes(q) ||
          expTitle.includes(q) ||
          expOrg.includes(q) ||
          reason.includes(q);
        if (!match) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && (l.status || '').toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }

      // Category
      if (categoryFilter !== 'ALL' && (l.category || 'Medical Leave') !== categoryFilter) {
        return false;
      }

      // Visit
      if (visitFilter !== 'ALL' && l.experienceId !== visitFilter) {
        return false;
      }

      return true;
    });
  }, [leaves, searchQuery, statusFilter, categoryFilter, visitFilter]);

  const handleOpenReviewModal = (leave: LeaveRequest) => {
    setReviewingLeave(leave);
    setFacultyRemarks(leave.reviewNotes || '');
  };

  const handleDecision = async (leaveId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
    setProcessingId(leaveId);
    try {
      const updated = await api.reviewLeaveRequest(leaveId, status, notes || facultyRemarks);
      setLeaves((prev) =>
        prev.map((l) =>
          l.id === leaveId
            ? {
                ...l,
                ...updated,
                status,
                reviewedAt: new Date().toISOString(),
                reviewNotes: notes !== undefined ? notes : facultyRemarks,
              }
            : l
        )
      );
      setFeedback({
        type: 'success',
        text: `Leave petition marked as ${status.toLowerCase()} successfully. Notification dispatched to student.`,
      });
      setReviewingLeave(null);
      setFacultyRemarks('');
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error('Error updating leave decision:', err);
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update leave petition status.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Leave Petitions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate and decide formal student exemption and leave applications for your assigned industrial visits
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl p-3.5 text-xs flex items-center gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Top Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Queue
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{stats.pending}</span>
            <span className="text-[11px] text-slate-500">awaiting review</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Approved
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{stats.approved}</span>
            <span className="text-[11px] text-slate-500">exemptions granted</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rejected
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-800">{stats.rejected}</span>
            <span className="text-[11px] text-slate-500">petitions denied</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Applications
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#0B2545]">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-500">recorded</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, roll no, reason..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#0B2545] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:border-[#0B2545] focus:outline-none"
            >
              <option value="ALL">All Statuses ({stats.total})</option>
              <option value="PENDING">Pending Review ({stats.pending})</option>
              <option value="APPROVED">Approved ({stats.approved})</option>
              <option value="REJECTED">Rejected ({stats.rejected})</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:border-[#0B2545] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Family Event">Family Event</option>
              <option value="Academic">Academic</option>
              <option value="Competition">Competition</option>
              <option value="Personal Work">Personal Work</option>
            </select>
          </div>

          {/* Visit Filter */}
          <div>
            <select
              value={visitFilter}
              onChange={(e) => setVisitFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:border-[#0B2545] focus:outline-none truncate"
            >
              <option value="ALL">All Industrial Visits</option>
              {uniqueVisits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent mb-2"></div>
          <p className="text-xs text-slate-500">Loading student leave petitions...</p>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">
            {leaves.length === 0
              ? 'No Student Leave Petitions Filed'
              : 'No Applications Match Filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {leaves.length === 0
              ? 'All registered students are currently scheduled to attend their assigned industrial tours.'
              : 'Try resetting search terms or switching the status / category filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeaves.map((leave) => {
            const studentName = leave.studentName || leave.student?.name || 'Student';
            const rollNo = leave.studentRollNo || leave.student?.studentId || leave.studentId;
            const studentEmail = leave.studentEmail || leave.student?.email || 'N/A';
            const dept = leave.studentDepartment || leave.student?.branch || 'Engineering';
            const division = leave.studentDivision || (leave.student as any)?.division || 'A';

            const visitTitle = leave.experienceTitle || leave.experience?.title || 'Industrial Visit';
            const companyName = leave.experienceOrganization || leave.experience?.organization || 'Host Partner';
            const visitDate = leave.experienceDate || leave.experience?.date || 'Scheduled Date';
            const visitLoc = leave.experienceLocation || leave.experience?.location;

            const isPending = (leave.status || '').toUpperCase() === 'PENDING';

            return (
              <div
                key={leave.id}
                className={`rounded-2xl border p-5 shadow-xs transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-5 ${
                  isPending
                    ? 'bg-amber-50/30 border-amber-200'
                    : (leave.status || '').toUpperCase() === 'APPROVED'
                    ? 'bg-white border-emerald-200'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                {/* Left Side: Comprehensive Details */}
                <div className="space-y-3.5 flex-1">
                  {/* Top line: Student Dossier Header & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <User className="h-4 w-4 text-[#0B2545]" />
                        {studentName}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#0B2545] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {rollNo}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {studentEmail}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-slate-400" />
                        {dept} (Div {division})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getCategoryBadgeClass(
                          leave.category
                        )}`}
                      >
                        {leave.category || 'Medical Leave'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : (leave.status || '').toUpperCase() === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>
                  </div>

                  {/* Industrial Visit Specifications */}
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                      <span>{visitTitle}</span>
                    </div>
                    <div className="text-slate-600 flex flex-wrap items-center gap-3 text-[11px]">
                      <span>Host: <strong className="text-slate-800">{companyName}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {visitDate}
                      </span>
                      {visitLoc && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {visitLoc}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reason for Leave */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Student Reason Statement:
                    </span>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed italic">
                      "{leave.reason}"
                    </p>
                  </div>

                  {/* Supporting Document Attachment */}
                  {leave.supportingDocument ? (
                    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-4 w-4 text-blue-700 flex-shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {leave.supportingDocument.name}
                        </span>
                        {leave.supportingDocument.size && (
                          <span className="text-[10px] text-slate-500">
                            ({(leave.supportingDocument.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingDoc(leave.supportingDocument!)}
                        className="flex items-center gap-1 text-xs font-bold text-[#0B2545] hover:underline cursor-pointer flex-shrink-0 ml-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View / Download</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs">
                      <span className="font-semibold text-slate-500">Supporting Document:</span>
                      <span className="text-slate-500 italic">Not Provided</span>
                    </div>
                  )}

                  {/* Review History / Remarks if already decided */}
                  {((leave.status || '').toUpperCase() === 'APPROVED' || (leave.status || '').toUpperCase() === 'REJECTED') && (
                    <div
                      className={`rounded-xl p-3 text-xs border space-y-1 ${
                        (leave.status || '').toUpperCase() === 'APPROVED'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/60 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          Decided by {leave.reviewerName || 'Faculty Coordinator'}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {formatDateTime(leave.reviewedAt)}
                        </span>
                      </div>
                      {leave.reviewNotes && (
                        <div className="bg-white/80 p-2 rounded-lg border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                          <strong>Faculty Remarks:</strong> {leave.reviewNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission Timestamp Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Submitted: {formatDateTime(leave.submittedAt)}</span>
                    <span className="font-mono">Petition ID: {leave.id}</span>
                  </div>
                </div>

                {/* Right Side: Quick Actions & Detailed Review Button */}
                <div className="flex lg:flex-col items-center gap-2 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 min-w-[140px]">
                  <button
                    onClick={() => handleOpenReviewModal(leave)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-xs cursor-pointer w-full"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{isPending ? 'Review Petition' : 'Edit Remarks'}</span>
                  </button>

                  {isPending && (
                    <div className="flex w-full gap-2">
                      <button
                        disabled={processingId === leave.id}
                        onClick={() => handleDecision(leave.id, 'APPROVED', '')}
                        className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer flex-1"
                        title="Quick Approve"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        disabled={processingId === leave.id}
                        onClick={() => handleDecision(leave.id, 'REJECTED', '')}
                        className="flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer flex-1"
                        title="Quick Reject"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal for Faculty */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#0B2545] font-bold">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Review Leave Petition</h3>
                  <p className="text-[11px] text-slate-500">Official Faculty Adjudication</p>
                </div>
              </div>
              <button
                onClick={() => setReviewingLeave(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Student Dossier Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-900 text-sm">
                  {reviewingLeave.studentName || reviewingLeave.student?.name}
                </span>
                <span className="font-mono text-xs font-bold text-[#0B2545] bg-blue-100/70 px-2 py-0.5 rounded">
                  {reviewingLeave.studentRollNo || reviewingLeave.studentId}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">OFFICIAL STUDENT EMAIL</span>
                  <span className="font-mono font-medium text-slate-800">
                    {reviewingLeave.studentEmail || reviewingLeave.student?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DEPARTMENT & DIVISION</span>
                  <span className="font-medium text-slate-800">
                    {reviewingLeave.studentDepartment || 'Engineering'} (Div{' '}
                    {reviewingLeave.studentDivision || 'A'})
                  </span>
                </div>
              </div>
            </div>

            {/* Industrial Visit Info */}
            <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-200/80 text-xs space-y-1">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                Industrial Visit Details:
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {reviewingLeave.experienceTitle || reviewingLeave.experience?.title}
              </div>
              <div className="text-slate-600 flex flex-wrap items-center gap-2 pt-0.5">
                <span>
                  Host: <strong className="text-[#0B2545]">{reviewingLeave.experienceOrganization || reviewingLeave.experience?.organization}</strong>
                </span>
                <span>•</span>
                <span>
                  Date: <strong>{reviewingLeave.experienceDate || reviewingLeave.experience?.date}</strong>
                </span>
              </div>
            </div>

            {/* Leave Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Leave Category:</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getCategoryBadgeClass(
                    reviewingLeave.category
                  )}`}
                >
                  {reviewingLeave.category || 'Medical Leave'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Student Reason:
                </span>
                <p className="text-slate-700 leading-relaxed italic">
                  "{reviewingLeave.reason}"
                </p>
              </div>

              {/* Supporting Document */}
              {reviewingLeave.supportingDocument && (
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="h-4 w-4 text-blue-700 flex-shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {reviewingLeave.supportingDocument.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingDoc(reviewingLeave.supportingDocument!)}
                    className="flex items-center gap-1 text-xs font-bold text-[#0B2545] hover:underline cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View File</span>
                  </button>
                </div>
              )}
            </div>

            {/* Faculty Remarks Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Faculty Remarks / Instructions <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={facultyRemarks}
                onChange={(e) => setFacultyRemarks(e.target.value)}
                placeholder="E.g., Approved. Submit original medical prescription hardcopy to the department office upon return..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewingLeave(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={processingId === reviewingLeave.id}
                onClick={() => handleDecision(reviewingLeave.id, 'REJECTED', facultyRemarks)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject Petition</span>
              </button>

              <button
                type="button"
                disabled={processingId === reviewingLeave.id}
                onClick={() => handleDecision(reviewingLeave.id, 'APPROVED', facultyRemarks)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve Petition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        title="Verification Document"
      />
    </div>
  );
};
