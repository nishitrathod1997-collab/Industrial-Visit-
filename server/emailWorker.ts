import { emailService, EmailPayload } from './emailService';
import { EmailNotification } from '../src/types';

export interface EmailWorkerStatus {
  isRunning: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  pendingCount: number;
  totalProcessedCount: number;
}

let workerTimer: NodeJS.Timeout | null = null;
let isProcessing = false;
let currentWorkerStatus: EmailWorkerStatus = {
  isRunning: false,
  pendingCount: 0,
  totalProcessedCount: 0,
};

/**
 * Processes all queued and pending emails in FIFO order.
 */
export async function processPendingEmailQueue(
  db: any
): Promise<{ processed: number; succeeded: number; failed: number }> {
  if (isProcessing) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  isProcessing = true;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    const allLogs: EmailNotification[] = db.data?.emailLogs || [];
    const pendingLogs = allLogs.filter(
      (log) => log.status === 'PENDING' || (log.status as string) === 'QUEUED' || (log.status as string) === 'RETRYING'
    );

    currentWorkerStatus.pendingCount = pendingLogs.length;

    if (pendingLogs.length > 0) {
      console.log(`[EmailWorker] Checking pending emails...`);
      console.log(`[EmailWorker] Pending emails found: ${pendingLogs.length}`);

      for (const log of pendingLogs) {
        processed++;
        console.log(`[EmailWorker] Processing email: ${log.id}`);
        console.log(`[EmailWorker] Recipient: ${log.recipientEmail}`);
        console.log(`[EmailWorker] Sending...`);

        log.attempts = (log.attempts || 0) + 1;
        log.lastAttemptAt = new Date().toISOString();

        const exp = log.tripId ? db.data?.experiences?.find((e: any) => e.id === log.tripId) : undefined;
        const resolvedStudent = log.studentId ? db.data?.students?.find((s: any) => s.studentId === log.studentId) : undefined;

        const payload: EmailPayload = {
          to: log.recipientEmail,
          toName: log.recipientName || resolvedStudent?.fullName || 'Student',
          subject: log.subject,
          eventType: log.eventType,
          tripId: log.tripId,
          studentId: log.studentId,
          notificationId: log.notificationId,
          headline: log.subject,
          contentParagraphs: [
            `This is an automated institutional notification from the Industrial Visit Management Portal.`,
          ],
          tripDetails: exp ? {
            organization: exp.organization,
            title: exp.title,
            date: exp.date,
            reportingTime: exp.travelInfo?.reportingTime || exp.time || '07:30 AM',
            reportingLocation: exp.travelInfo?.reportingLocation || 'VIT Campus Gate 2 Bus Bay',
            venueLocation: exp.location,
            statusBadge: 'Active Record',
          } : undefined,
          importantNotes: [
            'Carry your valid physical College ID Card at all times.',
            'Adhere strictly to official institutional travel instructions.',
          ],
        };

        try {
          const result = await emailService.sendEmail(payload);

          if (result.success) {
            log.status = 'SENT';
            log.sentAt = new Date().toISOString();
            log.errorMessage = undefined;

            if (log.notificationId && db.data?.notifications) {
              const notif = db.data.notifications.find((n: any) => n.id === log.notificationId);
              if (notif) {
                notif.emailStatus = 'SENT';
                notif.emailSentAt = log.sentAt;
              }
            }

            console.log(`[EmailWorker] Provider accepted message`);
            console.log(`[EmailWorker] Email status updated: SENT`);
            succeeded++;
          } else {
            const isTransient =
              (result.error && (
                result.error.includes('421') ||
                result.error.includes('4.3.0') ||
                result.error.includes('450') ||
                result.error.includes('451') ||
                result.error.toLowerCase().includes('temporary') ||
                result.error.toLowerCase().includes('rate-limit') ||
                result.error.includes('ECONNRESET') ||
                result.error.includes('ETIMEDOUT')
              )) ?? false;

            if (isTransient && (log.attempts || 1) < 4) {
              log.status = 'RETRYING';
              log.errorMessage = result.error || 'Temporary delivery delay. Will retry automatically.';
              console.log(`[EmailWorker] Delivery transient delay (${result.error}). Status updated to: RETRYING (attempt ${log.attempts}/4)`);
            } else {
              log.status = 'FAILED';
              log.errorMessage = result.error || 'Delivery rejected by provider';
              if (log.notificationId && db.data?.notifications) {
                const notif = db.data.notifications.find((n: any) => n.id === log.notificationId);
                if (notif) {
                  notif.emailStatus = 'FAILED';
                }
              }
              console.log(`[EmailWorker] Delivery failed: ${result.error}`);
              console.log(`[EmailWorker] Email status updated: FAILED`);
              failed++;
            }
          }
        } catch (err: any) {
          const isTransient =
            err.message?.includes('421') ||
            err.message?.includes('4.3.0') ||
            err.message?.toLowerCase().includes('temporary') ||
            err.message?.includes('ECONNRESET');

          if (isTransient && (log.attempts || 1) < 4) {
            log.status = 'RETRYING';
            log.errorMessage = err.message || 'Worker transient exception. Will retry.';
            console.log(`[EmailWorker] Transient exception: ${err.message}. Status updated to: RETRYING`);
          } else {
            log.status = 'FAILED';
            log.errorMessage = err.message || 'Worker delivery error';
            console.log(`[EmailWorker] Exception sending email: ${err.message}`);
            console.log(`[EmailWorker] Email status updated: FAILED`);
            failed++;
          }
        }

        db.saveDatabase();

        // Brief delay between sequential queue deliveries to respect Gmail rate pacing
        await new Promise((res) => setTimeout(res, 400));
      }

      currentWorkerStatus.totalProcessedCount += processed;
      currentWorkerStatus.pendingCount = (db.data?.emailLogs || []).filter(
        (l: any) => l.status === 'PENDING' || l.status === 'QUEUED' || l.status === 'RETRYING'
      ).length;
    }
  } catch (err: any) {
    console.error('[EmailWorker] Error during pending queue execution:', err);
  } finally {
    currentWorkerStatus.lastRunAt = new Date().toISOString();
    isProcessing = false;
  }

  return { processed, succeeded, failed };
}

/**
 * Initializes background email worker loop
 */
export function initEmailWorker(db: any, intervalMs: number = 10000) {
  if (workerTimer) {
    clearInterval(workerTimer);
  }

  currentWorkerStatus.isRunning = true;
  console.log(`[EmailWorker] Email worker started`);

  // Run initial pass after 2 seconds
  setTimeout(() => {
    processPendingEmailQueue(db).catch((err) => {
      console.error('[EmailWorker] Initial worker run error:', err);
    });
  }, 2000);

  // Recurring background interval
  workerTimer = setInterval(() => {
    processPendingEmailQueue(db).catch((err) => {
      console.error('[EmailWorker] Interval worker run error:', err);
    });
  }, intervalMs);
}

/**
 * Returns current email worker telemetry
 */
export function getEmailWorkerStatus(): EmailWorkerStatus {
  return currentWorkerStatus;
}
