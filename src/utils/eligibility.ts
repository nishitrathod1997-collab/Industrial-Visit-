import {
  StudentProfile,
  EligibilityRules,
  EligibilityResult,
  AttendanceRecord,
  EligibilityPreviewResult,
} from '../types';

export const ALL_BRANCHES = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Computer Science',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biomedical Engineering',
  'Electrical & Electronics Engineering',
];

export const ALL_YEARS = [1, 2, 3, 4];
export const ALL_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
export const ALL_DIVISIONS = ['A', 'B', 'C', 'D'];

/**
 * Deterministic rule-based evaluation of a student against visit eligibility criteria.
 */
export function evaluateStudentEligibility(
  student: StudentProfile,
  eligibility?: EligibilityRules,
  attendanceRecords: AttendanceRecord[] = []
): EligibilityResult {
  const details = {
    branchEligible: true,
    yearEligible: true,
    semesterEligible: true,
    divisionEligible: true,
    cgpaEligible: true,
    backlogEligible: true,
    attendanceEligible: true,
  };

  const reasons: string[] = [];
  const passedCriteria: string[] = [];

  // 1. Calculate student attendance percentage
  let studentAttendanceRate = 100;
  const studentAttRecords = attendanceRecords.filter((a) => a.studentId === student.studentId);
  if (studentAttRecords.length > 0) {
    const presentCount = studentAttRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    studentAttendanceRate = Math.round((presentCount / studentAttRecords.length) * 100);
  } else if (student.attendancePercentage !== undefined) {
    studentAttendanceRate = student.attendancePercentage;
  }

  const studentBacklogs = student.activeBacklogs !== undefined ? student.activeBacklogs : 0;

  if (!eligibility) {
    return {
      eligible: true,
      reasons: [],
      details,
      snapshot: {
        branch: student.branch,
        department: student.department,
        year: student.year,
        semester: student.semester,
        division: student.division,
        cgpa: student.cgpa,
        activeBacklogs: studentBacklogs,
        attendanceRate: studentAttendanceRate,
        evaluatedAt: new Date().toISOString(),
        passedCriteria: ['All Criteria (Open for all students)'],
      },
    };
  }

  // 2. Department / Branch Criterion
  const rawBranches = eligibility.allowedBranches || [];
  const isAllBranches =
    rawBranches.length === 0 ||
    rawBranches.includes('ALL') ||
    rawBranches.includes('All Departments') ||
    rawBranches.includes('All Branches');

  if (!isAllBranches) {
    const matchesBranch = rawBranches.some(
      (b) =>
        b.trim().toLowerCase() === student.branch.trim().toLowerCase() ||
        (student.department && b.trim().toLowerCase() === student.department.trim().toLowerCase())
    );
    if (!matchesBranch) {
      details.branchEligible = false;
      reasons.push(
        `Your branch (${student.branch}) is not eligible for this visit. Eligible branches: ${rawBranches.join(', ')}`
      );
    } else {
      passedCriteria.push(`Branch: ${student.branch}`);
    }
  } else {
    passedCriteria.push('Department: Open to all departments');
  }

  // 3. Academic Year Criterion
  const rawYears = eligibility.allowedYears || [];
  const isAllYears =
    rawYears.length === 0 ||
    rawYears.includes(0) ||
    (rawYears.length >= 4 && [1, 2, 3, 4].every((y) => rawYears.includes(y)));

  if (!isAllYears) {
    const matchesYear = rawYears.includes(student.year);
    if (!matchesYear) {
      details.yearEligible = false;
      const yearLabels = rawYears.map((y) => `Year ${y}`).join(', ');
      reasons.push(
        `Students in Year ${student.year} are not eligible for this visit. Allowed years: ${yearLabels}`
      );
    } else {
      passedCriteria.push(`Year: Year ${student.year}`);
    }
  } else {
    passedCriteria.push('Year: Open to all academic years');
  }

  // 4. Semester Criterion
  const rawSemesters = eligibility.allowedSemesters || [];
  const isAllSemesters =
    rawSemesters.length === 0 ||
    rawSemesters.includes(0) ||
    rawSemesters.length >= 8;

  if (!isAllSemesters) {
    const matchesSemester = rawSemesters.includes(student.semester);
    if (!matchesSemester) {
      details.semesterEligible = false;
      const semLabels = rawSemesters.map((s) => `Sem ${s}`).join(', ');
      reasons.push(
        `Students in Semester ${student.semester} are not eligible for this visit. Allowed semesters: ${semLabels}`
      );
    } else {
      passedCriteria.push(`Semester: Semester ${student.semester}`);
    }
  } else {
    passedCriteria.push('Semester: Open to all semesters');
  }

  // 5. Division Criterion
  const rawDivisions = eligibility.allowedDivisions || [];
  const isAllDivisions =
    rawDivisions.length === 0 ||
    rawDivisions.includes('ALL') ||
    rawDivisions.includes('All Divisions');

  if (!isAllDivisions) {
    const matchesDivision = rawDivisions.some(
      (d) => d.trim().toUpperCase() === student.division.trim().toUpperCase()
    );
    if (!matchesDivision) {
      details.divisionEligible = false;
      reasons.push(
        `Division ${student.division} is not eligible for this visit. Allowed divisions: ${rawDivisions.join(', ')}`
      );
    } else {
      passedCriteria.push(`Division: Division ${student.division}`);
    }
  } else {
    passedCriteria.push('Division: Open to all divisions');
  }

  // 6. CGPA (Min / Max)
  if (eligibility.minCgpa !== undefined && eligibility.minCgpa !== null && eligibility.minCgpa > 0) {
    if (student.cgpa < eligibility.minCgpa) {
      details.cgpaEligible = false;
      reasons.push(
        `Minimum CGPA required: ${eligibility.minCgpa.toFixed(2)} (Your CGPA: ${student.cgpa.toFixed(2)})`
      );
    } else {
      passedCriteria.push(`Min CGPA: ${student.cgpa.toFixed(2)} >= ${eligibility.minCgpa.toFixed(2)}`);
    }
  }

  if (eligibility.maxCgpa !== undefined && eligibility.maxCgpa !== null && eligibility.maxCgpa > 0) {
    if (student.cgpa > eligibility.maxCgpa) {
      details.cgpaEligible = false;
      reasons.push(
        `Maximum CGPA allowed: ${eligibility.maxCgpa.toFixed(2)} (Your CGPA: ${student.cgpa.toFixed(2)})`
      );
    } else {
      passedCriteria.push(`Max CGPA: ${student.cgpa.toFixed(2)} <= ${eligibility.maxCgpa.toFixed(2)}`);
    }
  }

  // 7. Backlog Restrictions
  if (eligibility.backlogRule === 'NO_BACKLOGS') {
    if (student.activeBacklogs !== undefined) {
      if (student.activeBacklogs > 0) {
        details.backlogEligible = false;
        reasons.push(
          `No active backlogs allowed for this visit (Your active backlogs: ${student.activeBacklogs})`
        );
      } else {
        passedCriteria.push('Active Backlogs: 0 (No backlogs)');
      }
    } else {
      // In case data is missing
      details.backlogEligible = false;
      reasons.push('Active backlog status is not on file in the academic database. Please verify with the registrar.');
    }
  } else if (eligibility.backlogRule === 'MAX_BACKLOGS' && eligibility.maxBacklogs !== undefined) {
    if (student.activeBacklogs !== undefined) {
      if (student.activeBacklogs > eligibility.maxBacklogs) {
        details.backlogEligible = false;
        reasons.push(
          `Maximum ${eligibility.maxBacklogs} active backlog(s) allowed (Your active backlogs: ${student.activeBacklogs})`
        );
      } else {
        passedCriteria.push(`Active Backlogs: ${student.activeBacklogs} <= max ${eligibility.maxBacklogs}`);
      }
    } else {
      details.backlogEligible = false;
      reasons.push('Active backlog status is not on file in the academic database. Please verify with the registrar.');
    }
  }

  // 8. Minimum Attendance
  if (
    eligibility.minAttendance !== undefined &&
    eligibility.minAttendance !== null &&
    eligibility.minAttendance > 0
  ) {
    if (studentAttendanceRate < eligibility.minAttendance) {
      details.attendanceEligible = false;
      reasons.push(
        `Minimum attendance of ${eligibility.minAttendance}% required (Your attendance rate: ${studentAttendanceRate}%)`
      );
    } else {
      passedCriteria.push(
        `Attendance: ${studentAttendanceRate}% >= min ${eligibility.minAttendance}%`
      );
    }
  }

  const eligible = reasons.length === 0;

  return {
    eligible,
    reasons,
    details,
    snapshot: {
      branch: student.branch,
      department: student.department,
      year: student.year,
      semester: student.semester,
      division: student.division,
      cgpa: student.cgpa,
      activeBacklogs: student.activeBacklogs,
      attendanceRate: studentAttendanceRate,
      evaluatedAt: new Date().toISOString(),
      passedCriteria,
    },
  };
}

/**
 * Previews eligible students across an entire student cohort without modifying database state.
 */
export function calculateEligibleCohortPreview(
  students: StudentProfile[],
  eligibility?: EligibilityRules,
  attendanceRecords: AttendanceRecord[] = []
): EligibilityPreviewResult {
  const breakdownByBranch: Record<string, number> = {};
  const breakdownByYear: Record<string, number> = {};
  const breakdownBySemester: Record<string, number> = {};

  const eligibleStudents: Array<{
    studentId: string;
    name: string;
    branch: string;
    year: number;
    semester: number;
    division: string;
    cgpa: number;
    attendanceRate: number;
    activeBacklogs?: number;
  }> = [];

  students.forEach((student) => {
    const result = evaluateStudentEligibility(student, eligibility, attendanceRecords);
    if (result.eligible) {
      eligibleStudents.push({
        studentId: student.studentId,
        name: student.name,
        branch: student.branch,
        year: student.year,
        semester: student.semester,
        division: student.division,
        cgpa: student.cgpa,
        attendanceRate: result.snapshot?.attendanceRate || 100,
        activeBacklogs: student.activeBacklogs,
      });

      breakdownByBranch[student.branch] = (breakdownByBranch[student.branch] || 0) + 1;
      breakdownByYear[`Year ${student.year}`] = (breakdownByYear[`Year ${student.year}`] || 0) + 1;
      breakdownBySemester[`Sem ${student.semester}`] =
        (breakdownBySemester[`Sem ${student.semester}`] || 0) + 1;
    }
  });

  const totalEligible = eligibleStudents.length;
  const totalStudents = students.length;
  const percentage = totalStudents > 0 ? Math.round((totalEligible / totalStudents) * 100) : 0;

  return {
    totalEligible,
    totalStudents,
    percentage,
    breakdownByBranch,
    breakdownByYear,
    breakdownBySemester,
    eligibleStudents,
  };
}
