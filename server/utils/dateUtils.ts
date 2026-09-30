/**
 * Server Date & Time Utilities for Asia/Kolkata (IST, UTC+05:30)
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

export function isRegistrationDeadlinePassed(registrationDeadline?: string | null): boolean {
  if (!registrationDeadline) return false;
  try {
    const deadlineTime = new Date(registrationDeadline).getTime();
    if (isNaN(deadlineTime)) return false;
    return Date.now() > deadlineTime;
  } catch {
    return false;
  }
}

export function formatISTDateTime(dateString?: string | null): string {
  if (!dateString) return 'Not Specified';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);

    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${formatter.format(d)} IST`;
  } catch {
    return String(dateString);
  }
}

export function validateTripDeadlines(
  tripDateStr: string,
  tripTimeStr: string | undefined,
  registrationDeadlineISO: string
): { valid: boolean; error?: string } {
  if (!tripDateStr) {
    return { valid: false, error: 'Trip Date is required.' };
  }
  if (!registrationDeadlineISO) {
    return { valid: false, error: 'Registration Deadline is required.' };
  }

  const deadlineTimestamp = new Date(registrationDeadlineISO).getTime();
  if (isNaN(deadlineTimestamp)) {
    return { valid: false, error: 'Invalid Registration Deadline format.' };
  }

  const tripDateParts = tripDateStr.split('T')[0];
  let tripHour = 8;
  let tripMinute = 0;
  if (tripTimeStr) {
    const match = tripTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      tripHour = h;
      tripMinute = m;
    }
  }

  const tripISTString = `${tripDateParts}T${String(tripHour).padStart(2, '0')}:${String(tripMinute).padStart(2, '0')}:00+05:30`;
  const tripTimestamp = new Date(tripISTString).getTime();

  if (deadlineTimestamp >= tripTimestamp) {
    return {
      valid: false,
      error: 'Registration Deadline must be strictly before the Trip Date & Time.',
    };
  }

  return { valid: true };
}
