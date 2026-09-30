import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { ScanQRModal } from '../../components/common/ScanQRModal';
import {
  AttendanceRecord,
  ExperienceWithMeta,
  StudentProfile,
  Certificate,
  Registration,
} from '../../types';
import {
  UserCheck, QrCode,
  CheckCircle2,
  Building2,
  Calendar,
  Save,
  Search,
  Clock,
  Check,
  X,
  Award,
  ShieldCheck,
  Eye,
  AlertCircle,
  FileCheck2,
  Filter,
  Users,
  MapPin,
  Sparkles,
  Info,
  RotateCcw,
} from 'lucide-react';
import { CertificateViewerModal } from '../../components/student/CertificateViewerModal';
import { calculateAttendanceStats } from '../../utils/attendance';

interface FacultyAttendanceProps {
  initialExperienceId?: string;
}

interface RosterItem {
  student: StudentProfile;
  registration?: Registration;
  registrationStatus?: string;
  attendance?: AttendanceRecord;
  boardingPassNumber?: string;
  leaveStatus?: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface AttendanceEntry {
  status: AttendanceStatus;
  notes: string;
}

export const FacultyAttendance: React.FC<FacultyAttendanceProps> = ({ initialExperienceId }) => {
  const [experiences, setExperiences] = useState<ExperienceWithMeta[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string>('');
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceEntry>>({});
  const [initialAttendanceMap, setInitialAttendanceMap] = useState<Record<string, AttendanceEntry>>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [issuingCerts, setIssuingCerts] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [certSuccessMessage, setCertSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview Modal
  const [previewCert, setPreviewCert] = useState<{
    certificate: Certificate;
    experience: ExperienceWithMeta;
    student: StudentProfile;
  } | null>(null);

  useEffect(() => {
    loadFacultyExperiences();
  }, []);

  const loadFacultyExperiences = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const exps = await api.getFacultyExperiences();
      setExperiences(exps);
      if (exps.length > 0) {
        const targetId =
          initialExperienceId && exps.some((e) => e.id === initialExperienceId)
            ? initialExperienceId
            : exps[0].id;
        setSelectedExpId(targetId);
        await loadExperienceData(targetId);
      }
    } catch (err: any) {
      console.error('Error loading faculty experiences:', err);
      setErrorMessage('Unable to load assigned visits. Please ensure you are authorized.');
    } finally {
      setLoading(false);
    }
  };

  const loadExperienceData = async (expId: string) => {
    setLoading(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      const [rosterRes, certsRes] = await Promise.all([
        api.getExperienceRoster(expId),
        api.getExperienceCertificates(expId).catch(() => []),
      ]);

      const rawList =
        (rosterRes as any)?.confirmed ||
        (rosterRes as any)?.registered ||
        (rosterRes as any)?.data ||
        [];

      const registeredItems: RosterItem[] = rawList.map((r: any) => ({
        student: r.student || r,
        registration: r.registration,
        registrationStatus: r.registrationStatus || r.registration?.status || 'REGISTERED',
        attendance:
          r.attendance ||
          (r.attendanceStatus && r.attendanceStatus !== 'NOT_MARKED'
            ? {
                id: `att_${r.studentId || r.student?.studentId}`,
                studentId: r.studentId || r.student?.studentId,
                experienceId: expId,
                status: r.attendanceStatus as AttendanceStatus,
                markedBy: '',
                timestamp: new Date().toISOString(),
              }
            : undefined),
        boardingPassNumber: r.boardingPassNumber || r.boardingPass?.passNumber,
        leaveStatus: r.leaveStatus || r.leave?.status,
      }));

      setRoster(registeredItems);
      setCertificates(certsRes || []);

      const map: Record<string, AttendanceEntry> = {};
      registeredItems.forEach((item) => {
        const studentId = item.student?.studentId;
        if (!studentId) return;
        const recordedStatus = item.attendance?.status as AttendanceStatus | undefined;
        const notes = item.attendance?.notes || '';
        map[studentId] = {
          status: recordedStatus || 'PRESENT',
          notes: notes,
        };
      });

      setAttendanceMap(map);
      setInitialAttendanceMap(JSON.parse(JSON.stringify(map)));
    } catch (err: any) {
      console.error('Error loading students for attendance:', err);
      setErrorMessage(err.message || 'Error loading student roster for this visit.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExperience = (expId: string) => {
    setSelectedExpId(expId);
    setSaveSuccess(false);
    setCertSuccessMessage(null);
    setErrorMessage(null);
    loadExperienceData(expId);
  };

  const isDirty = useMemo(() => {
    const keys = Object.keys(attendanceMap);
    if (keys.length !== Object.keys(initialAttendanceMap).length) return true;
    for (const key of keys) {
      const cur = attendanceMap[key];
      const init = initialAttendanceMap[key];
      if (!init) return true;
      if (cur.status !== init.status || cur.notes !== init.notes) return true;
    }
    return false;
  }, [attendanceMap, initialAttendanceMap]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { notes: '' }),
        status,
      },
    }));
    setSaveSuccess(false);
  };

  const setStudentNotes = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'PRESENT' }),
        notes,
      },
    }));
    setSaveSuccess(false);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceEntry> = { ...attendanceMap };
    filteredRoster.forEach((item) => {
      const sId = item.student?.studentId;
      if (sId) {
        updated[sId] = {
          ...(updated[sId] || { notes: '' }),
          status,
        };
      }
    });
    setAttendanceMap(updated);
    setSaveSuccess(false);
  };

  const handleResetToSaved = () => {
    setAttendanceMap(JSON.parse(JSON.stringify(initialAttendanceMap)));
    setSaveSuccess(false);
  };

  const handleSaveAttendance = async () => {
    if (!selectedExpId) return;
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    setCertSuccessMessage(null);

    try {
      const records = (Object.entries(attendanceMap) as [string, AttendanceEntry][]).map(
        ([studentId, entry]) => ({
          studentId,
          status: entry.status,
          notes: entry.notes || undefined,
        })
      );

      await api.markAttendance(selectedExpId, records);
      setSaveSuccess(true);
      // Reload fresh database state to ensure absolute analytics and roster synchronization
      await loadExperienceData(selectedExpId);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setErrorMessage(err.message || 'Failed to save attendance records. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleIssueCertificates = async () => {
    if (!selectedExpId) return;
    setIssuingCerts(true);
    setCertSuccessMessage(null);
    setErrorMessage(null);

    try {
      // 1. Auto-save current attendance before certificate issuance
      if (isDirty) {
        const records = (Object.entries(attendanceMap) as [string, AttendanceEntry][]).map(
          ([studentId, entry]) => ({
            studentId,
            status: entry.status,
            notes: entry.notes || undefined,
          })
        );
        await api.markAttendance(selectedExpId, records);
      }

      // 2. Issue certificates for all attending students
      const res = await api.issueCertificates(selectedExpId);
      const issuedList = (res as any)?.certificates || res || [];
      const count = (res as any)?.count || issuedList.length || 0;
      setCertificates(issuedList);
      setCertSuccessMessage(
        `Successfully issued ${count} official certificates of completion! Student portals and transcripts updated.`
      );
      await loadExperienceData(selectedExpId);
    } catch (err: any) {
      console.error('Error issuing certificates:', err);
      setErrorMessage(err.message || 'Failed to issue certificates.');
    } finally {
      setIssuingCerts(false);
    }
  };

  const currentExp = experiences.find((e) => e.id === selectedExpId);

  // Derive unique branches for filter dropdown
  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    roster.forEach((item) => {
      if (item.student?.branch) branches.add(item.student.branch);
    });
    return Array.from(branches).sort();
  }, [roster]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const student = item.student;
      if (!student) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = student.name?.toLowerCase().includes(q);
        const matchesId = student.studentId?.toLowerCase().includes(q);
        const matchesPrn = student.prn?.toLowerCase().includes(q);
        const matchesBranch = student.branch?.toLowerCase().includes(q);
        const matchesEmail = student.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPrn && !matchesBranch && !matchesEmail) {
          return false;
        }
      }

      // Branch filter
      if (branchFilter !== 'ALL' && student.branch !== branchFilter) {
        return false;
      }

      // Year filter
      if (yearFilter !== 'ALL' && String(student.year) !== yearFilter) {
        return false;
      }

      // Attendance status filter
      if (statusFilter !== 'ALL') {
        const currentStatus = attendanceMap[student.studentId]?.status;
        if (currentStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [roster, search, branchFilter, yearFilter, statusFilter, attendanceMap]);

  // Aggregate Metrics
  const totalCount = roster.length;
  const attendanceList = Object.values(attendanceMap) as AttendanceEntry[];
  const presentCount = attendanceList.filter((v) => v.status === 'PRESENT').length;
  const lateCount = attendanceList.filter((v) => v.status === 'LATE').length;
  const excusedCount = attendanceList.filter((v) => v.status === 'EXCUSED').length;
  const absentCount = attendanceList.filter((v) => v.status === 'ABSENT').length;
  const attendedCount = presentCount + lateCount;
  const attendanceRate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;
  const issuedCertsCount = certificates.filter((c) => c.status === 'ISSUED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-[#0B2545]" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mark Attendance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review registered students, conduct verified roll calls, record attendance statuses, and persist official records.
          </p>
        </div>

        {currentExp && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowScanModal(true)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan QR</span>
            </button>
            {isDirty && (
              <button
                type="button"
                onClick={handleResetToSaved}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Discard unsaved changes"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Discard Changes</span>
              </button>
            )}

            <button
              type="button"
              id="faculty-save-attendance-btn"
              onClick={handleSaveAttendance}
              disabled={saving || roster.length === 0}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isDirty
                  ? 'bg-[#0B2545] text-white hover:bg-[#133E87] ring-2 ring-[#0B2545]/20'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              } disabled:opacity-50`}
            >
              <Save className={`h-4 w-4 ${isDirty ? 'text-amber-400' : 'text-[#0B2545]'}`} />
              <span>{saving ? 'Saving Records...' : isDirty ? 'Save Attendance *' : 'Save Attendance'}</span>
            </button>

            <button
              type="button"
              onClick={handleIssueCertificates}
              disabled={issuingCerts || attendedCount === 0}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Award className="h-4 w-4 text-emerald-200" />
              <span>
                {issuingCerts
                  ? 'Issuing Certificates...'
                  : `Issue Certificates (${attendedCount} Eligible)`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs font-bold text-amber-900 flex items-center justify-between shadow-2xs animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>You have unsaved attendance changes. Click "Save Attendance" to persist to the central registry.</span>
          </div>
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="rounded-md bg-amber-700 text-white px-3 py-1 text-[11px] font-bold hover:bg-amber-800 transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
            <span>Official attendance ledger successfully saved! Changes are synchronized across Faculty Dashboard, Analytics, and Reports.</span>
          </div>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Certificate Success Notification */}
      {certSuccessMessage && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs font-bold text-[#0B2545] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Award className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
            <span>{certSuccessMessage}</span>
          </div>
          <button
            onClick={() => setCertSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Select Visit Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label
              htmlFor="faculty-visit-selector"
              className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block"
            >
              Select Visit to Mark Attendance:
            </label>
            <select
              id="faculty-visit-selector"
              value={selectedExpId}
              onChange={(e) => handleSelectExperience(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:bg-white focus:outline-none cursor-pointer transition-colors shadow-2xs"
            >
              {experiences.length === 0 ? (
                <option value="">No authorized visits found</option>
              ) : (
                <>
                  <optgroup label="Upcoming & Active Industrial Visits">
                    {experiences
                      .filter((e) => e.status === 'PUBLISHED')
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.organization} — {e.title} ({e.date}) • Capacity: {e.capacity}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Completed Visits (Ledger Archive)">
                    {experiences
                      .filter((e) => e.status === 'COMPLETED' || e.status === 'CANCELLED')
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          [{e.status}] {e.organization} — {e.title} ({e.date})
                        </option>
                      ))}
                  </optgroup>
                </>
              )}
            </select>
          </div>

          {currentExp && (
            <div className="flex flex-wrap items-center gap-3 lg:border-l lg:border-slate-200 lg:pl-5 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Organization</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                  {currentExp.organization}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {currentExp.date}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    currentExp.status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  {currentExp.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Attendance Statistics Cards */}
        {currentExp && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Enrolled
              </span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalCount}</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Present
              </span>
              <span className="text-xl font-black text-emerald-800 mt-0.5 block">{presentCount}</span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Late
              </span>
              <span className="text-xl font-black text-amber-800 mt-0.5 block">{lateCount}</span>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2545] block">
                Excused
              </span>
              <span className="text-xl font-black text-[#0B2545] mt-0.5 block">{excusedCount}</span>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                Absent
              </span>
              <span className="text-xl font-black text-rose-800 mt-0.5 block">{absentCount}</span>
            </div>

            <div className="rounded-xl border border-[#0B2545]/20 bg-[#0B2545]/5 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2545] block">
                Turnout Rate
              </span>
              <span className="text-xl font-black text-[#0B2545] mt-0.5 block">{attendanceRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Action Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="student-attendance-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name, roll number, PRN, email..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Mark Batch Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Quick Mark:
            </span>
            <button
              type="button"
              id="mark-all-present-btn"
              onClick={() => handleMarkAll('PRESENT')}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Mark All Present</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Mark All Absent</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Branch:</span>
            <select
              id="filter-branch-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Branches ({uniqueBranches.length})</option>
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Year:</span>
            <select
              id="filter-year-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Academic Years</option>
              <option value="1">1st Year (Freshmen)</option>
              <option value="2">2nd Year (Sophomore)</option>
              <option value="3">3rd Year (Junior)</option>
              <option value="4">4th Year (Senior)</option>
            </select>
          </div>

          {/* Attendance Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Status:</span>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Attendance Status</option>
              <option value="PRESENT">Present ({presentCount})</option>
              <option value="LATE">Late ({lateCount})</option>
              <option value="EXCUSED">Excused ({excusedCount})</option>
              <option value="ABSENT">Absent ({absentCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-600 mt-3">Loading verified student roster...</p>
          <p className="text-[11px] text-slate-400 mt-1">Retrieving registration details and credentials</p>
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs space-y-2">
          <Users className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No registered students found.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search || branchFilter !== 'ALL' || yearFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No students matched the active search or filter criteria. Try resetting filters.'
              : 'There are currently no confirmed registrations for this visit.'}
          </p>
          {(search || branchFilter !== 'ALL' || yearFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setBranchFilter('ALL');
                setYearFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Showing {filteredRoster.length} of {roster.length} registered students
            </span>
            <span className="text-[11px] text-slate-500">
              Click status pills to mark attendance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Roll Number / PRN</th>
                  <th className="py-3.5 px-4">Branch & Div</th>
                  <th className="py-3.5 px-4 text-center">Year</th>
                  <th className="py-3.5 px-4 text-center">Registration</th>
                  <th className="py-3.5 px-4 text-center min-w-[280px]">Attendance Status</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Faculty Remarks</th>
                  <th className="py-3.5 px-4 text-center">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRoster.map((item, index) => {
                  const student = item.student;
                  const sId = student.studentId;
                  const entry = attendanceMap[sId] || { status: 'PRESENT', notes: '' };
                  const currentStatus = entry.status;
                  const notes = entry.notes;
                  const cert = certificates.find((c) => c.studentId === sId && c.status === 'ISSUED');

                  return (
                    <tr
                      key={sId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        currentStatus === 'ABSENT' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Row Index */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Student Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{student.name}</span>
                            <span className="text-[10px] text-slate-400 block">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number / PRN */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{sId}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          PRN: {student.prn || sId}
                        </span>
                      </td>

                      {/* Branch & Division */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{student.branch}</span>
                        <span className="text-[10px] text-slate-500 block">
                          Div {student.division || 'A'}
                          {item.boardingPassNumber && ` • BP: ${item.boardingPassNumber}`}
                        </span>
                      </td>

                      {/* Year */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          Yr {student.year}
                        </span>
                      </td>

                      {/* Registration Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.registrationStatus === 'CONFIRMED' || item.registrationStatus === 'REGISTERED'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : item.registrationStatus === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.registrationStatus || 'CONFIRMED'}
                        </span>
                      </td>

                      {/* Attendance Status Selection */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 shadow-2xs">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(sId, 'PRESENT')}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
                            }`}
                            title="Mark student as Present on site"
                          >
                            <Check className="h-3 w-3" />
                            <span>Present</span>
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(sId, 'LATE')}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
                            }`}
                            title="Mark student as Late arrival"
                          >
                            <Clock className="h-3 w-3" />
                            <span>Late</span>
                          </button>

                          {/* Excused */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(sId, 'EXCUSED')}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'EXCUSED'
                                ? 'bg-[#0B2545] text-white shadow-xs'
                                : 'text-slate-600 hover:text-[#0B2545] hover:bg-white/60'
                            }`}
                            title="Official approved leave / Excused absence"
                          >
                            <FileCheck2 className="h-3 w-3" />
                            <span>Excused</span>
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(sId, 'ABSENT')}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-white/60'
                            }`}
                            title="Mark student as Absent"
                          >
                            <X className="h-3 w-3" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setStudentNotes(sId, e.target.value)}
                          placeholder="Optional notes..."
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none transition-colors"
                        />
                      </td>

                      {/* Certificate Status */}
                      <td className="py-3 px-4 text-center">
                        {currentStatus === 'ABSENT' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            <X className="h-3 w-3 text-rose-500" />
                            <span>Ineligible</span>
                          </span>
                        ) : cert ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              <span className="font-mono">{cert.certificateId}</span>
                            </span>
                            {currentExp && (
                              <button
                                onClick={() =>
                                  setPreviewCert({
                                    certificate: cert,
                                    experience: currentExp,
                                    student,
                                  })
                                }
                                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:text-[#0B2545] hover:border-slate-300 transition-colors cursor-pointer"
                                title="Preview Official Certificate"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span>Pending Issue</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Table Summary Bar */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span>
                Verified Attendee Count: <strong>{attendedCount}</strong> of {totalCount} students (
                {attendanceRate}% turnout).
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                <Save className="h-4 w-4 text-amber-400" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

            {showScanModal && (
        <ScanQRModal 
          isOpen={showScanModal}
          experienceId={selectedExpId}
          onClose={() => setShowScanModal(false)}
          onScanSuccess={(studentId) => {
            loadExperienceData(selectedExpId);
          }}
          onScanError={(msg) => console.error(msg)}
        />
      )}
{/* Preview Certificate Modal */}
      {previewCert && (
        <CertificateViewerModal
          isOpen={!!previewCert}
          onClose={() => setPreviewCert(null)}
          certificate={previewCert.certificate}
          experience={previewCert.experience}
          student={previewCert.student}
        />
      )}
    </div>
  );
};
