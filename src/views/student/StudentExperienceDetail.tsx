import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ExperienceWithMeta, LeaveCategory, SupportingDocument } from '../../types';
import { CompanyImage } from '../../components/common/CompanyImage';
import {
  Building2,
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Bus,
  CheckCircle2,
  ArrowLeft,
  QrCode,
  FileText,
  Trash2,
  GraduationCap,
  Sparkles,
  Info,
  Check,
  Award,
  AlertCircle,
  IndianRupee,
  Phone,
  Mail,
  User,
  Compass,
  Star,
  CheckSquare,
  XCircle,
  X,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BoardingPassModal } from '../../components/common/BoardingPassModal';
import { LeaveRequestModal } from '../../components/common/LeaveRequestModal';
import { CancelModal } from '../../components/common/CancelModal';
import { ReviewRegistrationModal } from '../../components/common/ReviewRegistrationModal';
import { CertificateViewerModal } from '../../components/student/CertificateViewerModal';
import { CompanyLocationSection } from '../../components/common/CompanyLocationSection';
import { FeedbackModal } from '../../components/student/FeedbackModal';
import { PostTripReportModal } from '../../components/student/PostTripReportModal';
import { formatISTDateTime, isRegistrationDeadlinePassed } from '../../utils/dateUtils';

interface StudentExperienceDetailProps {
  experienceId: string;
  onBack: () => void;
  onRefreshStudent: () => void;
}

export const StudentExperienceDetail: React.FC<StudentExperienceDetailProps> = ({
  experienceId,
  onBack,
  onRefreshStudent,
}) => {
  const { student } = useAuth();
  const [experience, setExperience] = useState<ExperienceWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingConsent, setUploadingConsent] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportViewMode, setReportViewMode] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [experienceId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getExperienceById(experienceId);
      setExperience(data);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to load experience details' });
    } finally {
      setLoading(false);
    }
  };

  
  const handleUploadNewConsent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !experience) return;
    setUploadingConsent(true);
    setFeedbackMessage(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const res = await api.uploadConsentForm(experience.id, event.target?.result as string);
        if (res.consentStatus === 'VERIFIED' && res.status === 'REGISTERED') {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          setFeedbackMessage({
            type: 'success',
            text: 'Consent form verified successfully! Registration is now confirmed and Boarding Pass is active.',
          });
        } else if (res.consentStatus === 'REJECTED' || res.status === 'REJECTED' || !res.success) {
          setFeedbackMessage({
            type: 'error',
            text:
              res.rejectionReason ||
              res.consentRejectionReason ||
              res.validationResult?.reason ||
              res.message ||
              'Uploaded document could not be validated as a signed consent form.',
          });
        } else {
          setFeedbackMessage({
            type: 'success',
            text: 'Consent form uploaded for verification.',
          });
        }
        await loadDetails();
        onRefreshStudent();
      } catch (err: any) {
        setFeedbackMessage({ type: 'error', text: err.message || 'Upload failed' });
      } finally {
        setUploadingConsent(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmRegistration = async (consentDocumentUrl?: string) => {
    if (!experience) return;
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await api.registerForExperience(experience.id, consentDocumentUrl);
      setShowReviewModal(false);

      if (res.status === 'REGISTERED') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setFeedbackMessage({
          type: 'success',
          text: `Registration confirmed! Your official Boarding Pass has been generated.`,
        });
        // Immediately trigger the Boarding Pass / Ticket Modal
        setShowBoardingPass(true);
      } else if (res.status === 'REJECTED' || res.consentStatus === 'REJECTED') {
        setFeedbackMessage({
          type: 'error',
          text:
            res.consentValidationResult?.reason ||
            res.message ||
            'Consent form validation failed. Please upload a valid signed Parent/Guardian Consent Form.',
        });
      } else if (res.status === 'WAITLISTED') {
        setFeedbackMessage({
          type: 'success',
          text: `Placed at position #${res.waitlistEntry?.position || res.waitlistPosition || 1} on the waitlist. Automated promotion will trigger upon vacancy.`,
        });
      } else {
        setFeedbackMessage({
          type: 'success',
          text: res.message || 'Registration submitted.',
        });
      }
      await loadDetails();
      onRefreshStudent();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Registration failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!experience) return;
    try {
      const res = await api.cancelRegistration(experience.id);
      setFeedbackMessage({
        type: 'success',
        text: `Registration cancelled.${res.promoted ? ` Promoted next waitlisted student ${res.promoted.name}.` : ''}`,
      });
      await loadDetails();
      onRefreshStudent();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Cancellation failed' });
    }
  };

  const handleSubmitLeave = async (
    reason: string,
    category?: LeaveCategory,
    document?: SupportingDocument | null
  ) => {
    if (!experience) return;
    await api.submitLeaveRequest(experience.id, reason, category, document);
    setFeedbackMessage({
      type: 'success',
      text: 'Your leave application has been submitted to the faculty coordinator.',
    });
    await loadDetails();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center max-w-4xl mx-auto shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Loading detailed experience specification...</p>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center max-w-xl mx-auto shadow-xs">
        <p className="text-sm font-bold text-slate-900">Experience Not Found</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white hover:bg-[#133E87] cursor-pointer"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isConsentRejected =
    experience.userRegistration?.status === 'REJECTED' ||
    experience.userRegistration?.consentStatus === 'REJECTED';

  const isRegistered =
    (experience.userRegistration?.status === 'REGISTERED' ||
      experience.userRegistration?.status === 'COMPLETED') &&
    !isConsentRejected;

  const isWaitlisted =
    (experience.userWaitlistEntry?.status === 'ACTIVE' && !isRegistered && !isConsentRejected) ||
    experience.userRegistration?.status === 'WAITLISTED';

  const isCancelled =
    !isRegistered &&
    !isWaitlisted &&
    !isConsentRejected &&
    (experience.userRegistration?.status === 'CANCELLED' ||
      experience.userWaitlistEntry?.status === 'CANCELLED');

  const isEligible = experience.isEligible;
  const seatsOpen = experience.seatsRemaining > 0;
  const canWaitlist = !seatsOpen && experience.waitlistEnabled && experience.waitlistCount < experience.waitlistCapacity;
  const fee = (experience.contribution || 0) === 0 ? 'Free Visit' : `₹${experience.contribution}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation & Feedback */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0B2545] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Experiences</span>
        </button>
        <div className="text-xs text-slate-500 font-medium">
          Visit ID: <span className="font-mono text-slate-700">{experience.id}</span>
        </div>
      </div>

      {/* Alert Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-medium border flex items-center justify-between shadow-xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs underline font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Card with Company Visual Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Banner Graphic */}
        <div className="relative">
          <CompanyImage
            src={experience.image}
            alt={experience.title}
            companyName={experience.organization}
            logoSrc={experience.organizationLogo}
            aspectRatio="wide"
            className="rounded-t-2xl max-h-72"
          />
        </div>

        {/* Hero Meta & Action Header */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-[#0B2545]">
                  {experience.experienceType}
                </span>
                <span className="rounded bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {experience.organizationIndustry || (experience as any).industry || 'Industrial Technology'}
                </span>
                {isRegistered && (
                  <span className="rounded bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirmed Registration
                  </span>
                )}
                {isWaitlisted && (
                  <span className="rounded bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900 flex items-center gap-1 shadow-2xs">
                    <Clock className="h-3.5 w-3.5" />
                    Waitlisted #{experience.userWaitlistEntry?.position || 1} in Queue
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {experience.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Building2 className="h-4 w-4 text-[#0B2545]" />
                  <span>{experience.organization}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{experience.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{experience.date}</span>
                </div>
                {experience.registrationDeadline && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Reg Deadline: <strong className="text-slate-800">{formatISTDateTime(experience.registrationDeadline)}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <IndianRupee className="h-4 w-4 text-slate-400" />
                  <span>{fee}</span>
                </div>
              </div>
            </div>

            {/* Registration Action Box */}
            <div className="w-full lg:w-72 rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Batch Capacity</span>
                <span className="font-bold text-slate-900">
                  {experience.registeredCount} / {experience.capacity} Filled
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0B2545] h-full transition-all"
                  style={{ width: `${Math.min(100, (experience.registeredCount / experience.capacity) * 100)}%` }}
                />
              </div>

              {experience.waitlistEnabled && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Waitlist Queue:</span>
                  <span className="font-bold text-amber-800">
                    {experience.waitlistCount} / {experience.waitlistCapacity} slots
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {experience.status === 'COMPLETED' ? (
                  isRegistered ? (
                    <div className="space-y-3">
                      {/* Attendance Status Banner */}
                      {(() => {
                        const isAttended = experience.userAttendance?.status === 'PRESENT' || experience.userAttendance?.status === 'LATE';
                        const isAbsent = experience.userAttendance?.status === 'ABSENT';
                        const isAttendancePending = !experience.userAttendance || experience.userAttendance?.status === 'NOT_MARKED';

                        if (isAbsent) {
                          return (
                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 space-y-2">
                              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                                <XCircle className="h-4 w-4 text-rose-600" />
                                <span>✕ Marked Absent</span>
                              </div>
                              <p className="text-[11px] text-rose-700 leading-relaxed">
                                You were marked absent for this industrial visit and are not eligible to submit a post-trip report or receive a certificate.
                              </p>
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <span className="rounded-lg bg-white/80 border border-rose-200 p-2 text-center text-[10px] font-semibold text-rose-600">
                                  Certificate Unavailable
                                </span>
                                <span className="rounded-lg bg-white/80 border border-rose-200 p-2 text-center text-[10px] font-semibold text-rose-600">
                                  Report Unavailable
                                </span>
                              </div>
                            </div>
                          );
                        }

                        if (isAttendancePending) {
                          return (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2">
                              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span>Attendance Pending</span>
                              </div>
                              <p className="text-[11px] text-amber-700 leading-relaxed">
                                Your report and certificate will become available once attendance has been finalized by faculty.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs font-bold text-emerald-800">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>✓ Attendance Verified (Attended)</span>
                            </div>

                            {/* Post-Trip Report Action */}
                            {(() => {
                              const hasReport = Boolean(experience.userReport || experience.reportEligibility?.reportStatus === 'SUBMITTED');
                              if (hasReport) {
                                return (
                                  <button
                                    id="detail-view-report-btn"
                                    onClick={() => {
                                      setReportViewMode(true);
                                      setShowReportModal(true);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-900 transition-all shadow-xs cursor-pointer"
                                  >
                                    <FileCheck className="h-4 w-4 text-emerald-600" />
                                    <span>View Submitted Post-Trip Report & Photos</span>
                                  </button>
                                );
                              }
                              return (
                                <button
                                  id="detail-submit-report-btn"
                                  onClick={() => {
                                    setReportViewMode(false);
                                    setShowReportModal(true);
                                  }}
                                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B2545] hover:bg-[#133E87] px-4 py-2.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 text-amber-400" />
                                  <span>Submit Post-Trip Report & Photos</span>
                                </button>
                              );
                            })()}

                            {/* Certificate action */}
                            {experience.certificate ? (
                              <button
                                onClick={() => setShowCertModal(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all shadow-xs cursor-pointer"
                              >
                                <Award className="h-4 w-4 text-amber-600" />
                                <span>View Official Completion Certificate</span>
                              </button>
                            ) : (
                              <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                                Certificate Pending Generation
                              </span>
                            )}

                            {/* Feedback action */}
                            {experience.userFeedback ? (
                              <div
                                id={`detail-feedback-submitted-badge`}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50/60 border border-amber-200 p-2 text-xs font-semibold text-amber-900"
                              >
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                                <span>Feedback Recorded ({(experience.userFeedback.overallRating || experience.userFeedback.rating).toFixed(1)} ★)</span>
                              </div>
                            ) : (
                              <button
                                id="detail-give-feedback-btn"
                                onClick={() => setShowFeedbackModal(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 border border-amber-600 px-4 py-2 text-xs font-bold text-slate-950 transition-colors shadow-2xs cursor-pointer"
                              >
                                <Star className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
                                <span>Rate Experience</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => setShowBoardingPass(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                      >
                        <QrCode className="h-3.5 w-3.5 text-slate-500" />
                        <span>View Boarding Pass Record</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-slate-100 border border-slate-200 p-3 text-center text-xs font-bold text-slate-700">
                      Visit Completed & Archived
                    </div>
                  )
                ) : isConsentRejected ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 space-y-2.5 text-left">
                      <div className="flex items-start gap-2.5 text-rose-900">
                        <X className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold block text-rose-900">Consent Form Verification Failed</span>
                          <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                            {experience.userRegistration?.consentRejectionReason ||
                              'The uploaded file could not be verified as a valid signed Parent/Guardian Consent Form.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-rose-200/60 flex flex-col gap-2">
                        <input
                          type="file"
                          accept=".pdf, image/jpeg, image/png, image/jpg"
                          ref={fileInputRef}
                          onChange={handleUploadNewConsent}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={uploadingConsent}
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingConsent ? 'Validating Document...' : 'Re-upload Signed Consent Form'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReviewModal(true)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-rose-300 bg-white hover:bg-rose-50 rounded-lg text-[11px] font-semibold text-rose-800 transition-colors cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-rose-600" />
                          <span>Re-open Registration Modal</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 text-center">
                      Boarding Pass and attendance clearance cannot be issued until a valid signed consent form is approved.
                    </p>
                  </div>
                ) : isRegistered ? (
                  <div className="space-y-2">
                    {experience.userRegistration?.consentStatus === 'PENDING_VERIFICATION' && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 mb-2 flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-[11px] font-bold">Consent Status: Pending Verification</span>
                      </div>
                    )}
                    {experience.userRegistration?.consentStatus === 'VERIFIED' && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 mb-2 flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span className="text-[11px] font-bold">Consent Verified</span>
                      </div>
                    )}

                    <button
                      onClick={() => setShowBoardingPass(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-all shadow-xs cursor-pointer"
                    >
                      <QrCode className="h-4 w-4 text-amber-400" />
                      <span>View Official Boarding Pass</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <FileText className="h-3 w-3 text-slate-500" />
                        <span>Apply Leave</span>
                      </button>
                      {experience.canCancel === false || experience.registrationDeadlinePassed || isRegistrationDeadlinePassed(experience.registrationDeadline) ? (
                        <div
                          title="Cancellation is locked because the registration deadline has passed."
                          className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 cursor-not-allowed"
                        >
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>Cancellation Locked</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3 text-rose-600" />
                          <span>Cancel Visit</span>
                        </button>
                      )}
                    </div>
                    {(experience.canCancel === false || experience.registrationDeadlinePassed || isRegistrationDeadlinePassed(experience.registrationDeadline)) && (
                      <p className="text-[10px] text-slate-500 text-center">
                        Cancellation is no longer available because the deadline has passed.
                      </p>
                    )}
                  </div>
                ) : isWaitlisted ? (
                  <div className="space-y-2">
                    <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-300 text-center font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>WAITING LIST #{experience.userWaitlistEntry?.position || 1}</span>
                    </div>
                    {experience.canCancel === false || experience.registrationDeadlinePassed || isRegistrationDeadlinePassed(experience.registrationDeadline) ? (
                      <div className="rounded-lg bg-slate-100 border border-slate-200 p-2 text-center text-[11px] text-slate-600 font-medium">
                        Waitlist is frozen because the registration deadline has passed.
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] text-slate-500 text-center">
                          You are in queue at position #{experience.userWaitlistEntry?.position || 1}. You will be automatically promoted if a confirmed seat opens up before the deadline.
                        </p>
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="w-full rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Withdraw from Waitlist
                        </button>
                      </>
                    )}
                  </div>
                ) : isEligible ? (
                  (experience.registrationDeadlinePassed || experience.isRegistrationClosed || isRegistrationDeadlinePassed(experience.registrationDeadline)) ? (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full rounded-lg bg-slate-200 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>Registration Closed (Deadline Passed)</span>
                      </button>
                      <p className="text-[11px] text-slate-500 text-center">
                        The registration deadline for this visit passed on {formatISTDateTime(experience.registrationDeadline)}.
                      </p>
                    </div>
                  ) : seatsOpen ? (
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowReviewModal(true)}
                      className="w-full rounded-lg bg-[#0B2545] py-2.5 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                    >
                      {actionLoading ? 'Confirming...' : 'Register for Visit'}
                    </button>
                  ) : canWaitlist ? (
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowReviewModal(true)}
                      className="w-full rounded-lg bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                    >
                      {actionLoading ? 'Joining...' : 'Join Waitlist (Queue Free)'}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
                    >
                      Capacity Reached
                    </button>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-left">
                      <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs mb-1">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                        <span>Academic Ineligibility</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-snug">
                        {experience.eligibilityReason ||
                          (experience.eligibilityReasons && experience.eligibilityReasons[0]) ||
                          'You do not meet the academic criteria configured for this industrial visit.'}
                      </p>
                      {experience.eligibilityReasons && experience.eligibilityReasons.length > 1 && (
                        <ul className="mt-1.5 space-y-0.5 border-t border-rose-200/60 pt-1.5 text-[10.5px] text-rose-800 list-disc list-inside">
                          {experience.eligibilityReasons.slice(1, 3).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      disabled
                      className="w-full rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
                    >
                      Registration Restricted
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Travel & Departure Timing Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Reporting Time</span>
                <strong className="text-slate-900">{experience.travelInfo?.reportingTime || '07:30 AM'} sharp</strong>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Bus className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Transit Transport</span>
                <strong className="text-slate-900">{experience.travelInfo?.transport || (experience.travelInfo as any)?.busNumber || 'University AC Coach'}</strong>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-[#0B2545] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Departure Bay</span>
                <strong className="text-slate-900">{experience.travelInfo?.reportingLocation || 'VIT Main Gate — Bus Bay #3'}</strong>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Faculty In-Charge</span>
                <strong className="text-slate-900">{experience.primaryFaculty?.name || 'Dr. Arvind Swaminathan'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout (2 cols left, 1 col right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. What You'll Experience */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
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

            {/* Numbered Experience Highlights */}
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#0B2545]" />
              Key Academic Competencies & Outcomes
            </h2>

            {((experience.academicCompetencies && experience.academicCompetencies.length > 0) ||
              (experience.learningObjectives && experience.learningObjectives.length > 0) ||
              ((experience as any).learningOutcomes && (experience as any).learningOutcomes.length > 0)) ? (
              <div className="space-y-2.5">
                {(experience.academicCompetencies && experience.academicCompetencies.length > 0
                  ? experience.academicCompetencies
                  : experience.learningObjectives && experience.learningObjectives.length > 0
                  ? experience.learningObjectives
                  : (experience as any).learningOutcomes || []
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

          {/* 4. Student Requirements & Eligibility */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-[#0B2545]" />
                Institutional Eligibility Criteria & Requirements
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border flex items-center gap-1 ${
                  isEligible
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {isEligible ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>You Are Eligible</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Ineligible</span>
                  </>
                )}
              </span>
            </div>

            {/* Configured Criteria Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* 1. Branches / Disciplines */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 sm:col-span-2 lg:col-span-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Eligible Academic Branches / Disciplines
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {experience.eligibility?.allowedBranches && experience.eligibility.allowedBranches.length > 0 ? (
                    experience.eligibility.allowedBranches.map((branch, bidx) => {
                      const isStudentBranch = student?.branch === branch;
                      return (
                        <span
                          key={bidx}
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-all ${
                            isStudentBranch
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400'
                              : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
                          }`}
                        >
                          {branch} {isStudentBranch && '✓ (Your Branch)'}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs font-medium text-slate-600">Open to all Engineering departments</span>
                  )}
                </div>
              </div>

              {/* 2. Years */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Eligible Academic Years
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {experience.eligibility?.allowedYears && experience.eligibility.allowedYears.length > 0 ? (
                    experience.eligibility.allowedYears.map((year, yidx) => (
                      <span
                        key={yidx}
                        className={`rounded-md px-2.5 py-1 text-xs font-bold border ${
                          student?.year === year
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-white text-slate-800 border-slate-200 shadow-2xs'
                        }`}
                      >
                        Year {year} {student?.year === year && '✓'}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-bold text-slate-800">All Academic Years</span>
                  )}
                </div>
              </div>

              {/* 3. Semesters */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Eligible Semesters
                </span>
                <div className="flex flex-wrap gap-1">
                  {experience.eligibility?.allowedSemesters && experience.eligibility.allowedSemesters.length > 0 ? (
                    experience.eligibility.allowedSemesters.map((sem, sidx) => (
                      <span
                        key={sidx}
                        className={`rounded px-2 py-0.5 text-[11px] font-bold border ${
                          student?.semester === sem
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Sem {sem}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-slate-600">Semesters 1 - 8</span>
                  )}
                </div>
              </div>

              {/* 4. Divisions */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Eligible Class Divisions
                </span>
                <div className="flex flex-wrap gap-1">
                  {experience.eligibility?.allowedDivisions && experience.eligibility.allowedDivisions.length > 0 ? (
                    experience.eligibility.allowedDivisions.map((div, didx) => (
                      <span
                        key={didx}
                        className={`rounded px-2 py-0.5 text-[11px] font-bold border ${
                          student?.division === div
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Div {div}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-slate-600">Divisions A, B, C, D</span>
                  )}
                </div>
              </div>

              {/* 5. CGPA Threshold */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Academic CGPA Cutoff
                </span>
                <div className="text-xs font-bold text-slate-900">
                  {experience.eligibility?.minCgpa ? (
                    <span>Min {experience.eligibility.minCgpa.toFixed(1)} CGPA</span>
                  ) : (
                    <span className="text-slate-600 font-normal">No minimum CGPA required</span>
                  )}
                  {experience.eligibility?.maxCgpa && (
                    <span className="text-slate-500 font-normal ml-1">
                      (Up to {experience.eligibility.maxCgpa.toFixed(1)})
                    </span>
                  )}
                </div>
              </div>

              {/* 6. Backlog Policy */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Backlog Policy
                </span>
                <div className="text-xs font-bold text-slate-900">
                  {experience.eligibility?.backlogRule === 'NO_BACKLOGS' ? (
                    <span className="text-rose-700">Strictly 0 Active Backlogs</span>
                  ) : experience.eligibility?.backlogRule === 'MAX_BACKLOGS' ? (
                    <span>Max {experience.eligibility.maxAllowedBacklogs || 1} Active Backlogs Allowed</span>
                  ) : (
                    <span className="text-slate-600 font-normal">No Backlog Restrictions</span>
                  )}
                </div>
              </div>

              {/* 7. Attendance Requirement */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Attendance Mandate
                </span>
                <div className="text-xs font-bold text-slate-900">
                  {experience.eligibility?.minAttendancePercentage ? (
                    <span className="text-indigo-900">
                      Min {experience.eligibility.minAttendancePercentage}% Institutional Attendance
                    </span>
                  ) : (
                    <span className="text-slate-600 font-normal">Standard 75% attendance policy</span>
                  )}
                </div>
              </div>
            </div>

            {/* Personalized Verification Status Box */}
            {student && (
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  isEligible
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isEligible ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isEligible
                          ? 'Your Academic Profile Meets All Visit Criteria'
                          : 'Your Profile Does Not Meet All Criteria'}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Evaluated against {student.name} ({student.studentId || student.prn}) — {student.branch}, Year {student.year}, Sem {student.semester}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Criteria Pass/Fail Breakdown */}
                {experience.eligibilityDetails && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      {experience.eligibilityDetails.branchEligible ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-rose-600 font-bold" />
                      )}
                      <span className={experience.eligibilityDetails.branchEligible ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                        Branch Match
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {experience.eligibilityDetails.yearEligible ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-rose-600 font-bold" />
                      )}
                      <span className={experience.eligibilityDetails.yearEligible ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                        Year Match
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {experience.eligibilityDetails.cgpaEligible ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-rose-600 font-bold" />
                      )}
                      <span className={experience.eligibilityDetails.cgpaEligible ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                        CGPA ({student.cgpa || 0})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {experience.eligibilityDetails.backlogEligible ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-rose-600 font-bold" />
                      )}
                      <span className={experience.eligibilityDetails.backlogEligible ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                        Backlogs ({student.activeBacklogs ?? 0})
                      </span>
                    </div>
                  </div>
                )}

                {/* Specific Ineligibility Explanation */}
                {!isEligible && (experience.eligibilityReasons || experience.eligibilityReason) && (
                  <div className="bg-white/80 rounded-lg p-2.5 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800">
                      Reason for ineligibility:
                    </span>
                    {experience.eligibilityReasons && experience.eligibilityReasons.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {experience.eligibilityReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px]">{experience.eligibilityReason}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mandatory Student Requirements List */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Mandatory Student Requirements for Visit Entry
              </span>
              {((experience.studentRequirements && experience.studentRequirements.length > 0) ||
                (experience.requirements && experience.requirements.length > 0)) ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {(experience.studentRequirements && experience.studentRequirements.length > 0
                    ? experience.studentRequirements
                    : experience.requirements || []
                  ).map((req, ridx) => (
                    <li key={ridx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-1 text-xs text-slate-600">
                  <li>• Carry valid physical College ID card at all times</li>
                  <li>• Formal attire / prescribed college uniform</li>
                  <li>• Closed-toe shoes mandatory for site and plant floor access</li>
                </ul>
              )}
            </div>
          </div>

          {/* 5. Plant Rules & Safety Directives */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
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
                  <span>Strictly adhere to plant supervisor and faculty directives at all times</span>
                </div>
                <div className="rounded-lg bg-rose-50/40 border border-rose-200 p-3 flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>No mobile photography or audio recording in restricted production areas</span>
                </div>
              </div>
            )}

            {/* Safety Protocol Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs">Mandatory Dress Code:</strong>
                <p className="text-[11px] text-slate-600">
                  {experience.safetyInfo?.dressCode || 'Formal business attire. Full-length trousers and closed-toe leather/safety shoes required.'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs">Required Gear & Credentials:</strong>
                <p className="text-[11px] text-slate-600">
                  {experience.safetyInfo?.requiredGear || 'Physical College ID Card and verified Boarding Pass. PPE helmets provided on-site where required.'}
                </p>
              </div>
            </div>
          </div>

          {/* Minute-by-Minute Visual Timeline Schedule */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Visit Timeline & Schedule
            </h2>
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {experience.itinerary && experience.itinerary.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-3.5 pl-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0B2545] text-white text-[10px] font-bold z-10 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.activity}</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">{item.time}</span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Location Section */}
          <CompanyLocationSection experience={experience} />

          {/* Things to Know Before You Go (Safety & Dress Code) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Things to Know Before You Go (Safety & Protocols)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-1.5">
                <strong className="text-slate-900 block text-xs">Mandatory Dress Code:</strong>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {experience.safetyInfo?.dressCode || 'Formal or semi-formal academic dress code. Full-length trousers and closed leather/safety shoes required.'}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-1.5">
                <strong className="text-slate-900 block text-xs">Required Credentials & Gear:</strong>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {experience.safetyInfo?.requiredGear || 'Physical College ID Card and verified Boarding Pass. Safety helmet/goggles provided on-site.'}
                </p>
              </div>
            </div>

            {/* Dos & Don'ts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3 space-y-1.5 text-[11px]">
                <strong className="text-emerald-900 flex items-center gap-1 font-bold">
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                  Mandatory Protocols
                </strong>
                <ul className="space-y-1 text-slate-600">
                  <li>• Carry physical college identity card at all times</li>
                  <li>• Arrive at departure bay 15 mins before reporting time</li>
                  <li>• Stay with your assigned faculty coordinator</li>
                </ul>
              </div>

              <div className="rounded-lg bg-rose-50/50 border border-rose-100 p-3 space-y-1.5 text-[11px]">
                <strong className="text-rose-900 flex items-center gap-1 font-bold">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  Strict Restrictions
                </strong>
                <ul className="space-y-1 text-slate-600">
                  <li>• Strictly NO photography in proprietary testing labs</li>
                  <li>• No open slippers, sandals, or loose garments</li>
                  <li>• Unauthorized departure from site grounds is prohibited</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col: Company Info, Location, Eligibility, Faculty) */}
        <div className="space-y-6">
          {/* Company Information Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
              Company Information
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <p className="font-bold text-slate-900 text-sm">{experience.organization}</p>
                <span className="text-[11px] font-semibold text-slate-500">
                  {experience.organizationIndustry || (experience as any).industry || 'Engineering Pioneer'}
                </span>
              </div>

              {experience.companyInfo?.about && (
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {experience.companyInfo.about}
                </p>
              )}

              {experience.companyInfo?.headquarters && (
                <div className="flex justify-between py-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">HQ:</span>
                  <strong className="text-slate-800">{experience.companyInfo.headquarters}</strong>
                </div>
              )}

              {experience.companyInfo?.specialties && experience.companyInfo.specialties.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Key Specialties:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {experience.companyInfo.specialties.map((spec, sidx) => (
                      <span key={sidx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(experience.organizationWebsite || experience.companyInfo?.website) && (
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={experience.organizationWebsite || experience.companyInfo?.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#0B2545] font-bold text-[11px] hover:underline"
                  >
                    <span>Visit Official Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location & Directions Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#0B2545]" />
              Plant / Facility Location
            </h3>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-900">{experience.location}</p>
              {experience.address && (
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {experience.address}
                </p>
              )}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5 text-[11px] text-[#0B2545] font-medium">
                University transit provided from campus departure bay. No individual vehicles allowed.
              </div>
            </div>
          </div>

          {/* Academic Eligibility Matrix */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-[#0B2545]" />
              Academic Eligibility
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Allowed Branches:</span>
                <strong className="text-slate-900 text-right truncate max-w-[150px]">
                  {experience.eligibility?.allowedBranches ? experience.eligibility.allowedBranches.join(', ') : ((experience.eligibility as any)?.branches?.join(', ') || 'All Branches')}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Allowed Years:</span>
                <strong className="text-slate-900">
                  {experience.eligibility?.allowedYears ? experience.eligibility.allowedYears.map(y => `Year ${y}`).join(', ') : ((experience.eligibility as any)?.years?.join(', ') || 'All Years')}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Min. CGPA:</span>
                <strong className="text-slate-900">{experience.eligibility?.minCgpa || 7.0}</strong>
              </div>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-bold w-full justify-center ${
                  isEligible
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {isEligible ? '✓ You Meet All Eligibility Criteria' : '✗ Ineligible for current academic record'}
                </span>
              </div>
            </div>
          </div>

          {/* Faculty Coordinator Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#0B2545]" />
              Faculty Coordinator
            </h3>
            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-slate-900">{experience.primaryFaculty?.name || 'Dr. Arvind Swaminathan'}</p>
              <p className="text-slate-500 text-[11px] font-medium">Department of Computer Science & Engineering</p>
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{experience.primaryFaculty?.email || 'arvind.swaminathan@vit.edu.in'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{experience.primaryFaculty?.phone || '+91 98201 54321'}</span>
              </div>
            </div>
            
            {experience.additionalFaculty && experience.additionalFaculty.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Faculty</h4>
                <div className="space-y-3">
                  {experience.additionalFaculty.map(fac => (
                    <div key={fac.facultyId} className="text-xs">
                      <p className="font-bold text-slate-800">{fac.name}</p>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                        <Mail className="h-3 w-3" />
                        <span>{fac.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Registration Modal */}
      {showReviewModal && student && experience && (
        <ReviewRegistrationModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          experience={experience}
          student={student}
          onConfirm={handleConfirmRegistration}
          loading={actionLoading}
        />
      )}

      {/* Boarding Pass Modal */}
      {showBoardingPass && experience.userBoardingPass && student && (
        <BoardingPassModal
          isOpen={showBoardingPass}
          onClose={() => setShowBoardingPass(false)}
          boardingPass={experience.userBoardingPass}
          experience={experience}
          student={student}
        />
      )}

      {/* Certificate Modal */}
      {showCertModal && experience.certificate && student && (
        <CertificateViewerModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          certificate={experience.certificate}
          experience={experience}
          student={student}
        />
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <LeaveRequestModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          experience={experience}
          onSubmit={handleSubmitLeave}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && experience && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          experience={experience}
          onFeedbackSubmitted={(newFb) => {
            setExperience((prev) => (prev ? { ...prev, userFeedback: newFb } : null));
            setFeedbackMessage({
              type: 'success',
              text: 'Thank you! Your feedback has been recorded and submitted successfully.',
            });
            loadDetails();
            onRefreshStudent();
          }}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          experience={experience}
          isWaitlisted={isWaitlisted}
          onConfirm={handleCancelRegistration}
        />
      )}

      {/* Post-Trip Report & Photo Modal */}
      {showReportModal && experience && (
        <PostTripReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          experience={experience}
          initialViewMode={reportViewMode}
          onReportSubmitted={() => {
            loadDetails();
            onRefreshStudent();
          }}
        />
      )}
    </div>
  );
};
