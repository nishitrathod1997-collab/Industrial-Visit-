import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  UserCheck,
  Megaphone,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Eye,
  Edit,
  User,
  Ticket,
  GraduationCap,
  ShieldCheck,
  Bus,
  FileSpreadsheet,
  Award,
  RefreshCw,
  Info,
  Sparkles,
  Check,
  CheckSquare,
  QrCode,
  Mail,
  MailCheck,
  BellRing,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Experience,
  ExperienceWithMeta,
  StudentProfile,
  RegisteredStudent,
  Announcement,
  AttendanceRecord,
  EmailNotification,
} from '../../types';
import { CompanyImage } from '../../components/common/CompanyImage';
import { StudentDetailModal } from '../../components/faculty/StudentDetailModal';
import { CompanyLocationSection } from '../../components/common/CompanyLocationSection';
import { ScanQRModal } from '../../components/common/ScanQRModal';
import { PostTripReportsManager } from '../../components/common/PostTripReportsManager';
import { formatISTDateTime } from '../../utils/dateUtils';

interface FacultyVisitDetailProps {
  experienceId: string;
  initialTab?: 'overview' | 'confirmed' | 'waitlist' | 'attendance' | 'announcements' | 'emails' | 'documents' | 'reports';
  onBack: () => void;
  onEdit?: (experience: ExperienceWithMeta) => void;
  onPreview?: (experience: ExperienceWithMeta) => void;
}

export const FacultyVisitDetail: React.FC<FacultyVisitDetailProps> = ({
  experienceId,
  initialTab = 'overview',
  onBack,
  onEdit,
  onPreview,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'confirmed' | 'waitlist' | 'attendance' | 'announcements' | 'emails' | 'documents' | 'reports'
  >(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Experience and Roster Data
  const [experience, setExperience] = useState<ExperienceWithMeta | null>(null);
  const [registeredStudents, setRegisteredStudents] = useState<
    Array<{
      student: StudentProfile;
      registration: any;
      boardingPass?: any;
      attendance?: AttendanceRecord;
      leave?: any;
    }>
  >([]);
  const [waitlistedStudents, setWaitlistedStudents] = useState<
    Array<{
      student: StudentProfile;
      waitlist: any;
      registration?: any;
    }>
  >([]);

  // Search & Filters for Confirmed Students
  const [confirmedSearch, setConfirmedSearch] = useState('');
  const [confirmedBranchFilter, setConfirmedBranchFilter] = useState('ALL');
  const [confirmedStatusFilter, setConfirmedStatusFilter] = useState('ALL');

  // Search for Waitlist
  const [waitlistSearch, setWaitlistSearch] = useState('');

  // Selected student for detail modal
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<{
    student: StudentProfile;
    isWaitlisted: boolean;
    waitlistPosition?: number;
    registeredInfo?: any;
  } | null>(null);

  // Attendance State
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes: string }>
  >({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSaveMessage, setAttendanceSaveMessage] = useState<string | null>(null);
  const [issuingCerts, setIssuingCerts] = useState(false);
  const [certMessage, setCertMessage] = useState<string | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [attSearch, setAttSearch] = useState('');
  const [attBranchFilter, setAttBranchFilter] = useState('ALL');
  const [attYearFilter, setAttYearFilter] = useState('ALL');
  const [attStatusFilter, setAttStatusFilter] = useState('ALL');

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annAudience, setAnnAudience] = useState<'ALL' | 'CONFIRMED_ONLY' | 'WAITLISTED_ONLY'>('ALL');
  const [sendingAnn, setSendingAnn] = useState(false);
  const [annSuccessMessage, setAnnSuccessMessage] = useState<string | null>(null);

  // Email Transmissions & Trip Reminder State
  const [tripEmailLogs, setTripEmailLogs] = useState<EmailNotification[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);

  const loadVisitData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Roster & Experience
      const roster = await api.getExperienceRoster(experienceId);
      if (!roster) {
        throw new Error(`Industrial visit ID "${experienceId}" not found in database.`);
      }

      setExperience(roster.experience as ExperienceWithMeta);

      const registered = (roster.registered || (roster as any).confirmed || []).map((item: any) => {
        const studentObj = item.student || item;
        const studentId = studentObj?.studentId || item.studentId || item.id || 'UNKNOWN';
        
        if (!studentObj || !studentObj.name) {
          console.warn(`[FacultyVisitDetail] Student profile missing or incomplete for registration ID: ${item.registrationId || item.id}, studentRef: ${studentId}`);
        }

        return {
          ...item,
          student: {
            studentId,
            userId: studentObj?.userId || '',
            name: studentObj?.name || 'Student Information Unavailable',
            email: studentObj?.email || 'N/A',
            branch: studentObj?.branch || 'N/A',
            year: studentObj?.year || 1,
            semester: studentObj?.semester || 1,
            division: studentObj?.division || 'A',
            department: studentObj?.department || 'N/A',
            cgpa: studentObj?.cgpa || 0,
            phone: studentObj?.phone || '',
            prn: studentObj?.prn || studentId,
          },
          registration: item.registration || {
            id: item.registrationId || item.id,
            status: item.registrationStatus || item.status || 'REGISTERED',
            registeredAt: item.registeredAt || new Date().toISOString(),
          },
          boardingPass: item.boardingPass || (item.boardingPassNumber ? { passNumber: item.boardingPassNumber, status: item.boardingPassStatus } : undefined),
          attendance: item.attendance || (item.attendanceStatus ? { status: item.attendanceStatus } : undefined),
          leave: item.leave,
        };
      });

      const waitlisted = (roster.waitlisted || roster.waitlist || []).map((item: any, idx: number) => {
        const studentObj = item.student || item;
        const studentId = studentObj?.studentId || item.studentId || 'UNKNOWN';

        if (!studentObj || !studentObj.name) {
          console.warn(`[FacultyVisitDetail] Student profile missing or incomplete for waitlist entry ID: ${item.id}, studentRef: ${studentId}`);
        }

        return {
          ...item,
          student: {
            studentId,
            userId: studentObj?.userId || '',
            name: studentObj?.name || 'Student Information Unavailable',
            email: studentObj?.email || 'N/A',
            branch: studentObj?.branch || 'N/A',
            year: studentObj?.year || 1,
            semester: studentObj?.semester || 1,
            division: studentObj?.division || 'A',
            department: studentObj?.department || 'N/A',
            cgpa: studentObj?.cgpa || 0,
            phone: studentObj?.phone || '',
            prn: studentObj?.prn || studentId,
          },
          waitlist: item.waitlist || {
            id: item.id || `wait_${idx}`,
            position: item.position || idx + 1,
            joinedAt: item.joinedAt || new Date().toISOString(),
            status: item.status || 'ACTIVE',
          },
        };
      });

      setRegisteredStudents(registered);
      setWaitlistedStudents(waitlisted);

      // Initialize Attendance Map from existing records
      const initialAttendance: Record<string, { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes: string }> = {};
      registered.forEach((item) => {
        const sId = item.student.studentId;
        const currentAtt = item.attendance;
        const recordedStatus = currentAtt?.status as ('PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') | undefined;
        initialAttendance[sId] = {
          status: recordedStatus || 'PRESENT', // default to PRESENT
          notes: currentAtt?.notes || '',
        };
      });
      setAttendanceMap(initialAttendance);

      // 2. Fetch Announcements & Email Logs
      try {
        const [anns, emails] = await Promise.all([
          api.getExperienceAnnouncements(experienceId),
          api.getEmailLogs({ tripId: experienceId }),
        ]);
        setAnnouncements(anns || []);
        setTripEmailLogs(emails || []);
      } catch (err) {
        console.warn('Could not load announcements/email logs:', err);
      }
    } catch (err: any) {
      console.error('Failed to load visit details:', err);
      setError(err.message || 'Failed to load visit management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitData();
  }, [experienceId]);

  // Attendance Actions
  const handleToggleAttendance = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    const updated: Record<string, { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes: string }> = {};
    registeredStudents.forEach((item) => {
      const sId = item.student.studentId;
      updated[sId] = {
        status,
        notes: attendanceMap[sId]?.notes || '',
      };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      setAttendanceSaveMessage(null);

      const records = registeredStudents.map((item) => ({
        studentId: item.student.studentId,
        status: attendanceMap[item.student.studentId]?.status || 'PRESENT',
        notes: attendanceMap[item.student.studentId]?.notes || '',
      }));

      await api.markAttendance(experienceId, records);
      setAttendanceSaveMessage('Attendance recorded and confirmed in database.');
      setTimeout(() => setAttendanceSaveMessage(null), 4000);
      await loadVisitData();
    } catch (err: any) {
      alert(`Failed to save attendance: ${err.message}`);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleIssueCertificates = async () => {
    try {
      setIssuingCerts(true);
      setCertMessage(null);
      const res = await api.issueCertificates(experienceId);
      setCertMessage(`Successfully generated ${res.count} participation certificates!`);
      setTimeout(() => setCertMessage(null), 5000);
    } catch (err: any) {
      alert(`Failed to issue certificates: ${err.message}`);
    } finally {
      setIssuingCerts(false);
    }
  };

  // Broadcast Announcement
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    try {
      setSendingAnn(true);
      setAnnSuccessMessage(null);
      await api.createAnnouncement(experienceId, annTitle, annMessage, annAudience);
      setAnnTitle('');
      setAnnMessage('');
      const targetLabel = annAudience === 'CONFIRMED_ONLY' ? 'confirmed students' : annAudience === 'WAITLISTED_ONLY' ? 'waitlisted students' : 'all students';
      setAnnSuccessMessage(`Official notice dispatched as in-app notification and email to ${targetLabel}.`);
      setTimeout(() => setAnnSuccessMessage(null), 5000);
      const [updatedAnns, updatedEmails] = await Promise.all([
        api.getExperienceAnnouncements(experienceId),
        api.getEmailLogs({ tripId: experienceId }),
      ]);
      setAnnouncements(updatedAnns || []);
      setTripEmailLogs(updatedEmails || []);
    } catch (err: any) {
      alert(`Failed to broadcast announcement: ${err.message}`);
    } finally {
      setSendingAnn(false);
    }
  };

  // Dispatch 24-Hour Trip Reminder
  const handleSendTripReminders = async () => {
    if (!window.confirm(`Are you sure you want to dispatch a 24-Hour Visit Reminder to all confirmed students enrolled in ${experience?.organization || 'this trip'}?`)) {
      return;
    }
    try {
      setSendingReminders(true);
      setReminderMessage(null);
      const res = await api.sendTripReminders(experienceId);
      setReminderMessage(`Trip reminder dispatched to ${res.count} confirmed student(s) via email and in-app notifications.`);
      const updatedEmails = await api.getEmailLogs({ tripId: experienceId });
      setTripEmailLogs(updatedEmails || []);
      setTimeout(() => setReminderMessage(null), 6000);
    } catch (err: any) {
      alert(`Failed to dispatch reminders: ${err.message}`);
    } finally {
      setSendingReminders(false);
    }
  };

  // Retry Failed Email for this trip
  const handleRetryTripEmail = async (id: string) => {
    try {
      setRetryingEmailId(id);
      await api.retryEmailLog(id);
      const updatedEmails = await api.getEmailLogs({ tripId: experienceId });
      setTripEmailLogs(updatedEmails || []);
    } catch (err: any) {
      alert(`Failed to retry email: ${err.message}`);
    } finally {
      setRetryingEmailId(null);
    }
  };

  // Export Roster CSV
  const handleExportCSV = (type: 'confirmed' | 'waitlist' | 'attendance') => {
    if (!experience) return;

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (type === 'confirmed') {
      headers = [
        'Roll No / Student ID',
        'Student Name',
        'Email',
        'Phone',
        'Branch',
        'Year',
        'Division',
        'CGPA',
        'Boarding Pass No',
        'Registration Status',
        'Attendance Status',
      ];
      rows = registeredStudents.map((item) => [
        item.student.studentId,
        `"${item.student.name}"`,
        item.student.email,
        item.student.phone || '',
        `"${item.student.branch}"`,
        String(item.student.year),
        item.student.division || 'A',
        String(item.student.cgpa || '8.5'),
        item.boardingPass?.passNumber || `VIT-BP-2026-${item.student.studentId.slice(-5)}`,
        item.registration?.status || 'REGISTERED',
        item.attendance?.status || 'NOT_MARKED',
      ]);
      filename = `${experience.organization.replace(/\s+/g, '_')}_Confirmed_Roster.csv`;
    } else if (type === 'waitlist') {
      headers = [
        'Queue Position',
        'Roll No / Student ID',
        'Student Name',
        'Email',
        'Phone',
        'Branch',
        'Year',
        'Division',
        'CGPA',
        'Joined Timestamp',
        'Waitlist Status',
      ];
      rows = waitlistedStudents.map((item, idx) => [
        `#${idx + 1}`,
        item.student.studentId,
        `"${item.student.name}"`,
        item.student.email,
        item.student.phone || '',
        `"${item.student.branch}"`,
        String(item.student.year),
        item.student.division || 'A',
        String(item.student.cgpa || '8.5'),
        item.waitlist?.joinedAt || new Date().toISOString(),
        item.waitlist?.status || 'ACTIVE',
      ]);
      filename = `${experience.organization.replace(/\s+/g, '_')}_Waitlist_Queue.csv`;
    } else if (type === 'attendance') {
      headers = [
        'Roll No / Student ID',
        'Student Name',
        'Branch',
        'Division',
        'Attendance Status',
        'Coordinator Remarks',
      ];
      rows = registeredStudents.map((item) => {
        const sId = item.student.studentId;
        return [
          sId,
          `"${item.student.name}"`,
          `"${item.student.branch}"`,
          item.student.division || 'A',
          attendanceMap[sId]?.status || item.attendance?.status || 'PRESENT',
          `"${attendanceMap[sId]?.notes || ''}"`,
        ];
      });
      filename = `${experience.organization.replace(/\s+/g, '_')}_Attendance_Verification.csv`;
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable Sheet
  const handlePrintSheet = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
        <p className="text-xs text-slate-500 mt-3 font-medium">
          Loading visit management console & student records...
        </p>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-rose-900">Unable to load visit details</h3>
          <p className="text-xs text-rose-700 mt-1">{error || 'Experience not found or unauthorized.'}</p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assigned Visits</span>
        </button>
      </div>
    );
  }

  // Filtered confirmed list
  const filteredConfirmed = registeredStudents.filter((item) => {
    const s = item.student;
    const matchSearch =
      !confirmedSearch ||
      s.name.toLowerCase().includes(confirmedSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(confirmedSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(confirmedSearch.toLowerCase());

    const matchBranch = confirmedBranchFilter === 'ALL' || s.branch === confirmedBranchFilter;
    const attStatus = item.attendance?.status || 'NOT_MARKED';
    const matchStatus = confirmedStatusFilter === 'ALL' || attStatus === confirmedStatusFilter;

    return matchSearch && matchBranch && matchStatus;
  });

  // Filtered waitlist
  const filteredWaitlist = waitlistedStudents.filter((item) => {
    const s = item.student;
    return (
      !waitlistSearch ||
      s.name.toLowerCase().includes(waitlistSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(waitlistSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(waitlistSearch.toLowerCase())
    );
  });

  // Unique branches for filter
  const branchList = Array.from(new Set(registeredStudents.map((r) => r.student.branch)));

  // Attendance metrics calculation
  const totalConfirmedCount = registeredStudents.length;
  const presentCount = Object.values(attendanceMap).filter(
    (a) => (a as { status: string }).status === 'PRESENT'
  ).length;
  const absentCount = Object.values(attendanceMap).filter(
    (a) => (a as { status: string }).status === 'ABSENT'
  ).length;
  const attendancePercentage =
    totalConfirmedCount > 0 ? Math.round((presentCount / totalConfirmedCount) * 100) : 0;

  const availableSeatsCount = Math.max(0, experience.capacity - totalConfirmedCount);

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation & Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2545] hover:text-[#133E87] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assigned Visits</span>
        </button>

        <div className="flex items-center gap-2">
          {onPreview && (
            <button
              onClick={() => onPreview(experience)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              title="Preview Student Experience View"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Preview</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(experience)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              title="Edit Visit Details"
            >
              <Edit className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={handleSendTripReminders}
            disabled={sendingReminders || totalConfirmedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            title="Dispatch 24-hour reminder email and push notification to all confirmed students"
          >
            <BellRing className={`h-3.5 w-3.5 text-amber-700 ${sendingReminders ? 'animate-bounce' : ''}`} />
            <span>{sendingReminders ? 'Dispatching Reminders...' : 'Send 24h Reminder'}</span>
          </button>

          <button
            onClick={() => handleExportCSV('confirmed')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      {/* Reminder Message Alert */}
      {reminderMessage && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-center justify-between gap-2 text-xs font-bold text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-amber-700 flex-shrink-0" />
            <span>{reminderMessage}</span>
          </div>
          <button onClick={() => setReminderMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* 2. Main Visit Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 shadow-xs">
              <CompanyImage
                src={experience.image}
                alt={experience.title}
                companyName={experience.organization}
                logoSrc={experience.organizationLogo}
                aspectRatio="square"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                  {experience.experienceType || 'Industrial Visit'}
                </span>
                <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  {experience.organizationIndustry || 'Industrial Engineering'}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                    experience.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : experience.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-800 border-slate-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {experience.status}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {experience.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                  {experience.organization}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {experience.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {experience.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {experience.time || experience.travelInfo?.reportingTime || '08:00 AM'} (
                  {experience.duration || 'Full Day'})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto flex-shrink-0">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Capacity
              </span>
              <span className="text-base font-black text-slate-900">{experience.capacity}</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Confirmed
              </span>
              <span className="text-base font-black text-emerald-800">{totalConfirmedCount}</span>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2545] block">
                Available Seats
              </span>
              <span className="text-base font-black text-[#0B2545]">{availableSeatsCount}</span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Waitlist
              </span>
              <span className="text-base font-black text-amber-900">{waitlistedStudents.length}</span>
            </div>
          </div>
        </div>

        {/* 3. Tab Bar Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'confirmed'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Confirmed Students</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === 'confirmed'
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-slate-200 text-slate-700 font-semibold'
              }`}
            >
              {totalConfirmedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('waitlist')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'waitlist'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Waitlist Queue</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === 'waitlist'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 text-amber-900 font-semibold'
              }`}
            >
              {waitlistedStudents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Announcements</span>
            {announcements.length > 0 && (
              <span className="rounded-full bg-blue-100 text-[#0B2545] px-1.5 py-0.2 text-[10px] font-semibold">
                {announcements.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'emails'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email Logs</span>
            {tripEmailLogs.length > 0 && (
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-semibold">
                {tripEmailLogs.length}
              </span>
            )}
          </button>

          <button
            id="faculty-visit-tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4 text-amber-500" />
            <span>Reports</span>
          </button>

          <button
            id="faculty-visit-tab-documents"
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-[#0B2545] text-[#0B2545] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Documents & Exports</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content Panels */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Details & Highlights & Directives */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. What You'll Experience */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  What You'll Experience
                </h2>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-900 uppercase tracking-wide">
                  {experience.experienceType || 'Industrial Visit'}
                </span>
              </div>

              {/* Title & Short Description Banner */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 block">
                  {experience.experienceType}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {experience.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {experience.shortDescription ||
                    experience.detailedDescription ||
                    'Comprehensive experiential industrial visit structured for engineering students.'}
                </p>
              </div>

              {/* Numbered Highlights */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Visit Highlights & Key Observations
                </h4>
                {((experience.experienceHighlights && experience.experienceHighlights.length > 0) ||
                  (experience.whatYouWillLearn && experience.whatYouWillLearn.length > 0)) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(experience.experienceHighlights && experience.experienceHighlights.length > 0
                      ? experience.experienceHighlights
                      : experience.whatYouWillLearn.map((item) => ({ title: item, description: '' }))
                    ).map((highlight: any, idx: number) => {
                      const titleText = typeof highlight === 'string' ? highlight : highlight.title || highlight.description || '';
                      const descText = typeof highlight === 'object' && highlight.description && highlight.description !== highlight.title ? highlight.description : '';
                      return (
                        <div
                          key={idx}
                          className="rounded-xl bg-white border border-slate-200 p-3.5 flex items-start gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="h-6 w-6 rounded-lg bg-[#0B2545] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            {idx + 1}
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-900 leading-snug block">
                              {titleText}
                            </span>
                            {descText && (
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {descText}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500">
                    Experience highlights and live plant observation areas will be briefed by the faculty coordinator.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Why This Visit Is Worth Attending */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-600" />
                Why This Visit Is Worth Attending
              </h2>

              {((experience.whyWorthAttending && experience.whyWorthAttending.length > 0) ||
                (experience.whyAttend && experience.whyAttend.length > 0)) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(experience.whyWorthAttending && experience.whyWorthAttending.length > 0
                    ? experience.whyWorthAttending
                    : experience.whyAttend || []
                  ).map((reason: any, idx: number) => {
                    const text = typeof reason === 'string' ? reason : reason.title || reason.text || JSON.stringify(reason);
                    return (
                      <div
                        key={idx}
                        className="rounded-xl bg-emerald-50/40 border border-emerald-100 p-3.5 flex items-start gap-2.5 text-xs text-slate-800"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">{text}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500">
                  Direct exposure to live engineering infrastructure, domain interactions, and institutional certification upon completion.
                </div>
              )}
            </div>

            {/* 3. Key Academic Competencies & Outcomes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#0B2545]" />
                Key Academic Competencies & Outcomes
              </h2>

              {((experience.academicCompetencies && experience.academicCompetencies.length > 0) ||
                (experience.learningObjectives && experience.learningObjectives.length > 0) ||
                (experience.learningOutcomes && experience.learningOutcomes.length > 0)) ? (
                <div className="space-y-2.5">
                  {(experience.academicCompetencies && experience.academicCompetencies.length > 0
                    ? experience.academicCompetencies
                    : experience.learningObjectives && experience.learningObjectives.length > 0
                    ? experience.learningObjectives
                    : experience.learningOutcomes || []
                  ).map((obj: any, i: number) => {
                    const text = typeof obj === 'string' ? obj : obj.title || obj.description || String(obj);
                    return (
                      <div
                        key={i}
                        className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 flex items-start gap-2.5 text-xs text-slate-800"
                      >
                        <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{text}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500">
                  Practical domain knowledge transfer mapped to curriculum learning standards.
                </div>
              )}
            </div>

            {/* Travel & Transit Logistics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Bus className="h-4 w-4 text-[#0B2545]" />
                Travel & Logistics Protocol
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Reporting Time & Assembly Point
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {experience.travelInfo?.reportingTime || '07:30 AM'} —{' '}
                    {experience.travelInfo?.pickupLocation || experience.travelInfo?.reportingLocation || 'Main Gate / Bus Bay'}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Campus entry verification starts 15 mins prior
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Transit Coach Allocation
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {experience.travelInfo?.busNumber || 'University AC Coach #4'} (
                    {experience.travelInfo?.mode || experience.travelInfo?.transport || 'Deluxe Bus'})
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Return ETA: {experience.travelInfo?.returnTime || experience.travelInfo?.campusArrival || '06:30 PM'}
                  </span>
                </div>
              </div>

              {/* Company Location Section */}
              <CompanyLocationSection experience={experience} />
            </div>

            {/* 5. Plant Rules & Safety Directives */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Plant Rules & Safety Directives
              </h2>

              {((experience.safetyDirectives && experience.safetyDirectives.length > 0) ||
                (experience.rules && experience.rules.length > 0) ||
                (experience.safetyGuidelines && experience.safetyGuidelines.length > 0) ||
                (experience.safetyInfo?.importantRules && experience.safetyInfo.importantRules.length > 0)) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(experience.safetyDirectives && experience.safetyDirectives.length > 0
                    ? experience.safetyDirectives
                    : experience.rules && experience.rules.length > 0
                    ? experience.rules
                    : experience.safetyGuidelines && experience.safetyGuidelines.length > 0
                    ? experience.safetyGuidelines
                    : experience.safetyInfo?.importantRules || []
                  ).map((rule: string, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-amber-50/50 border border-amber-200/80 p-3 flex items-start gap-2.5 text-xs text-amber-950"
                    >
                      <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{rule}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="rounded-lg bg-amber-50/40 border border-amber-200 p-3 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Strictly adhere to plant supervisor and safety protocols at all times</span>
                  </div>
                  <div className="rounded-lg bg-rose-50/40 border border-rose-200 p-3 flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>No photography or unauthorized recording in secure manufacturing/R&D areas</span>
                  </div>
                </div>
              )}

              {/* Safety Protocol Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Mandatory Dress Code:</strong>
                  <p className="text-[11px] text-slate-600">
                    {experience.safetyInfo?.dressCode || 'Formal attire. Full trousers and closed leather/safety shoes required.'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Required Gear & Credentials:</strong>
                  <p className="text-[11px] text-slate-600">
                    {experience.safetyInfo?.requiredGear || 'Physical College ID Card and verified Boarding Pass.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Eligibility & Summary & Dossier */}
          <div className="space-y-6">
            {/* 4. Student Requirements & Eligibility Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#0B2545]" />
                Student Requirements & Eligibility
              </h2>

              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Eligible Departments / Streams
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {experience.eligibility?.allowedBranches &&
                    experience.eligibility.allowedBranches.length > 0 ? (
                      experience.eligibility.allowedBranches.map((b, i) => (
                        <span
                          key={i}
                          className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                        >
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-slate-600">
                        Open to all engineering streams
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Target Academic Years
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {experience.eligibility?.allowedYears &&
                      experience.eligibility.allowedYears.length > 0
                        ? experience.eligibility.allowedYears.map(y => `Year ${y}`).join(', ')
                        : 'Year 2, 3, 4'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Minimum CGPA
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {experience.eligibility?.minCgpa
                        ? `${experience.eligibility.minCgpa.toFixed(1)} / 10.0`
                        : '6.5 / 10.0'}
                    </span>
                  </div>
                </div>

                {/* Student Requirements List */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Student Requirements
                  </span>
                  {((experience.studentRequirements && experience.studentRequirements.length > 0) ||
                    (experience.requirements && experience.requirements.length > 0)) ? (
                    <ul className="space-y-1 text-xs text-slate-700">
                      {(experience.studentRequirements && experience.studentRequirements.length > 0
                        ? experience.studentRequirements
                        : experience.requirements || []
                      ).map((req, ridx) => (
                        <li key={ridx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-500">Standard college identification and compliance required.</span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Registration & Cancellation Deadline
                  </span>
                  <span className="text-xs font-bold text-rose-700">
                    {experience.registrationDeadline
                      ? formatISTDateTime(experience.registrationDeadline)
                      : 'Open until filled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinator Dossier */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="h-4 w-4 text-[#0B2545]" />
                Faculty Coordinator In-Charge
              </h2>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  {experience.primaryFaculty?.name || 'Prof. Faculty Coordinator'}
                  {experience.additionalFaculty && experience.additionalFaculty.length > 0 && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-2">+{experience.additionalFaculty.length} More</span>}
                </div>
                <div className="text-[11px] text-slate-600">
                  {experience.primaryFaculty?.department || 'School of Computer Science & Engineering'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  ID: {experience.primaryFaculty?.facultyId || experience.primaryFacultyId || 'FAC-1001'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONFIRMED STUDENTS */}
      {activeTab === 'confirmed' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-4 p-6">
          {/* Header Row & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Confirmed Student Cohort ({registeredStudents.length})
              </h2>
              <p className="text-xs text-slate-500">
                Students with confirmed seats and issued electronic boarding passes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV('confirmed')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrintSheet}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Print Roster</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={confirmedSearch}
                onChange={(e) => setConfirmedSearch(e.target.value)}
                placeholder="Search confirmed students by name, roll number, or email..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={confirmedBranchFilter}
                onChange={(e) => setConfirmedBranchFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#0B2545] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {branchList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={confirmedStatusFilter}
                onChange={(e) => setConfirmedStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#0B2545] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Attendance Status</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="NOT_MARKED">Not Marked</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredConfirmed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              {registeredStudents.length === 0
                ? 'No students have confirmed registrations for this visit yet.'
                : 'No confirmed students match the current search / branch filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Branch & Dept</th>
                    <th className="px-4 py-3">Year / Div</th>
                    <th className="px-4 py-3">Boarding Pass #</th>
                    <th className="px-4 py-3">Consent</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredConfirmed.map((item, index) => {
                    const s = item.student;
                    const passNo =
                      item.boardingPass?.passNumber || `VIT-BP-2026-${s.studentId.slice(-5)}`;
                    const attStatus = item.attendance?.status || 'NOT_MARKED';

                    return (
                      <tr key={s.id || s.studentId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setSelectedStudentForModal({
                                student: s,
                                isWaitlisted: false,
                                registeredInfo: item,
                              })
                            }
                            className="text-left font-bold text-slate-900 hover:text-[#0B2545] cursor-pointer"
                          >
                            {s.name}
                          </button>
                          <span className="block text-[10px] text-slate-400 truncate max-w-[180px]">
                            {s.email}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                          {s.studentId}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate" title={s.branch}>
                          {s.branch}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          Year {s.year} (Div {s.division || 'A'})
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-800">
                          {passNo}
                        </td>
                        {/* Consent Document Status */}
                        <td className="px-4 py-3">
                          {item.registration?.consentDocumentUrl || (s as any).consentDocumentUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                const docUrl = item.registration?.consentDocumentUrl || (s as any).consentDocumentUrl;
                                const win = window.open();
                                if (win && docUrl) {
                                  win.document.write(`
                                    <html>
                                      <head><title>Parent Consent Form - ${s.name}</title></head>
                                      <body style="margin:0; background:#1e293b; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                                        <img src="${docUrl}" style="max-width:90%; max-height:90vh; box-shadow:0 10px 25px rgba(0,0,0,0.5); border-radius:8px;" alt="Consent Form" />
                                      </body>
                                    </html>
                                  `);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Click to view signed consent form"
                            >
                              <span>Verified Form</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              <span>Verified</span>
                            </span>
                          )}
                        </td>
                        {/* Attendance Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              attStatus === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : attStatus === 'ABSENT'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {attStatus === 'NOT_MARKED' ? 'Registered' : attStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              setSelectedStudentForModal({
                                student: s,
                                isWaitlisted: false,
                                registeredInfo: item,
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                          >
                            View Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WAITLIST QUEUE */}
      {activeTab === 'waitlist' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-4 p-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Waitlist Queue ({waitlistedStudents.length})
              </h2>
              <p className="text-xs text-slate-500">
                First-In, First-Out (FIFO) candidate queue. Automatic seat escalation is triggered upon
                cancellations.
              </p>
            </div>

            <button
              onClick={() => handleExportCSV('waitlist')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Waitlist CSV</span>
            </button>
          </div>

          {/* FIFO Explanation Notice */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Info className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-amber-900">Automatic FIFO Queue Promotion</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                If a confirmed student withdraws or has their leave approved, Candidate{' '}
                <strong>#1</strong> in the queue is automatically converted to Confirmed status with a
                QR boarding pass generated immediately.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={waitlistSearch}
              onChange={(e) => setWaitlistSearch(e.target.value)}
              placeholder="Search waitlisted students..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
            />
          </div>

          {/* Table */}
          {filteredWaitlist.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              {waitlistedStudents.length === 0
                ? 'There are currently no students on the waitlist for this visit.'
                : 'No waitlisted students match your search criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Queue Position</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Year / Div</th>
                    <th className="px-4 py-3">Joined Queue</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredWaitlist.map((item, index) => {
                    const s = item.student;
                    const joinedTime = item.waitlist?.joinedAt
                      ? new Date(item.waitlist.joinedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently';

                    return (
                      <tr key={s.id || s.studentId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px]">
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setSelectedStudentForModal({
                                student: s,
                                isWaitlisted: true,
                                waitlistPosition: index + 1,
                                registeredInfo: item,
                              })
                            }
                            className="text-left font-bold text-slate-900 hover:text-[#0B2545] cursor-pointer"
                          >
                            {s.name}
                          </button>
                          <span className="block text-[10px] text-slate-400 truncate max-w-[180px]">
                            {s.email}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                          {s.studentId}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.branch}</td>
                        <td className="px-4 py-3 text-slate-600">
                          Year {s.year} (Div {s.division || 'A'})
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{joinedTime}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            Active Queue
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              setSelectedStudentForModal({
                                student: s,
                                isWaitlisted: true,
                                waitlistPosition: index + 1,
                                registeredInfo: item,
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                          >
                            View Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MARK ATTENDANCE */}
      {activeTab === 'attendance' && (() => {
        const attPresentCount = registeredStudents.filter(
          (r) => attendanceMap[r.student.studentId]?.status === 'PRESENT'
        ).length;
        const attLateCount = registeredStudents.filter(
          (r) => attendanceMap[r.student.studentId]?.status === 'LATE'
        ).length;
        const attExcusedCount = registeredStudents.filter(
          (r) => attendanceMap[r.student.studentId]?.status === 'EXCUSED'
        ).length;
        const attAbsentCount = registeredStudents.filter(
          (r) => attendanceMap[r.student.studentId]?.status === 'ABSENT'
        ).length;
        const attAttendedCount = attPresentCount + attLateCount;
        const attTurnoutRate =
          totalConfirmedCount > 0
            ? Math.round((attAttendedCount / totalConfirmedCount) * 100)
            : 0;

        // Unique branches in registered students
        const attBranches = Array.from(
          new Set(registeredStudents.map((r) => r.student.branch).filter(Boolean))
        ).sort();

        // Filtered attendance list
        const filteredAttStudents = registeredStudents.filter((item) => {
          const s = item.student;
          if (attSearch.trim()) {
            const q = attSearch.toLowerCase();
            const match =
              s.name.toLowerCase().includes(q) ||
              s.studentId.toLowerCase().includes(q) ||
              (s.prn && s.prn.toLowerCase().includes(q)) ||
              s.branch.toLowerCase().includes(q);
            if (!match) return false;
          }
          if (attBranchFilter !== 'ALL' && s.branch !== attBranchFilter) return false;
          if (attYearFilter !== 'ALL' && String(s.year) !== attYearFilter) return false;
          if (attStatusFilter !== 'ALL') {
            const currentStatus = attendanceMap[s.studentId]?.status || 'PRESENT';
            if (currentStatus !== attStatusFilter) return false;
          }
          return true;
        });

        return (
          <div className="space-y-6">
            {/* Top Attendance Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Confirmed
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {totalConfirmedCount}
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Present
                </span>
                <span className="text-2xl font-black text-emerald-800 mt-1 block">
                  {attPresentCount}
                </span>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Late
                </span>
                <span className="text-2xl font-black text-amber-800 mt-1 block">
                  {attLateCount}
                </span>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2545] block">
                  Excused
                </span>
                <span className="text-2xl font-black text-[#0B2545] mt-1 block">
                  {attExcusedCount}
                </span>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                  Absent
                </span>
                <span className="text-2xl font-black text-rose-800 mt-1 block">
                  {attAbsentCount}
                </span>
              </div>

              <div className="rounded-2xl border border-[#0B2545]/20 bg-[#0B2545]/5 p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2545] block">
                  Turnout Rate
                </span>
                <span className="text-2xl font-black text-[#0B2545] mt-1 block">
                  {attTurnoutRate}%
                </span>
              </div>
            </div>

            {/* Actions & Filters Toolbar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mark Attendance</h2>
                  <p className="text-xs text-slate-500">
                    Verify student physical onboarding, update statuses, and synchronize official records.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="scan-qr-attendance-btn"
                    type="button"
                    onClick={() => setShowScanModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#0B2545] bg-[#0B2545] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#133A6B] transition-colors cursor-pointer shadow-2xs"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Scan Boarding Passes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('PRESENT')}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('ABSENT')}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    Mark All Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('attendance')}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={attSearch}
                    onChange={(e) => setAttSearch(e.target.value)}
                    placeholder="Search by student name, roll number, PRN..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={attBranchFilter}
                    onChange={(e) => setAttBranchFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Branches ({attBranches.length})</option>
                    {attBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={attYearFilter}
                    onChange={(e) => setAttYearFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Academic Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Attendance Status Alert Messages */}
              {attendanceSaveMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{attendanceSaveMessage}</span>
                </div>
              )}

              {certMessage && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-2 text-xs font-bold text-[#0B2545]">
                  <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span>{certMessage}</span>
                </div>
              )}

              {/* Roster Attendance Table */}
              {filteredAttStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  {registeredStudents.length === 0
                    ? 'No confirmed students registered for this visit.'
                    : 'No students matched the active search or filter.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-10 text-center">#</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Roll Number</th>
                        <th className="px-4 py-3">Branch & Div</th>
                        <th className="px-4 py-3 text-center">Year</th>
                        <th className="px-4 py-3 text-center">Registration</th>
                        <th className="px-4 py-3 text-center min-w-[260px]">Attendance Status</th>
                        <th className="px-4 py-3">Faculty Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAttStudents.map((item, index) => {
                        const s = item.student;
                        const sId = s.studentId;
                        const entry = attendanceMap[sId] || { status: 'PRESENT', notes: '' };
                        const currentStatus = entry.status;
                        const currentNotes = entry.notes;

                        return (
                          <tr key={sId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-400 font-mono">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900 block">{s.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                BP: {item.boardingPass?.passNumber || `VIT-BP-2026-${sId.slice(-5)}`}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                              {sId}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {s.branch} (Div {s.division || 'A'})
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-700">
                              Yr {s.year}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                {item.registrationStatus || item.registration?.status || 'CONFIRMED'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(sId, 'PRESENT')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                    currentStatus === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  PRESENT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(sId, 'LATE')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                    currentStatus === 'LATE'
                                      ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  LATE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(sId, 'EXCUSED')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                    currentStatus === 'EXCUSED'
                                      ? 'bg-[#0B2545] text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  EXCUSED
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(sId, 'ABSENT')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                    currentStatus === 'ABSENT'
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  ABSENT
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={currentNotes}
                                onChange={(e) => handleNotesChange(sId, e.target.value)}
                                placeholder="Optional remarks (e.g. late arrival, lab report)..."
                                className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bottom Finalize Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-600">
                  <span>
                    Present/Attended: <strong>{attAttendedCount}</strong> / {totalConfirmedCount} (
                    {attTurnoutRate}% verified attendance)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={issuingCerts}
                    onClick={handleIssueCertificates}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Award className="h-4 w-4 text-amber-700" />
                    <span>{issuingCerts ? 'Issuing...' : 'Issue Certificates'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingAttendance}
                    onClick={handleSaveAttendance}
                    className="rounded-lg bg-[#0B2545] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>{savingAttendance ? 'Saving Records...' : 'Save Attendance'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Compose Announcement */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="space-y-1 border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4 text-[#0B2545]" />
                  Broadcast Notice
                </h2>
                <p className="text-xs text-slate-500">
                  Broadcasts instant in-app alerts and sends transactional emails directly to registered student inboxes.
                </p>
              </div>

              {annSuccessMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{annSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleSendAnnouncement} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Target Audience</label>
                  <select
                    value={annAudience}
                    onChange={(e) => setAnnAudience(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">
                      All Students (Confirmed + Waitlist) ({totalConfirmedCount + waitlistedStudents.length})
                    </option>
                    <option value="CONFIRMED_ONLY">
                      Confirmed Students Only ({totalConfirmedCount})
                    </option>
                    <option value="WAITLISTED_ONLY">
                      Waitlisted Students Only ({waitlistedStudents.length})
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Bus Bay #3 Allocated / Safety Shoes Mandatory"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Notice Content</label>
                  <textarea
                    required
                    rows={4}
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    placeholder="Provide reporting instructions, dress code updates, or required documents..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                  />
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5 text-[11px] text-[#0B2545] flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  <span>Dispatches dual in-app & verified SMTP email alerts</span>
                </div>

                <button
                  type="submit"
                  disabled={sendingAnn}
                  className="w-full rounded-lg bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>{sendingAnn ? 'Broadcasting...' : 'Broadcast Notice to Cohort'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right: Previous Announcements */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Broadcast History ({announcements.length})
                </h2>
                <span className="text-xs text-slate-400">Logged in audit trail</span>
              </div>

              {announcements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No announcements broadcasted for this industrial visit yet. Use the form to send the
                  first notice.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xs font-bold text-slate-900">{ann.title}</h3>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          {new Date(ann.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {ann.message}
                      </p>
                      <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-2">
                        <span>Issued by: <strong>{ann.authorName || 'Faculty Coordinator'}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Delivered via In-App & Email</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EMAIL DELIVERY LOGS */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MailCheck className="h-4 w-4 text-[#0B2545]" />
                  <span>Transactional Email Deliveries for {experience.organization}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete ledger of registration confirmations, waitlist promotions, schedule shifts, cancellations, and trip reminders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const emails = await api.getEmailLogs({ tripId: experienceId });
                    setTripEmailLogs(emails || []);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {tripEmailLogs.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl">
                <Mail className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No email records for this visit yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Emails triggered by registrations, waitlist promotions, or announcements will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Event Type</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tripEmailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                            {log.eventType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{log.recipientName || 'Student'}</div>
                          <div className="font-mono text-[11px] text-slate-500">{log.recipientEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 truncate max-w-sm">{log.subject}</div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {log.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Delivered</span>
                            </span>
                          ) : log.status === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="h-3 w-3 text-rose-600" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>In Transit</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {log.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryTripEmail(log.id)}
                              disabled={retryingEmailId === log.id}
                              className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              {retryingEmailId === log.id ? 'Retrying...' : 'Retry Email'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <PostTripReportsManager role="FACULTY" initialExperienceId={experienceId} />
        </div>
      )}

      {/* TAB 7: DOCUMENTS & EXPORTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Confirmed Roster Export */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0B2545] flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Confirmed Student Roster</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Complete student ledger with roll numbers, contact details, boarding pass numbers, and
                  academic standings.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV('confirmed')}
                className="w-full rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download CSV (.csv)</span>
              </button>
            </div>

            {/* Waitlist Queue Export */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Waitlist Queue Dossier</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chronological list of waitlisted applicants with exact timestamp of entry and FIFO queue
                  positions.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV('waitlist')}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Download Waitlist CSV</span>
              </button>
            </div>

            {/* Official Verification Sheet */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Official Attendance Sheet</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Institutional attendance sheet with signature columns for bus departure, plant entrance,
                  and return sign-off.
                </p>
              </div>
              <button
                onClick={handlePrintSheet}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Print Signature Sheet</span>
              </button>
            </div>
          </div>

          {/* Student Post-Trip Reports Section */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0B2545]" />
              <span>Student Post-Trip Reports & Photo Gallery for this Visit</span>
            </h3>
            <PostTripReportsManager role="FACULTY" initialExperienceId={experienceId} />
          </div>
        </div>
      )}

      {/* Student Dossier Modal */}
      {selectedStudentForModal && (
        <StudentDetailModal
          student={selectedStudentForModal.student}
          experienceTitle={experience.title}
          isWaitlisted={selectedStudentForModal.isWaitlisted}
          waitlistPosition={selectedStudentForModal.waitlistPosition}
          onClose={() => setSelectedStudentForModal(null)}
        />
      )}

      {/* QR Scanner Attendance Modal */}
      {showScanModal && (
        <ScanQRModal
          isOpen={showScanModal}
          experienceId={experienceId}
          onClose={() => setShowScanModal(false)}
          onScanSuccess={(studentId, msg) => {
            setAttendanceSaveMessage(msg);
            loadVisitData();
          }}
          onScanError={(msg) => console.warn('[QR Scan Error]:', msg)}
        />
      )}
    </div>
  );
};
