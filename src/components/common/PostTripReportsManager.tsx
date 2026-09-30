import React, { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Download,
  Building2,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  RefreshCw,
  Award,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { TripReport } from '../../types';

interface PostTripReportsManagerProps {
  role: 'FACULTY' | 'ADMIN';
  initialExperienceId?: string;
}

export const PostTripReportsManager: React.FC<PostTripReportsManagerProps> = ({
  role,
  initialExperienceId,
}) => {
  const [data, setData] = useState<{
    totalCompletedTrips: number;
    totalEligibleStudents: number;
    totalReportsSubmitted: number;
    totalReportsPending: number;
    totalPhotos: number;
    tripSummaries: Array<{
      experienceId: string;
      title: string;
      organization: string;
      date: string;
      location: string;
      capacity: number;
      attendedCount: number;
      eligibleCount: number;
      submittedCount: number;
      pendingCount: number;
      photosCount: number;
      students: Array<{
        studentId: string;
        name: string;
        enrollmentNumber: string;
        email: string;
        department: string;
        branch: string;
        year: number;
        semester: number;
        attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'PENDING' | 'NOT_MARKED';
        isEligible: boolean;
        reportStatus: 'SUBMITTED' | 'PENDING' | 'NOT_ELIGIBLE';
        reportId?: string;
        submittedAt?: string;
        photosCount: number;
      }>;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>(
    initialExperienceId || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'PENDING' | 'NOT_ELIGIBLE'>('ALL');

  // Selected Report Modal
  const [viewingReport, setViewingReport] = useState<TripReport | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [role]);

  useEffect(() => {
    if (initialExperienceId) {
      setSelectedExperienceId(initialExperienceId);
    }
  }, [initialExperienceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'FACULTY') {
        const res = await api.getFacultyReportsDashboard();
        setData(res);
      } else {
        const res = await api.getAdminReportsDashboard();
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (reportId: string, expId: string, studentId: string) => {
    setReportLoading(true);
    setViewingReport(null);
    try {
      let report: TripReport | null = null;
      if (reportId) {
        report =
          role === 'FACULTY'
            ? await api.getFacultyReportDetail(reportId)
            : await api.getAdminReportDetail(reportId);
      } else {
        report = await api.getStudentTripReport(expId, studentId);
      }
      setViewingReport(report);
    } catch (err) {
      console.error('Failed to load report details:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const trips = data?.tripSummaries || [];

  // Filter trips
  const activeTrips =
    selectedExperienceId === 'ALL'
      ? trips
      : trips.filter((t) => t.experienceId === selectedExperienceId);

  // Computed metrics for active trips
  const currentCompletedTrips =
    selectedExperienceId === 'ALL'
      ? data?.totalCompletedTrips || 0
      : activeTrips.length;

  const currentEligibleStudents =
    selectedExperienceId === 'ALL'
      ? data?.totalEligibleStudents || 0
      : activeTrips.reduce((sum, t) => sum + t.eligibleCount, 0);

  const currentReportsSubmitted =
    selectedExperienceId === 'ALL'
      ? data?.totalReportsSubmitted || 0
      : activeTrips.reduce((sum, t) => sum + t.submittedCount, 0);

  const currentReportsPending =
    selectedExperienceId === 'ALL'
      ? data?.totalReportsPending || 0
      : activeTrips.reduce((sum, t) => sum + t.pendingCount, 0);

  const currentPhotos =
    selectedExperienceId === 'ALL'
      ? data?.totalPhotos || 0
      : activeTrips.reduce((sum, t) => sum + t.photosCount, 0);

  // Flattened students list with visit info attached
  const allStudentsWithVisits = activeTrips.flatMap((trip) =>
    trip.students.map((st) => ({
      ...st,
      tripTitle: trip.title,
      organization: trip.organization,
      visitDate: trip.date,
      experienceId: trip.experienceId,
    }))
  );

  const filteredStudents = allStudentsWithVisits.filter((st) => {
    const matchesSearch =
      !searchQuery.trim() ||
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || st.reportStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activePhotos = viewingReport?.photos || [];
  const activeLightboxPhoto =
    lightboxIndex !== null && activePhotos[lightboxIndex]
      ? activePhotos[lightboxIndex]
      : null;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Completed Visits
          </span>
          <p className="text-2xl font-black text-slate-900">
            {currentCompletedTrips}
          </p>
          <span className="text-[10px] text-slate-400">Archived institutional visits</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Eligible (Attended)
          </span>
          <p className="text-2xl font-black text-slate-900">
            {currentEligibleStudents}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Present in attendance</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Reports Submitted
          </span>
          <p className="text-2xl font-black text-emerald-700">
            {currentReportsSubmitted}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {currentEligibleStudents
              ? Math.round((currentReportsSubmitted / currentEligibleStudents) * 100)
              : 0}
            % completion rate
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/40 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Pending Reports
          </span>
          <p className="text-2xl font-black text-amber-700">
            {currentReportsPending}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">Awaiting student submissions</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Photos Uploaded
          </span>
          <p className="text-2xl font-black text-[#0B2545]">
            {currentPhotos}
          </p>
          <span className="text-[10px] text-slate-400">High-res site documentation</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll number, department, or trip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0B2545] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Visit Filter */}
            <select
              value={selectedExperienceId}
              onChange={(e) => setSelectedExperienceId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-[#0B2545] outline-none max-w-[200px] truncate"
            >
              <option value="ALL">All Completed Visits ({trips.length})</option>
              {trips.map((t) => (
                <option key={t.experienceId} value={t.experienceId}>
                  {t.title} ({t.organization})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-[#0B2545] outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="NOT_ELIGIBLE">Not Eligible (Absent)</option>
            </select>

            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table of Submissions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0B2545]" />
            <h3 className="text-sm font-bold text-slate-900">
              Student Post-Trip Reports & Photo Records
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredStudents.length} records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <div className="h-6 w-6 border-2 border-slate-300 border-t-[#0B2545] rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading post-trip reports...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <FileText className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No report records found</p>
            <p className="text-xs text-slate-400">
              Try adjusting your search or visit filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Industrial Visit</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Report Status</th>
                  <th className="px-4 py-3">Photos</th>
                  <th className="px-4 py-3">Submitted Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={`${st.experienceId}_${st.studentId}`} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-medium">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{st.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">{st.enrollmentNumber}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {st.department || st.branch} (Year {st.year})
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800 truncate max-w-[200px]" title={st.tripTitle}>
                          {st.tripTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{st.organization}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">{st.visitDate}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {st.attendanceStatus === 'PRESENT' || st.attendanceStatus === 'LATE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> {st.attendanceStatus}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="h-3 w-3" /> {st.attendanceStatus}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {st.reportStatus === 'SUBMITTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Submitted
                        </span>
                      ) : st.reportStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Not Eligible
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                        {st.photosCount} photos
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {st.submittedAt ? (
                        new Date(st.submittedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {st.reportStatus === 'SUBMITTED' ? (
                        <button
                          onClick={() => handleOpenReport(st.reportId || '', st.experienceId, st.studentId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Report
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No report yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Viewing Report Detail Modal */}
      {(viewingReport || reportLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-linear-to-r from-[#0B2545] to-[#134074] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileText className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Student Post-Trip Report</h3>
                  <p className="text-xs text-slate-300">
                    {viewingReport?.studentName} &bull; {viewingReport?.studentEnrollment} &bull;{' '}
                    {viewingReport?.tripTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {reportLoading ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <div className="h-6 w-6 border-2 border-slate-300 border-t-[#0B2545] rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Loading student report...</p>
                </div>
              ) : viewingReport ? (
                <div className="space-y-6">
                  {/* Context Bar */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Student</span>
                      <p className="font-bold text-slate-800">{viewingReport.studentName}</p>
                      <p className="font-mono text-slate-500">{viewingReport.studentEnrollment}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Department</span>
                      <p className="font-semibold text-slate-800">{viewingReport.studentDepartment}</p>
                      <p className="text-slate-500">Year {viewingReport.studentYear} / Sem {viewingReport.studentSemester}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Company & Date</span>
                      <p className="font-semibold text-slate-800">{viewingReport.organizationName}</p>
                      <p className="text-slate-500">{viewingReport.visitDate}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Submitted At</span>
                      <p className="font-semibold text-slate-800">
                        {new Date(viewingReport.submittedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Verified Attendance
                      </span>
                    </div>
                  </div>

                  {/* Q1 */}
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 1. What I Learned
                    </h4>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {viewingReport.whatILearned}
                    </p>
                  </div>

                  {/* Q2 */}
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" /> 2. Key Activities & Observations
                    </h4>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {viewingReport.activities}
                    </p>
                  </div>

                  {/* Q3 */}
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> 3. Skills & Knowledge Gained
                    </h4>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {viewingReport.skillsGained}
                    </p>
                  </div>

                  {/* Q4 */}
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" /> 4. Overall Experience
                    </h4>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {viewingReport.experience}
                    </p>
                  </div>

                  {/* Q5 */}
                  {viewingReport.suggestions && (
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        5. Student Suggestions & Recommendations
                      </h4>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {viewingReport.suggestions}
                      </p>
                    </div>
                  )}

                  {/* Photo Gallery */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-[#0B2545]" /> Attached Photos (
                      {activePhotos.length})
                    </h4>

                    {activePhotos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                        No photos were attached with this submission.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {activePhotos.map((photo, idx) => (
                          <div
                            key={photo.id}
                            className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs cursor-pointer"
                            onClick={() => setLightboxIndex(idx)}
                          >
                            <img
                              src={photo.fileUrl}
                              alt={photo.caption || photo.fileName}
                              className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="p-1.5 bg-white/90 rounded-full text-slate-800 hover:bg-white">
                                <ZoomIn className="h-4 w-4" />
                              </span>
                            </div>
                            {photo.caption && (
                              <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 p-1.5 text-[10px] text-white truncate">
                                {photo.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                onClick={() => setViewingReport(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox */}
      {activeLightboxPhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-between p-4 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="w-full flex items-center justify-between text-white py-2 px-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">
                Photo {lightboxIndex + 1} of {activePhotos.length}
              </span>
              {activeLightboxPhoto.fileName && (
                <span className="text-xs text-slate-400">&bull; {activeLightboxPhoto.fileName}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a
                href={activeLightboxPhoto.fileUrl}
                download={activeLightboxPhoto.fileName || 'visit_photo.jpg'}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
              >
                <Download className="h-4 w-4" /> Download
              </a>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 w-full flex items-center justify-center relative p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {activePhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : activePhotos.length - 1));
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img
              src={activeLightboxPhoto.fileUrl}
              alt={activeLightboxPhoto.caption || 'Visit Photo'}
              className="max-h-[78vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            />

            {activePhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! < activePhotos.length - 1 ? prev! + 1 : 0));
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {activeLightboxPhoto.caption && (
            <div
              className="py-3 px-6 bg-white/10 backdrop-blur-md rounded-xl text-white text-xs max-w-xl text-center mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {activeLightboxPhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
