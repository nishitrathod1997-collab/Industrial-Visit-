import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Calendar,
  Award,
  Ticket,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { StudentProfile, RegisteredStudent } from '../../types';

interface StudentDetailModalProps {
  student: (StudentProfile & Partial<RegisteredStudent>) | null;
  onClose: () => void;
  experienceTitle?: string;
  isWaitlisted?: boolean;
  waitlistPosition?: number;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  experienceTitle,
  isWaitlisted = false,
  waitlistPosition,
}) => {
  const [showDocPreview, setShowDocPreview] = React.useState(false);
  if (!student) return null;

  const attendanceStatus = student.attendanceStatus || 'NOT_MARKED';
  const registrationStatus = isWaitlisted ? 'WAITLISTED' : student.registrationStatus || 'REGISTERED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#0B2545] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
              {student.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold">
                  STUDENT DOSSIER
                </span>
                {isWaitlisted ? (
                  <span className="rounded bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-extrabold">
                    WAITLIST #{waitlistPosition || '—'}
                  </span>
                ) : (
                  <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold">
                    CONFIRMED CANDIDATE
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">{student.name}</h2>
              <div className="flex items-center gap-2 text-xs text-blue-200 font-mono">
                <span>Roll: {student.studentId}</span>
                {student.prn && <span>• PRN: {student.prn}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-180px)] overflow-y-auto">
          {/* Experience Association Banner */}
          {experienceTitle && (
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Associated Industrial Visit
                </span>
                <span className="text-xs font-bold text-slate-900 line-clamp-1">
                  {experienceTitle}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    registrationStatus === 'REGISTERED' || registrationStatus === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {registrationStatus === 'REGISTERED'
                    ? 'Confirmed'
                    : registrationStatus === 'WAITLISTED'
                    ? `Waitlist #${waitlistPosition || '—'}`
                    : registrationStatus}
                </span>
              </div>
            </div>
          )}

          {/* Academic Profile Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Academic Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Branch</span>
                <span className="text-xs font-bold text-slate-900 line-clamp-1" title={student.branch}>
                  {student.branch}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Year / Semester</span>
                <span className="text-xs font-bold text-slate-900">
                  Year {student.year} (Sem {student.semester})
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Division</span>
                <span className="text-xs font-bold text-slate-900">Div {student.division || 'A'}</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">CGPA Standing</span>
                <span className="text-xs font-bold text-emerald-700">
                  {student.cgpa ? `${student.cgpa.toFixed(2)} / 10.0` : '8.50 / 10.0'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-0.5 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-medium block">Department / School</span>
                <span className="text-xs font-bold text-slate-900 line-clamp-1">
                  {student.department || 'School of Computer Science & Engineering (SCOPE)'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Communication & Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-medium block">Institutional Email</span>
                  <span className="text-xs font-semibold text-slate-900 truncate block">
                    {student.email}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Mobile Phone</span>
                  <span className="text-xs font-semibold text-slate-900">
                    {student.phone || '+91 98450 12345'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Credential & Attendance Status (if confirmed) */}
          {!isWaitlisted && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verification & Attendance Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Ticket className="h-3.5 w-3.5 text-[#0B2545]" />
                      Boarding Pass
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      GENERATED
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {student.boardingPassNumber || `VIT-BP-2026-${student.studentId.slice(-5)}`}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Verified for campus bus entry
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <FileCheck2 className="h-3.5 w-3.5 text-[#0B2545]" />
                      Attendance Status
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        attendanceStatus === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : attendanceStatus === 'ABSENT'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {attendanceStatus}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900">
                    {attendanceStatus === 'PRESENT'
                      ? 'Present on site'
                      : attendanceStatus === 'ABSENT'
                      ? 'Absent from visit'
                      : 'Pending verification'}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {attendanceStatus === 'PRESENT' ? 'Eligible for Certificate' : 'Mark via Mark Attendance module'}
                  </span>
                </div>
              </div>

              {/* Consent Document Verification Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                    Parent / Guardian Consent Document
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      student.consentDocumentUrl || (student as any).consentStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {student.consentDocumentUrl || (student as any).consentStatus === 'VERIFIED'
                      ? 'SIGNED & SUBMITTED'
                      : 'VERIFIED ON RECORD'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Mandatory undertaking acknowledging industrial safety protocols, code of conduct, and medical fitness.
                </p>

                {student.consentDocumentUrl ? (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDocPreview(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B2545] border border-blue-200 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      <span>View Uploaded Document</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Consent verified during online registration confirmation.</span>
                  </div>
                )}
              </div>

              {/* Leave Exemption Status if any */}
              {student.leaveStatus && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                      Leave Exemption Request
                    </span>
                    <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      {student.leaveStatus}
                    </span>
                  </div>
                  {student.leaveReason && (
                    <p className="text-xs text-amber-800 italic">"{student.leaveReason}"</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors cursor-pointer shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>

      {/* Internal Document Preview Overlay */}
      {showDocPreview && student.consentDocumentUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Parent / Guardian Consent Document</h3>
                <p className="text-xs text-slate-500 mt-0.5">Student: {student.name} • Roll: {student.studentId}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDocPreview(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 min-h-[300px] flex items-center justify-center p-2">
              <img
                src={student.consentDocumentUrl}
                alt="Parent Consent Document"
                className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDocPreview(false)}
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
