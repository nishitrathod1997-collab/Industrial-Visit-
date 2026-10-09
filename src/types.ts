export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  passwordHash?: string;
  salt?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  consentStatus?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  consentDocumentUrl?: string;
  consentRejectionReason?: string;
  consentUploadedAt?: string;
  tokenVersion?: number;
}

export interface StudentProfile {
  studentId: string; // e.g. "21BCE10482"
  userId: string;
  name: string;
  email: string;
  branch: string; // e.g. "Computer Science & Engineering"
  year: number; // e.g. 3
  semester: number; // e.g. 6
  division: string; // e.g. "A"
  department: string; // e.g. "School of Computer Science & Engineering (SCOPE)"
  cgpa: number;
  phone: string;
  prn: string;
  activeBacklogs?: number;
  attendancePercentage?: number;
}

export interface FacultyProfile {
  facultyId: string; // e.g. "VIT-FAC-8841"
  userId: string;
  name: string;
  email: string;
  department: string; // e.g. "School of Computer Science & Engineering (SCOPE)"
  designation: string; // e.g. "Associate Professor"
  employeeCode: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type ExperienceType = 'Industrial Visits' | 'Technical Tours' | 'Field Research';
export type ExperienceStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

export interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  description: string;
  order: number;
}

export interface TravelInfo {
  reportingTime: string;
  reportingLocation: string;
  departureTime: string;
  transport: string;
  expectedArrival: string;
  returnDeparture: string;
  campusArrival: string;
}

export interface EligibilityRules {
  allowedBranches: string[];
  allowedYears: number[];
  allowedSemesters: number[];
  allowedDivisions: string[];
  minCgpa?: number;
  maxCgpa?: number;
  backlogRule?: 'NO_RESTRICTION' | 'NO_BACKLOGS' | 'MAX_BACKLOGS';
  maxBacklogs?: number;
  minAttendance?: number;
  additionalRules?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  details: {
    branchEligible: boolean;
    yearEligible: boolean;
    semesterEligible: boolean;
    divisionEligible: boolean;
    cgpaEligible: boolean;
    backlogEligible: boolean;
    attendanceEligible: boolean;
  };
  snapshot?: {
    branch: string;
    department: string;
    year: number;
    semester: number;
    division: string;
    cgpa: number;
    activeBacklogs?: number;
    attendanceRate: number;
    evaluatedAt: string;
    passedCriteria: string[];
  };
}

export interface EligibilityPreviewResult {
  totalEligible: number;
  totalStudents: number;
  percentage: number;
  breakdownByBranch: Record<string, number>;
  breakdownByYear: Record<string, number>;
  breakdownBySemester: Record<string, number>;
  eligibleStudents: Array<{
    studentId: string;
    name: string;
    branch: string;
    year: number;
    semester: number;
    division: string;
    cgpa: number;
    attendanceRate: number;
    activeBacklogs?: number;
  }>;
}

export interface Experience {
  id: string;
  title: string;
  organization: string;
  organizationDescription: string;
  organizationIndustry: string;
  organizationWebsite: string;
  organizationLogo?: string;
  experienceType: ExperienceType;
  shortDescription: string;
  detailedDescription: string;
  image?: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  time?: string;
  duration?: string;
  learningHours?: number;
  location: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  contribution: number; // in INR (0 if fully funded)
  capacity: number;
  waitlistEnabled: boolean;
  waitlistCapacity: number;
  registrationOpen: string; // ISO date
  registrationDeadline: string; // ISO date
  status: ExperienceStatus;
  createdBy: string;
  primaryFacultyId: string;
  additionalFacultyIds?: string[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  publishedBy?: string;
  publishedAt?: string;
  consentStatus?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  consentDocumentUrl?: string;
  consentRejectionReason?: string;
  consentUploadedAt?: string;

  eligibility: EligibilityRules;
  whatYouWillLearn: string[];
  learningObjectives: string[];
  itinerary: ItineraryItem[];
  travelInfo: TravelInfo;
  requirements: string[];
  rules: string[];
  experienceHighlights?: Array<{ icon?: string; title: string; description: string }>;
  whyAttend?: string[];
  whyWorthAttending?: string[];
  academicCompetencies?: string[];
  studentRequirements?: string[];
  safetyDirectives?: string[];
  safetyInfo?: { dressCode?: string; requiredGear?: string; importantRules?: string[] };
  companyInfo?: { website?: string; about?: string; employees?: string; headquarters?: string };
}

export interface VerifiedOrganization {
  id: string;
  name: string;
  shortName?: string;
  aliases: string[];
  officialWebsite: string;
  location: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  industry: string;
  about?: string;
  headquarters?: string;
  campusOrPlant?: string;
  isVerified: boolean;
}

export type RegistrationStatus = 'REGISTERED' | 'WAITLISTED' | 'CANCELLED' | 'COMPLETED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type ValidationCheckStatus = 'PASS' | 'FAIL' | 'INCONCLUSIVE';

export interface ConsentValidationChecks {
  processingStatus?: 'SUCCESS' | 'FAILED';
  documentReadable: ValidationCheckStatus;
  correctDocumentType: ValidationCheckStatus;
  studentNameDetected: ValidationCheckStatus;
  studentNameMatchesProfile: ValidationCheckStatus;
  tripCompanyDetected: ValidationCheckStatus;
  tripMatchesRegistration: ValidationCheckStatus;
  parentGuardianDetails: ValidationCheckStatus;
  signatureDetected: ValidationCheckStatus;
  requiredFieldsPresent: ValidationCheckStatus;
}

export interface ConsentValidationResult {
  isValidConsentForm: boolean;
  finalDecision?: 'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW';
  processingStatus?: 'SUCCESS' | 'FAILED';
  documentType?: string;
  studentName?: string | null;
  studentId?: string | null;
  visitName?: string | null;
  parentGuardianName?: string | null;
  parentSignaturePresent: boolean;
  parentSignatureStatus?: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  parentSignatureConfidence?: number;
  parentSignatureReason?: string;
  studentSignatureStatus?: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  studentSignatureConfidence?: number;
  studentSignatureReason?: string;
  confidence: number;
  reason: string;
  checks?: ConsentValidationChecks;
  validationReport?: string;
  extractedDetails?: {
    branch?: string | null;
    academicYear?: string | null;
    division?: string | null;
    parentPhone?: string | null;
    dateOfVisit?: string | null;
    studentSignaturePresent?: boolean;
    parentSignaturePresent?: boolean;
    parentSignatureStatus?: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
    parentSignatureConfidence?: number;
    parentSignatureReason?: string;
    studentSignatureStatus?: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
    studentSignatureConfidence?: number;
    studentSignatureReason?: string;
    containsOfficialDeclaration?: boolean;
    isBlankTemplate?: boolean;
  };
  diagnostics?: {
    fileReceived: 'PASS' | 'FAIL';
    pdfOpened?: 'PASS' | 'FAIL';
    pageCount?: number;
    textExtraction?: 'PASS' | 'FAIL';
    imageRendering?: 'PASS' | 'FAIL';
    aiVisionAnalysis?: 'PASS' | 'FAIL';
    mimeType?: string;
    fileSizeBytes?: number;
  };
}

export interface Registration {
  id: string;
  studentId: string;
  experienceId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt?: string;
  updatedAt: string;
  consentStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'VERIFIED' | 'REJECTED';
  consentDocumentUrl?: string;
  consentRejectionReason?: string;
  consentUploadedAt?: string;
  consentVerifiedAt?: string;
  consentValidationResult?: ConsentValidationResult;
  eligibilitySnapshot?: {
    branch: string;
    department: string;
    year: number;
    semester: number;
    division: string;
    cgpa: number;
    activeBacklogs?: number;
    attendanceRate: number;
    evaluatedAt: string;
    passedCriteria: string[];
  };
}

export interface WaitlistEntry {
  id: string;
  studentId: string;
  experienceId: string;
  position: number;
  joinedAt: string;
  status: 'ACTIVE' | 'PROMOTED' | 'CANCELLED';
}

export interface AttendanceRecord {
  id: string;
  studentId?: string;
  facultyId?: string;
  experienceId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  markedBy: string; // faculty userId
  timestamp: string;
  notes?: string;
}

export type LeaveCategory =
  | 'Medical Leave'
  | 'Family Event'
  | 'Academic'
  | 'Competition'
  | 'Personal Work';

export interface SupportingDocument {
  name: string;
  size?: number;
  type?: string;
  dataUrl?: string;
  uploadedAt?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  experienceId: string;
  category?: LeaveCategory | string;
  reason: string;
  supportingDocument?: SupportingDocument | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  // Enriched fields
  student?: StudentProfile;
  studentName?: string;
  studentRollNo?: string;
  studentEmail?: string;
  studentDepartment?: string;
  studentDivision?: string;
  experience?: Experience;
  experienceTitle?: string;
  experienceOrganization?: string;
  experienceDate?: string;
  experienceLocation?: string;
  reviewer?: User;
  reviewerName?: string;
}

export type NotificationPriority = 'NORMAL' | 'IMPORTANT' | 'HIGH' | 'CRITICAL';

export type NotificationCategory =
  | 'REGISTRATION'
  | 'WAITLIST'
  | 'PROMOTION'
  | 'TRIP_UPDATE'
  | 'BOARDING_PASS'
  | 'REMINDER'
  | 'CANCELLATION'
  | 'ANNOUNCEMENT'
  | 'CERTIFICATE'
  | 'FEEDBACK'
  | 'ACADEMIC';

export type NotificationType = 
  | 'REGISTRATION_SUBMITTED'
  | 'REGISTRATION_CONFIRMED'
  | 'REGISTRATION_CANCELLED'
  | 'REGISTRATION_REJECTED'
  | 'CONSENT_REJECTED'
  | 'CONSENT_VERIFIED'
  | 'WAITLIST_JOINED'
  | 'WAITLIST_PROMOTED'
  | 'WAITLIST_UPDATE'
  | 'BOARDING_PASS_READY'
  | 'BOARDING_PASS_UPDATED'
  | 'BOARDING_PASS_CANCELLED'
  | 'TRIP_SCHEDULE_CHANGED'
  | 'TRIP_VENUE_CHANGED'
  | 'TRIP_ITINERARY_CHANGED'
  | 'VISIT_REMINDER'
  | 'ANNOUNCEMENT'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'EXPERIENCE_CANCELLED'
  | 'EXPERIENCE_APPROVED'
  | 'EXPERIENCE_REJECTED'
  | 'EXPERIENCE_SUBMITTED_FOR_APPROVAL'
  | 'ATTENDANCE_MARKED'
  | 'CERTIFICATE_ISSUED'
  | 'FEEDBACK_AVAILABLE'
  | 'REPORT_SUBMITTED'
  | 'PRE_TRIP_3_DAY_REMINDER'
  | 'SECURITY_NOTICE'
  | 'ADMIN_SUMMARY';

export interface AppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  relatedEntityId?: string;
  entityType?: 'EXPERIENCE' | 'LEAVE' | 'BOARDING_PASS' | 'ANNOUNCEMENT' | 'CERTIFICATE' | 'FEEDBACK';
  actionUrl?: string;
  actionLabel?: string;
  emailStatus?: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  emailRecipient?: string;
  emailSentAt?: string;
}

export type EmailDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';

export interface EmailNotification {
  id: string;
  studentId?: string;
  tripId?: string;
  notificationId?: string;
  eventType: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole?: 'STUDENT' | 'FACULTY' | 'SECURITY' | 'ADMIN';
  subject: string;
  status: EmailDeliveryStatus;
  attempts: number;
  sentAt?: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  createdAt: string;
  idempotencyKey?: string;
}

export interface SecurityRecipient {
  id: string;
  name: string;
  email: string;
  department: string;
  gateLocation: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TripReminderRecord {
  id: string;
  tripId: string;
  tripTitle: string;
  tripDate: string;
  reminderType: 'PRE_TRIP_3_DAY' | 'PRE_TRIP_24_HOUR';
  targetDate: string;
  studentsNotified: number;
  facultyNotified: number;
  securityNotified: number;
  adminNotified: number;
  recipientCount?: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  triggerSource?: string;
  dispatchedAt: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  details?: string;
}

export interface PreTripReminderDispatchResult {
  tripId: string;
  tripTitle: string;
  tripDate: string;
  daysUntilTrip: number;
  targetDate: string;
  studentsNotified: number;
  facultyNotified: number;
  securityNotified: number;
  adminNotified: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'FAILED';
  recipientBreakdown: {
    students: { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
    faculty: { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
    security: { name: string; email: string; gate: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
    admin: { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
  };
  message: string;
}

export interface EmailDeliveryStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  totalEmailsPending: number;
  emailsSent?: number;
  emailsPending?: number;
  emailsFailed?: number;
  totalAttempts: number;
  deliveryRate: number;
  byEventType: Record<string, { total: number; sent: number; failed: number }>;
  tripId?: string;
  tripTitle?: string;
  organization?: string;
  totalAffected?: number;
  websiteNotificationsCreated?: number;
  recentLogs?: EmailNotification[];
}

export interface BoardingPass {
  id: string;
  studentId: string;
  experienceId: string;
  passNumber: string;
  qrData: string;
  generatedAt: string;
  status: 'VALID' | 'CANCELLED' | 'USED';
}

export interface Announcement {
  id: string;
  experienceId: string;
  createdBy: string;
  authorName: string;
  title: string;
  message: string;
  createdAt: string;
  targetAudience?: 'ALL' | 'CONFIRMED_ONLY' | 'WAITLISTED_ONLY';
  recipientCount?: number;
  emailDeliveredCount?: number;
}

export interface ExperienceTemplate {
  id: string;
  name: string;
  category: ExperienceType;
  description: string;
  configuration: Partial<Experience>;
  createdBy: string;
  createdAt: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  timesUsed?: number;
  lastUsedAt?: string;
}

export type AuditModule =
  | 'AUTHENTICATION'
  | 'USERS'
  | 'FACULTY'
  | 'STUDENTS'
  | 'VISITS'
  | 'REGISTRATIONS'
  | 'WAITLIST'
  | 'LEAVE_PETITIONS'
  | 'ATTENDANCE'
  | 'DOCUMENTS'
  | 'CERTIFICATES'
  | 'ANNOUNCEMENTS'
  | 'TEMPLATES'
  | 'SETTINGS'
  | 'SECURITY'
  | 'SYSTEM';

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'WARNING';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  module?: AuditModule;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: UserRole | 'SYSTEM';
  performedBy?: string;
  performedByName?: string;
  userRole?: UserRole | 'SYSTEM';
  targetId?: string;
  targetName?: string;
  entityId?: string;
  entityType?: string;
  description?: string;
  details?: string | Record<string, any>;
  status?: AuditStatus;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'UNAUTHORIZED_ACCESS'
  | 'PERMISSION_DENIED'
  | 'ROLE_ACCESS_VIOLATION'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_REACTIVATED'
  | 'ROLE_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'REPEATED_LOGIN_FAILURES'
  | 'EXCESSIVE_REQUESTS'
  | 'SUSPICIOUS_TOKEN'
  | 'USER_SWITCH_ATTEMPT'
  | 'SECURITY_POLICY_VIOLATION';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityEventStatus = 'LOGGED' | 'BLOCKED' | 'ALLOWED' | 'FLAGGED';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: SecurityEventType | string;
  actorEmail: string;
  actorId?: string;
  actorName?: string;
  actorRole: UserRole | 'SYSTEM' | 'UNKNOWN';
  resource: string;
  actionAttempted: string;
  severity: SecuritySeverity;
  status: SecurityEventStatus;
  reason?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface SecurityStats {
  totalEvents: number;
  failedLogins24h: number;
  blockedAttempts: number;
  criticalIncidents: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  activeThreatLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
}

export type CertificateStatus = 'NOT_ELIGIBLE' | 'PENDING' | 'ISSUED' | 'REVOKED';

export interface Certificate {
  id: string;
  certificateId: string;
  studentId: string;
  experienceId: string;
  status: CertificateStatus;
  issuedAt?: string;
  issuedBy?: string;
  createdAt: string;
  updatedAt: string;
  consentStatus?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  consentDocumentUrl?: string;
  consentRejectionReason?: string;
  consentUploadedAt?: string;
}

export interface GlobalSettings {
  attendanceThresholdGood: number;
  attendanceThresholdWarning: number;
  academicYear: string;
  currentSemester: string;
  allowedBranches: string[];
  experienceTypes: ExperienceType[];
  autoPromotionEnabled: boolean;
  allowStudentLeaveRequests: boolean;
}

export interface ExperienceWithMeta extends Experience {
  registeredCount: number;
  waitlistCount: number;
  seatsRemaining: number;
  isEligible?: boolean;
  eligibilityReason?: string;
  eligibilityReasons?: string[];
  eligibilityDetails?: {
    branchEligible: boolean;
    yearEligible: boolean;
    semesterEligible: boolean;
    divisionEligible: boolean;
    cgpaEligible: boolean;
    backlogEligible: boolean;
    attendanceEligible: boolean;
  };
  eligibilitySnapshot?: {
    branch: string;
    department: string;
    year: number;
    semester: number;
    division: string;
    cgpa: number;
    activeBacklogs?: number;
    attendanceRate: number;
    evaluatedAt: string;
    passedCriteria: string[];
  };
  userRegistration?: Registration | null;
  userWaitlistEntry?: WaitlistEntry | null;
  userAttendance?: AttendanceRecord | null;
  userBoardingPass?: BoardingPass | null;
  userFeedback?: ExperienceFeedback | null;
  userReport?: TripReport | null;
  reportEligibility?: TripReportEligibility | null;
  primaryFaculty?: FacultyProfile | null;
  additionalFaculty?: FacultyProfile[] | null;
  matchScore?: number;
  registrationDeadlinePassed?: boolean;
  isRegistrationClosed?: boolean;
  canCancel?: boolean;
}

export interface RegisteredStudent extends StudentProfile {
  registrationId?: string;
  registrationStatus?: RegistrationStatus;
  registeredAt?: string;
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NOT_MARKED';
  boardingPassNumber?: string;
  boardingPassStatus?: string;
  leaveStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  leaveReason?: string;
}

export interface StudentDirectoryVisitInfo {
  experienceId: string;
  title: string;
  organization: string;
  location: string;
  date: string;
  status: ExperienceStatus;
  registrationStatus: RegistrationStatus;
  registeredAt: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NOT_MARKED';
  attendanceNotes?: string;
  boardingPassNumber?: string;
  certificateId?: string;
  certificateStatus?: 'ISSUED' | 'NONE' | 'REVOKED';
  certificateIssuedAt?: string;
  consentStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'VERIFIED' | 'REJECTED';
  consentDocumentUrl?: string;
  consentRejectionReason?: string;
  consentVerifiedAt?: string;
  consentValidationResult?: ConsentValidationResult;
}

export interface StudentDirectoryAttendanceSummary {
  totalAssigned: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  attendedCount: number;
  attendanceRate: number;
}

export interface StudentDirectoryCertificateSummary {
  totalIssued: number;
  certificates: {
    id: string;
    certificateId: string;
    experienceId: string;
    experienceTitle: string;
    issuedAt: string;
  }[];
}

export interface StudentDirectoryEntry extends StudentProfile {
  registeredVisits: StudentDirectoryVisitInfo[];
  registeredVisitsCount: number;
  completedVisitsCount: number;
  attendanceSummary: StudentDirectoryAttendanceSummary;
  certificateSummary: StudentDirectoryCertificateSummary;
}

export interface StudentDirectoryResponse {
  scopeSummary: {
    scopeType: 'INSTITUTION' | 'DEPARTMENT' | 'FACULTY_ASSIGNED';
    isHod: boolean;
    departmentScope: string | null;
    authorizedVisitCount: number | 'UNRESTRICTED';
    totalAuthorizedStudents: number;
  };
  students: StudentDirectoryEntry[];
  availableBranches: string[];
}

export interface ExperienceFeedback {
  id: string;
  experienceId: string;
  studentId: string;
  rating: number; // 1-5 overall rating (for compatibility)
  overallRating?: number; // 1-5 overall rating
  technicalExposureRating?: number; // 1-5 rating
  facultyCoordinationRating?: number; // 1-5 rating
  organizationRating?: number; // 1-5 rating
  learningValueRating?: number; // 1-5 rating
  recommend?: boolean | 'YES' | 'NO';
  positiveComment?: string;
  improvementComment?: string;
  comments?: string;
  submittedAt: string;
  createdAt?: string;
}

export interface AnalyticsScopeInfo {
  scopeType: 'INSTITUTION' | 'DEPARTMENT' | 'FACULTY_ASSIGNED' | 'FORBIDDEN';
  isHod: boolean;
  departmentScope: string | null;
  authorizedVisitCount: number | 'UNRESTRICTED';
  userRole: string;
}

export interface AnalyticsOverviewResult {
  scopeSummary: {
    scopeType: string;
    isHod: boolean;
    departmentScope: string | null;
    enforcedFilters: {
      department: string | null;
      branch: string | null;
      visitId: string | null;
      status: string | null;
      academicYear: string | null;
    };
  };

  summaryKpis: {
    uniqueStudentsParticipated: number;
    completedVisits: number;
    totalVisitsInScope: number;
    averageAttendance: number;
    totalLearningHours: number;
    totalRegistrations: number;
    waitlistedStudents: number;
    certificatesIssued: number;
    averageRating: number | null;
  };

  branchAnalytics: Array<{
    branch: string;
    registered: number;
    attended: number;
    attendancePercentage: number;
    certificates: number;
  }>;

  yearAnalytics: Array<{
    year: number;
    yearLabel: string;
    registered: number;
    attended: number;
    attendancePercentage: number;
  }>;

  attendanceBreakdown: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    totalMarked: number;
    attendancePercentage: number;
  };

  visitTypeAnalytics: Array<{
    type: string;
    visits: number;
    students: number;
    attendancePercentage: number;
    learningHours: number;
  }>;

  visitPerformance: Array<{
    id: string;
    title: string;
    organization: string;
    experienceType: string;
    date: string;
    location: string;
    capacity: number;
    registrations: number;
    waitlistCount: number;
    attended: number;
    attendancePercentage: number;
    rating: number | null;
    learningHours: number;
    performanceScore: number | null;
    status: string;
  }>;

  seatUtilization: {
    totalCapacity: number;
    totalRegistrations: number;
    utilizationPercentage: number;
  };

  waitingListAnalytics: {
    totalWaitlisted: number;
    waitlistByVisit: Array<{
      visitId: string;
      visitTitle: string;
      count: number;
      capacity: number;
    }>;
  };

  certificateAnalytics: {
    totalCertificates: number;
    certificatesByBranch: Record<string, number>;
    certificatesByVisit: Array<{
      visitId: string;
      visitTitle: string;
      count: number;
      capacity: number;
    }>;
  };

  feedbackAnalytics: {
    totalFeedbackCount: number;
    averageRating: number | null;
    technicalExposureAvg: number | null;
    facultyCoordinationAvg: number | null;
    organizationAvg: number | null;
    learningValueAvg: number | null;
    wouldRecommendPercentage: number | null;
    ratingDistribution: Record<number, number>;
  };

  industryExposure: Array<{
    industry: string;
    visitCount: number;
    studentReach: number;
    totalHours: number;
  }>;

  locationExposure: Array<{
    location: string;
    visitCount: number;
    studentCount: number;
  }>;

  monthlyTrends: Array<{
    month: string;
    visits: number;
    students: number;
    learningHours: number;
  }>;

  recentCompletedVisits: Array<{
    id: string;
    title: string;
    organization: string;
    date: string;
    attendancePercentage: number;
    attendedCount: number;
    learningHours: number;
  }>;

  topPerformingVisits: Array<{
    id: string;
    rank: number;
    title: string;
    organization: string;
    attendancePercentage: number;
    rating: number | null;
    registrations: number;
    attended: number;
    performanceScore: number;
    capacity: number;
    learningHours: number;
  }>;
}

export type TripReportStatus = 'PENDING' | 'SUBMITTED' | 'NOT_ELIGIBLE';

export interface TripReportPhoto {
  id: string;
  reportId: string;
  experienceId: string;
  studentId: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  fileUrl: string; // Base64 dataUrl or storage path
  uploadedAt: string;
  caption?: string;
}

export interface TripReport {
  id: string;
  experienceId: string;
  studentId: string;
  studentName?: string;
  studentEnrollment?: string;
  studentDepartment?: string;
  studentBranch?: string;
  studentYear?: number;
  studentSemester?: number;
  studentDivision?: string;
  tripTitle?: string;
  organizationName?: string;
  visitDate?: string;
  whatILearned: string;
  activities: string;
  skillsGained: string;
  experience: string;
  suggestions?: string;
  photos?: TripReportPhoto[];
  submittedAt: string;
  updatedAt: string;
  status: 'SUBMITTED' | 'DRAFT';
}

export interface TripReportEligibility {
  eligible: boolean;
  tripStatus: ExperienceStatus;
  isCompleted: boolean;
  isRegistered: boolean;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'PENDING' | 'NOT_MARKED' | null;
  reportStatus: TripReportStatus;
  reason: string;
  report?: TripReport | null;
}

export interface TripReportSummary {
  totalEligible: number;
  reportsSubmitted: number;
  reportsPending: number;
  totalPhotos: number;
}
