import * as XLSX from 'xlsx';
import { db } from './db';
import { AnalyticsOverviewResult } from './analyticsService';
import { AnalyticsUserScope, EffectiveAnalyticsFilters } from './analyticsAuth';

export interface ExcelUserInfo {
  name: string;
  email: string;
  role: string;
  identifier?: string;
}

/**
 * Generates an official, institutional Excel workbook for the VIT Industrial Exposure Program.
 * Contains the 8 required structured sheets populated dynamically from filtered database records.
 */
export function generateOfficialExcelReport(
  analytics: AnalyticsOverviewResult,
  scope: AnalyticsUserScope,
  filters: EffectiveAnalyticsFilters,
  userInfo: ExcelUserInfo
): Buffer {
  const wb = XLSX.utils.book_new();

  // Retrieve base entities from database for granular sheets
  const allExperiences = db.getExperiences();
  const allStudents = db.getAllStudents();
  const studentMap = new Map();
  allStudents.forEach((s) => studentMap.set(s.studentId, s));

  // Determine authorized in-scope experiences
  let inScopeExperiences = allExperiences;
  if (scope.scopeType === 'DEPARTMENT' && scope.departmentScope && scope.authorizedVisitIds) {
    inScopeExperiences = inScopeExperiences.filter((e) => scope.authorizedVisitIds!.includes(e.id));
  } else if (scope.scopeType === 'FACULTY_ASSIGNED' && scope.authorizedVisitIds) {
    inScopeExperiences = inScopeExperiences.filter((e) => scope.authorizedVisitIds!.includes(e.id));
  }

  // Apply active filters to in-scope experiences matching analyticsService
  if (filters.visitId && filters.visitId !== 'ALL' && filters.visitId !== '__NO_ACCESS__') {
    inScopeExperiences = inScopeExperiences.filter((e) => e.id === filters.visitId);
  }
  if (filters.status && filters.status !== 'ALL') {
    inScopeExperiences = inScopeExperiences.filter((e) => e.status === filters.status);
  }
  if (filters.visitType && filters.visitType !== 'ALL' && filters.visitType !== 'All Experience') {
    const targetType = filters.visitType.toLowerCase();
    inScopeExperiences = inScopeExperiences.filter((e) => {
      const expType = (e.experienceType || '').toLowerCase();
      if (targetType.includes('industrial')) return expType.includes('industrial');
      if (targetType.includes('field')) return expType.includes('field');
      if (targetType.includes('technical') || targetType.includes('tour')) {
        return expType.includes('tour') || expType.includes('technical');
      }
      return expType === targetType || expType.includes(targetType);
    });
  }
  if (filters.location && filters.location !== 'ALL' && filters.location !== 'All Locations') {
    const targetLoc = filters.location.toLowerCase();
    inScopeExperiences = inScopeExperiences.filter((e) => e.location.toLowerCase().includes(targetLoc));
  }
  if (filters.academicYear && filters.academicYear !== 'ALL') {
    inScopeExperiences = inScopeExperiences.filter((e) => {
      const year = new Date(e.date).getFullYear();
      if (filters.academicYear === '2025-2026') return year === 2025 || year === 2026;
      if (filters.academicYear === '2024-2025') return year === 2024 || year === 2025;
      return e.date.includes(filters.academicYear!);
    });
  }
  if (filters.startDate) {
    inScopeExperiences = inScopeExperiences.filter((e) => e.date >= filters.startDate!);
  }
  if (filters.endDate) {
    inScopeExperiences = inScopeExperiences.filter((e) => e.date <= filters.endDate!);
  }

  // Helper for student filters matching active filters
  const matchesStudentFilters = (student: any) => {
    if (!student) return true;
    if (filters.branch && filters.branch !== 'ALL' && filters.branch !== '__NO_ACCESS__' && student.branch !== filters.branch) {
      return false;
    }
    if (filters.year !== null && filters.year !== undefined && Number(student.year) !== Number(filters.year)) {
      return false;
    }
    if (filters.department && filters.department !== 'ALL' && filters.department !== '__NO_ACCESS__' && student.department !== filters.department) {
      return false;
    }
    return true;
  };

  const studentYearLabel =
    filters.year !== null && filters.year !== undefined
      ? filters.year === 1
        ? 'First Year'
        : filters.year === 2
        ? 'Second Year'
        : filters.year === 3
        ? 'Third Year'
        : 'Fourth Year'
      : 'All Years';

  const dateRangeLabel =
    filters.startDate && filters.endDate
      ? `${filters.startDate} to ${filters.endDate}`
      : filters.dateRange === 'THIS_MONTH' || filters.dateRange === '30d'
      ? 'This Month (Last 30 Days)'
      : filters.dateRange === 'THIS_SEMESTER' || filters.dateRange === '90d'
      ? 'This Semester (Last 90 Days)'
      : 'All Time';

  // --- SHEET 1: SUMMARY ---
  const summaryAOA: any[][] = [
    ['VISHWAKARMA INSTITUTE OF TECHNOLOGY, PUNE'],
    ['VIT INDUSTRIAL EXPOSURE PROGRAM - DEPARTMENTAL REPORTS & ANALYTICS'],
    [],
    ['Scope Type:', scope.scopeType],
    [
      'Faculty Scope:',
      scope.scopeType === 'INSTITUTION'
        ? 'Institution-Wide (All Departments)'
        : scope.departmentScope || 'Departmental Authorized Scope',
    ],
    ['Academic Year:', filters.academicYear && filters.academicYear !== 'ALL' ? filters.academicYear : 'All Academic Years'],
    ['Student Year Filter:', studentYearLabel],
    ['Branch Filter:', filters.branch && filters.branch !== 'ALL' ? filters.branch : 'All Branches'],
    ['Visit Type Filter:', filters.visitType && filters.visitType !== 'ALL' ? filters.visitType : 'All Experience'],
    ['Date Range Filter:', dateRangeLabel],
    ['Location Filter:', filters.location && filters.location !== 'ALL' ? filters.location : 'All Locations'],
    ['Generated Date:', new Date().toLocaleString('en-US')],
    ['Generated By:', `${userInfo.name} (${userInfo.role} - ${userInfo.email})`],
    [],
    ['1. CORE EXECUTIVE SUMMARY KPIs'],
    ['Metric Name', 'Value', 'Unit / Notes'],
    ['Students Participated (Unique)', analytics.summaryKpis.uniqueStudentsParticipated, 'Count of distinct verified students'],
    ['Visits Conducted (Completed)', analytics.summaryKpis.completedVisits, 'Visits with verified attendance turnout'],
    ['Total Visits In Scope', analytics.summaryKpis.totalVisitsInScope, 'Total scheduled / active visits in scope'],
    ['Average Attendance Rate', `${analytics.summaryKpis.averageAttendance}%`, 'Overall turnout compliance percentage'],
    ['Learning Hours Delivered', `${analytics.summaryKpis.totalLearningHours} hrs`, 'Accrued curricular experiential hours'],
    ['Total Allocated Seat Capacity', analytics.seatUtilization.totalCapacity, 'Seats across in-scope visits'],
    ['Total Registrations', analytics.summaryKpis.totalRegistrations, 'Confirmed student bookings'],
    ['Seat Utilization Rate', `${analytics.seatUtilization.utilizationPercentage}%`, 'Bookings / Capacity'],
    ['Waitlisted Students', analytics.summaryKpis.waitlistedStudents, 'Pending capacity requests'],
    ['Certificates Issued', analytics.summaryKpis.certificatesIssued, 'Verified student completion badges'],
    [
      'Average Student Rating',
      analytics.summaryKpis.averageRating !== null ? `${analytics.summaryKpis.averageRating} / 5.0` : 'N/A',
      'Overall student satisfaction score',
    ],
    [],
    ['2. ATTENDANCE BREAKDOWN'],
    ['Turnout Status', 'Count', 'Turnout Percentage'],
    ['Present', analytics.attendanceBreakdown.present, `${analytics.attendanceBreakdown.attendancePercentage}%`],
    ['Absent', analytics.attendanceBreakdown.absent, '-'],
    ['Late', analytics.attendanceBreakdown.late, '-'],
    ['Excused', analytics.attendanceBreakdown.excused, '-'],
    ['Total Marked Records', analytics.attendanceBreakdown.totalMarked, '100%'],
    [],
    ['3. VISIT TYPE DISTRIBUTION'],
    ['Visit Category / Type', 'Visits Conducted', 'Students Reached', 'Attendance Rate', 'Learning Hours Delivered'],
    ...analytics.visitTypeAnalytics.map((vt) => [
      vt.type,
      vt.visits,
      vt.students,
      `${vt.attendancePercentage}%`,
      `${vt.learningHours} hrs`,
    ]),
    [],
    ['4. COHORT PARTICIPATION BY YEAR'],
    ['Year Level', 'Registered Students', 'Attended Students', 'Turnout Rate'],
    ...analytics.yearAnalytics.map((y) => [
      `${y.yearLabel} (Year ${y.year})`,
      y.registered,
      y.attended,
      `${y.attendancePercentage}%`,
    ]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // --- SHEET 2: STUDENT PARTICIPATION ---
  const participationData: any[] = [];
  inScopeExperiences.forEach((exp) => {
    const regs = db.getRegistrationsByExperience(exp.id);
    regs.forEach((r) => {
      const student = studentMap.get(r.studentId);
      if (!student) return;
      if (!matchesStudentFilters(student)) return;

      const yearLabel =
        student.year === 1
          ? 'First Year'
          : student.year === 2
          ? 'Second Year'
          : student.year === 3
          ? 'Third Year'
          : 'Fourth Year';

      participationData.push({
        'Registration ID': r.id,
        'Student Roll No': student.studentId,
        'Student Name': student.name,
        Department: student.department || 'N/A',
        Branch: student.branch,
        'Student Year': yearLabel,
        'Academic Year': (exp as any).academicYear || '2025-2026',
        'Visit Title': exp.title,
        Organization: exp.organization,
        Category: exp.experienceType,
        'Visit Date': exp.date,
        Location: exp.location,
        'Registration Status': r.status,
        'Registered Date': r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : 'N/A',
      });
    });
  });

  const wsParticipation =
    participationData.length > 0
      ? XLSX.utils.json_to_sheet(participationData)
      : XLSX.utils.aoa_to_sheet([['No student participation records found for the selected filters.']]);
  XLSX.utils.book_append_sheet(wb, wsParticipation, 'Student Participation');

  // --- SHEET 3: VISIT PERFORMANCE ---
  const visitPerfData = analytics.visitPerformance.map((v) => ({
    'Visit ID': v.id,
    'Visit Title': v.title,
    Organization: v.organization,
    Category: v.experienceType,
    Date: v.date,
    Location: v.location,
    Capacity: v.capacity,
    Registrations: v.registrations,
    'Waitlist Count': v.waitlistCount,
    'Attended Students': v.attended,
    'Attendance Rate %': `${v.attendancePercentage}%`,
    'Student Rating': v.rating !== null ? `${v.rating} / 5.0` : 'N/A',
    'Learning Hours': `${v.learningHours} hrs`,
    'Performance Score (0-100)': v.performanceScore !== null ? v.performanceScore : 'N/A',
    Status: v.status,
  }));

  const wsVisitPerf =
    visitPerfData.length > 0
      ? XLSX.utils.json_to_sheet(visitPerfData)
      : XLSX.utils.aoa_to_sheet([['No visits found in selected scope.']]);
  XLSX.utils.book_append_sheet(wb, wsVisitPerf, 'Visit Performance');

  // --- SHEET 4: ATTENDANCE ---
  const attendanceData: any[] = [];
  inScopeExperiences.forEach((exp) => {
    const records = db.getAttendanceByExperience(exp.id);
    records.forEach((att) => {
      const student = studentMap.get(att.studentId);
      if (student && !matchesStudentFilters(student)) return;

      const yearLabel = student
        ? student.year === 1
          ? 'First Year'
          : student.year === 2
          ? 'Second Year'
          : student.year === 3
          ? 'Third Year'
          : 'Fourth Year'
        : 'N/A';

      attendanceData.push({
        'Attendance Record ID': att.id,
        'Marked Date': att.timestamp ? new Date(att.timestamp).toLocaleDateString() : exp.date,
        'Visit Title': exp.title,
        Organization: exp.organization,
        Category: exp.experienceType,
        'Student Roll No': att.studentId,
        'Student Name': student ? student.name : 'Unknown Student',
        Branch: student ? student.branch : 'N/A',
        'Student Year': yearLabel,
        'Attendance Status': att.status,
        Notes: att.notes || '',
      });
    });
  });

  const wsAttendance =
    attendanceData.length > 0
      ? XLSX.utils.json_to_sheet(attendanceData)
      : XLSX.utils.aoa_to_sheet([['No marked attendance records found.']]);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance');

  // --- SHEET 5: WAITING LIST ---
  const waitlistData: any[] = [];
  inScopeExperiences.forEach((exp) => {
    const waitEntries = db.getWaitlistByExperience(exp.id);
    waitEntries.forEach((w) => {
      const student = studentMap.get(w.studentId);
      if (student && !matchesStudentFilters(student)) return;

      const yearLabel = student
        ? student.year === 1
          ? 'First Year'
          : student.year === 2
          ? 'Second Year'
          : student.year === 3
          ? 'Third Year'
          : 'Fourth Year'
        : 'N/A';

      waitlistData.push({
        'Waitlist ID': w.id,
        Position: w.position,
        'Visit Title': exp.title,
        Organization: exp.organization,
        'Student Roll No': w.studentId,
        'Student Name': student ? student.name : 'Unknown Student',
        Branch: student ? student.branch : 'N/A',
        'Student Year': yearLabel,
        Status: w.status,
        'Requested Date': w.joinedAt ? new Date(w.joinedAt).toLocaleDateString() : 'N/A',
      });
    });
  });

  const wsWaitlist =
    waitlistData.length > 0
      ? XLSX.utils.json_to_sheet(waitlistData)
      : XLSX.utils.aoa_to_sheet([['No waitlisted student requests found.']]);
  XLSX.utils.book_append_sheet(wb, wsWaitlist, 'Waiting List');

  // --- SHEET 6: CERTIFICATES ---
  const certificateData: any[] = [];
  inScopeExperiences.forEach((exp) => {
    const certs = db.getCertificatesByExperience(exp.id);
    certs.forEach((c) => {
      const student = studentMap.get(c.studentId);
      if (student && !matchesStudentFilters(student)) return;

      const yearLabel = student
        ? student.year === 1
          ? 'First Year'
          : student.year === 2
          ? 'Second Year'
          : student.year === 3
          ? 'Third Year'
          : 'Fourth Year'
        : 'N/A';

      certificateData.push({
        'Certificate ID': c.id,
        'Certificate Number': c.certificateId || c.id,
        'Issue Date': c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : 'N/A',
        'Visit Title': exp.title,
        Organization: exp.organization,
        Category: exp.experienceType,
        'Student Roll No': c.studentId,
        'Student Name': student ? student.name : 'Unknown Student',
        Branch: student ? student.branch : 'N/A',
        'Student Year': yearLabel,
        'Credit Hours': (c as any).creditHours || exp.learningHours || 8,
      });
    });
  });

  const wsCertificates =
    certificateData.length > 0
      ? XLSX.utils.json_to_sheet(certificateData)
      : XLSX.utils.aoa_to_sheet([['No verified certificates found in selected scope.']]);
  XLSX.utils.book_append_sheet(wb, wsCertificates, 'Certificates');

  // --- SHEET 7: FEEDBACK ---
  const feedbackData: any[] = [];
  inScopeExperiences.forEach((exp) => {
    const fbList = db.getFeedbackByExperience(exp.id);
    fbList.forEach((fb) => {
      feedbackData.push({
        'Feedback ID': fb.id,
        'Submitted Date': fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString() : 'N/A',
        'Student ID': fb.studentId,
        'Visit ID': exp.id,
        'Visit Title': exp.title,
        Organization: exp.organization,
        Category: exp.experienceType,
        'Overall Rating (1-5)': fb.overallRating || fb.rating,
        'Technical Exposure Rating': fb.technicalExposureRating || 'N/A',
        'Faculty Coordination Rating': fb.facultyCoordinationRating || 'N/A',
        'Organization Rating': fb.organizationRating || 'N/A',
        'Learning Value Rating': fb.learningValueRating || 'N/A',
        'Would Recommend': fb.recommend !== undefined ? (fb.recommend === true || fb.recommend === 'YES' ? 'Yes' : 'No') : 'N/A',
        'Valuable Learnings': fb.positiveComment || fb.comments || '',
        'Suggestions for Improvement': fb.improvementComment || '',
        Comments: fb.comments || '',
      });
    });
  });

  const wsFeedback =
    feedbackData.length > 0
      ? XLSX.utils.json_to_sheet(feedbackData)
      : XLSX.utils.aoa_to_sheet([['No student feedback submissions found in selected scope.']]);
  XLSX.utils.book_append_sheet(wb, wsFeedback, 'Feedback');

  // --- SHEET 8: BRANCH ANALYTICS ---
  const branchData = analytics.branchAnalytics.map((b) => ({
    'Branch Name': b.branch,
    'Registered Students': b.registered,
    'Attended Students': b.attended,
    'Attendance Rate %': `${b.attendancePercentage}%`,
    'Certificates Issued': b.certificates,
  }));

  const wsBranch =
    branchData.length > 0
      ? XLSX.utils.json_to_sheet(branchData)
      : XLSX.utils.aoa_to_sheet([['No branch analytics available.']]);
  XLSX.utils.book_append_sheet(wb, wsBranch, 'Branch Analytics');

  // Write workbook to buffer
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}
