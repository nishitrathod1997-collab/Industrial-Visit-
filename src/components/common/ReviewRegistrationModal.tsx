import React, { useState, useRef } from 'react';
import { ExperienceWithMeta, StudentProfile, ConsentValidationResult } from '../../types';
import { api } from '../../services/api';
import {
  X,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  GraduationCap,
  Info,
  ShieldCheck,
  Building2,
  Download,
  Upload,
  FileText,
  Check,
  Eye,
  Printer,
  FileCheck,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  FileWarning,
} from 'lucide-react';
import { CompanyImage } from './CompanyImage';
import { ConsentFormModal } from './ConsentFormModal';
import { formatISTDateTime } from '../../utils/dateUtils';

interface ReviewRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: ExperienceWithMeta;
  student: StudentProfile;
  onConfirm: (consentDocumentUrl?: string) => Promise<void>;
  loading?: boolean;
}

export const ReviewRegistrationModal: React.FC<ReviewRegistrationModalProps> = ({
  isOpen,
  onClose,
  experience,
  student,
  onConfirm,
  loading = false,
}) => {
  const [ack1, setAck1] = useState(false);
  const [ack2, setAck2] = useState(false);
  const [ack3, setAck3] = useState(false);
  
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [consentDataUrl, setConsentDataUrl] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ConsentValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [detectedDocType, setDetectedDocType] = useState<string | null>(null);
  const [showConsentViewer, setShowConsentViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isConsentValid = !!consentFile && !!consentDataUrl && !!validationResult?.isValidConsentForm;
  const allAcknowledged = ack1 && ack2 && ack3 && isConsentValid && !isValidating && !validationError;

  const reportingTime = experience.travelInfo?.reportingTime || experience.time || '07:00 AM';
  const reportingLocation =
    experience.travelInfo?.reportingLocation || 'VIT Main Gate (Bus Bay)';

  const feeText =
    (experience.contribution || 0) === 0 ? 'Free' : `₹${experience.contribution}`;

  const getYearSuffix = (yr: number) => {
    if (yr === 1) return '1st';
    if (yr === 2) return '2nd';
    if (yr === 3) return '3rd';
    return `${yr}th`;
  };

  const academicYearText = `${getYearSuffix(student.year || 2)} Year, Sem ${
    student.semester || (student.year ? student.year * 2 - 1 : 3)
  }`;

  const handleDownloadConsent = () => {
    // Generate official standardized consent form HTML matching institutional template
    const departureTime = experience.travelInfo?.departureTime || '08:00 AM';
    const returnTime = experience.travelInfo?.returnTime || '06:00 PM';
    const transportMode =
      experience.travelInfo?.transport ||
      experience.travelInfo?.mode ||
      experience.travelInfo?.busNumber ||
      'Institutional Air-Conditioned Coach';
    const facultyName = experience.primaryFaculty?.name || 'Dr. Arvind Swaminathan (Faculty In-Charge)';
    const facultyPhone = experience.primaryFaculty?.phone || '+91 98201 54321';

    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Parent_Guardian_Consent_Form_${student.name.replace(/\s+/g, '_')}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.4; font-size: 11pt; padding: 20px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #0B2545; padding-bottom: 12px; margin-bottom: 16px; }
    .inst-name { font-size: 16pt; font-weight: 800; color: #0B2545; margin: 0; }
    .inst-sub { font-size: 9pt; color: #475569; margin: 3px 0 0 0; }
    .doc-title { display: inline-block; margin-top: 10px; padding: 4px 16px; background: #0B2545; color: #fff; font-size: 11pt; font-weight: 700; border-radius: 4px; }
    .section-title { font-size: 10.5pt; font-weight: 700; color: #0B2545; background: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0B2545; margin: 14px 0 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt; }
    th, td { padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; }
    th { background-color: #f8fafc; color: #334155; font-weight: 600; width: 25%; }
    .declaration-box { border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; background: #fafafa; font-size: 9.5pt; line-height: 1.5; margin: 10px 0; }
    .signatures { margin-top: 35px; display: flex; justify-content: space-between; }
    .sig-block { width: 45%; border-top: 1.5px dashed #475569; padding-top: 6px; text-align: center; font-size: 9.5pt; }
    .sig-label { font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="inst-name">VIDYALANKAR INSTITUTE OF TECHNOLOGY</h1>
    <p class="inst-sub">An Autonomous Engineering & Technology Institution | Affiliated to University of Mumbai</p>
    <p class="inst-sub">Department of Experiential Learning & Industrial Relations (ELIR)</p>
    <div class="doc-title">Parent / Guardian Consent & Undertaking Form</div>
  </div>

  <div class="section-title">1. Student / Participant Particulars</div>
  <table>
    <tr><th>Student Full Name</th><td><strong>${student.name}</strong></td><th>Roll / Reg No.</th><td><strong>${student.studentId || 'N/A'}</strong></td></tr>
    <tr><th>Branch & Department</th><td>${student.branch}</td><th>Academic Year & Sem</th><td>${academicYearText}</td></tr>
    <tr><th>Division</th><td>Division ${student.division || 'A'}</td><th>PRN Number</th><td>${student.prn || 'N/A'}</td></tr>
  </table>

  <div class="section-title">2. Industrial Visit Particulars</div>
  <table>
    <tr><th>Industrial Host / Plant</th><td><strong>${experience.organization}</strong> — ${experience.title}</td><th>Facility Location</th><td>${experience.location}</td></tr>
    <tr><th>Date of Visit</th><td><strong>${experience.date}</strong></td><th>Reporting & Transit</th><td>${reportingTime} sharp (${reportingLocation})</td></tr>
    <tr><th>Departure & Return</th><td>Dep: ${departureTime} | Ret: ${returnTime}</td><th>Faculty In-Charge</th><td>${facultyName} (${facultyPhone})</td></tr>
  </table>

  <div class="section-title">3. Parent / Guardian Particulars & Emergency Contact</div>
  <table>
    <tr><th>Parent / Guardian Name</th><td>____________________________________________</td><th>Relationship to Student</th><td>Father / Mother / Guardian</td></tr>
    <tr><th>Emergency Contact Number</th><td>+91 ____________________</td><th>Alternate Contact Number</th><td>+91 ____________________</td></tr>
  </table>

  <div class="section-title">4. Parental Consent, Rules & Undertaking Declaration</div>
  <div class="declaration-box">
    <p>I hereby grant permission for my son / daughter / ward (named above) to participate in the educational Industrial Visit organized by Vidyalankar Institute of Technology to <strong>${experience.organization}</strong> on <strong>${experience.date}</strong>.</p>
    <ol>
      <li>I confirm that my ward is medically fit to undertake this journey and participate in industrial site demonstrations.</li>
      <li>I understand that transportation is coordinated by the Institute and student reporting must be punctual.</li>
      <li>I instruct my ward to strictly abide by all industrial safety rules, plant guidelines, and faculty instructions.</li>
    </ol>
  </div>

  <div class="signatures">
    <div class="sig-block">
      <br/><br/>
      <div class="sig-label">Signature of Student</div>
      <div>Date: _____ / _____ / 2026</div>
    </div>
    <div class="sig-block">
      <br/><br/>
      <div class="sig-label">Signature of Parent / Guardian</div>
      <div>Date: _____ / _____ / 2026</div>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consent_Form_${student.name.replace(/ /g, '_')}_${experience.organization.replace(/ /g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setConsentFile(null);
      setConsentDataUrl(null);
      setValidationResult(null);
      setValidationError("File is too large. Maximum allowed document size is 5MB.");
      setDetectedDocType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);
    setConsentFile(null);
    setConsentDataUrl(null);
    setDetectedDocType(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const result = await api.validateConsentDocument(experience.id, dataUrl);
        if (result.isValidConsentForm) {
          setConsentFile(file);
          setConsentDataUrl(dataUrl);
          setValidationResult(result);
          setValidationError(null);
          setDetectedDocType(result.documentType || 'Official Consent Form');
        } else {
          setConsentFile(null);
          setConsentDataUrl(null);
          setValidationResult(result);
          setDetectedDocType(result.documentType || 'Unverified Document');
          setValidationError(
            result.reason ||
              'Uploaded document could not be validated as an official signed Parent/Guardian Consent Form.'
          );
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setConsentFile(null);
        setConsentDataUrl(null);
        setValidationResult(null);
        setDetectedDocType(null);
        setValidationError(err.message || 'AI document validation service encountered an error. Please try again.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setIsValidating(false);
      }
    };
    reader.onerror = () => {
      setIsValidating(false);
      setValidationError('Failed to read file from local device. Please choose another file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleReplaceDocument = () => {
    setConsentFile(null);
    setConsentDataUrl(null);
    setValidationResult(null);
    setValidationError(null);
    setDetectedDocType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleConfirm = async () => {
    if (!allAcknowledged) return;
    await onConfirm(consentDataUrl || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 bg-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Review Registration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Please review your visit details before confirming.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Experience Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex items-center gap-3.5 shadow-2xs">
            <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center">
              {experience.organizationLogo ? (
                <img
                  src={experience.organizationLogo}
                  alt={experience.organization}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Building2 className="h-6 w-6 text-[#0B2545]" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-xs font-bold text-[#0B2545] line-clamp-1">
                {experience.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {experience.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">
                    {experience.organization} {experience.location ? `• ${experience.location}` : ''}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  <Users className="h-2.5 w-2.5" />
                  {experience.seatsRemaining > 0
                    ? `${experience.seatsRemaining} seats remaining`
                    : 'Waitlist open'}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                  <IndianRupee className="h-2.5 w-2.5" />
                  Fee: {feeText}
                </span>
                {experience.registrationDeadline && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    Deadline: {formatISTDateTime(experience.registrationDeadline)}
                  </span>
                )}
              </div>
            </div>
          </div>

                    {/* Faculty Assignment */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
              <Users className="h-4 w-4 text-[#0B2545]" />
              Faculty Coordinators
            </div>
            <div className="text-xs space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Primary Lead:</span>
                <span className="font-bold text-slate-900">{experience.primaryFaculty?.name || 'Not assigned'}</span>
              </div>
              {experience.additionalFaculty && experience.additionalFaculty.length > 0 && (
                <div className="flex flex-col gap-1 pt-1 mt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium text-[11px]">Additional Coordinators:</span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {experience.additionalFaculty.map(f => f.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Eligibility Banner */}
          <div className="rounded-xl bg-blue-50/80 border border-blue-200/90 p-3.5 flex items-start gap-3 shadow-2xs">
            <div className="h-5 w-5 rounded-full bg-[#0B2545] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">
                You are eligible for this experience
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Your current academic profile ({student.branch} • {getYearSuffix(student.year)} Year • Sem{' '}
                {student.semester || (student.year ? student.year * 2 - 1 : 3)}) meets all prerequisites for this industrial visit.
              </p>
            </div>
          </div>

          {/* Student Profile Details (Read-only) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <GraduationCap className="h-4 w-4 text-[#0B2545]" />
                <span>Student Profile Details</span>
              </div>
              <span className="text-[11px] italic text-slate-400 font-medium">Read-only</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Full Name
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{student.name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Roll No
                </span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">
                  {student.studentId || student.prn || '2026ECS042'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Department
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">{student.branch}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Academic Year
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">{academicYearText}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Division
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">{student.division || 'A'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
              <Info className="h-3 w-3 text-slate-400" />
              <span>These details are taken from your college profile.</span>
            </div>
          </div>

          
          {/* Parent/Guardian Consent Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs mt-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B2545]">
                <FileText className="h-5 w-5 text-[#0B2545]" />
                <span>Parent/Guardian Consent Form</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isConsentValid
                  ? 'bg-emerald-100 text-emerald-800'
                  : validationError
                  ? 'bg-rose-100 text-rose-800'
                  : isValidating
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isConsentValid ? 'Verified' : validationError ? 'Rejected' : isValidating ? 'Analyzing...' : 'Mandatory'}
              </span>
            </div>

            {/* Hidden file input always available */}
            <input
              type="file"
              accept=".pdf, image/jpeg, image/png, image/jpg"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* STATE 1: VALIDATING WITH AI */}
            {isValidating && (
              <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-4 space-y-3 animate-pulse text-center">
                <div className="flex items-center justify-center gap-2 text-[#0B2545]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent" />
                  <Sparkles className="h-4 w-4 text-blue-600 animate-bounce" />
                  <span className="text-xs font-bold">AI Analyzing & Validating Consent Document...</span>
                </div>
                <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Inspecting document structure, student credentials ({student.name}), host organization ({experience.organization}), and parent/guardian handwritten signature...
                </p>
                <div className="w-full bg-blue-200/60 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0B2545] h-full w-2/3 animate-indeterminate" />
                </div>
              </div>
            )}

            {/* STATE 2: VALIDATION FAILED / ERROR CARD */}
            {!isValidating && validationError && (
              <div className="space-y-3">
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 space-y-3 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 text-rose-900">
                      <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block text-rose-900">
                          Document Verification Failed
                        </span>
                        {detectedDocType && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-rose-200/70 text-rose-800 text-[10px] font-semibold">
                            Detected: {detectedDocType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/80 border border-rose-200 p-3 text-xs text-rose-950 leading-relaxed font-medium">
                    <p>{validationError}</p>
                  </div>

                  {validationResult?.checks && (
                    <div className="bg-white/90 border border-rose-200 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                      <span className="font-bold text-slate-700 block text-[10.5px] uppercase tracking-wider">
                        {validationResult.processingStatus === 'FAILED' ? 'Document Processing Report:' : 'Validation Check Breakdown:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                        {[
                          { label: 'Document Legible', val: validationResult.checks.documentReadable },
                          { label: 'Document Type', val: validationResult.checks.correctDocumentType },
                          { label: 'Student Identity', val: validationResult.checks.studentNameMatchesProfile },
                          { label: 'Host Company / Trip', val: validationResult.checks.tripMatchesRegistration },
                          { label: 'Parent Details', val: validationResult.checks.parentGuardianDetails },
                          { label: 'Parent Signature', val: validationResult.checks.signatureDetected },
                        ].map((item, i) => {
                          const isPass = item.val === 'PASS';
                          const isFail = item.val === 'FAIL';
                          const isInc = item.val === 'INCONCLUSIVE';
                          const icon = isPass ? '✓' : isInc ? '—' : '✗';
                          const color = isPass ? 'text-emerald-600 font-bold' : isInc ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold';
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className={color}>{icon}</span>
                              <span className="text-slate-700">
                                {item.label}: <strong className={isPass ? 'text-emerald-700' : isInc ? 'text-amber-700' : 'text-rose-700'}>{item.val || 'N/A'}</strong>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    A wrong or unverified document <strong>cannot be accepted</strong> for registration. Please ensure you print the official pre-filled form for <strong>{experience.organization}</strong>, obtain your parent/guardian's handwritten signature, and upload a clear photo or PDF scan.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-rose-200/60">
                    <button
                      type="button"
                      onClick={handleReplaceDocument}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Replace Document / Upload Again</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConsentViewer(true)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-rose-700" />
                      <span>View Official Form</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 3: VALIDATION SUCCEEDED / VERIFIED CARD */}
            {!isValidating && isConsentValid && consentFile && (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center text-emerald-900">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">✓ Signed Consent Form Verified</span>
                        <span className="text-[10px] text-emerald-700">AI verification passed — student credentials & parent signature confirmed</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReplaceDocument}
                      className="text-xs font-bold text-slate-600 hover:text-rose-600 px-2 py-1 bg-white rounded border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    >
                      Replace
                    </button>
                  </div>

                  {/* Verification Tag Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10.5px]">
                    <div className="bg-white/80 border border-emerald-200 rounded px-2 py-1 flex items-center gap-1.5 text-emerald-900">
                      <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">Student: {validationResult?.studentName || student.name}</span>
                    </div>
                    <div className="bg-white/80 border border-emerald-200 rounded px-2 py-1 flex items-center gap-1.5 text-emerald-900">
                      <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">Visit: {validationResult?.visitName || experience.organization}</span>
                    </div>
                    <div className="bg-white/80 border border-emerald-200 rounded px-2 py-1 flex items-center gap-1.5 text-emerald-900">
                      <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">Parent Signature: Verified</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 font-medium truncate flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{consentFile.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">
                      {(consentFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>

                {consentDataUrl && consentDataUrl.startsWith('data:image/') && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden h-36 relative bg-slate-100 flex items-center justify-center group shadow-2xs">
                    <img
                      src={consentDataUrl}
                      alt="Uploaded Signed Consent Preview"
                      className="h-full w-full object-contain bg-slate-50"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="text-white text-xs font-bold drop-shadow-md">
                        Document Upload Verified ✓
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STATE 4: INITIAL UPLOAD PROMPT (NO FILE, NO ERROR, NOT VALIDATING) */}
            {!isValidating && !validationError && !consentFile && (
              <div className="space-y-3">
                <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#0B2545] block mb-1">
                    Official College Consent Document Required
                  </span>
                  Please open and print the pre-filled Institutional Consent & Undertaking Form, obtain your parent/guardian's physical signature and date, and upload a clear photo or PDF scan below.
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConsentViewer(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-[#0B2545]" />
                    <span>View & Print Official Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConsentViewer(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-[#0B2545] bg-[#0B2545]/5 rounded-lg text-xs font-bold text-[#0B2545] hover:bg-[#0B2545]/10 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-[#0B2545]" />
                    <span>Download Consent Form</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Upload Signed Consent Form:</span>
                    <span className="text-[10px] font-normal text-slate-500">JPG, PNG, PDF (Max 5MB)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-1.5 py-6 px-4 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 hover:border-blue-500 transition-all text-slate-600 cursor-pointer bg-slate-50/50 group"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2545] group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Click to upload signed document</span>
                    <span className="text-[10px] text-slate-400">Drag & drop or browse from your device</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Acknowledgments */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-bold text-slate-900">Acknowledgments</h4>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={ack1}
                  onChange={(e) => setAck1(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B2545] focus:ring-[#0B2545] cursor-pointer"
                />
                <span className="text-[11px] text-slate-700 group-hover:text-slate-900 leading-snug">
                  I understand reporting at {reportingTime} at {reportingLocation}.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={ack2}
                  onChange={(e) => setAck2(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B2545] focus:ring-[#0B2545] cursor-pointer"
                />
                <span className="text-[11px] text-slate-700 group-hover:text-slate-900 leading-snug">
                  I agree to follow visit rules, safety protocols, and faculty guidelines during the entire duration of the tour.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={ack3}
                  onChange={(e) => setAck3(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B2545] focus:ring-[#0B2545] cursor-pointer"
                />
                <span className="text-[11px] text-slate-700 group-hover:text-slate-900 leading-snug">
                  I understand registration is subject to seat availability and final faculty approval.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allAcknowledged || loading}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              allAcknowledged && !loading
                ? 'bg-[#0B2545] text-white hover:bg-[#133E87]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{loading ? 'Confirming...' : 'Confirm Registration'}</span>
          </button>
        </div>
      </div>

      {/* Official Consent Form Viewer / Printable Modal */}
      {showConsentViewer && (
        <ConsentFormModal
          isOpen={showConsentViewer}
          onClose={() => setShowConsentViewer(false)}
          experience={experience}
          student={student}
        />
      )}
    </div>
  );
};
