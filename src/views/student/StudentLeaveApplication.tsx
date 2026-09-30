import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ExperienceWithMeta, LeaveCategory, LeaveRequest, SupportingDocument } from '../../types';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Building2,
  Send,
  Info,
  Paperclip,
  Trash2,
  FileCheck2,
  Download,
  Eye,
  MapPin,
  MessageSquare,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

const LEAVE_CATEGORIES: LeaveCategory[] = [
  'Medical Leave',
  'Family Event',
  'Academic',
  'Competition',
  'Personal Work',
];

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

export const StudentLeaveApplication: React.FC = () => {
  const { student } = useAuth();
  const [upcomingVisits, setUpcomingVisits] = useState<ExperienceWithMeta[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>('');
  const [category, setCategory] = useState<LeaveCategory>('Medical Leave');
  const [reason, setReason] = useState<string>('');
  const [supportingDoc, setSupportingDoc] = useState<SupportingDocument | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Document preview modal
  const [viewingDoc, setViewingDoc] = useState<SupportingDocument | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const expRes = await api.getStudentExperiences();
      const confirmedVisits = (expRes.upcoming || []).filter(
        (e) => e.userRegistration?.status === 'REGISTERED' || !!e.userBoardingPass
      );
      setUpcomingVisits(confirmedVisits);
      if (confirmedVisits.length > 0 && !selectedExperienceId) {
        setSelectedExperienceId(confirmedVisits[0].id);
      }

      const leavesRes = await api.getStudentLeaveRequests();
      setLeaveHistory(leavesRes || []);
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Supporting document size must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSupportingDoc({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      });
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperienceId) {
      setErrorMsg('Please select an upcoming confirmed industrial visit.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please provide a specific justification or reason for leave.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.submitLeaveRequest(
        selectedExperienceId,
        reason.trim(),
        category,
        supportingDoc
      );
      setSuccessMsg('Your leave petition has been successfully submitted to your Faculty Coordinator for formal review.');
      setReason('');
      setSupportingDoc(null);
      setCategory('Medical Leave');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVisitObj = upcomingVisits.find((v) => v.id === selectedExperienceId);

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Industrial Visit Leave Applications</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit formal exemption petitions for scheduled technical visits due to medical emergencies, university examinations, or sanctioned academic competitions.
        </p>
      </div>

      {/* Institutional Policy Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs flex items-start gap-3 shadow-xs">
        <Info className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-700">
          <p className="font-bold text-[#0B2545]">Vidyalankar Institute of Technology Leave Protocol</p>
          <p>
            Industrial visits carry mandatory attendance credits toward your departmental Semester Dossier. Leave petitions must be submitted prior to departure and are officially reviewed by your assigned Faculty Coordinator.
          </p>
        </div>
      </div>

      {/* Grid: Submit Form + Status History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Submit Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#0B2545] font-bold">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Leave Application</h3>
                <p className="text-[11px] text-slate-500">Official absence petition</p>
              </div>
            </div>

            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Industrial Visit Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Industrial Visit <span className="text-rose-500">*</span>
                </label>
                {upcomingVisits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center bg-slate-50 text-xs text-slate-500">
                    You currently have no confirmed upcoming industrial visits.
                  </div>
                ) : (
                  <select
                    value={selectedExperienceId}
                    onChange={(e) => setSelectedExperienceId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                    required
                  >
                    {upcomingVisits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        {visit.title} ({visit.organization} • {visit.date})
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Visit Highlights Card */}
                {selectedVisitObj && (
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                    <div className="font-bold text-slate-900">{selectedVisitObj.title}</div>
                    <div className="text-slate-600 flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedVisitObj.organization}</span>
                      <span>•</span>
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedVisitObj.date}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Leave Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Leave Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LeaveCategory)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                  required
                >
                  {LEAVE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Reason for Leave Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Provide comprehensive details justifying your absence (e.g., Medical hospitalization, conflict with University Semester Practical Exam, representation in National Hackathon)..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                  required
                />
              </div>

              {/* 4. Supporting Document (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Supporting Document <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {supportingDoc ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">{supportingDoc.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {supportingDoc.size ? `${(supportingDoc.size / 1024).toFixed(1)} KB` : 'Attached file'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingDoc(supportingDoc)}
                        className="p-1 text-slate-600 hover:text-[#0B2545] transition-colors cursor-pointer"
                        title="Preview attachment"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSupportingDoc(null)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-[#0B2545] rounded-xl bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors text-center">
                    <Paperclip className="h-5 w-5 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-[#0B2545]">Upload medical note, hall ticket, or certificate</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">PDF, PNG, JPG up to 10MB</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || upcomingVisits.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B2545] py-2.5 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting Leave Petition...' : 'Submit Leave Petition'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: My Leave Applications History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">My Leave Applications</h3>
                  <p className="text-[11px] text-slate-500">Official petition review history</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Total: {leaveHistory.length}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent mb-2"></div>
                <p className="text-xs">Loading leave records...</p>
              </div>
            ) : leaveHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-slate-50 space-y-2">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-700">No Leave Applications Filed</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  You have not submitted any exemption requests. All confirmed visit registrations remain valid for attendance.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {leaveHistory.map((leave) => {
                  const visitTitle = leave.experienceTitle || leave.experience?.title || 'Industrial Visit';
                  const companyName = leave.experienceOrganization || leave.experience?.organization || 'Host Organization';
                  const visitDate = leave.experienceDate || leave.experience?.date || 'Scheduled Visit';
                  const visitLocation = leave.experienceLocation || leave.experience?.location;

                  return (
                    <div
                      key={leave.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                    >
                      {/* Top Bar: Visit Details & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{visitTitle}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getCategoryBadgeClass(
                                leave.category
                              )}`}
                            >
                              {leave.category || 'Medical Leave'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {companyName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {visitDate}
                            </span>
                            {visitLocation && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  {visitLocation}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {leave.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 text-[11px] font-bold">
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              Pending Faculty Review
                            </span>
                          )}
                          {leave.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-[11px] font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Approved
                            </span>
                          )}
                          {leave.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 text-[11px] font-bold">
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Reason for Leave:
                        </span>
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed italic">
                          "{leave.reason}"
                        </p>
                      </div>

                      {/* Supporting Document Row */}
                      {leave.supportingDocument && (
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                            <span className="font-medium text-slate-800 truncate">
                              {leave.supportingDocument.name}
                            </span>
                            {leave.supportingDocument.size && (
                              <span className="text-[10px] text-slate-400">
                                ({(leave.supportingDocument.size / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewingDoc(leave.supportingDocument!)}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#0B2545] hover:text-[#133E87] hover:underline cursor-pointer flex-shrink-0"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View / Download</span>
                          </button>
                        </div>
                      )}

                      {/* Review Information & Faculty Remarks */}
                      {(leave.status === 'APPROVED' || leave.status === 'REJECTED') && (
                        <div
                          className={`rounded-xl p-3 text-xs border space-y-1.5 ${
                            leave.status === 'APPROVED'
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-rose-50/60 border-rose-200 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold flex items-center gap-1">
                              <UserCheck className="h-3.5 w-3.5" />
                              Reviewed by {leave.reviewerName || 'Faculty Coordinator'}
                            </span>
                            <span className="text-slate-500 font-mono">
                              {formatDateTime(leave.reviewedAt)}
                            </span>
                          </div>
                          {leave.reviewNotes && (
                            <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 text-slate-800 text-[11px] leading-relaxed">
                              <strong>Faculty Remarks:</strong> {leave.reviewNotes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Timestamp */}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>Submitted: {formatDateTime(leave.submittedAt)}</span>
                        <span className="font-mono">Status: {leave.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        title="Supporting Document Verification"
      />
    </div>
  );
};
