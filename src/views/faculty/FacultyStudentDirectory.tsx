import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import {
  StudentDirectoryEntry,
  StudentDirectoryResponse,
  StudentDirectoryVisitInfo,
} from '../../types';
import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Eye,
  X,
  GraduationCap,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  UserCheck,
  FileText,
} from 'lucide-react';

interface FacultyStudentDirectoryProps {
  initialExperienceId?: string;
}

export const FacultyStudentDirectory: React.FC<FacultyStudentDirectoryProps> = ({
  initialExperienceId,
}) => {
  const [data, setData] = useState<StudentDirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [visitFilter, setVisitFilter] = useState<string>(initialExperienceId || 'ALL');

  // Selected student for detail modal
  const [selectedStudent, setSelectedStudent] = useState<StudentDirectoryEntry | null>(null);
  const [viewingConsentDoc, setViewingConsentDoc] = useState<{
    studentName: string;
    visitTitle: string;
    docUrl: string;
    consentStatus?: string;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    loadDirectory();
  }, []);

  const loadDirectory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStudentDirectory();
      setData(response);
    } catch (err: any) {
      console.error('Error loading student directory:', err);
      setError(err?.message || 'Failed to load authorized student directory records.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format year into canonical text
  const formatYearLabel = (year: number) => {
    switch (year) {
      case 1:
        return 'First Year';
      case 2:
        return 'Second Year';
      case 3:
        return 'Third Year';
      case 4:
        return 'Fourth Year';
      default:
        return `Year ${year}`;
    }
  };

  // Extract list of all unique visits across all authorized students
  const availableVisits = useMemo(() => {
    if (!data?.students) return [];
    const visitMap = new Map<string, { id: string; title: string; organization: string }>();
    data.students.forEach((s) => {
      s.registeredVisits.forEach((v) => {
        if (!visitMap.has(v.experienceId)) {
          visitMap.set(v.experienceId, {
            id: v.experienceId,
            title: v.title,
            organization: v.organization,
          });
        }
      });
    });
    return Array.from(visitMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [data]);

  // Filter students based on search, branch, and strictly the 4 year options
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];

    return data.students.filter((student) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = student.name.toLowerCase().includes(q);
        const matchId = student.studentId.toLowerCase().includes(q);
        const matchPrn = student.prn?.toLowerCase().includes(q) || false;
        const matchEmail = student.email.toLowerCase().includes(q);
        const matchBranch = student.branch.toLowerCase().includes(q);
        const matchVisit = student.registeredVisits.some(
          (v) =>
            v.title.toLowerCase().includes(q) ||
            v.organization.toLowerCase().includes(q) ||
            (v.certificateId && v.certificateId.toLowerCase().includes(q))
        );

        if (!matchName && !matchId && !matchPrn && !matchEmail && !matchBranch && !matchVisit) {
          return false;
        }
      }

      // 2. Branch Filter
      if (branchFilter !== 'ALL' && student.branch !== branchFilter) {
        return false;
      }

      // 3. Year Filter (Strictly: All Years, First Year = 1, Second Year = 2, Third Year = 3, Fourth Year = 4)
      if (yearFilter !== 'ALL') {
        const selectedYearNum = parseInt(yearFilter, 10);
        if (student.year !== selectedYearNum) {
          return false;
        }
      }

      // 4. Visit Filter (optional helper)
      if (visitFilter !== 'ALL') {
        const hasVisit = student.registeredVisits.some((v) => v.experienceId === visitFilter);
        if (!hasVisit) {
          return false;
        }
      }

      return true;
    });
  }, [data, search, branchFilter, yearFilter, visitFilter]);

  // Aggregate Metrics for Top Strip
  const metrics = useMemo(() => {
    if (!data?.students) {
      return { totalStudents: 0, totalRegistrations: 0, overallAttendanceRate: 0, totalCertificates: 0 };
    }
    const totalStudents = data.students.length;
    let totalRegistrations = 0;
    let totalAttendedVisits = 0;
    let totalAssignedVisits = 0;
    let totalCertificates = 0;

    data.students.forEach((s) => {
      totalRegistrations += s.registeredVisitsCount;
      totalAssignedVisits += s.attendanceSummary.totalAssigned;
      totalAttendedVisits += s.attendanceSummary.attendedCount;
      totalCertificates += s.certificateSummary.totalIssued;
    });

    const overallAttendanceRate =
      totalAssignedVisits > 0 ? Math.round((totalAttendedVisits / totalAssignedVisits) * 100) : 0;

    return {
      totalStudents,
      totalRegistrations,
      overallAttendanceRate,
      totalCertificates,
    };
  }, [data]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setBranchFilter('ALL');
    setYearFilter('ALL');
    setVisitFilter('ALL');
  };

  const isFiltered = search !== '' || branchFilter !== 'ALL' || yearFilter !== 'ALL' || visitFilter !== 'ALL';

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;

    const headers = [
      'Roll Number',
      'PRN',
      'Student Name',
      'Branch',
      'Year',
      'Division',
      'Email',
      'Phone',
      'Department',
      'Registered Visits Count',
      'Attendance Rate (%)',
      'Present Count',
      'Late Count',
      'Excused Count',
      'Absent Count',
      'Certificates Issued',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.studentId}"`,
      `"${s.prn || s.studentId}"`,
      `"${s.name}"`,
      `"${s.branch}"`,
      `"${formatYearLabel(s.year)}"`,
      `"${s.division}"`,
      `"${s.email}"`,
      `"${s.phone}"`,
      `"${s.department}"`,
      s.registeredVisitsCount,
      s.attendanceSummary.totalAssigned > 0 ? `${s.attendanceSummary.attendanceRate}%` : 'Not marked',
      s.attendanceSummary.presentCount,
      s.attendanceSummary.lateCount,
      s.attendanceSummary.excusedCount,
      s.attendanceSummary.absentCount,
      s.certificateSummary.totalIssued,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VIT_Faculty_Student_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h1>
            {data?.scopeSummary && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B2545]/10 text-[#0B2545] border border-[#0B2545]/20">
                <ShieldCheck className="h-3 w-3 text-[#0B2545]" />
                {data.scopeSummary.scopeType === 'INSTITUTION'
                  ? 'Institution-Wide Access'
                  : data.scopeSummary.scopeType === 'DEPARTMENT'
                  ? `Department Scope • ${data.scopeSummary.departmentScope?.split('(')[1]?.replace(')', '') || 'HOD'}`
                  : 'Assigned Cohorts Scope'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Authorized student roster across your permitted academic departments and coordinated industrial visits. View verified enrollment, attendance summaries, and participation certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDirectory}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Authorized Students
            </span>
            <Users className="h-4 w-4 text-[#0B2545]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.totalStudents}</span>
            <span className="text-[11px] text-slate-500 font-medium">in scope</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B2545]">
              Visit Registrations
            </span>
            <Building2 className="h-4 w-4 text-[#0B2545]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0B2545]">{metrics.totalRegistrations}</span>
            <span className="text-[11px] text-[#0B2545]/70 font-medium">total enrollments</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Verified Attendance
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{metrics.overallAttendanceRate}%</span>
            <span className="text-[11px] text-emerald-700 font-medium">overall rate</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Certificates Issued
            </span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800">{metrics.totalCertificates}</span>
            <span className="text-[11px] text-amber-700 font-medium">official credentials</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, PRN, email, or visit..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div className="md:col-span-3">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Branches ({data?.availableBranches?.length || 0})</option>
              {data?.availableBranches?.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter: STRICTLY All Years, First Year, Second Year, Third Year, Fourth Year */}
          <div className="md:col-span-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Years</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
            </select>
          </div>

          {/* Visit Filter */}
          <div className="md:col-span-2">
            <select
              value={visitFilter}
              onChange={(e) => setVisitFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Visits ({availableVisits.length})</option>
              {availableVisits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.organization}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>
              Showing <strong className="text-slate-900 font-bold">{filteredStudents.length}</strong> of{' '}
              {data?.students?.length || 0} authorized students
            </span>
            {isFiltered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-200">
                <Filter className="h-2.5 w-2.5 text-amber-600" />
                Active Filters
              </span>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-600 font-semibold hover:text-rose-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Table Area */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#0B2545] border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-800 mt-3">Loading Student Directory...</p>
          <p className="text-xs text-slate-400 mt-1">Verifying departmental and visit authorization scopes</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center">
          <ShieldCheck className="h-8 w-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-rose-900 mt-2">{error}</p>
          <button
            type="button"
            onClick={loadDirectory}
            className="mt-3 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
          >
            Retry Authorization
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-xs">
          <Users className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 mt-3">No Authorized Students Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {isFiltered
              ? 'No student profiles match your current search query and filter criteria.'
              : 'There are currently no students registered in your coordinated industrial visits or assigned department scope.'}
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear Filter Criteria</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Roll Number & PRN</th>
                  <th className="py-3.5 px-4">Branch & Year</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Registered Visits</th>
                  <th className="py-3.5 px-4 text-center">Attendance Summary</th>
                  <th className="py-3.5 px-4 text-center">Certificate Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((s, idx) => {
                  const attRate = s.attendanceSummary.attendanceRate;
                  const hasCerts = s.certificateSummary.totalIssued > 0;
                  const totalVisits = s.registeredVisitsCount;

                  return (
                    <tr
                      key={s.studentId}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedStudent(s)}
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0B2545] font-bold text-white text-xs shadow-2xs">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-[#0B2545] transition-colors block">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Div {s.division || 'A'} • CGPA: {s.cgpa ? s.cgpa.toFixed(2) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number & PRN */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 block text-xs">
                          {s.studentId}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block">
                          PRN: {s.prn || s.studentId}
                        </span>
                      </td>

                      {/* Branch & Year */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {s.branch}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mt-0.5">
                          {formatYearLabel(s.year)} (Sem {s.semester})
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <a
                          href={`mailto:${s.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B2545] font-medium text-xs transition-colors hover:underline"
                        >
                          <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[170px]">{s.email}</span>
                        </a>
                      </td>

                      {/* Registered Visits */}
                      <td className="py-3.5 px-4 text-center">
                        {totalVisits === 0 ? (
                          <span className="text-[11px] text-slate-400 font-medium">None</span>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B2545] border border-blue-200">
                              <Building2 className="h-3 w-3 text-[#0B2545]" />
                              {totalVisits} Visit{totalVisits === 1 ? '' : 's'}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5 font-medium">
                              {s.completedVisitsCount} Completed
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Attendance Summary */}
                      <td className="py-3.5 px-4 text-center">
                        {s.attendanceSummary.totalAssigned === 0 ? (
                          <span className="text-[11px] text-slate-400 font-medium">Not marked</span>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                attRate >= 80
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  : attRate >= 60
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-rose-50 text-rose-900 border-rose-200'
                              }`}
                            >
                              {attRate}% Attendance
                            </span>
                            <span className="text-[9px] text-slate-500 mt-0.5 font-medium">
                              {s.attendanceSummary.attendedCount}/{s.attendanceSummary.totalAssigned} Attended
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Certificate Status */}
                      <td className="py-3.5 px-4 text-center">
                        {hasCerts ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-900 border border-amber-200 shadow-2xs">
                            <Award className="h-3 w-3 text-amber-600" />
                            {s.certificateSummary.totalIssued} Issued
                          </span>
                        ) : s.attendanceSummary.attendedCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            Eligible
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">None Issued</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(s);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#0B2545] hover:text-white hover:border-[#0B2545] transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Exposure Dossier Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B2545] font-black text-white text-lg shadow-xs">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {selectedStudent.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-800">
                      Roll: {selectedStudent.studentId}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">
                      PRN: {selectedStudent.prn || selectedStudent.studentId}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {formatYearLabel(selectedStudent.year)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Student Profile Quick Facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Branch & Division
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {selectedStudent.branch} (Div {selectedStudent.division || 'A'})
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Academic Standing
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {formatYearLabel(selectedStudent.year)} • Sem {selectedStudent.semester} (CGPA {selectedStudent.cgpa})
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Attendance Rate
                </span>
                <span className="text-xs font-bold text-emerald-700 mt-1 block">
                  {selectedStudent.attendanceSummary.totalAssigned === 0
                    ? 'Not marked'
                    : `${selectedStudent.attendanceSummary.attendanceRate}% (${selectedStudent.attendanceSummary.attendedCount}/${selectedStudent.attendanceSummary.totalAssigned} Attended)`}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Official Certificates
                </span>
                <span className="text-xs font-bold text-amber-700 mt-1 block">
                  {selectedStudent.certificateSummary.totalIssued} Credential{selectedStudent.certificateSummary.totalIssued === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Contact & Department Information */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Academic & Contact Records
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Academic Department</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Institutional Email</span>
                  <a
                    href={`mailto:${selectedStudent.email}`}
                    className="font-semibold text-[#0B2545] hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Mail className="h-3 w-3" />
                    {selectedStudent.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                  <span className="font-mono font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {selectedStudent.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Industrial Exposure Engagement History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                  <span>Industrial Exposure History & Attendance Log</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedStudent.registeredVisits.length} Registered Visits
                </span>
              </div>

              {selectedStudent.registeredVisits.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  No industrial visit records registered under your coordination scope for this student.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Visit & Host Facility</th>
                        <th className="px-3.5 py-2.5">Date & Location</th>
                        <th className="px-3.5 py-2.5 text-center">Registration</th>
                        <th className="px-3.5 py-2.5 text-center">Consent</th>
                        <th className="px-3.5 py-2.5 text-center">Attendance</th>
                        <th className="px-3.5 py-2.5 text-center">Eligibility</th>
                        <th className="px-3.5 py-2.5 text-center">Certificate</th>
                        <th className="px-3.5 py-2.5 text-right">Consent Form</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedStudent.registeredVisits.map((v) => {
                        const isRegApproved = v.registrationStatus === 'REGISTERED' || v.registrationStatus === 'COMPLETED';
                        const isConsentApproved = v.consentStatus === 'VERIFIED';
                        const isAttendanceEligible = isRegApproved && isConsentApproved;

                        return (
                          <tr key={v.experienceId} className="hover:bg-slate-50/60">
                            <td className="px-3.5 py-2.5">
                              <span className="font-bold text-slate-900 block">{v.organization}</span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                                {v.title}
                              </span>
                              {v.boardingPassNumber && (
                                <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                  Pass: {v.boardingPassNumber}
                                </span>
                              )}
                            </td>

                            <td className="px-3.5 py-2.5 text-slate-600">
                              <span className="font-medium block">{v.date}</span>
                              <span className="text-[10px] text-slate-400 block">{v.location}</span>
                            </td>

                            <td className="px-3.5 py-2.5 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  v.registrationStatus === 'REGISTERED' || v.registrationStatus === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                    : v.registrationStatus === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                                }`}
                              >
                                {v.registrationStatus === 'REGISTERED' || v.registrationStatus === 'COMPLETED'
                                  ? 'APPROVED'
                                  : v.registrationStatus}
                              </span>
                            </td>

                            <td className="px-3.5 py-2.5 text-center">
                              {v.consentStatus ? (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    v.consentStatus === 'VERIFIED'
                                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                      : v.consentStatus === 'REJECTED'
                                      ? 'bg-rose-50 text-rose-900 border border-rose-200'
                                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                                  }`}
                                >
                                  {v.consentStatus === 'VERIFIED'
                                    ? 'APPROVED'
                                    : v.consentStatus === 'PENDING_VERIFICATION'
                                    ? 'PENDING'
                                    : v.consentStatus}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">None</span>
                              )}
                            </td>

                            <td className="px-3.5 py-2.5 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                  v.attendanceStatus === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : v.attendanceStatus === 'LATE'
                                    ? 'bg-amber-100 text-amber-900'
                                    : v.attendanceStatus === 'EXCUSED'
                                    ? 'bg-blue-100 text-[#0B2545]'
                                    : v.attendanceStatus === 'ABSENT'
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {v.attendanceStatus === 'PRESENT' ? 'Present ✓' : v.attendanceStatus}
                              </span>
                              {v.attendanceNotes && (
                                <span className="text-[9px] text-slate-400 block mt-0.5 italic">
                                  "{v.attendanceNotes}"
                                </span>
                              )}
                            </td>

                            <td className="px-3.5 py-2.5 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isAttendanceEligible
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {isAttendanceEligible ? 'Eligible' : 'Not Eligible'}
                              </span>
                            </td>

                            <td className="px-3.5 py-2.5 text-center">
                              {v.certificateStatus === 'ISSUED' ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                    <Award className="h-3 w-3 text-amber-600" />
                                    ISSUED
                                  </span>
                                  {v.certificateId && (
                                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                                      {v.certificateId}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">None</span>
                              )}
                            </td>

                          <td className="px-3.5 py-2.5 text-right">
                            {v.consentDocumentUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewingConsentDoc({
                                    studentName: selectedStudent.name,
                                    visitTitle: v.title,
                                    docUrl: v.consentDocumentUrl!,
                                    consentStatus: v.consentStatus,
                                    reason: v.consentRejectionReason,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0B2545] hover:bg-[#0B2545] hover:text-white rounded text-[11px] font-bold border border-blue-200 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Inspect Form</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No Upload</span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <a
                href={`mailto:${selectedStudent.email}?subject=VIT Industrial Exposure Communication - ${encodeURIComponent(selectedStudent.name)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Mail className="h-3.5 w-3.5 text-[#0B2545]" />
                <span>Contact Student via Email</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg bg-[#0B2545] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-all cursor-pointer shadow-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consent Document Inspection Modal */}
      {viewingConsentDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Parent / Guardian Consent Document</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student: <strong className="text-slate-800">{viewingConsentDoc.studentName}</strong> • Visit: {viewingConsentDoc.visitTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingConsentDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Verification Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                  viewingConsentDoc.consentStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : viewingConsentDoc.consentStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {viewingConsentDoc.consentStatus || 'PENDING'}
              </span>
            </div>

            {viewingConsentDoc.reason && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800">
                <strong className="block mb-0.5 font-bold">Validation Note:</strong>
                {viewingConsentDoc.reason}
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 min-h-[300px] flex items-center justify-center p-2">
              {viewingConsentDoc.docUrl.startsWith('data:image/') ||
              viewingConsentDoc.docUrl.startsWith('http') ||
              viewingConsentDoc.docUrl.startsWith('blob:') ? (
                <img
                  src={viewingConsentDoc.docUrl}
                  alt="Uploaded Consent Form"
                  className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-8 text-slate-500 text-xs">
                  <FileText className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                  <span>PDF Document Uploaded</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingConsentDoc(null)}
                className="px-4 py-2 bg-[#0B2545] text-white font-bold rounded-lg text-xs hover:bg-[#133E87] transition-colors cursor-pointer"
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
