import { db } from './db';
import { EffectiveAnalyticsFilters, AnalyticsUserScope } from './analyticsAuth';
import { Experience, StudentProfile, AttendanceRecord, Registration, Certificate, ExperienceFeedback } from '../src/types';

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

  trends: Array<{
    period: string;
    visitCount: number;
    studentCount: number;
    completedCount: number;
  }>;

  recentCompletedVisits: Array<{
    id: string;
    title: string;
    organization: string;
    date: string;
    attended: number;
    attendancePercentage: number;
    rating: number | null;
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

/**
 * FORMULA: Transparent Normalized Visit Performance Score (0 - 100)
 *
 * Requirements & Constraints:
 * - Applicable strictly to COMPLETED visits.
 * - Multi-component weighted scoring prevents any single metric from dominating.
 * - Missing metrics (e.g. no student feedback rating) are handled explicitly:
 *   they are excluded from the calculation, and remaining metric weights are dynamically re-weighted
 *   so the active weights sum to 100%.
 *
 * Components & Base Weights:
 * 1. Attendance Rate Score (S_att): (Present / Marked) * 100 [Base Weight: 35%]
 * 2. Seat Utilization Score (S_util): Min(100, (Registrations / Capacity) * 100) [Base Weight: 25%]
 * 3. Student Rating Score (S_rating): (AverageRating / 5.0) * 100 [Base Weight: 20%] (Missing if rating === null)
 * 4. Learning Credit Score (S_learn): Min(100, (LearningHours / 12) * 100) [Base Weight: 10%]
 * 5. Participation Volume Score (S_vol): Min(100, (AttendedCount / MaxAttendedInScope) * 100) [Base Weight: 10%]
 *
 * Mathematical Formula:
 * Composite Score = Sum(W_m * S_m) / Sum(W_m) for all m in Active_Metrics
 */
export function calculateVisitPerformanceScore(params: {
  attendancePercentage: number;
  capacity: number;
  registrations: number;
  rating: number | null;
  learningHours: number;
  attended: number;
  maxAttendedInScope: number;
}): number {
  const { attendancePercentage, capacity, registrations, rating, learningHours, attended, maxAttendedInScope } = params;

  let totalWeightedScore = 0;
  let totalActiveWeight = 0;

  // 1. Attendance Rate Score (35%)
  const S_att = Math.min(100, Math.max(0, attendancePercentage));
  const W_att = 0.35;
  totalWeightedScore += S_att * W_att;
  totalActiveWeight += W_att;

  // 2. Seat Utilization Score (25%)
  const utilPct = capacity > 0 ? (registrations / capacity) * 100 : 0;
  const S_util = Math.min(100, Math.max(0, utilPct));
  const W_util = 0.25;
  totalWeightedScore += S_util * W_util;
  totalActiveWeight += W_util;

  // 3. Student Rating Score (20% if present)
  if (rating !== null && rating !== undefined) {
    const S_rating = Math.min(100, Math.max(0, (rating / 5.0) * 100));
    const W_rating = 0.20;
    totalWeightedScore += S_rating * W_rating;
    totalActiveWeight += W_rating;
  }

  // 4. Learning Value Score (10%)
  const S_learn = Math.min(100, Math.max(0, (learningHours / 12.0) * 100));
  const W_learn = 0.10;
  totalWeightedScore += S_learn * W_learn;
  totalActiveWeight += W_learn;

  // 5. Participation Volume Score (10%)
  const volPct = maxAttendedInScope > 0 ? (attended / maxAttendedInScope) * 100 : 0;
  const S_vol = Math.min(100, Math.max(0, volPct));
  const W_vol = 0.10;
  totalWeightedScore += S_vol * W_vol;
  totalActiveWeight += W_vol;

  if (totalActiveWeight === 0) return 0;
  return parseFloat((totalWeightedScore / totalActiveWeight).toFixed(1));
}

/**
 * Calculates learning hours for an experience.
 * Reuses explicit learningHours if present, or derives from duration.
 */
function getLearningHours(exp: Experience): number {
  if (exp.learningHours && exp.learningHours > 0) {
    return exp.learningHours;
  }
  if (exp.duration) {
    const match = exp.duration.match(/(\d+)\s*hour/i);
    if (match) return parseInt(match[1], 10);
  }
  return 8; // Default 1 full day = 8 learning credit hours
}

/**
 * Central Analytics Aggregator Service.
 * Computes live metrics dynamically from the database based on scope and filters.
 */
export function calculateAnalytics(
  scope: AnalyticsUserScope,
  filters: EffectiveAnalyticsFilters
): AnalyticsOverviewResult {
  // 1. Fetch all raw entities from database
  let allExperiences = db.getExperiences();
  const allStudents = db.getAllStudents();
  const studentMap = new Map<string, StudentProfile>();
  allStudents.forEach((s) => studentMap.set(s.studentId, s));

  // 2. Filter experiences based on authorization scope and active filters
  let filteredExperiences = allExperiences;

  // Scope constraints
  if (scope.scopeType === 'DEPARTMENT' && scope.departmentScope) {
    if (scope.authorizedVisitIds) {
      filteredExperiences = filteredExperiences.filter((e) => scope.authorizedVisitIds!.includes(e.id));
    }
  } else if (scope.scopeType === 'FACULTY_ASSIGNED' && scope.authorizedVisitIds) {
    filteredExperiences = filteredExperiences.filter((e) => scope.authorizedVisitIds!.includes(e.id));
  }

  // Filter: visitId
  if (filters.visitId && filters.visitId !== 'ALL' && filters.visitId !== '__NO_ACCESS__') {
    filteredExperiences = filteredExperiences.filter((e) => e.id === filters.visitId);
  }

  // Filter: status
  if (filters.status && filters.status !== 'ALL') {
    filteredExperiences = filteredExperiences.filter((e) => e.status === filters.status);
  }

  // Filter: department
  if (filters.department && filters.department !== 'ALL' && filters.department !== '__NO_ACCESS__') {
    const deptStudents = allStudents.filter((s) => s.department === filters.department).map((s) => s.studentId);
    filteredExperiences = filteredExperiences.filter((e) => {
      // Keep if created/assigned to dept faculty, or has registered students from dept
      const fac = db.getFacultyProfileByUserId(e.primaryFacultyId || e.createdBy);
      if (fac && fac.department === filters.department) return true;
      const regs = db.getRegistrationsByExperience(e.id);
      return regs.some((r) => deptStudents.includes(r.studentId));
    });
  }

  // Filter: visitType
  if (filters.visitType && filters.visitType !== 'ALL' && filters.visitType !== 'All Experience') {
    const targetType = filters.visitType.toLowerCase();
    filteredExperiences = filteredExperiences.filter((e) => {
      const expType = (e.experienceType || '').toLowerCase();
      if (targetType.includes('industrial')) return expType.includes('industrial');
      if (targetType.includes('field')) return expType.includes('field');
      if (targetType.includes('technical') || targetType.includes('tour')) {
        return expType.includes('tour') || expType.includes('technical');
      }
      return expType === targetType || expType.includes(targetType);
    });
  }

  // Filter: location
  if (filters.location && filters.location !== 'ALL' && filters.location !== 'All Locations') {
    const targetLoc = filters.location.toLowerCase();
    filteredExperiences = filteredExperiences.filter((e) => e.location.toLowerCase().includes(targetLoc));
  }

  // Filter: startDate & endDate
  if (filters.startDate) {
    filteredExperiences = filteredExperiences.filter((e) => e.date >= filters.startDate!);
  }
  if (filters.endDate) {
    filteredExperiences = filteredExperiences.filter((e) => e.date <= filters.endDate!);
  }

  // Filter: academicYear
  if (filters.academicYear && filters.academicYear !== 'ALL') {
    filteredExperiences = filteredExperiences.filter((e) => {
      const year = new Date(e.date).getFullYear();
      if (filters.academicYear === '2025-2026') return year === 2025 || year === 2026;
      if (filters.academicYear === '2024-2025') return year === 2024 || year === 2025;
      return e.date.includes(filters.academicYear!);
    });
  }

  // Filter: branch
  if (filters.branch && filters.branch !== 'ALL' && filters.branch !== '__NO_ACCESS__') {
    filteredExperiences = filteredExperiences.filter((e) => {
      if (e.eligibility?.allowedBranches?.includes(filters.branch!)) return true;
      const regs = db.getRegistrationsByExperience(e.id);
      return regs.some((r) => {
        const student = studentMap.get(r.studentId);
        return student?.branch === filters.branch;
      });
    });
  }

  const inScopeVisitIds = new Set(filteredExperiences.map((e) => e.id));
  const completedExperiences = filteredExperiences.filter((e) => e.status === 'COMPLETED');
  const completedVisitIds = new Set(completedExperiences.map((e) => e.id));

  // 3. Aggregate Registrations across in-scope visits
  const allRegistrations: Registration[] = [];
  filteredExperiences.forEach((e) => {
    const regs = db.getRegistrationsByExperience(e.id);
    regs.forEach((r) => {
      const student = studentMap.get(r.studentId);
      if (!student) return;
      if (filters.department && filters.department !== 'ALL' && student.department !== filters.department) return;
      if (filters.branch && filters.branch !== 'ALL' && student.branch !== filters.branch) return;
      if (filters.year && student.year !== filters.year) return;
      allRegistrations.push(r);
    });
  });

  // 4. Aggregate Attendance Records across in-scope COMPLETED visits
  const allAttendance: AttendanceRecord[] = [];
  completedExperiences.forEach((e) => {
    const atts = db.getAttendanceByExperience(e.id);
    atts.forEach((a) => {
      const student = studentMap.get(a.studentId);
      if (!student) return;
      if (filters.department && filters.department !== 'ALL' && student.department !== filters.department) return;
      if (filters.branch && filters.branch !== 'ALL' && student.branch !== filters.branch) return;
      if (filters.year && student.year !== filters.year) return;
      allAttendance.push(a);
    });
  });

  // 5. Aggregate Waitlist Entries across in-scope visits
  const allWaitlist: Array<{ visitId: string; visitTitle: string; count: number; capacity: number }> = [];
  let totalWaitlisted = 0;
  filteredExperiences.forEach((e) => {
    const wl = db.getWaitlistByExperience(e.id);
    const count = wl.filter((w) => w.status === 'ACTIVE').length;
    totalWaitlisted += count;
    if (count > 0) {
      allWaitlist.push({
        visitId: e.id,
        visitTitle: e.title,
        count,
        capacity: e.capacity,
      });
    }
  });

  // 6. Aggregate Certificates across in-scope visits
  const allCertificates: Certificate[] = [];
  filteredExperiences.forEach((e) => {
    const certs = db.getCertificatesByExperience(e.id);
    certs.forEach((c) => {
      const student = studentMap.get(c.studentId);
      if (!student) return;
      if (filters.department && filters.department !== 'ALL' && student.department !== filters.department) return;
      if (filters.branch && filters.branch !== 'ALL' && student.branch !== filters.branch) return;
      allCertificates.push(c);
    });
  });

  // 7. Aggregate Feedback across in-scope visits
  const allFeedback: ExperienceFeedback[] = [];
  filteredExperiences.forEach((e) => {
    const fbList = db.getFeedbackByExperience(e.id);
    fbList.forEach((f) => {
      const student = studentMap.get(f.studentId);
      if (!student) return;
      if (filters.department && filters.department !== 'ALL' && student.department !== filters.department) return;
      if (filters.branch && filters.branch !== 'ALL' && student.branch !== filters.branch) return;
      allFeedback.push(f);
    });
  });

  // --- CALCULATE METRICS ---

  // Unique students participated
  const uniqueStudents = new Set<string>();
  allRegistrations.forEach((r) => uniqueStudents.add(r.studentId));
  allAttendance.forEach((a) => {
    if (a.status === 'PRESENT') uniqueStudents.add(a.studentId);
  });

  // Total Learning Hours delivered to students in completed visits
  let totalLearningHours = 0;
  completedExperiences.forEach((e) => {
    const hours = getLearningHours(e);
    const presentCount = allAttendance.filter((a) => a.experienceId === e.id && a.status === 'PRESENT').length;
    totalLearningHours += hours * Math.max(presentCount, 1);
  });

  // Attendance breakdown
  const presentCount = allAttendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = allAttendance.filter((a) => a.status === 'ABSENT').length;
  const lateCount = allAttendance.filter((a) => a.status === 'LATE').length;
  const excusedCount = allAttendance.filter((a) => a.status === 'EXCUSED').length;
  const totalMarked = allAttendance.length;
  const overallAttendancePercentage = totalMarked > 0 ? parseFloat(((presentCount / totalMarked) * 100).toFixed(1)) : 0;

  // Feedback overall rating and multi-criteria averages
  let averageRating: number | null = null;
  let technicalExposureAvg: number | null = null;
  let facultyCoordinationAvg: number | null = null;
  let organizationAvg: number | null = null;
  let learningValueAvg: number | null = null;
  let wouldRecommendPercentage: number | null = null;
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (allFeedback.length > 0) {
    const sumRating = allFeedback.reduce((acc, f) => acc + (f.overallRating || f.rating || 5), 0);
    averageRating = parseFloat((sumRating / allFeedback.length).toFixed(1));

    const techList = allFeedback.filter((f) => f.technicalExposureRating !== undefined && f.technicalExposureRating !== null).map((f) => f.technicalExposureRating!);
    if (techList.length > 0) {
      technicalExposureAvg = parseFloat((techList.reduce((a, b) => a + b, 0) / techList.length).toFixed(1));
    }

    const coordList = allFeedback.filter((f) => f.facultyCoordinationRating !== undefined && f.facultyCoordinationRating !== null).map((f) => f.facultyCoordinationRating!);
    if (coordList.length > 0) {
      facultyCoordinationAvg = parseFloat((coordList.reduce((a, b) => a + b, 0) / coordList.length).toFixed(1));
    }

    const orgList = allFeedback.filter((f) => f.organizationRating !== undefined && f.organizationRating !== null).map((f) => f.organizationRating!);
    if (orgList.length > 0) {
      organizationAvg = parseFloat((orgList.reduce((a, b) => a + b, 0) / orgList.length).toFixed(1));
    }

    const lvList = allFeedback.filter((f) => f.learningValueRating !== undefined && f.learningValueRating !== null).map((f) => f.learningValueRating!);
    if (lvList.length > 0) {
      learningValueAvg = parseFloat((lvList.reduce((a, b) => a + b, 0) / lvList.length).toFixed(1));
    }

    const recList = allFeedback.filter((f) => f.recommend !== undefined && f.recommend !== null);
    if (recList.length > 0) {
      const recYes = recList.filter((f) => f.recommend === true || f.recommend === 'YES').length;
      wouldRecommendPercentage = parseFloat(((recYes / recList.length) * 100).toFixed(1));
    }

    allFeedback.forEach((f) => {
      const r = Math.round(f.overallRating || f.rating || 5);
      if (r >= 1 && r <= 5) {
        ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
      }
    });
  }

  // Branch Analytics
  const branchMap = new Map<string, { registered: Set<string>; attended: number; totalAtt: number; certs: number }>();
  allStudents.forEach((s) => {
    if (s.branch && !branchMap.has(s.branch)) {
      branchMap.set(s.branch, { registered: new Set(), attended: 0, totalAtt: 0, certs: 0 });
    }
  });

  allRegistrations.forEach((r) => {
    const s = studentMap.get(r.studentId);
    if (s && branchMap.has(s.branch)) {
      branchMap.get(s.branch)!.registered.add(r.studentId);
    }
  });

  allAttendance.forEach((a) => {
    const s = studentMap.get(a.studentId);
    if (s && branchMap.has(s.branch)) {
      const bData = branchMap.get(s.branch)!;
      bData.totalAtt += 1;
      if (a.status === 'PRESENT') bData.attended += 1;
    }
  });

  allCertificates.forEach((c) => {
    const s = studentMap.get(c.studentId);
    if (s && branchMap.has(s.branch)) {
      branchMap.get(s.branch)!.certs += 1;
    }
  });

  let branchAnalytics = Array.from(branchMap.entries()).map(([branch, d]) => ({
    branch,
    registered: d.registered.size,
    attended: d.attended,
    attendancePercentage: d.totalAtt > 0 ? parseFloat(((d.attended / d.totalAtt) * 100).toFixed(1)) : 0,
    certificates: d.certs,
  }));

  if (filters.branch && filters.branch !== 'ALL' && filters.branch !== 'All Branches') {
    branchAnalytics = branchAnalytics.filter((b) => b.branch === filters.branch);
  }

  // Year Analytics (First Year, Second Year, Third Year, Fourth Year)
  const yearMap = new Map<number, { registered: Set<string>; attended: number; totalAtt: number }>();
  [1, 2, 3, 4].forEach((y) => yearMap.set(y, { registered: new Set(), attended: 0, totalAtt: 0 }));

  allRegistrations.forEach((r) => {
    const s = studentMap.get(r.studentId);
    if (s && yearMap.has(s.year)) {
      yearMap.get(s.year)!.registered.add(r.studentId);
    }
  });

  allAttendance.forEach((a) => {
    const s = studentMap.get(a.studentId);
    if (s && yearMap.has(s.year)) {
      const yData = yearMap.get(s.year)!;
      yData.totalAtt += 1;
      if (a.status === 'PRESENT') yData.attended += 1;
    }
  });

  const yearLabels: Record<number, string> = {
    1: 'First Year',
    2: 'Second Year',
    3: 'Third Year',
    4: 'Fourth Year',
  };

  const yearAnalytics = Array.from(yearMap.entries()).map(([year, d]) => ({
    year,
    yearLabel: yearLabels[year] || `Year ${year}`,
    registered: d.registered.size,
    attended: d.attended,
    attendancePercentage: d.totalAtt > 0 ? parseFloat(((d.attended / d.totalAtt) * 100).toFixed(1)) : 0,
  }));

  // Visit Type Analytics (strictly Industrial Visit, Field Research, Technical Tour)
  const standardTypes = ['Industrial Visit', 'Field Research', 'Technical Tour'];
  const typeMap = new Map<string, { visits: number; students: Set<string>; attended: number; totalAtt: number; hours: number }>();
  standardTypes.forEach((t) => {
    typeMap.set(t, { visits: 0, students: new Set(), attended: 0, totalAtt: 0, hours: 0 });
  });

  filteredExperiences.forEach((e) => {
    let t = 'Industrial Visit';
    const rawType = (e.experienceType || '').toLowerCase();
    if (rawType.includes('field')) t = 'Field Research';
    else if (rawType.includes('tour') || rawType.includes('technical')) t = 'Technical Tour';
    else t = 'Industrial Visit';

    const data = typeMap.get(t)!;
    data.visits += 1;

    const regs = db.getRegistrationsByExperience(e.id);
    regs.forEach((r) => {
      const s = studentMap.get(r.studentId);
      if (!s) return;
      if (filters.branch && filters.branch !== 'ALL' && s.branch !== filters.branch) return;
      if (filters.year && s.year !== filters.year) return;
      data.students.add(r.studentId);
    });

    if (e.status === 'COMPLETED') {
      const atts = db.getAttendanceByExperience(e.id);
      atts.forEach((a) => {
        const s = studentMap.get(a.studentId);
        if (!s) return;
        if (filters.branch && filters.branch !== 'ALL' && s.branch !== filters.branch) return;
        if (filters.year && s.year !== filters.year) return;
        data.totalAtt += 1;
        if (a.status === 'PRESENT') data.attended += 1;
      });
      data.hours += getLearningHours(e);
    }
  });

  const visitTypeAnalytics = Array.from(typeMap.entries()).map(([type, d]) => ({
    type,
    visits: d.visits,
    students: d.students.size,
    attendancePercentage: d.totalAtt > 0 ? parseFloat(((d.attended / d.totalAtt) * 100).toFixed(1)) : 0,
    learningHours: d.hours,
  }));

  // Max attended count across completed visits for volume normalization
  const maxAttendedInScope = Math.max(
    1,
    ...completedExperiences.map((e) => {
      const atts = db.getAttendanceByExperience(e.id);
      return atts.filter((a) => a.status === 'PRESENT').length;
    })
  );

  // Visit Performance
  const visitPerformance = filteredExperiences.map((e) => {
    const regs = db.getRegistrationsByExperience(e.id);
    const wl = db.getWaitlistByExperience(e.id).filter((w) => w.status === 'ACTIVE');
    const atts = db.getAttendanceByExperience(e.id);
    const presentAtts = atts.filter((a) => a.status === 'PRESENT').length;
    const attPct = atts.length > 0 ? parseFloat(((presentAtts / atts.length) * 100).toFixed(1)) : 0;

    const fbList = db.getFeedbackByExperience(e.id);
    const avgFb = fbList.length > 0 ? parseFloat((fbList.reduce((acc, f) => acc + f.rating, 0) / fbList.length).toFixed(1)) : null;
    const hours = getLearningHours(e);

    const perfScore = e.status === 'COMPLETED'
      ? calculateVisitPerformanceScore({
          attendancePercentage: attPct,
          capacity: e.capacity,
          registrations: regs.length,
          rating: avgFb,
          learningHours: hours,
          attended: presentAtts,
          maxAttendedInScope,
        })
      : null;

    return {
      id: e.id,
      title: e.title,
      organization: e.organization,
      experienceType: e.experienceType,
      date: e.date,
      location: e.location,
      capacity: e.capacity,
      registrations: regs.length,
      waitlistCount: wl.length,
      attended: presentAtts,
      attendancePercentage: attPct,
      rating: avgFb,
      learningHours: hours,
      performanceScore: perfScore,
      status: e.status,
    };
  });

  // Seat Utilization
  const totalCapacity = filteredExperiences.reduce((sum, e) => sum + e.capacity, 0);
  const totalRegistrations = allRegistrations.length;
  const utilizationPercentage = totalCapacity > 0 ? parseFloat(((totalRegistrations / totalCapacity) * 100).toFixed(1)) : 0;

  // Certificates Breakdown
  const certsByBranch: Record<string, number> = {};
  allCertificates.forEach((c) => {
    const s = studentMap.get(c.studentId);
    if (s) {
      certsByBranch[s.branch] = (certsByBranch[s.branch] || 0) + 1;
    }
  });

  const certsByVisit = filteredExperiences.map((e) => ({
    visitId: e.id,
    visitTitle: e.title,
    count: db.getCertificatesByExperience(e.id).length,
  }));

  // Industry Exposure
  const industryMap = new Map<string, { visits: number; students: Set<string>; hours: number }>();
  filteredExperiences.forEach((e) => {
    const ind = e.organizationIndustry || 'Industrial Engineering';
    if (!industryMap.has(ind)) {
      industryMap.set(ind, { visits: 0, students: new Set(), hours: 0 });
    }
    const data = industryMap.get(ind)!;
    data.visits += 1;
    const regs = db.getRegistrationsByExperience(e.id);
    regs.forEach((r) => data.students.add(r.studentId));
    if (e.status === 'COMPLETED') {
      data.hours += getLearningHours(e);
    }
  });

  const industryExposure = Array.from(industryMap.entries()).map(([industry, d]) => ({
    industry,
    visitCount: d.visits,
    studentReach: d.students.size,
    totalHours: d.hours,
  }));

  // Location Exposure
  const locMap = new Map<string, { visits: number; students: Set<string> }>();
  filteredExperiences.forEach((e) => {
    const loc = e.location || 'Maharashtra';
    if (!locMap.has(loc)) {
      locMap.set(loc, { visits: 0, students: new Set() });
    }
    const data = locMap.get(loc)!;
    data.visits += 1;
    const regs = db.getRegistrationsByExperience(e.id);
    regs.forEach((r) => data.students.add(r.studentId));
  });

  const locationExposure = Array.from(locMap.entries()).map(([location, d]) => ({
    location,
    visitCount: d.visits,
    studentCount: d.students.size,
  }));

  // Monthly / Period Trends
  const trendMap = new Map<string, { visits: number; students: Set<string>; completed: number }>();
  filteredExperiences.forEach((e) => {
    const period = e.date ? e.date.substring(0, 7) : '2026-07';
    if (!trendMap.has(period)) {
      trendMap.set(period, { visits: 0, students: new Set(), completed: 0 });
    }
    const data = trendMap.get(period)!;
    data.visits += 1;
    if (e.status === 'COMPLETED') data.completed += 1;
    const regs = db.getRegistrationsByExperience(e.id);
    regs.forEach((r) => data.students.add(r.studentId));
  });

  const trends = Array.from(trendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, d]) => ({
      period,
      visitCount: d.visits,
      studentCount: d.students.size,
      completedCount: d.completed,
    }));

  // Recent Completed Visits
  const recentCompletedVisits = completedExperiences
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((e) => {
      const atts = db.getAttendanceByExperience(e.id);
      const present = atts.filter((a) => a.status === 'PRESENT').length;
      const attPct = atts.length > 0 ? parseFloat(((present / atts.length) * 100).toFixed(1)) : 0;
      const fb = db.getFeedbackByExperience(e.id);
      const avgRating = fb.length > 0 ? parseFloat((fb.reduce((acc, f) => acc + f.rating, 0) / fb.length).toFixed(1)) : null;

      return {
        id: e.id,
        title: e.title,
        organization: e.organization,
        date: e.date,
        attended: present,
        attendancePercentage: attPct,
        rating: avgRating,
      };
    });

  // Top Performing Visits (COMPLETED VISITS ONLY, ranked by performanceScore descending)
  const topPerformingVisits = visitPerformance
    .filter((v) => v.status === 'COMPLETED' && v.performanceScore !== null)
    .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
    .map((v, idx) => ({
      id: v.id,
      rank: idx + 1,
      title: v.title,
      organization: v.organization,
      attendancePercentage: v.attendancePercentage,
      rating: v.rating,
      registrations: v.registrations,
      attended: v.attended,
      performanceScore: v.performanceScore || 0,
      capacity: v.capacity,
      learningHours: v.learningHours,
    }));

  return {
    scopeSummary: {
      scopeType: scope.scopeType,
      isHod: scope.isHod,
      departmentScope: scope.departmentScope,
      enforcedFilters: {
        department: filters.department,
        branch: filters.branch,
        visitId: filters.visitId,
        status: filters.status,
        academicYear: filters.academicYear,
      },
    },
    summaryKpis: {
      uniqueStudentsParticipated: uniqueStudents.size,
      completedVisits: completedExperiences.length,
      totalVisitsInScope: filteredExperiences.length,
      averageAttendance: overallAttendancePercentage,
      totalLearningHours,
      totalRegistrations: allRegistrations.length,
      waitlistedStudents: totalWaitlisted,
      certificatesIssued: allCertificates.length,
      averageRating,
    },
    branchAnalytics,
    yearAnalytics,
    attendanceBreakdown: {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      totalMarked,
      attendancePercentage: overallAttendancePercentage,
    },
    visitTypeAnalytics,
    visitPerformance,
    seatUtilization: {
      totalCapacity,
      totalRegistrations,
      utilizationPercentage,
    },
    waitingListAnalytics: {
      totalWaitlisted,
      waitlistByVisit: allWaitlist,
    },
    certificateAnalytics: {
      totalCertificates: allCertificates.length,
      certificatesByBranch: certsByBranch,
      certificatesByVisit: certsByVisit,
    },
    feedbackAnalytics: {
      totalFeedbackCount: allFeedback.length,
      averageRating,
      technicalExposureAvg,
      facultyCoordinationAvg,
      organizationAvg,
      learningValueAvg,
      wouldRecommendPercentage,
      ratingDistribution,
    },
    industryExposure,
    locationExposure,
    trends,
    recentCompletedVisits,
    topPerformingVisits,
  };
}
