import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Search,
  Users,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  Phone,
  BookOpen,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const AdminStudentDirectory: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState<'visits' | 'leaves' | 'certificates' | 'attendance'>('visits');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const formatAttendanceStatus = (status: string) => {
    if (status === 'NOT_MARKED') return 'Not Marked';
    if (!status) return 'Not Marked';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getAttendanceBadgeColor = (status: string) => {
    if (status === 'PRESENT') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'ABSENT') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (status === 'LATE') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (status === 'EXCUSED') return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-blue-50 text-blue-800 border-blue-200';
    if (status === 'REGISTERED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'CANCELLED') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (status === 'WAITLISTED') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleOpenDossier = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingDossier(true);
    try {
      const data = await api.getAdminStudentDossier(studentId);
      setDossier(data);
    } catch (err) {
      console.error('Error loading student dossier:', err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Student ID', 'Roll No / PRN', 'Name', 'Email', 'Department / Branch', 'Year', 'Division', 'Registrations', 'Completed Visits', 'Certificates', 'Attendance Rate (%)'];
    const rows = filteredStudents.map((s) => [
      s.studentId,
      s.rollNumber || s.prn || '',
      `"${s.name}"`,
      s.email,
      `"${s.branch || s.department}"`,
      s.year,
      s.division || 'A',
      s.totalRegistrations,
      s.completedVisits,
      s.totalCertificates,
      `${s.attendanceRate}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vit_student_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(search.toLowerCase())) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase())) ||
      (s.branch && s.branch.toLowerCase().includes(search.toLowerCase()));

    const matchesBranch = selectedBranch === 'ALL' || (s.branch && s.branch.toLowerCase().includes(selectedBranch.toLowerCase()));
    const matchesYear = selectedYear === 'ALL' || s.year === Number(selectedYear);

    return matchesSearch && matchesBranch && matchesYear;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 border border-blue-200 text-[#0B2545] px-2.5 py-0.5 text-[10px] font-bold">
              ACADEMIC DOSSIER & REGISTRY
            </span>
            <span className="text-xs text-slate-500 font-medium">{students.length} Total Enrolled Students</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Student Directory & Industrial Immersion Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional lookup across all departments, tracking student visit eligibility, participation history, and verification credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Roster (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll no, PRN, email, or branch..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments / Branches</option>
            <option value="Computer">Computer Science & Eng</option>
            <option value="Information">Information Technology</option>
            <option value="Electronics">Electronics & Telecom (EXTC)</option>
            <option value="Biomedical">Biomedical Engineering</option>
          </select>
        </div>

        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Academic Years</option>
            <option value="1">1st Year (FE)</option>
            <option value="2">2nd Year (SE)</option>
            <option value="3">3rd Year (TE)</option>
            <option value="4">4th Year (BE)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading verified student profiles...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No students matched the query filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Student Details</th>
                  <th className="px-4 py-3.5">Department & Year</th>
                  <th className="px-4 py-3.5 text-center">Visits Attended</th>
                  <th className="px-4 py-3.5 text-center">Certificates</th>
                  <th className="px-4 py-3.5 text-center">Attendance %</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-[#0B2545] font-semibold">{s.rollNumber || s.studentId}</span>
                        <span>•</span>
                        <span>{s.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{s.branch || s.department}</div>
                      <div className="text-[11px] text-slate-500">Year {s.year} (Sem {s.semester || s.year * 2}) • Div {s.division || 'A'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0B2545]">
                        {s.totalRegistrations} registered ({s.completedVisits} completed)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        <Award className="h-3 w-3 text-emerald-600" />
                        {s.totalCertificates} Issued
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-900">
                        <span className={s.attendanceRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}>
                          {s.attendanceRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenDossier(s.studentId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-amber-400" />
                        <span>View Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Full Dossier Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#0B2545] text-white px-2 py-0.5 text-[10px] font-bold">
                    OFFICIAL STUDENT DOSSIER
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {dossier?.profile?.studentId || selectedStudentId}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {dossier?.profile?.name || 'Loading Student...'}
                </h3>
                <div className="mt-2 space-y-0.5">
                  <p className="text-sm font-medium text-slate-700">
                    {dossier?.profile?.branch}
                  </p>
                  <p className="text-xs text-slate-500">
                    Year {dossier?.profile?.year} • Division {dossier?.profile?.division || 'A'}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    CGPA: {dossier?.profile?.cgpa || '8.2'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedStudentId(null);
                  setDossier(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDossier ? (
              <div className="p-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
                <p className="text-xs text-slate-500 mt-2">Compiling academic records and certificates...</p>
              </div>
            ) : dossier ? (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Quick Profile Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Visits</span>
                    <span className="text-lg font-bold text-slate-900">{dossier.stats.totalRegistrations}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Attendance Rate</span>
                    <span className="text-lg font-bold text-emerald-700">{dossier.stats.attendanceRate}%</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Certificates</span>
                    <span className="text-lg font-bold text-blue-700">{dossier.stats.totalCertificates}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Waitlists</span>
                    <span className="text-lg font-bold text-amber-700">{dossier.stats.activeWaitlist}</span>
                  </div>
                </div>

                {/* Dossier Tabs */}
                <div className="flex border-b border-slate-200 gap-2">
                  <button
                    onClick={() => setActiveDossierTab('visits')}
                    className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      activeDossierTab === 'visits'
                        ? 'border-[#0B2545] text-[#0B2545]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Visits & Registrations ({dossier.registrations.length})
                  </button>
                  <button
                    onClick={() => setActiveDossierTab('leaves')}
                    className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      activeDossierTab === 'leaves'
                        ? 'border-[#0B2545] text-[#0B2545]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Leave Petitions ({dossier.leaveRequests.length})
                  </button>
                  <button
                    onClick={() => setActiveDossierTab('certificates')}
                    className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      activeDossierTab === 'certificates'
                        ? 'border-[#0B2545] text-[#0B2545]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Certificates ({dossier.certificates.length})
                  </button>
                </div>

                {/* Tab: Visits */}
                {activeDossierTab === 'visits' && (
                  <div className="space-y-2.5">
                    {dossier.registrations.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No registration history for this student.</p>
                    ) : (
                      dossier.registrations.map((reg: any) => (
                        <div
                          key={reg.registrationId}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{reg.experienceTitle}</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {reg.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3">
                              <span>Org: {reg.organization}</span>
                              <span>Date: {reg.date}</span>
                              {reg.boardingPassNumber && (
                                <span className="font-mono text-[#0B2545] font-semibold">Pass: {reg.boardingPassNumber}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-800">
                              Att: {reg.attendanceStatus}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Leaves */}
                {activeDossierTab === 'leaves' && (
                  <div className="space-y-2.5">
                    {dossier.leaveRequests.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No leave applications submitted by this student.</p>
                    ) : (
                      dossier.leaveRequests.map((leave: any) => (
                        <div
                          key={leave.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{leave.experienceTitle}</span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                leave.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : leave.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {leave.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                            <span className="font-semibold text-slate-700">Category: {leave.category}</span>
                            <p className="mt-0.5">{leave.reason}</p>
                          </div>
                          {leave.reviewNotes && (
                            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                              <span className="font-medium text-slate-700">Review Notes: </span>
                              {leave.reviewNotes}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Certificates */}
                {activeDossierTab === 'certificates' && (
                  <div className="space-y-2.5">
                    {dossier.certificates.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No certificates issued yet.</p>
                    ) : (
                      dossier.certificates.map((cert: any) => (
                        <div
                          key={cert.id}
                          className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-xs flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{cert.experienceTitle}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              Certificate ID: <span className="font-mono font-semibold">{cert.certificateId}</span> • Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="rounded bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10px] font-bold">
                            VERIFIED & VALID
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Footer */}
            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => {
                  setSelectedStudentId(null);
                  setDossier(null);
                }}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
