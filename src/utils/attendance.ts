import { AttendanceRecord } from '../types';

export interface AttendanceStats {
  totalEnrolled: number;
  totalAttendanceMarked: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  notMarkedCount: number;
  attendanceRatePercent: number;
}

/**
 * Standardized attendance calculation utility based on application rules.
 * Reusable by Faculty Dashboard, Mark Attendance, Analytics, and Reports.
 */
export function calculateAttendanceStats(
  attendanceRecords: AttendanceRecord[] = [],
  totalEnrolled: number = 0
): AttendanceStats {
  const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const lateCount = attendanceRecords.filter((a) => a.status === 'LATE').length;
  const excusedCount = attendanceRecords.filter((a) => a.status === 'EXCUSED').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
  const totalAttendanceMarked = presentCount + lateCount + excusedCount + absentCount;
  const notMarkedCount = Math.max(0, totalEnrolled - totalAttendanceMarked);
  const attendanceRatePercent =
    totalAttendanceMarked > 0
      ? Math.round((presentCount / totalAttendanceMarked) * 1000) / 10
      : 0;

  return {
    totalEnrolled,
    totalAttendanceMarked,
    presentCount,
    lateCount,
    excusedCount,
    absentCount,
    notMarkedCount,
    attendanceRatePercent,
  };
}

/**
 * Calculates overall attendance percentage for a list of attendance records.
 */
export function calculateCohortAttendanceRate(records: AttendanceRecord[] = []): number {
  if (!records || records.length === 0) return 0;
  const presentCount = records.filter((a) => a.status === 'PRESENT').length;
  return Math.round((presentCount / records.length) * 1000) / 10;
}
