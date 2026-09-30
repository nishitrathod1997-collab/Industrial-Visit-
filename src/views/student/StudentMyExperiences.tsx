import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ExperienceWithMeta, Certificate, ExperienceFeedback, LeaveCategory, SupportingDocument } from '../../types';
import {
  Calendar,
  Building2,
  Clock,
  QrCode,
  FileText,
  Trash2,
  ArrowRight,
  Compass,
  CheckCircle2,
  Award,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Star,
  MessageSquarePlus,
  Sparkles, Download,
} from 'lucide-react';
import { BoardingPassModal } from '../../components/common/BoardingPassModal';
import { LeaveRequestModal } from '../../components/common/LeaveRequestModal';
import { CancelModal } from '../../components/common/CancelModal';
import { CertificateViewerModal } from '../../components/student/CertificateViewerModal';
import { FeedbackModal } from '../../components/student/FeedbackModal';
import { PostTripReportModal } from '../../components/student/PostTripReportModal';
import { formatISTDateTime, isRegistrationDeadlinePassed } from '../../utils/dateUtils';

interface StudentMyExperiencesProps {
  onSelectExperience: (id: string) => void;
  onExploreClick: () => void;
}

export const StudentMyExperiences: React.FC<StudentMyExperiencesProps> = ({
  onSelectExperience,
  onExploreClick,
}) => {
  const { student } = useAuth();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'WAITLISTED' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [data, setData] = useState<{
    upcoming: ExperienceWithMeta[];
    waitlisted: ExperienceWithMeta[];
    completed: ExperienceWithMeta[];
    cancelled: ExperienceWithMeta[];
  }>({ upcoming: [], waitlisted: [], completed: [], cancelled: [] });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [studentFeedback, setStudentFeedback] = useState<ExperienceFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedExpForPass, setSelectedExpForPass] = useState<ExperienceWithMeta | null>(null);
  const [selectedExpForLeave, setSelectedExpForLeave] = useState<ExperienceWithMeta | null>(null);
  const [selectedExpForCancel, setSelectedExpForCancel] = useState<ExperienceWithMeta | null>(null);
  const [selectedCertExp, setSelectedCertExp] = useState<{ cert: Certificate; exp: ExperienceWithMeta } | null>(null);
  const [selectedExpForFeedback, setSelectedExpForFeedback] = useState<ExperienceWithMeta | null>(null);
  const [selectedExpForReport, setSelectedExpForReport] = useState<ExperienceWithMeta | null>(null);
  const [reportInitialViewMode, setReportInitialViewMode] = useState<boolean>(false);

  useEffect(() => {
    loadStudentExperiences();
  }, []);

  const loadStudentExperiences = async () => {
    setLoading(true);
    try {
      const [res, certs, fbList] = await Promise.all([
        api.getStudentExperiences(),
        api.getStudentCertificates().catch(() => []),
        api.getStudentFeedback().catch(() => []),
      ]);
      setData({
        upcoming: res?.upcoming || [],
        waitlisted: res?.waitlisted || [],
        completed: res?.completed || [],
        cancelled: res?.cancelled || [],
      });
      setCertificates(certs || []);
      setStudentFeedback(fbList || []);
    } catch (err) {
      console.error('Error loading my experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedExpForCancel) return;
    try {
      const res = await api.cancelRegistration(selectedExpForCancel.id);
      setToastMessage(
        res?.promoted
          ? `Registration cancelled. Seat reallocated to waitlisted student ${res.promoted.name}.`
          : 'Registration cancelled successfully.'
      );
      setTimeout(() => setToastMessage(null), 5000);
      await loadStudentExperiences();
    } catch (err: any) {
      console.error('Cancellation error:', err);
      setToastMessage(err?.message || 'Failed to cancel registration.');
      setTimeout(() => setToastMessage(null), 5000);
      throw err;
    }
  };

  const handleLeaveSubmit = async (
    reason: string,
    category?: LeaveCategory,
    document?: SupportingDocument | null
  ) => {
    if (!selectedExpForLeave) return;
    await api.submitLeaveRequest(selectedExpForLeave.id, reason, category, document);
    await loadStudentExperiences();
  };

  const handleFeedbackSubmitted = (newFb: ExperienceFeedback) => {
    setStudentFeedback((prev) => [...prev.filter((f) => f.experienceId !== newFb.experienceId), newFb]);
    setToastMessage('Thank you! Your experience feedback has been submitted successfully.');
    setTimeout(() => setToastMessage(null), 5000);
    loadStudentExperiences();
  };

  const upcomingList = data?.upcoming || [];
  const waitlistedList = data?.waitlisted || [];
  const completedList = data?.completed || [];
  const cancelledList = data?.cancelled || [];

  const currentList =
    activeTab === 'UPCOMING'
      ? upcomingList
      : activeTab === 'WAITLISTED'
      ? waitlistedList
      : activeTab === 'COMPLETED'
      ? completedList
      : cancelledList;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <div id="student-feedback-toast" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">✕</button>
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Registered Experiences</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your registered industrial visits, track waitlist status, submit verified feedback, and retrieve boarding passes and certificates
          </p>
        </div>

        <button
          onClick={onExploreClick}
          className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-xs cursor-pointer"
        >
          <Compass className="h-4 w-4" />
          <span>Explore New Visits</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'UPCOMING'
              ? 'border-[#0B2545] text-[#0B2545]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Upcoming & Confirmed</span>
          <span className="rounded bg-blue-100 text-[#0B2545] px-2 py-0.5 text-[10px] font-bold">
            {upcomingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('WAITLISTED')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'WAITLISTED'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Waitlisted</span>
          <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
            {waitlistedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'COMPLETED'
              ? 'border-emerald-600 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Completed Visits</span>
          <span className="rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold">
            {completedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CANCELLED'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Withdrawn / Cancelled</span>
          <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
            {cancelledList.length}
          </span>
        </button>
      </div>

      {/* List Area */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading your registrations...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Calendar className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 mt-2">No {activeTab.toLowerCase()} experiences found.</p>
          <p className="text-xs text-slate-500 mt-1">Browse the master catalog to register for industrial opportunities.</p>
          <button
            onClick={onExploreClick}
            className="mt-4 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white hover:bg-[#133E87] cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((exp) => {
            const cert = certificates.find((c) => c.experienceId === exp.id && c.status === 'ISSUED');
            const isAttended = exp.userAttendance?.status === 'PRESENT' || exp.userAttendance?.status === 'LATE';
            const isAbsent = exp.userAttendance?.status === 'ABSENT';
            const isAttendancePending = !exp.userAttendance || exp.userAttendance?.status === 'NOT_MARKED';

            return (
              <div
                key={exp.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#0B2545] hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4 flex-1">
                  {exp.organizationLogo ? (
                    <div className="h-12 w-12 rounded-lg bg-slate-100 p-1 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={exp.organizationLogo}
                        alt={exp.organization}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-[#0B2545] text-white flex-shrink-0 flex items-center justify-center font-black text-sm">
                      {exp.organization ? exp.organization.substring(0, 2).toUpperCase() : 'IV'}
                    </div>
                  )}

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-semibold text-[#0B2545]">
                        {exp.experienceType}
                      </span>
                      {activeTab === 'UPCOMING' && (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          Confirmed ✓
                        </span>
                      )}
                      {activeTab === 'WAITLISTED' && (
                        <span className="rounded bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                          Position #{exp.userWaitlistEntry?.position || 1} in Queue
                        </span>
                      )}
                      {activeTab === 'WAITLISTED' && (exp.registrationDeadlinePassed || isRegistrationDeadlinePassed(exp.registrationDeadline)) && (
                        <span className="rounded bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          Waitlist Frozen (Deadline Passed)
                        </span>
                      )}
                      {activeTab === 'UPCOMING' && (exp.registrationDeadlinePassed || isRegistrationDeadlinePassed(exp.registrationDeadline)) && (
                        <span className="rounded bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          Deadline Passed
                        </span>
                      )}
                      {activeTab === 'COMPLETED' && (
                        isAbsent ? (
                          <span className="rounded bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 flex items-center gap-1">
                            ✕ Absent
                          </span>
                        ) : isAttendancePending ? (
                          <span className="rounded bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" />
                            Attendance Pending
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ✓ Attended
                          </span>
                        )
                      )}
                      {exp.userBoardingPass && (
                        <span className="text-[11px] font-mono text-slate-500">
                          Pass #{exp.userBoardingPass.passNumber}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        onClick={() => onSelectExperience(exp.id)}
                        className="text-base font-bold text-slate-900 hover:text-[#0B2545] cursor-pointer truncate"
                      >
                        {exp.title}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-[#0B2545] flex-shrink-0" />
                        <span className="font-semibold text-slate-900">{exp.organization}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 truncate">{exp.location}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {exp.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Reporting: {exp.travelInfo?.reportingTime || '07:30 AM'}
                      </span>
                      {exp.travelInfo?.reportingLocation && (
                        <span>Bay: {exp.travelInfo.reportingLocation}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 flex-shrink-0">
                  {/* COMPLETED TAB ACTIONS (FEEDBACK + CERTIFICATES + REPORTS) */}
                  {activeTab === 'COMPLETED' && (
                    <>
                      {isAbsent ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            title="You were marked absent for this industrial visit and are not eligible to submit a post-trip report or receive a certificate."
                            className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                          >
                            Certificate Unavailable
                          </span>
                          <span
                            title="You were marked absent for this industrial visit and are not eligible to submit a post-trip report or receive a certificate."
                            className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                          >
                            Report Unavailable
                          </span>
                        </div>
                      ) : isAttendancePending ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            title="Your report and certificate will become available once attendance has been finalized."
                            className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                          >
                            Certificate Pending
                          </span>
                          <span
                            title="Your report and certificate will become available once attendance has been finalized."
                            className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                          >
                            Report Unavailable
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Student Feedback Button / Status Badge */}
                          {(() => {
                            const fb = studentFeedback.find((f) => f.experienceId === exp.id) || exp.userFeedback;
                            if (fb) {
                              return (
                                <div
                                  id={`feedback-submitted-badge-${exp.id}`}
                                  className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 shadow-2xs"
                                  title="Feedback has been submitted for this completed visit"
                                >
                                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                                  <span>Feedback ({(fb.overallRating || fb.rating).toFixed(1)} ★)</span>
                                </div>
                              );
                            }
                            return (
                              <button
                                id={`give-feedback-btn-${exp.id}`}
                                onClick={() => setSelectedExpForFeedback(exp)}
                                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 border border-amber-600 px-3.5 py-2 text-xs font-bold text-slate-950 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                <Star className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
                                <span>Give Feedback</span>
                              </button>
                            );
                          })()}

                          {/* Post-Trip Report Button / Status */}
                          {(() => {
                            const hasReport = Boolean(exp.userReport || exp.reportEligibility?.reportStatus === 'SUBMITTED');
                            if (hasReport) {
                              return (
                                <button
                                  id={`view-report-btn-${exp.id}`}
                                  onClick={() => {
                                    setSelectedExpForReport(exp);
                                    setReportInitialViewMode(true);
                                  }}
                                  className="flex items-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-900 transition-colors shadow-2xs cursor-pointer"
                                  title="View your submitted post-trip report & photos"
                                >
                                  <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>View Report</span>
                                </button>
                              );
                            }
                            return (
                              <button
                                id={`submit-report-btn-${exp.id}`}
                                onClick={() => {
                                  setSelectedExpForReport(exp);
                                  setReportInitialViewMode(false);
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] hover:bg-[#133E87] px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
                                title="Submit post-trip report and photo documentation"
                              >
                                <FileText className="h-3.5 w-3.5 text-amber-400" />
                                <span>Submit Report</span>
                              </button>
                            );
                          })()}

                          {/* Certificate */}
                          {cert ? (
                            <button
                              onClick={() => setSelectedCertExp({ cert, exp })}
                              className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
                            >
                              <Award className="h-3.5 w-3.5 text-amber-400" />
                              <span>View Certificate</span>
                            </button>
                          ) : (
                            <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                              Certificate Pending
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {activeTab === 'UPCOMING' && exp.userBoardingPass && (
                    <>
                    <button
                      onClick={() => setSelectedExpForPass(exp)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5 text-amber-400" />
                      <span>Boarding Pass</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedExpForPass(exp);
                        setTimeout(() => window.print(), 500);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer ml-2"
                      title="Download Ticket"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-200" />
                      <span className="hidden sm:inline">Ticket</span>
                    </button>
                    </>
                  )}

                  {activeTab === 'UPCOMING' && (
                    <button
                      onClick={() => setSelectedExpForLeave(exp)}
                      className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>Leave</span>
                    </button>
                  )}

                  {(activeTab === 'UPCOMING' || activeTab === 'WAITLISTED') && (
                    (exp.canCancel === false || exp.registrationDeadlinePassed || isRegistrationDeadlinePassed(exp.registrationDeadline)) ? (
                      <span
                        title="Cancellation is closed because the registration deadline has passed."
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedExpForCancel(exp)}
                        className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Cancel</span>
                      </button>
                    )
                  )}

                  <button
                    onClick={() => onSelectExperience(exp.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {selectedExpForFeedback && (
        <FeedbackModal
          isOpen={!!selectedExpForFeedback}
          onClose={() => setSelectedExpForFeedback(null)}
          experience={selectedExpForFeedback}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}

      {/* Certificate Modal */}
      {selectedCertExp && student && (
        <CertificateViewerModal
          isOpen={!!selectedCertExp}
          onClose={() => setSelectedCertExp(null)}
          certificate={selectedCertExp.cert}
          experience={selectedCertExp.exp}
          student={student}
        />
      )}

      {/* Post-Trip Report Modal */}
      {selectedExpForReport && (
        <PostTripReportModal
          isOpen={!!selectedExpForReport}
          onClose={() => setSelectedExpForReport(null)}
          experience={selectedExpForReport}
          student={student}
          initialViewMode={reportInitialViewMode}
          onReportSubmitted={() => {
            setToastMessage('Post-trip report and photos saved successfully!');
            setTimeout(() => setToastMessage(null), 5000);
            loadStudentExperiences();
          }}
        />
      )}

      {/* Boarding Pass Modal */}
      {selectedExpForPass && selectedExpForPass.userBoardingPass && student && (
        <BoardingPassModal
          isOpen={!!selectedExpForPass}
          onClose={() => setSelectedExpForPass(null)}
          boardingPass={selectedExpForPass.userBoardingPass}
          experience={selectedExpForPass}
          student={student}
        />
      )}

      {/* Leave Request Modal */}
      {selectedExpForLeave && (
        <LeaveRequestModal
          isOpen={!!selectedExpForLeave}
          onClose={() => setSelectedExpForLeave(null)}
          experience={selectedExpForLeave}
          onSubmit={handleLeaveSubmit}
        />
      )}

      {/* Cancel Modal */}
      {selectedExpForCancel && (
        <CancelModal
          isOpen={!!selectedExpForCancel}
          onClose={() => setSelectedExpForCancel(null)}
          experience={selectedExpForCancel}
          isWaitlisted={activeTab === 'WAITLISTED'}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
};
