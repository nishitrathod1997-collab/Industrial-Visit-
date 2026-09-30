import { calculateDaysUntilTrip, getNowInAsiaKolkata, notificationService } from './notificationService';
import { Experience, PreTripReminderDispatchResult } from '../src/types';

export interface SchedulerStatus {
  isRunning: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastRunSummary?: {
    tripsEvaluated: number;
    tripsDueFor3Day: number;
    remindersDispatched: number;
    emailsQueued: number;
    alreadySentSkipped: number;
    failuresCount: number;
    results: PreTripReminderDispatchResult[];
  };
  totalRunsCount: number;
}

let schedulerTimer: NodeJS.Timeout | null = null;
let currentStatus: SchedulerStatus = {
  isRunning: false,
  totalRunsCount: 0,
};

/**
 * Core engine that evaluates all upcoming trips for 3-Day Pre-Trip Reminders.
 * 
 * Evaluation Logic:
 * - Standard Trigger: Trip is exactly 3 calendar days away in Asia/Kolkata timezone (daysUntilTrip === 3).
 * - Recovery Catch-Up Window: Trip is 1 to 2 calendar days away (daysUntilTrip === 2 || daysUntilTrip === 1)
 *   AND the 3-day reminder was NOT previously completed for this trip (e.g., if server was scaled to zero on day 3).
 * - Out of Window: Trips on the day of departure (daysUntilTrip === 0), in the past (daysUntilTrip < 0),
 *   or > 3 days away are not triggered.
 * - Idempotency: db.hasTripReminderBeenSent ensures duplicate emails are never sent if scheduler runs multiple times.
 */
export async function runPreTrip3DayScheduler(
  db: any,
  options: { forceTripId?: string; triggerSource?: string } = {}
): Promise<{
  timestamp: string;
  timezone: string;
  triggerSource: string;
  tripsEvaluated: number;
  tripsDueFor3Day: number;
  emailsQueued: number;
  alreadySentSkipped: number;
  failuresCount: number;
  results: PreTripReminderDispatchResult[];
  message: string;
}> {
  const triggerSource = options.triggerSource || (options.forceTripId ? 'MANUAL_TRIGGER' : 'AUTO_SCHEDULER');
  const nowKolkata = getNowInAsiaKolkata();
  const timestampIso = new Date().toISOString();

  console.log(`\n=============================================================`);
  console.log(`[REMINDER_SCHEDULER] ⏰ Execution Started`);
  console.log(`Triggered by: ${triggerSource}`);
  console.log(`Time: ${timestampIso}`);
  console.log(`Timezone: Asia/Kolkata (Current Date: ${nowKolkata.dateStr}, Time: ${nowKolkata.timeStr} IST)`);

  const allExperiences: Experience[] = db.getAllExperiences ? db.getAllExperiences() : [];
  const results: PreTripReminderDispatchResult[] = [];

  let tripsEvaluated = 0;
  let tripsDueFor3Day = 0;
  let emailsQueued = 0;
  let alreadySentSkipped = 0;
  let failuresCount = 0;

  for (const exp of allExperiences) {
    // If a specific trip was targeted, evaluate only that trip
    if (options.forceTripId && exp.id !== options.forceTripId) {
      continue;
    }

    tripsEvaluated++;

    // Skip inactive, cancelled, or draft experiences
    if (exp.status === 'CANCELLED' || exp.status === 'DRAFT' || exp.status === 'COMPLETED') {
      continue;
    }

    const daysUntilTrip = calculateDaysUntilTrip(exp.date);
    const isTargeted = Boolean(options.forceTripId && options.forceTripId === exp.id);
    const alreadySentForTrip = db.hasTripReminderBeenSent ? db.hasTripReminderBeenSent(exp.id, 'PRE_TRIP_3_DAY', exp.date) : false;

    // Trigger Rule:
    // 1. Exact 3-day mark (daysUntilTrip === 3)
    // 2. Recovery catch-up window (daysUntilTrip === 2 or 1) only if not already sent
    // 3. Forced manual target
    const isStandardDue = daysUntilTrip === 3;
    const isRecoveryDue = (daysUntilTrip === 2 || daysUntilTrip === 1) && !alreadySentForTrip;

    if (isStandardDue || isRecoveryDue || isTargeted) {
      // If already sent and not targeted with forceSend, skip redundant work
      if (alreadySentForTrip && !isTargeted) {
        alreadySentSkipped++;
        console.log(`[REMINDER_SCHEDULER] ⏩ Trip "${exp.title}" on ${exp.date} (${daysUntilTrip} days away) has already completed 3-day reminder. Skipping.`);
        continue;
      }

      tripsDueFor3Day++;
      const reason = isStandardDue
        ? 'Exact 3-day window'
        : isRecoveryDue
        ? `Recovery catch-up window (${daysUntilTrip} day(s) remaining)`
        : 'Manual target';

      console.log(`[REMINDER_SCHEDULER] 🎯 Trip "${exp.title}" on ${exp.date} is due for 3-Day Reminder (${reason}). Dispatching...`);

      try {
        const dispatchRes = await notificationService.dispatchPreTrip3DayRemindersForExperience(db, exp, {
          forceSend: isTargeted,
          triggerSource: triggerSource as any,
        });

        emailsQueued += dispatchRes.totalEmailsSent;
        failuresCount += dispatchRes.totalEmailsFailed;
        results.push(dispatchRes);
      } catch (err: any) {
        failuresCount++;
        console.error(`[REMINDER_SCHEDULER] ✗ Failed processing trip ${exp.id}:`, err.message);
        results.push({
          tripId: exp.id,
          tripTitle: exp.title,
          tripDate: exp.date,
          daysUntilTrip,
          targetDate: exp.date,
          studentsNotified: 0,
          facultyNotified: 0,
          securityNotified: 0,
          adminNotified: 0,
          totalEmailsSent: 0,
          totalEmailsFailed: 1,
          status: 'FAILED',
          recipientBreakdown: { students: [], faculty: [], security: [], admin: [] },
          message: `Scheduler execution error: ${err.message}`,
        });
      }
    }
  }

  const executionStatus = failuresCount === 0 ? 'SUCCESS' : emailsQueued > 0 ? 'PARTIAL_SUCCESS' : 'FAILED';

  console.log(`Trips evaluated: ${tripsEvaluated}`);
  console.log(`3-day reminders due: ${tripsDueFor3Day}`);
  console.log(`Emails queued: ${emailsQueued}`);
  console.log(`Already sent/skipped: ${alreadySentSkipped}`);
  console.log(`Failures: ${failuresCount}`);
  console.log(`Execution completed: ${executionStatus}`);
  console.log(`=============================================================\n`);

  currentStatus.lastRunAt = timestampIso;
  currentStatus.totalRunsCount++;
  currentStatus.lastRunSummary = {
    tripsEvaluated,
    tripsDueFor3Day,
    remindersDispatched: results.filter((r) => r.status === 'COMPLETED' || r.status === 'PARTIAL').length,
    emailsQueued,
    alreadySentSkipped,
    failuresCount,
    results,
  };

  // Next run in 1 hour (for in-process timer display)
  currentStatus.nextRunAt = new Date(Date.now() + 3600000).toISOString();

  return {
    timestamp: timestampIso,
    timezone: 'Asia/Kolkata',
    triggerSource,
    tripsEvaluated,
    tripsDueFor3Day,
    emailsQueued,
    alreadySentSkipped,
    failuresCount,
    results,
    message: `Pre-trip reminder check completed: ${tripsDueFor3Day} trip(s) due for 3-day reminder out of ${tripsEvaluated} evaluated (${emailsQueued} emails dispatched, ${alreadySentSkipped} skipped, ${failuresCount} failures).`,
  };
}

/**
 * Initializes automatic background in-process cron loop (local dev & container warm standby)
 */
export function initReminderScheduler(db: any, intervalMs: number = 3600000) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  currentStatus.isRunning = true;
  currentStatus.nextRunAt = new Date(Date.now() + 5000).toISOString();

  // Run initial pass shortly after server boots to catch any due reminders
  setTimeout(() => {
    runPreTrip3DayScheduler(db, { triggerSource: 'CONTAINER_STARTUP' }).catch((err) => {
      console.error('[ReminderScheduler] Initial startup check error:', err);
    });
  }, 5000);

  // Set recurring hourly background interval
  schedulerTimer = setInterval(() => {
    runPreTrip3DayScheduler(db, { triggerSource: 'IN_PROCESS_INTERVAL' }).catch((err) => {
      console.error('[ReminderScheduler] Scheduled interval check error:', err);
    });
  }, intervalMs);

  console.log(`[ReminderScheduler] 🚀 3-Day Pre-Trip Scheduler initialized (checking every ${Math.round(intervalMs / 60000)} minutes in Asia/Kolkata timezone).`);
}

/**
 * Returns current scheduler operational status
 */
export function getSchedulerStatus(): SchedulerStatus {
  return currentStatus;
}
