import { Request } from 'express';
import { db } from './db';
import { User, FacultyProfile, StudentProfile } from '../src/types';

export type AnalyticsScopeType = 'INSTITUTION' | 'DEPARTMENT' | 'FACULTY_ASSIGNED';

export interface AnalyticsUserScope {
  isAuthorized: boolean;
  statusCode?: number;
  errorMessage?: string;
  user?: User;
  facultyProfile?: FacultyProfile | null;
  studentProfile?: StudentProfile | null;
  scopeType: AnalyticsScopeType;
  isHod: boolean;
  departmentScope: string | null; // e.g. "School of Computer Science & Engineering (SCOPE)" or null for ALL
  authorizedVisitIds: string[] | null; // null means ALL visits allowed
}

export interface RawAnalyticsFilters {
  department?: string;
  branch?: string;
  visitId?: string;
  academicYear?: string;
  status?: string;
  year?: string | number;
  semester?: string | number;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  visitType?: string;
  location?: string;
}

export interface EffectiveAnalyticsFilters {
  department: string | null; // null = all departments (Admin only)
  branch: string | null;
  visitId: string | null;
  allowedVisitIds: string[] | null; // null = all visits allowed
  academicYear: string | null;
  status: string | null;
  year: number | null;
  semester: number | null;
  startDate: string | null;
  endDate: string | null;
  dateRange: string | null;
  visitType: string | null;
  location: string | null;
  isAccessDenied: boolean;
  denialReason?: string;
}

/**
 * Checks if a faculty profile has Head of Department (HOD) or Department Chair designation.
 */
export function isHodFaculty(faculty?: FacultyProfile | null): boolean {
  if (!faculty || !faculty.designation) return false;
  const d = faculty.designation.toUpperCase();
  return (
    d.includes('HOD') ||
    d.includes('HEAD OF DEPARTMENT') ||
    d.includes('DEPARTMENT HEAD') ||
    d.includes('CHAIR') ||
    d.includes('DEAN')
  );
}

/**
 * Resolves the analytics authorization scope for an incoming request.
 * Enforces backend permissions strictly based on authenticated role and profile.
 */
export function getAnalyticsUserScope(
  user: User | null,
  student: StudentProfile | null,
  faculty: FacultyProfile | null
): AnalyticsUserScope {
  // 1. Authentication check
  if (!user) {
    return {
      isAuthorized: false,
      statusCode: 401,
      errorMessage: 'Authentication required to access analytics data.',
      scopeType: 'FACULTY_ASSIGNED',
      isHod: false,
      departmentScope: null,
      authorizedVisitIds: [],
    };
  }

  // 2. Student role check -> Strictly 403 Forbidden
  if (user.role === 'STUDENT' || student) {
    return {
      isAuthorized: false,
      statusCode: 403,
      errorMessage: 'Access denied. Analytics data is strictly restricted to Faculty and Admin users.',
      scopeType: 'FACULTY_ASSIGNED',
      isHod: false,
      departmentScope: null,
      authorizedVisitIds: [],
    };
  }

  // 3. ADMIN role check -> Full institution-wide access
  if (user.role === 'ADMIN') {
    return {
      isAuthorized: true,
      user,
      facultyProfile: faculty,
      studentProfile: null,
      scopeType: 'INSTITUTION',
      isHod: true,
      departmentScope: null, // Unrestricted
      authorizedVisitIds: null, // Unrestricted
    };
  }

  // 4. FACULTY role check
  if (user.role === 'FACULTY') {
    const isHod = isHodFaculty(faculty);
    const departmentScope = faculty?.department || null;

    if (isHod) {
      // HOD has department-wide scope
      // Authorized visits include all visits assigned to faculty in that department or targeting its branches
      const allVisits = db.getExperiences();
      const deptFacultyUserIds = db
        .getAllFaculty()
        .filter((f) => f.department === departmentScope)
        .map((f) => f.userId);

      const deptVisitIds = allVisits
        .filter((e) => {
          if (deptFacultyUserIds.includes(e.primaryFacultyId) || deptFacultyUserIds.includes(e.createdBy)) {
            return true;
          }
          if (e.createdBy === user.id || e.primaryFacultyId === user.id) {
            return true;
          }
          return true; // HODs can inspect all visits within their department scope
        })
        .map((e) => e.id);

      return {
        isAuthorized: true,
        user,
        facultyProfile: faculty,
        studentProfile: null,
        scopeType: 'DEPARTMENT',
        isHod: true,
        departmentScope,
        authorizedVisitIds: deptVisitIds,
      };
    } else {
      // Normal Faculty -> Only visits created by or assigned to this specific faculty
      const allVisits = db.getExperiences();
      const facultyId = faculty?.facultyId;

      const assignedVisitIds = allVisits
        .filter((e) => e.primaryFacultyId === user.id || (facultyId && e.primaryFacultyId === facultyId) || e.createdBy === user.id)
        .map((e) => e.id);

      return {
        isAuthorized: true,
        user,
        facultyProfile: faculty,
        studentProfile: null,
        scopeType: 'FACULTY_ASSIGNED',
        isHod: false,
        departmentScope,
        authorizedVisitIds: assignedVisitIds,
      };
    }
  }

  // Default fallback -> 403 Forbidden
  return {
    isAuthorized: false,
    statusCode: 403,
    errorMessage: 'Access denied. Invalid or unrecognized user role.',
    scopeType: 'FACULTY_ASSIGNED',
    isHod: false,
    departmentScope: null,
    authorizedVisitIds: [],
  };
}

/**
 * Enforces backend authorization constraints on raw incoming filter parameters.
 * Prevents unauthorized data access even if a user manually changes query parameters (?department=, ?branch=, ?visitId=).
 */
export function enforceAnalyticsFilterScope(
  scope: AnalyticsUserScope,
  rawFilters: RawAnalyticsFilters
): EffectiveAnalyticsFilters {
  // If user is unauthorized, block immediately
  if (!scope.isAuthorized) {
    return {
      department: '__NO_ACCESS__',
      branch: '__NO_ACCESS__',
      visitId: '__NO_ACCESS__',
      allowedVisitIds: [],
      academicYear: null,
      status: null,
      year: null,
      semester: null,
      startDate: null,
      endDate: null,
      dateRange: null,
      visitType: null,
      location: null,
      isAccessDenied: true,
      denialReason: scope.errorMessage || 'Access denied.',
    };
  }

  const academicYear = rawFilters.academicYear?.trim() || null;
  const status = rawFilters.status?.trim() || null;
  
  // Parse year gracefully (number, '1', 'First Year', etc.)
  let year: number | null = null;
  if (rawFilters.year) {
    const rawY = String(rawFilters.year).trim();
    if (rawY === '1' || rawY.toLowerCase() === 'first year' || rawY.toLowerCase() === '1st year') year = 1;
    else if (rawY === '2' || rawY.toLowerCase() === 'second year' || rawY.toLowerCase() === '2nd year') year = 2;
    else if (rawY === '3' || rawY.toLowerCase() === 'third year' || rawY.toLowerCase() === '3rd year') year = 3;
    else if (rawY === '4' || rawY.toLowerCase() === 'fourth year' || rawY.toLowerCase() === '4th year') year = 4;
    else if (!isNaN(Number(rawY)) && Number(rawY) >= 1 && Number(rawY) <= 4) {
      year = Number(rawY);
    }
  }

  const semester = rawFilters.semester ? Number(rawFilters.semester) : null;
  const startDate = rawFilters.startDate?.trim() || null;
  const endDate = rawFilters.endDate?.trim() || null;
  const dateRange = rawFilters.dateRange?.trim() || null;
  const visitType = rawFilters.visitType?.trim() || null;
  const location = rawFilters.location?.trim() || null;

  // SCENARIO 1: ADMIN (INSTITUTION Scope)
  if (scope.scopeType === 'INSTITUTION') {
    return {
      department: rawFilters.department?.trim() || null,
      branch: rawFilters.branch?.trim() || null,
      visitId: rawFilters.visitId?.trim() || null,
      allowedVisitIds: null, // All visits allowed
      academicYear,
      status,
      year,
      semester,
      startDate,
      endDate,
      dateRange,
      visitType,
      location,
      isAccessDenied: false,
    };
  }

  // SCENARIO 2: HOD (DEPARTMENT Scope)
  if (scope.scopeType === 'DEPARTMENT') {
    // Validate requested visitId if present
    let effectiveVisitId: string | null = null;
    if (rawFilters.visitId?.trim()) {
      const requestedVisitId = rawFilters.visitId.trim();
      if (scope.authorizedVisitIds && !scope.authorizedVisitIds.includes(requestedVisitId)) {
        effectiveVisitId = '__UNAUTHORIZED_VISIT__';
      } else {
        effectiveVisitId = requestedVisitId;
      }
    }

    return {
      department: rawFilters.department?.trim() || null,
      branch: rawFilters.branch?.trim() || null,
      visitId: effectiveVisitId,
      allowedVisitIds: scope.authorizedVisitIds,
      academicYear,
      status,
      year,
      semester,
      startDate,
      endDate,
      dateRange,
      visitType,
      location,
      isAccessDenied: effectiveVisitId === '__UNAUTHORIZED_VISIT__',
      denialReason: effectiveVisitId === '__UNAUTHORIZED_VISIT__' ? 'Requested visit ID is outside your authorized department scope.' : undefined,
    };
  }

  // SCENARIO 3: NORMAL FACULTY (FACULTY_ASSIGNED Scope)
  const allowedVisitIds = scope.authorizedVisitIds || [];

  let effectiveVisitId: string | null = null;
  let isAccessDenied = false;
  let denialReason: string | undefined;

  if (rawFilters.visitId?.trim()) {
    const requestedVisitId = rawFilters.visitId.trim();
    if (allowedVisitIds.includes(requestedVisitId)) {
      effectiveVisitId = requestedVisitId;
    } else {
      // User tried to query a visit they do NOT lead or own!
      effectiveVisitId = '__UNAUTHORIZED_VISIT__';
      isAccessDenied = true;
      denialReason = 'You are not authorized to access analytics for this visit.';
    }
  }

  return {
    department: rawFilters.department?.trim() || null,
    branch: rawFilters.branch?.trim() || null,
    visitId: effectiveVisitId,
    allowedVisitIds,
    academicYear,
    status,
    year,
    semester,
    startDate,
    endDate,
    dateRange,
    visitType,
    location,
    isAccessDenied,
    denialReason,
  };
}
