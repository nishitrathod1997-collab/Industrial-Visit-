/**
 * Date & Time Utilities for Asia/Kolkata (IST, UTC+05:30)
 * Ensures consistent timezone handling and validation across student, faculty, and admin views.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Checks if the registration deadline has passed relative to the current moment.
 */
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

/**
 * Formats an ISO or Date string to a human-readable IST date & time string.
 * Example: "29 Aug 2026, 11:59 PM IST"
 */
export function formatISTDateTime(dateString?: string | null, includeSeconds = false): string {
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
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    });

    return `${formatter.format(d)} IST`;
  } catch {
    return String(dateString);
  }
}

/**
 * Formats an ISO or Date string to a human-readable IST date string.
 * Example: "31 Aug 2026"
 */
export function formatISTDate(dateString?: string | null): string {
  if (!dateString) return 'Not Specified';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Extracts the YYYY-MM-DD and HH:mm strings in Asia/Kolkata timezone from an ISO string.
 * Useful for populating HTML <input type="date"> and <input type="time">.
 */
export function extractISTDateAndTime(isoString?: string | null): { date: string; time: string } {
  if (!isoString) {
    return { date: '', time: '23:59' };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      const parts = isoString.split('T');
      return { date: parts[0] || '', time: parts[1]?.slice(0, 5) || '23:59' };
    }

    // Format in IST parts
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    let year = '', month = '', day = '', hour = '23', minute = '59';
    for (const p of parts) {
      if (p.type === 'year') year = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
      if (p.type === 'hour') hour = p.value.padStart(2, '0');
      if (p.type === 'minute') minute = p.value.padStart(2, '0');
    }

    // Handle 24:00 edge case from some formatters
    if (hour === '24') hour = '00';

    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}`,
    };
  } catch {
    const parts = String(isoString).split('T');
    return { date: parts[0] || '', time: '23:59' };
  }
}

/**
 * Combines a date string (YYYY-MM-DD) and optional time string (HH:mm) into an IST ISO-8601 string.
 * Example: date="2026-08-29", time="23:59" -> "2026-08-29T23:59:00+05:30"
 */
export function createISTTimestamp(dateStr: string, timeStr = '23:59'): string {
  if (!dateStr) return '';
  const cleanTime = timeStr.trim().length > 0 ? timeStr.trim() : '23:59';
  const timeWithSeconds = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
  return `${dateStr}T${timeWithSeconds}+05:30`;
}

/**
 * Validates that the registration deadline is strictly before the trip date/time.
 * Returns { valid: boolean; error?: string }
 */
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

  // Construct trip starting timestamp (default to 08:00 AM IST if time isn't standard)
  let tripTimestamp: number;
  const tripDateParts = tripDateStr.split('T')[0];
  
  // Try to parse trip time if present (e.g. "08:00 AM" or "08:00")
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
  tripTimestamp = new Date(tripISTString).getTime();

  if (deadlineTimestamp >= tripTimestamp) {
    return {
      valid: false,
      error: 'Registration Deadline must be strictly before the Trip Date & Time.',
    };
  }

  return { valid: true };
}
