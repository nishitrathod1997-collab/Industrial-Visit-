import {
  StudentProfile,
  Experience,
  Registration,
  WaitlistEntry,
  AttendanceRecord,
  Certificate,
  ExperienceFeedback,
} from '../types';

export interface DataIntegrityReport {
  timestamp: string;
  totalStudents: number;
  totalExperiences: number;
  totalRegistrations: number;
  totalWaitlistEntries: number;
  totalAttendanceRecords: number;
  totalCertificates: number;
  totalFeedbackEntries: number;
  orphanRegistrations: Array<{ id: string; studentId: string; experienceId: string; reason: string }>;
  orphanWaitlistEntries: Array<{ id: string; studentId: string; experienceId: string; reason: string }>;
  orphanAttendanceRecords: Array<{ id: string; studentId: string; experienceId: string; reason: string }>;
  orphanCertificates: Array<{ id: string; studentId: string; experienceId: string; reason: string }>;
  orphanFeedbackEntries: Array<{ id: string; studentId: string; experienceId: string; reason: string }>;
  studentsWithMissingFields: Array<{ studentId: string; name: string; missing: string[] }>;
  experiencesWithInvalidFaculty: Array<{ id: string; title: string; primaryFacultyId: string }>;
  summaryStatus: 'HEALTHY' | 'WARNINGS_FOUND';
}

/**
 * Non-destructive data integrity audit utility.
 * Verifies relationships across Student, Visit, Registration, Waitlist, Attendance, Certificate, and Feedback entities.
 * DOES NOT delete or alter any records automatically.
 */
export function auditDataIntegrity(data: {
  students: StudentProfile[];
  experiences: Experience[];
  registrations: Registration[];
  waitlist: WaitlistEntry[];
  attendance: AttendanceRecord[];
  certificates: Certificate[];
  feedback?: ExperienceFeedback[];
  faculty?: any[];
}): DataIntegrityReport {
  const studentMap = new Map<string, StudentProfile>();
  (data.students || []).forEach((s) => studentMap.set(s.studentId, s));

  const experienceMap = new Map<string, Experience>();
  (data.experiences || []).forEach((e) => experienceMap.set(e.id, e));

  const facultyIds = new Set<string>();
  (data.faculty || []).forEach((f) => {
    if (f.facultyId) facultyIds.add(f.facultyId);
    if (f.userId) facultyIds.add(f.userId);
  });

  const orphanRegistrations: Array<{ id: string; studentId: string; experienceId: string; reason: string }> = [];
  (data.registrations || []).forEach((r) => {
    const hasStudent = studentMap.has(r.studentId);
    const hasExp = experienceMap.has(r.experienceId);
    if (!hasStudent || !hasExp) {
      orphanRegistrations.push({
        id: r.id,
        studentId: r.studentId,
        experienceId: r.experienceId,
        reason: !hasStudent && !hasExp ? 'Missing student & experience' : !hasStudent ? 'Missing student' : 'Missing experience',
      });
    }
  });

  const orphanWaitlistEntries: Array<{ id: string; studentId: string; experienceId: string; reason: string }> = [];
  (data.waitlist || []).forEach((w) => {
    const hasStudent = studentMap.has(w.studentId);
    const hasExp = experienceMap.has(w.experienceId);
    if (!hasStudent || !hasExp) {
      orphanWaitlistEntries.push({
        id: w.id,
        studentId: w.studentId,
        experienceId: w.experienceId,
        reason: !hasStudent && !hasExp ? 'Missing student & experience' : !hasStudent ? 'Missing student' : 'Missing experience',
      });
    }
  });

  const orphanAttendanceRecords: Array<{ id: string; studentId: string; experienceId: string; reason: string }> = [];
  (data.attendance || []).forEach((a) => {
    const hasStudent = studentMap.has(a.studentId);
    const hasExp = experienceMap.has(a.experienceId);
    if (!hasStudent || !hasExp) {
      orphanAttendanceRecords.push({
        id: a.id,
        studentId: a.studentId,
        experienceId: a.experienceId,
        reason: !hasStudent && !hasExp ? 'Missing student & experience' : !hasStudent ? 'Missing student' : 'Missing experience',
      });
    }
  });

  const orphanCertificates: Array<{ id: string; studentId: string; experienceId: string; reason: string }> = [];
  (data.certificates || []).forEach((c) => {
    const hasStudent = studentMap.has(c.studentId);
    const hasExp = experienceMap.has(c.experienceId);
    if (!hasStudent || !hasExp) {
      orphanCertificates.push({
        id: c.id,
        studentId: c.studentId,
        experienceId: c.experienceId,
        reason: !hasStudent && !hasExp ? 'Missing student & experience' : !hasStudent ? 'Missing student' : 'Missing experience',
      });
    }
  });

  const orphanFeedbackEntries: Array<{ id: string; studentId: string; experienceId: string; reason: string }> = [];
  (data.feedback || []).forEach((fb) => {
    const hasStudent = studentMap.has(fb.studentId);
    const hasExp = experienceMap.has(fb.experienceId);
    if (!hasStudent || !hasExp) {
      orphanFeedbackEntries.push({
        id: fb.id,
        studentId: fb.studentId,
        experienceId: fb.experienceId,
        reason: !hasStudent && !hasExp ? 'Missing student & experience' : !hasStudent ? 'Missing student' : 'Missing experience',
      });
    }
  });

  const studentsWithMissingFields: Array<{ studentId: string; name: string; missing: string[] }> = [];
  (data.students || []).forEach((s) => {
    const missing: string[] = [];
    if (!s.branch) missing.push('branch');
    if (!s.department) missing.push('department');
    if (!s.year) missing.push('year');
    if (missing.length > 0) {
      studentsWithMissingFields.push({
        studentId: s.studentId,
        name: s.name,
        missing,
      });
    }
  });

  const experiencesWithInvalidFaculty: Array<{ id: string; title: string; primaryFacultyId: string }> = [];
  if (facultyIds.size > 0) {
    (data.experiences || []).forEach((e) => {
      if (e.primaryFacultyId && !facultyIds.has(e.primaryFacultyId)) {
        experiencesWithInvalidFaculty.push({
          id: e.id,
          title: e.title,
          primaryFacultyId: e.primaryFacultyId,
        });
      }
    });
  }

  const warningsCount =
    orphanRegistrations.length +
    orphanWaitlistEntries.length +
    orphanAttendanceRecords.length +
    orphanCertificates.length +
    orphanFeedbackEntries.length +
    studentsWithMissingFields.length +
    experiencesWithInvalidFaculty.length;

  return {
    timestamp: new Date().toISOString(),
    totalStudents: data.students?.length || 0,
    totalExperiences: data.experiences?.length || 0,
    totalRegistrations: data.registrations?.length || 0,
    totalWaitlistEntries: data.waitlist?.length || 0,
    totalAttendanceRecords: data.attendance?.length || 0,
    totalCertificates: data.certificates?.length || 0,
    totalFeedbackEntries: data.feedback?.length || 0,
    orphanRegistrations,
    orphanWaitlistEntries,
    orphanAttendanceRecords,
    orphanCertificates,
    orphanFeedbackEntries,
    studentsWithMissingFields,
    experiencesWithInvalidFaculty,
    summaryStatus: warningsCount === 0 ? 'HEALTHY' : 'WARNINGS_FOUND',
  };
}
