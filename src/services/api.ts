import {
  User,
  StudentProfile,
  FacultyProfile,
  Experience,
  ExperienceWithMeta,
  Registration,
  WaitlistEntry,
  AttendanceRecord,
  LeaveRequest,
  AppNotification,
  BoardingPass,
  Announcement,
  ExperienceTemplate,
  AuditLog,
  GlobalSettings,
  RegisteredStudent,
  ExperienceFeedback,
  AnalyticsOverviewResult,
  AnalyticsScopeInfo,
  StudentDirectoryResponse,
  EligibilityRules,
  EligibilityPreviewResult,
  VerifiedOrganization,
  ConsentValidationResult,
  EmailNotification,
  EmailDeliveryStats,
  SecurityRecipient,
  TripReminderRecord,
  PreTripReminderDispatchResult,
  TripReport,
  TripReportPhoto,
  TripReportEligibility,
  TripReportSummary,
} from '../types';

let currentAuthToken = localStorage.getItem('vit_auth_token') || '';

export function setAuthToken(token: string) {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem('vit_auth_token', token);
  } else {
    localStorage.removeItem('vit_auth_token');
  }
}

export function getAuthToken(): string {
  return currentAuthToken;
}

export function removeAuthToken() {
  localStorage.removeItem('vit_auth_token');
  currentAuthToken = '';
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
    headers['x-user-id'] = currentAuthToken;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const rawText = await response.text();
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText.slice(0, 200) || `Request failed with status ${response.status}` };
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (data: { identifier?: string; email?: string; password?: string; role?: string }) =>
    fetchApi<{ token: string; user: User; student?: StudentProfile; faculty?: FacultyProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    fetchApi<{ user: User; student?: StudentProfile; faculty?: FacultyProfile; unreadNotificationCount: number }>('/auth/me'),

  updateMyProfile: (data: { name?: string; phone?: string; department?: string }) => fetchApi<any>('/auth/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
  sendPhoneOtp: (phone: string) => fetchApi<any>('/auth/me/phone/otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyPhoneOtp: (phone: string, otp: string) => fetchApi<any>('/auth/me/phone/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  changePassword: (currentPassword: string, newPassword: string) => fetchApi<any>('/auth/me/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

  logout: () =>
    fetchApi<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (data: { identifier?: string; email?: string; role?: string }) =>
    fetchApi<{ message: string; resetToken: string; userEmail: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    fetchApi<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  switchUser: (userId: string) =>
    fetchApi<{ token: string; user: User; student?: StudentProfile; faculty?: FacultyProfile }>('/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Experiences
  getExperiences: (params?: { status?: string; type?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<ExperienceWithMeta[]>(`/experiences${qs}`);
  },

  getExperienceById: (id: string) => fetchApi<ExperienceWithMeta>(`/experiences/${id}`),

  createExperience: (data: Partial<Experience>) =>
    fetchApi<Experience>('/experiences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExperience: (id: string, data: Partial<Experience>) =>
    fetchApi<Experience>(`/experiences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  approveExperience: (id: string) =>
    fetchApi<Experience>(`/admin/experiences/${id}/approve`, {
      method: 'POST',
    }),

  rejectExperience: (id: string, reason: string) =>
    fetchApi<Experience>(`/admin/experiences/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  deleteExperience: (id: string) =>
    fetchApi<{ success: boolean; id: string }>(`/experiences/${id}`, {
      method: 'DELETE',
    }),

  cancelExperience: (id: string, reason?: string) =>
    fetchApi<Experience>(`/experiences/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  previewEligibility: (eligibility: EligibilityRules) =>
    fetchApi<EligibilityPreviewResult>('/experiences/preview-eligibility', {
      method: 'POST',
      body: JSON.stringify({ eligibility }),
    }),

  getAcademicOptions: () =>
    fetchApi<{
      branches: string[];
      years: number[];
      semesters: number[];
      divisions: string[];
    }>('/academic-options'),

  // Registration & Waitlist
  validateConsentDocument: (experienceId: string, consentDocumentUrl: string) =>
    fetchApi<ConsentValidationResult>(`/experiences/${experienceId}/validate-consent`, {
      method: 'POST',
      body: JSON.stringify({ consentDocumentUrl }),
    }),

  registerForExperience: (experienceId: string, consentDocumentUrl?: string) =>
    fetchApi<{
      status: 'REGISTERED' | 'WAITLISTED' | 'REJECTED';
      registration?: Registration;
      boardingPass?: BoardingPass;
      waitlistEntry?: WaitlistEntry;
      consentStatus?: string;
      consentValidationResult?: any;
      message?: string;
      waitlistPosition?: number;
    }>(`/experiences/${experienceId}/register`, {
      method: 'POST',
      body: JSON.stringify({ consentDocumentUrl }),
    }),

  uploadConsentForm: (experienceId: string, consentDocumentUrl: string) => fetchApi<any>(`/experiences/${experienceId}/consent`, { method: 'POST', body: JSON.stringify({ consentDocumentUrl }) }),

  cancelRegistration: (experienceId: string) =>
    fetchApi<{ success: boolean; promoted?: { name: string; studentId: string; passNumber: string } }>(
      `/experiences/${experienceId}/cancel-registration`,
      {
        method: 'POST',
      }
    ),

  // Student specific
  getStudentExperiences: () =>
    fetchApi<{
      upcoming: ExperienceWithMeta[];
      waitlisted: ExperienceWithMeta[];
      completed: ExperienceWithMeta[];
      cancelled: ExperienceWithMeta[];
    }>('/student/experiences'),

  getBoardingPass: (experienceId: string) =>
    fetchApi<{ boardingPass: BoardingPass; experience: Experience; student: StudentProfile }>(
      `/student/boarding-pass/${experienceId}`
    ),

  submitLeaveRequest: (
    experienceId: string,
    reason: string,
    category?: string,
    supportingDocument?: { name: string; size?: number; type?: string; dataUrl?: string } | null
  ) =>
    fetchApi<LeaveRequest>('/student/leave-request', {
      method: 'POST',
      body: JSON.stringify({ experienceId, reason, category, supportingDocument }),
    }),

  getStudentLeaveRequests: () => fetchApi<LeaveRequest[]>('/student/leave-requests'),

  getNotifications: () => fetchApi<AppNotification[]>('/student/notifications'),

  markNotificationRead: (id: string) =>
    fetchApi<{ success: boolean }>(`/student/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: () =>
    fetchApi<{ success: boolean; count: number }>('/student/notifications/read-all', { method: 'POST' }),

  // Multi-Channel Email & Notification Tracking
  getEmailLogs: (filters?: { tripId?: string; studentId?: string; status?: string; eventType?: string }) => {
    const params = new URLSearchParams();
    if (filters?.tripId) params.append('tripId', filters.tripId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    const qs = params.toString();
    return fetchApi<EmailNotification[]>(`/notifications/emails${qs ? `?${qs}` : ''}`);
  },

  getEmailDeliveryStats: (tripId?: string) =>
    fetchApi<EmailDeliveryStats>(`/notifications/emails/stats${tripId ? `?tripId=${tripId}` : ''}`),

  retryEmailLog: (id: string) =>
    fetchApi<{ success: boolean; message: string; log?: EmailNotification }>(`/notifications/emails/${id}/retry`, {
      method: 'POST',
    }),

  retryAllFailedEmails: (tripId?: string) =>
    fetchApi<{ success: boolean; retriedCount: number; successCount: number; message: string }>(
      '/notifications/emails/retry-all',
      {
        method: 'POST',
        body: JSON.stringify({ tripId }),
      }
    ),

  sendTestNotificationEmail: (recipientEmail?: string) =>
    fetchApi<{ success: boolean; message: string; messageId?: string }>('/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail }),
    }),

  sendTripReminders: (tripId: string) =>
    fetchApi<{ success: boolean; count: number; message: string }>(`/experiences/${tripId}/send-reminders`, {
      method: 'POST',
    }),

  // Faculty specific
  getFacultyDashboard: () =>
    fetchApi<{
      totalAssignedVisits: number;
      upcomingVisits: number;
      completedVisits: number;
      draftVisits: number;
      totalConfirmedStudents: number;
      totalStudentsRegistered: number;
      totalWaitlistedStudents: number;
      totalCapacity: number;
      availableSeats: number;
      pendingLeaves: number;
      avgAttendance: number;
      pendingActions: Array<{
        id: string;
        type: 'LEAVE_REVIEW' | 'ATTENDANCE_PENDING' | 'REGISTRATION_CLOSING' | 'CAPACITY_REACHED';
        title: string;
        description: string;
        experienceId?: string;
        entityId?: string;
        severity: 'HIGH' | 'MEDIUM' | 'INFO';
      }>;
    }>('/faculty/dashboard'),

  getFacultyExperiences: () => fetchApi<ExperienceWithMeta[]>('/faculty/experiences'),

  getExperienceAnnouncements: (experienceId: string) =>
    fetchApi<Announcement[]>(`/faculty/experiences/${experienceId}/announcements`),

  getFacultyExperienceStudents: async (experienceId: string): Promise<RegisteredStudent[]> => {
    const roster = await fetchApi<{
      experience: Experience;
      registered: { registration: Registration; student: StudentProfile; boardingPass?: BoardingPass; attendance?: AttendanceRecord; leave?: LeaveRequest }[];
      waitlisted: { waitlist: WaitlistEntry; student: StudentProfile; registration?: Registration }[];
      capacity: number;
      registeredCount: number;
      waitlistCount: number;
      seatsRemaining: number;
    }>(`/faculty/experiences/${experienceId}/roster`);
    
    return (roster.registered || []).map((r: any) => {
      const studentObj = r.student || r;
      return {
        ...studentObj,
        studentId: studentObj?.studentId || r.studentId || 'UNKNOWN',
        name: studentObj?.name || 'Student Information Unavailable',
        registrationId: r.registration?.id || r.registrationId,
        registrationStatus: r.registration?.status || r.registrationStatus,
        registeredAt: r.registration?.registeredAt || r.registeredAt,
        attendanceStatus: (r.attendance?.status || r.attendanceStatus as 'PRESENT' | 'ABSENT') || 'NOT_MARKED',
        boardingPassNumber: r.boardingPass?.passNumber || r.boardingPassNumber,
        boardingPassStatus: r.boardingPass?.status || r.boardingPassStatus,
        leaveStatus: r.leave?.status || r.leaveStatus,
        leaveReason: r.leave?.reason || r.leaveReason,
      };
    });
  },

  // --- Certificates ---
  getStudentCertificates: () =>
    fetchApi<any[]>("/student/certificates"),

  getCertificateDetails: (certificateId: string) =>
    fetchApi<any>(`/certificates/${certificateId}`),

  getExperienceCertificates: (experienceId: string) =>
    fetchApi<any[]>(`/faculty/experiences/${experienceId}/certificates`),

  issueCertificates: (experienceId: string) =>
    fetchApi<{ success: boolean; count: number; certificates: any[] }>(`/faculty/experiences/${experienceId}/certificates/issue`, {
      method: "POST",
    }),

  getExperienceRoster: (experienceId: string) =>
    fetchApi<{
      experience: Experience;
      registered: { registration: Registration; student: StudentProfile; boardingPass?: BoardingPass; attendance?: AttendanceRecord; leave?: LeaveRequest }[];
      confirmed?: any[];
      waitlisted: { waitlist: WaitlistEntry; student: StudentProfile; registration?: Registration }[];
      waitlist?: any[];
      capacity: number;
      registeredCount: number;
      waitlistCount: number;
      seatsRemaining: number;
    }>(`/faculty/experiences/${experienceId}/roster`),

  markAttendance: (experienceId: string, records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes?: string }[]) =>
    fetchApi<{ success: boolean; count: number; updated: number; records: AttendanceRecord[] }>(`/faculty/experiences/${experienceId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    }),
  markFacultyAttendance: (experienceId: string, records: { facultyId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes?: string }[]) =>
    fetchApi<{ success: boolean; count: number; updated: number; records: AttendanceRecord[] }>(`/faculty/experiences/${experienceId}/attendance-faculty`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    }),

  getFacultyLeaves: () =>
    fetchApi<(LeaveRequest & { student?: StudentProfile; experience?: Experience; reviewer?: User })[]>('/faculty/leaves'),

  getFacultyLeaveRequests: () =>
    fetchApi<(LeaveRequest & { student?: StudentProfile; experience?: Experience; reviewer?: User })[]>('/faculty/leaves'),

  reviewLeaveRequest: (leaveId: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) =>
    fetchApi<LeaveRequest>(`/faculty/leaves/${leaveId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes }),
    }),

  createAnnouncement: (experienceId: string, title: string, message: string, audience: 'ALL' | 'CONFIRMED_ONLY' | 'WAITLISTED_ONLY' = 'ALL') =>
    fetchApi<Announcement>('/faculty/announcements', {
      method: 'POST',
      body: JSON.stringify({ experienceId, title, message, audience }),
    }),

  getStudentDirectory: () => fetchApi<StudentDirectoryResponse>('/faculty/student-directory'),

  getFacultyReports: () =>
    fetchApi<{
      totalExperiences: number;
      completedVisits: number;
      activeVisits: number;
      branchDistribution: Record<string, number>;
      attendanceGoodCount: number;
      attendanceWarningCount: number;
      attendanceCriticalCount: number;
    }>('/faculty/reports'),

  // Admin specific
  getAdminOverview: () =>
    fetchApi<{
      totalExperiences: number;
      activeVisits: number;
      upcomingVisits: number;
      completedVisits: number;
      draftVisits: number;
      cancelledVisits: number;
      totalFaculty: number;
      totalStudents: number;
      activeRegistrations: number;
      completedRegistrations: number;
      totalRegistrations: number;
      waitlistedCount: number;
      pendingLeaves: number;
      approvedLeaves: number;
      rejectedLeaves: number;
      globalAttendanceRate: number;
      totalFeesCollected: number;
      recentActivity: AuditLog[];
      pendingActions: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        severity: 'HIGH' | 'MEDIUM' | 'INFO';
        entityId?: string;
        targetTab: string;
      }>;
      upcomingVisitsList: Array<{
        id: string;
        title: string;
        organization: string;
        industry: string;
        date: string;
        location: string;
        capacity: number;
        registeredCount: number;
        primaryFacultyName: string;
        primaryFacultyId: string;
        status: string;
        contribution: number;
        deadline: string;
      }>;
    }>('/admin/overview'),

  getAdminStats: () =>
    fetchApi<{
      totalExperiences: number;
      activeVisits: number;
      upcomingVisits: number;
      completedVisits: number;
      draftVisits: number;
      cancelledVisits: number;
      totalFaculty: number;
      totalStudents: number;
      activeRegistrations: number;
      completedRegistrations: number;
      totalRegistrations: number;
      waitlistedCount: number;
      pendingLeaves: number;
      approvedLeaves: number;
      rejectedLeaves: number;
      globalAttendanceRate: number;
      totalFeesCollected: number;
      recentActivity: AuditLog[];
      pendingActions: any[];
      upcomingVisitsList: any[];
    }>('/admin/overview'),

  getAdminStudents: () => fetchApi<any[]>('/admin/students'),

  getAdminStudentDossier: (studentId: string) => fetchApi<any>(`/admin/students/${studentId}`),

  getAdminFaculty: () => fetchApi<FacultyProfile[]>('/admin/faculty'),

  getAdminFacultyList: () => fetchApi<FacultyProfile[]>('/admin/faculty'),

  createFacultyAccount: (data: { name: string; email: string; department: string; designation: string; employeeCode: string; phone: string }) =>
    fetchApi<{ user: User; profile: FacultyProfile }>('/admin/faculty', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleFacultyStatus: (userId: string) =>
    fetchApi<FacultyProfile>(`/admin/faculty/${userId}/toggle-status`, { method: 'POST' }),

  getAdminRegistrations: () => fetchApi<any[]>('/admin/registrations'),

  promoteWaitlistStudent: (id: string) =>
    fetchApi<any>(`/admin/registrations/${id}/promote`, { method: 'POST' }),

  cancelRegistrationByAdmin: (id: string, reason?: string) =>
    fetchApi<{ success: boolean }>(`/admin/registrations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getAdminLeaves: () => fetchApi<any[]>('/admin/leaves'),

  overrideLeaveRequest: (leaveId: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) =>
    fetchApi<any>(`/admin/leaves/${leaveId}/override`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes }),
    }),

  getAdminAttendance: () => fetchApi<{ visitSummaries: any[]; totalVisits: number; totalAttendanceMarked: number }>('/admin/attendance'),

  getAdminDocuments: () => fetchApi<any[]>('/admin/documents'),
  verifyBoardingPass: (
    experienceId: string,
    passNumberOrPayload: string,
    studentId?: string,
    qrPayload?: string
  ) =>
    fetchApi<any>(`/experiences/${experienceId}/verify-pass`, {
      method: 'POST',
      body: JSON.stringify({
        passNumber: passNumberOrPayload,
        studentId,
        qrPayload: qrPayload || passNumberOrPayload,
      }),
    }),


  getAdminAnnouncements: () => fetchApi<any[]>('/admin/announcements'),

  createAdminAnnouncement: (data: { title: string; message: string; experienceId?: string; targetAudience?: string }) =>
    fetchApi<any>('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAdminAnnouncement: (id: string) =>
    fetchApi<{ success: boolean }>(`/admin/announcements/${id}`, { method: 'DELETE' }),

  getAdminUsers: () => fetchApi<any[]>('/admin/users'),

  createAdminUser: (data: any) =>
    fetchApi<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAdminUser: (id: string, data: any) =>
    fetchApi<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleAdminUserStatus: (id: string) =>
    fetchApi<any>(`/admin/users/${id}/toggle-status`, { method: 'POST' }),

  duplicateExperience: (id: string) =>
    fetchApi<ExperienceWithMeta>(`/admin/experiences/${id}/duplicate`, { method: 'POST' }),

  assignFacultyToExperience: (id: string, facultyId: string) =>
    fetchApi<ExperienceWithMeta>(`/admin/experiences/${id}/assign-faculty`, {
      method: 'POST',
      body: JSON.stringify({ facultyId }),
    }),

  getAdminSettings: () => fetchApi<GlobalSettings>('/admin/settings'),

  updateAdminSettings: (data: Partial<GlobalSettings>) =>
    fetchApi<GlobalSettings>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTemplates: () => fetchApi<ExperienceTemplate[]>('/admin/templates'),

  createTemplate: (data: Partial<ExperienceTemplate>) =>
    fetchApi<ExperienceTemplate>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateTemplate: (id: string, data: Partial<ExperienceTemplate>) =>
    fetchApi<ExperienceTemplate>(`/admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  recordTemplateUsage: (id: string) =>
    fetchApi<{ success: boolean }>(`/admin/templates/${id}/record-usage`, {
      method: 'POST'
    }),

  deleteTemplate: (id: string) =>
    fetchApi<{ success: boolean }>(`/admin/templates/${id}`, { method: 'DELETE' }),

  getAuditLogs: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const qStr = query.toString();
    return fetchApi<{ logs: AuditLog[]; total: number }>(`/admin/audit-logs${qStr ? '?' + qStr : ''}`);
  },

  getSecurityEvents: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const qStr = query.toString();
    return fetchApi<{ events: any[]; total: number }>(`/admin/security-events${qStr ? '?' + qStr : ''}`);
  },

  getSecurityStats: () => fetchApi<any>('/admin/security-stats'),

  // AI Services (Gemini powered)
  askAssistant: (prompt: string, history?: { role: 'user' | 'assistant'; content: string }[], currentExperienceId?: string) =>
    fetchApi<{ answer: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, history, currentExperienceId }),
    }),

  getAIRecommendations: (studentId?: string) =>
    fetchApi<
      Array<{
        experienceId: string;
        title: string;
        organization: string;
        matchScore: number;
        matchReasons: string[];
        suitabilityExplanation: string;
        highlightOutcomes: string[];
      }>
    >(studentId ? `/ai/recommendations?studentId=${studentId}` : '/ai/recommendations'),

  callFacultyAIHelper: (params: {
    task: 'DESCRIPTION' | 'OBJECTIVES' | 'ITINERARY' | 'SAFETY_PPE' | 'ELIGIBILITY' | 'ANALYZE_ROSTER' | 'LEAVE_SUMMARY';
    organization?: string;
    industry?: string;
    title?: string;
    experienceType?: string;
    experienceId?: string;
    contextData?: any;
  }) =>
    fetchApi<{
      text?: string;
      items?: string[];
      itinerary?: Array<{ time: string; activity: string; description: string }>;
      analysis?: any;
    }>('/ai/faculty-helper', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getAdminAIInsights: () =>
    fetchApi<{
      summary: string;
      highlights: string[];
      recommendations: string[];
    }>('/ai/admin-insights'),

  generateVisitContent: (params: {
    title?: string;
    organization: string;
    category?: string;
    organizationIndustry?: string;
    location?: string;
    allowedYears?: number[];
    allowedBranches?: string[];
    date?: string;
    duration?: string;
    additionalInfo?: string;
  }) =>
    fetchApi<{
      shortDescription: string;
      whatYouWillExperience: string[];
      whyWorthAttending: string[];
      academicCompetencies: string[];
      studentRequirements: string[];
      safetyDirectives: string[];
    }>('/faculty/generate-visit-content', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Feedback Services
  submitFeedback: (
    experienceId: string,
    data: {
      rating: number;
      overallRating?: number;
      technicalExposureRating?: number;
      facultyCoordinationRating?: number;
      organizationRating?: number;
      learningValueRating?: number;
      recommend?: boolean | 'YES' | 'NO';
      positiveComment?: string;
      improvementComment?: string;
      comments?: string;
    }
  ) =>
    fetchApi<ExperienceFeedback>(`/experiences/${experienceId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExperienceFeedback: (experienceId: string) =>
    fetchApi<{
      feedback: ExperienceFeedback[];
      stats: {
        averageRating: number;
        totalFeedbackCount: number;
        technicalExposureAvg: number;
        facultyCoordinationAvg: number;
        organizationAvg: number;
        learningValueAvg: number;
        wouldRecommendPercentage: number;
        ratingDistribution: Record<number, number>;
      };
    }>(`/experiences/${experienceId}/feedback`),

  getStudentFeedback: () => fetchApi<ExperienceFeedback[]>('/student/feedback'),

  // Analytics & Scope Services
  getAnalyticsScope: () =>
    fetchApi<AnalyticsScopeInfo>('/analytics/scope'),

  getDepartmentalAnalytics: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchApi<AnalyticsOverviewResult>(`/analytics/departmental-reports${query}`);
  },

  getInstitutionalAnalytics: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchApi<AnalyticsOverviewResult>(`/analytics/institutional-overview${query}`);
  },

  downloadAnalyticsPdf: async (params?: Record<string, string>): Promise<void> => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const token = localStorage.getItem('vit_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/analytics/export-pdf${query}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'Failed to download PDF report';
      try {
        const errJson = await response.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VIT_Industrial_Exposure_Report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadAnalyticsExcel: async (params?: Record<string, string>): Promise<void> => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const token = localStorage.getItem('vit_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/analytics/export-excel${query}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'Failed to download Excel workbook';
      try {
        const errJson = await response.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VIT_Industrial_Exposure_Analytics.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Organization Auto-Lookup
  lookupOrganizations: (query: string) =>
    fetchApi<{
      query: string;
      matches: VerifiedOrganization[];
      exactMatch: VerifiedOrganization | null;
      count: number;
    }>(`/organizations/lookup?q=${encodeURIComponent(query)}`),

  getOrganizationPresets: () =>
    fetchApi<VerifiedOrganization[]>('/organizations/presets'),

  getAllVerifiedOrganizations: () =>
    fetchApi<VerifiedOrganization[]>('/organizations/all'),

  // ==========================================
  // PHASE 2: SECURITY RECIPIENTS & 3-DAY REMINDERS
  // ==========================================
  getSecurityRecipients: () =>
    fetchApi<SecurityRecipient[]>('/admin/security-recipients'),

  createSecurityRecipient: (data: Partial<SecurityRecipient>) =>
    fetchApi<SecurityRecipient>('/admin/security-recipients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSecurityRecipient: (id: string, data: Partial<SecurityRecipient>) =>
    fetchApi<SecurityRecipient>(`/admin/security-recipients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSecurityRecipient: (id: string) =>
    fetchApi<{ success: boolean; id: string }>(`/admin/security-recipients/${id}`, {
      method: 'DELETE',
    }),

  getReminderSchedulerStatus: () =>
    fetchApi<{
      isRunning: boolean;
      lastRunAt?: string;
      nextRunAt?: string;
      totalRunsCount: number;
      tripsDueIn3DaysCount: number;
      tripsDueIn3DaysList: { id: string; title: string; organization: string; date: string; daysUntilTrip: number }[];
      upcomingActiveTrips: {
        id: string;
        title: string;
        organization: string;
        date: string;
        daysUntilTrip: number;
        isDueFor3DayReminder: boolean;
        confirmedCount: number;
      }[];
      lastRunSummary?: {
        tripsEvaluated: number;
        tripsDueFor3Day: number;
        remindersDispatched: number;
        results: PreTripReminderDispatchResult[];
      };
    }>('/reminders/status'),

  runReminderScheduler: (forceTripId?: string) =>
    fetchApi<{
      timestamp: string;
      tripsEvaluated: number;
      tripsDueFor3Day: number;
      results: PreTripReminderDispatchResult[];
      message: string;
    }>('/reminders/run-now', {
      method: 'POST',
      body: JSON.stringify({ forceTripId }),
    }),

  getReminderHistory: () =>
    fetchApi<TripReminderRecord[]>('/reminders/history'),

  getExperienceReminderPreview: (experienceId: string) =>
    fetchApi<{
      tripId: string;
      tripTitle: string;
      organization: string;
      tripDate: string;
      daysUntilTrip: number;
      isDueFor3DayReminder: boolean;
      reportingTime: string;
      reportingLocation: string;
      departureTime: string;
      transportInfo: string;
      counts: {
        confirmedStudents: number;
        waitlistedStudents: number;
        facultyCoordinators: number;
        securityGates: number;
        admins: number;
        totalExpectedRecipients: number;
      };
      students: { studentId: string; name: string; email: string; rollNumber: string; boardingPassNumber: string }[];
      faculty: { name: string; email: string; department: string }[];
      security: { name: string; email: string; gateLocation: string }[];
      admins: { name: string; email: string }[];
    }>(`/experiences/${experienceId}/reminder-preview`),

  sendExperience3DayReminder: (experienceId: string, forceSend: boolean = true) =>
    fetchApi<PreTripReminderDispatchResult>(`/experiences/${experienceId}/send-3day-reminder`, {
      method: 'POST',
      body: JSON.stringify({ forceSend }),
    }),

  // --- Post-Trip Report & Photo Submissions ---
  getTripReportEligibility: (experienceId: string) =>
    fetchApi<TripReportEligibility>(`/experiences/${experienceId}/report/eligibility`),

  getStudentTripReport: (experienceId: string, studentId?: string) =>
    fetchApi<TripReport | null>(`/experiences/${experienceId}/report${studentId ? `?studentId=${studentId}` : ''}`),

  submitTripReport: (
    experienceId: string,
    data: {
      whatILearned: string;
      activities: string;
      skillsGained: string;
      experience: string;
      suggestions?: string;
      photos?: Array<{
        fileName: string;
        fileSize?: number;
        fileType: string;
        fileUrl: string;
        caption?: string;
      }>;
    }
  ) =>
    fetchApi<TripReport>(`/experiences/${experienceId}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteReportPhoto: (photoId: string) =>
    fetchApi<{ success: boolean }>(`/reports/photos/${photoId}`, {
      method: 'DELETE',
    }),

  getFacultyReportsDashboard: () =>
    fetchApi<{
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
    }>('/faculty/reports'),

  getFacultyReportDetail: (reportId: string) =>
    fetchApi<TripReport>(`/faculty/reports/${reportId}`),

  getAdminReportsDashboard: () =>
    fetchApi<{
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
    }>('/admin/reports'),

  getAdminReportDetail: (reportId: string) =>
    fetchApi<TripReport>(`/admin/reports/${reportId}`),
};
