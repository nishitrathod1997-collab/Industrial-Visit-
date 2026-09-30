import { emailService, EmailPayload } from './emailService';
import {
  AppNotification,
  EmailNotification,
  Experience,
  StudentProfile,
  Registration,
  WaitlistEntry,
  BoardingPass,
  Announcement,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
} from '../src/types';

interface NotificationDispatchOptions {
  recipientUserId: string;
  student?: StudentProfile;
  experience?: Experience;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  relatedEntityId?: string;
  entityType?: 'EXPERIENCE' | 'LEAVE' | 'BOARDING_PASS' | 'ANNOUNCEMENT' | 'CERTIFICATE' | 'FEEDBACK';
  actionUrl?: string;
  actionLabel?: string;
  idempotencyKey?: string;
  emailPayload?: Partial<EmailPayload>;
}

class NotificationService {
  // Simple in-memory set to prevent duplicate event dispatching within a short window
  private processedEvents = new Set<string>();

  /**
   * Main entry point to dispatch both in-app notification and email from a single backend event.
   */
  public async dispatchMultiChannelEvent(
    db: any,
    options: NotificationDispatchOptions
  ): Promise<{ notification: AppNotification; emailLog?: EmailNotification }> {
    const {
      recipientUserId,
      student,
      experience,
      type,
      title,
      message,
      priority = 'NORMAL',
      category = 'REGISTRATION',
      relatedEntityId,
      entityType = 'EXPERIENCE',
      actionUrl,
      actionLabel,
      idempotencyKey,
      emailPayload,
    } = options;

    // Idempotency check: if key is provided and already processed recently, skip duplication
    if (idempotencyKey && this.processedEvents.has(idempotencyKey)) {
      console.log(`[NotificationService] Duplicate event skipped: ${idempotencyKey}`);
      const existingNotif = db.getNotificationsForUser(recipientUserId).find(
        (n: AppNotification) => n.relatedEntityId === relatedEntityId && n.type === type
      );
      return { notification: existingNotif || ({} as AppNotification) };
    }

    if (idempotencyKey) {
      this.processedEvents.add(idempotencyKey);
      // Clean up after 1 hour to prevent memory bloat
      setTimeout(() => this.processedEvents.delete(idempotencyKey), 3600000);
    }

    // 1. Resolve student profile and email if not explicitly provided
    const resolvedStudent = student || (recipientUserId ? db.getStudentProfileByUserId(recipientUserId) : undefined);
    const recipientUser = db.getUserById(recipientUserId);
    const recipientEmail = resolvedStudent?.email || recipientUser?.email;
    const recipientName = resolvedStudent?.name || recipientUser?.name || 'Student';

    // 2. Create in-app notification record in DB
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      recipientId: recipientUserId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      priority,
      category,
      relatedEntityId,
      entityType,
      actionUrl: actionUrl || (relatedEntityId ? `/student/experiences/${relatedEntityId}` : undefined),
      actionLabel: actionLabel || 'View Details',
      emailStatus: recipientEmail ? 'PENDING' : 'SKIPPED',
      emailRecipient: recipientEmail,
    };

    db.addNotificationDirect(notif);

    // 3. Create Email Log record in DB
    let emailLog: EmailNotification | undefined;
    if (recipientEmail && emailPayload) {
      const emailLogId = `eml_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      emailLog = {
        id: emailLogId,
        studentId: resolvedStudent?.studentId,
        tripId: experience?.id || relatedEntityId,
        notificationId: notif.id,
        eventType: type,
        recipientEmail,
        recipientName,
        subject: emailPayload.subject || title,
        status: 'PENDING',
        attempts: 0,
        createdAt: new Date().toISOString(),
        idempotencyKey,
      };

      db.addEmailLog(emailLog);

      // 4. Asynchronously send the email in background (non-blocking for DB transaction)
      const fullEmailPayload: EmailPayload = {
        to: recipientEmail,
        toName: recipientName,
        subject: emailPayload.subject || title,
        eventType: type,
        tripId: experience?.id,
        studentId: resolvedStudent?.studentId,
        notificationId: notif.id,
        headline: emailPayload.headline || title,
        badgeText: emailPayload.badgeText,
        badgeType: emailPayload.badgeType || 'info',
        contentParagraphs: emailPayload.contentParagraphs || [message],
        tripDetails: emailPayload.tripDetails || (experience ? {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          reportingTime: experience.travelInfo?.reportingTime || experience.time || '07:30 AM',
          reportingLocation: experience.travelInfo?.reportingLocation || 'VIT Campus Gate 2',
          venueLocation: experience.location || 'Mumbai / Pune Region',
          statusBadge: 'Confirmed',
        } : undefined),
        keyChangeDetails: emailPayload.keyChangeDetails,
        callToAction: emailPayload.callToAction || {
          label: actionLabel || 'Open Industrial Visit Hub',
          url: actionUrl || (experience ? `/student/experiences/${experience.id}` : '/'),
        },
        importantNotes: emailPayload.importantNotes || [
          'Bring your valid physical College ID Card & signed consent form.',
          'Adhere strictly to official VIT dress code (closed footwear, institutional attire).',
          'Arrive at the assembly point 15 minutes prior to reporting time.',
        ],
      };

      this.executeEmailDelivery(db, emailLog, notif, fullEmailPayload);
    }

    return { notification: notif, emailLog };
  }

  /**
   * Executes the email send with retry tracking and non-blocking failure tolerance.
   */
  public async executeEmailDelivery(
    db: any,
    emailLog: EmailNotification,
    notif: AppNotification,
    payload: EmailPayload
  ) {
    try {
      emailLog.attempts += 1;
      emailLog.lastAttemptAt = new Date().toISOString();

      if (payload.eventType === 'REGISTRATION_CANCELLED') {
        console.log(`\n========================================`);
        console.log(`Cancellation email triggered`);
        console.log(`Recipient: ${payload.to}`);
        console.log(`Event: ${payload.eventType}`);
        console.log(`Email service: called`);
      }

      const result = await emailService.sendEmail(payload);

      if (payload.eventType === 'REGISTRATION_CANCELLED') {
        console.log(`Provider response: ${result.success ? `SUCCESS (MessageId: ${result.messageId})` : `FAILED (${result.error})`}`);
        console.log(`========================================\n`);
      }

      if (result.success) {
        emailLog.status = 'SENT';
        emailLog.sentAt = new Date().toISOString();
        emailLog.errorMessage = undefined;

        // Update notification email receipt status
        notif.emailStatus = 'SENT';
        notif.emailSentAt = emailLog.sentAt;
      } else {
        emailLog.status = 'FAILED';
        emailLog.errorMessage = result.error || 'Unknown delivery failure';
        notif.emailStatus = 'FAILED';
      }
    } catch (err: any) {
      if (payload.eventType === 'REGISTRATION_CANCELLED') {
        console.log(`Provider response: EXCEPTION (${err.message})`);
        console.log(`========================================\n`);
      }
      emailLog.status = 'FAILED';
      emailLog.errorMessage = err.message || 'Exception during email dispatch';
      notif.emailStatus = 'FAILED';
    } finally {
      db.saveDatabase();
    }
  }

  // ==========================================
  // SPECIFIC EVENT HANDLERS
  // ==========================================

  /**
   * 1. Registration Submitted
   */
  public async notifyRegistrationSubmitted(db: any, student: StudentProfile, experience: Experience, registration: Registration) {
    const reportingTime = experience.travelInfo?.reportingTime || experience.time || '07:30 AM';
    const reportingLocation = experience.travelInfo?.reportingLocation || 'VIT Campus Gate 2 Bus Bay';

    return this.dispatchMultiChannelEvent(db, {
      recipientUserId: student.userId,
      student,
      experience,
      type: 'REGISTRATION_SUBMITTED',
      title: `📝 Registration Submitted: ${experience.title}`,
      message: `Your registration for ${experience.organization} scheduled for ${experience.date} has been submitted successfully. Please ensure your parent consent form is uploaded.`,
      priority: 'NORMAL',
      category: 'REGISTRATION',
      relatedEntityId: experience.id,
      entityType: 'EXPERIENCE',
      actionUrl: `/student/experiences/${experience.id}`,
      actionLabel: 'View Registration Status',
      idempotencyKey: `reg_sub_${student.studentId}_${experience.id}_${registration.id}`,
      emailPayload: {
        subject: `📝 Registration Received – ${experience.organization} Industrial Visit`,
        headline: `Registration Received: ${experience.title}`,
        badgeText: 'Registration Received',
        badgeType: 'info',
        contentParagraphs: [
          `Your registration application for the upcoming industrial visit to <strong>${experience.organization}</strong> has been successfully received and recorded in the academic repository.`,
          `Institutional guidelines require all participating students to complete mandatory consent verification and review all pre-visit directives prior to departure.`,
        ],
        tripDetails: {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          reportingTime,
          reportingLocation,
          venueLocation: experience.location,
          statusBadge: 'Received / Awaiting Final Processing',
        },
      },
    });
  }

  /**
   * 2. Registration Confirmed
   */
  public async notifyRegistrationConfirmed(
    db: any,
    student: StudentProfile,
    experience: Experience,
    registration: Registration,
    boardingPass?: BoardingPass
  ) {
    const passNum = boardingPass?.passNumber || `VIT-BP-${new Date().getFullYear()}-001`;
    const reportingTime = experience.travelInfo?.reportingTime || experience.time || '07:30 AM';
    const reportingLocation = experience.travelInfo?.reportingLocation || 'VIT Campus Gate 2 Bus Bay';

    return this.dispatchMultiChannelEvent(db, {
      recipientUserId: student.userId,
      student,
      experience,
      type: 'REGISTRATION_CONFIRMED',
      title: `🎫 Registration Confirmed: ${experience.title}`,
      message: `Your registration for ${experience.organization} on ${experience.date} is confirmed! Your digital boarding pass #${passNum} is ready.`,
      priority: 'IMPORTANT',
      category: 'REGISTRATION',
      relatedEntityId: experience.id,
      entityType: 'EXPERIENCE',
      actionUrl: `/student/experiences/${experience.id}`,
      actionLabel: 'View Boarding Pass & Ticket',
      idempotencyKey: `reg_conf_${student.studentId}_${experience.id}_${passNum}`,
      emailPayload: {
        subject: `🎫 Registration Confirmed – ${experience.organization} Industrial Visit`,
        headline: `Registration Confirmed: ${experience.title}`,
        badgeText: '✅ Seat Confirmed',
        badgeType: 'success',
        contentParagraphs: [
          `We are pleased to inform you that your registration for the <strong>${experience.organization} Industrial Visit</strong> has been officially confirmed!`,
          `Your personalized digital boarding pass has been issued and is available for download on the student portal. Please present this QR code pass during morning bus boarding and facility security check-in.`,
        ],
        tripDetails: {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          reportingTime,
          reportingLocation,
          venueLocation: experience.location,
          statusBadge: '✅ Confirmed & Ticket Issued',
          boardingPassNumber: passNum,
        },
        callToAction: {
          label: '🎫 View Digital Boarding Pass',
          url: `/student/experiences/${experience.id}`,
        },
        importantNotes: [
          'Carry your physical VIT Student ID card at all times.',
          'Keep your digital Boarding Pass ready on your phone (or carry a printed copy).',
          'Arrive at the assembly bus bay at least 15 minutes before reporting time.',
        ],
      },
    });
  }

  /**
   * 3. Registration Rejected (e.g. Consent rejected or capacity full)
   */
  public async notifyRegistrationRejected(db: any, student: StudentProfile, experience: Experience, reason: string) {
    return this.dispatchMultiChannelEvent(db, {
      recipientUserId: student.userId,
      student,
      experience,
      type: 'REGISTRATION_REJECTED',
      title: `❌ Registration Update: ${experience.title}`,
      message: `Your registration for ${experience.organization} could not be confirmed: ${reason}`,
      priority: 'IMPORTANT',
      category: 'REGISTRATION',
      relatedEntityId: experience.id,
      entityType: 'EXPERIENCE',
      actionUrl: `/student/experiences/${experience.id}`,
      actionLabel: 'View Registration Details',
      idempotencyKey: `reg_rej_${student.studentId}_${experience.id}_${Date.now()}`,
      emailPayload: {
        subject: `Registration Update – ${experience.organization} Industrial Visit`,
        headline: `Registration Status Update: ${experience.title}`,
        badgeText: 'Registration Rejected',
        badgeType: 'danger',
        contentParagraphs: [
          `Your registration request for the industrial visit to <strong>${experience.organization}</strong> could not be approved at this time.`,
          `<strong>Reason provided by coordinator:</strong> ${reason}`,
          `If this issue can be rectified (such as re-uploading a clearer signed parent consent form), you may re-apply through the Industrial Visit portal.`,
        ],
        tripDetails: {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          statusBadge: 'Rejected',
        },
      },
    });
  }

  /**
   * 4. Added to Waitlist
   */
  public async notifyWaitlistJoined(db: any, student: StudentProfile, experience: Experience, waitlistEntry: WaitlistEntry) {
    return this.dispatchMultiChannelEvent(db, {
      recipientUserId: student.userId,
      student,
      experience,
      type: 'WAITLIST_JOINED',
      title: `⏳ Added to Waiting List: ${experience.title}`,
      message: `The visit to ${experience.organization} is at capacity. You are placed at Position #${waitlistEntry.position} on the waitlist.`,
      priority: 'NORMAL',
      category: 'WAITLIST',
      relatedEntityId: experience.id,
      entityType: 'EXPERIENCE',
      actionUrl: `/student/experiences/${experience.id}`,
      actionLabel: 'Track Waitlist Status',
      idempotencyKey: `wl_join_${student.studentId}_${experience.id}_pos_${waitlistEntry.position}`,
      emailPayload: {
        subject: `⏳ Waitlist Update – ${experience.organization} Industrial Visit`,
        headline: `Added to Waitlist: ${experience.title}`,
        badgeText: `Waitlist Position #${waitlistEntry.position}`,
        badgeType: 'warning',
        contentParagraphs: [
          `All confirmed seats for <strong>${experience.organization}</strong> on <strong>${experience.date}</strong> are currently filled.`,
          `You have been placed on the official institutional waitlist at <strong>Position #${waitlistEntry.position}</strong>.`,
          `If a confirmed student cancels or forfeits their seat, our automated seat allocation engine will automatically promote the next eligible waitlisted candidate and instantly notify you via email and portal notification.`,
        ],
        tripDetails: {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          waitlistPosition: waitlistEntry.position,
          statusBadge: 'Waitlisted',
        },
      },
    });
  }

  /**
   * 5. Promoted from Waitlist (CRITICAL PROMOTION FLOW)
   */
  public async notifyWaitlistPromoted(
    db: any,
    student: StudentProfile,
    experience: Experience,
    registration: Registration,
    boardingPass?: BoardingPass,
    prevPosition: number = 1
  ) {
    const passNum = boardingPass?.passNumber || `VIT-BP-${new Date().getFullYear()}-001`;
    const reportingTime = experience.travelInfo?.reportingTime || experience.time || '07:30 AM';
    const reportingLocation = experience.travelInfo?.reportingLocation || 'VIT Campus Gate 2 Bus Bay';

    return this.dispatchMultiChannelEvent(db, {
      recipientUserId: student.userId,
      student,
      experience,
      type: 'WAITLIST_PROMOTED',
      title: `🎉 You've Been Promoted! ${experience.title}`,
      message: `A seat became available! Your registration for ${experience.organization} is now CONFIRMED. Boarding pass #${passNum} is generated.`,
      priority: 'HIGH',
      category: 'PROMOTION',
      relatedEntityId: experience.id,
      entityType: 'EXPERIENCE',
      actionUrl: `/student/experiences/${experience.id}`,
      actionLabel: 'View Confirmed Boarding Pass',
      idempotencyKey: `wl_promo_${student.studentId}_${experience.id}_${registration.id}`,
      emailPayload: {
        subject: `🎉 Seat Confirmed – Promoted from Waitlist (${experience.organization})`,
        headline: `Congratulations! You've Been Promoted!`,
        badgeText: '🎉 Promoted to Confirmed',
        badgeType: 'success',
        contentParagraphs: [
          `Great news! A seat has opened up for the <strong>${experience.organization} Industrial Visit</strong> scheduled for <strong>${experience.date}</strong>.`,
          `Your status has been elevated from <strong>Waitlist (Position #${prevPosition})</strong> to <strong>✅ CONFIRMED SEAT</strong>.`,
          `Your official digital boarding pass has been automatically generated and is ready for access on the portal.`,
        ],
        tripDetails: {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          reportingTime,
          reportingLocation,
          venueLocation: experience.location,
          statusBadge: '✅ Confirmed (Promoted from Waitlist)',
          boardingPassNumber: passNum,
        },
        callToAction: {
          label: '🎫 View & Download Boarding Pass',
          url: `/student/experiences/${experience.id}`,
        },
        importantNotes: [
          'Your confirmed seat is secured. No additional action is required unless a signed consent form is requested.',
          'Please ensure you arrive at the designated campus bay before the scheduled departure time.',
          'College physical ID card is mandatory.',
        ],
      },
    });
  }

  /**
   * 6. Registration Cancelled by Student
   */
  public async notifyRegistrationCancelled(db: any, student: StudentProfile, experience: Experience) {
    return this.dispatchMultiChannelEvent(db, {
      recipientUserId: student.userId,
      student,
      experience,
      type: 'REGISTRATION_CANCELLED',
      title: `❌ Registration Cancelled: ${experience.title}`,
      message: `Your registration for ${experience.organization} has been cancelled as requested. Any associated boarding pass is now void.`,
      priority: 'NORMAL',
      category: 'REGISTRATION',
      relatedEntityId: experience.id,
      entityType: 'EXPERIENCE',
      actionUrl: `/student/experiences`,
      actionLabel: 'Browse Other Visits',
      idempotencyKey: `reg_canc_${student.studentId}_${experience.id}_${Date.now()}`,
      emailPayload: {
        subject: `Registration Cancellation Confirmed – ${experience.organization}`,
        headline: `Registration Cancellation Confirmed: ${experience.title}`,
        badgeText: 'Registration Cancelled',
        badgeType: 'danger',
        contentParagraphs: [
          `Your registration for the industrial visit to <strong>${experience.organization}</strong> on <strong>${experience.date}</strong> has been cancelled.`,
          `Any previously generated boarding pass for this visit is now void and cannot be used for attendance.`,
          `Your seat has been released to the next eligible candidate on the waitlist.`,
        ],
        tripDetails: {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          statusBadge: 'Cancelled',
        },
      },
    });
  }

  /**
   * 7. Boarding Pass Ready / Updated
   */
  public async notifyBoardingPassReady(db: any, student: StudentProfile, experience: Experience, boardingPass: BoardingPass) {
    return this.dispatchMultiChannelEvent(db, {
      recipientUserId: student.userId,
      student,
      experience,
      type: 'BOARDING_PASS_READY',
      title: `🎫 Boarding Pass Ready: ${experience.title}`,
      message: `Your digital boarding pass #${boardingPass.passNumber} for ${experience.organization} is active and ready for check-in.`,
      priority: 'IMPORTANT',
      category: 'BOARDING_PASS',
      relatedEntityId: experience.id,
      entityType: 'BOARDING_PASS',
      actionUrl: `/student/experiences/${experience.id}`,
      actionLabel: 'View Digital Ticket',
      idempotencyKey: `bp_ready_${student.studentId}_${experience.id}_${boardingPass.passNumber}`,
      emailPayload: {
        subject: `🎫 Your Boarding Pass is Ready – ${experience.organization} Visit`,
        headline: `Your Boarding Pass is Ready: ${experience.title}`,
        badgeText: 'Boarding Pass Active',
        badgeType: 'success',
        contentParagraphs: [
          `Your digital boarding pass for the industrial visit to <strong>${experience.organization}</strong> has been generated and validated.`,
          `Please present your QR code pass on the day of the visit (either on your mobile device or printed) at the campus bus bay.`,
        ],
        tripDetails: {
          organization: experience.organization,
          title: experience.title,
          date: experience.date,
          reportingTime: experience.travelInfo?.reportingTime || experience.time,
          reportingLocation: experience.travelInfo?.reportingLocation,
          boardingPassNumber: boardingPass.passNumber,
          statusBadge: 'Valid Boarding Pass',
        },
      },
    });
  }

  /**
   * 8. Trip Schedule / Location / Detail Changes
   */
  public async notifyTripScheduleChanged(
    db: any,
    experience: Experience,
    changes: Array<{ label: string; oldValue?: string; newValue: string; highlight?: boolean }>,
    affectedStudents: StudentProfile[]
  ) {
    const changeSummary = changes.map((c) => `${c.label}: ${c.oldValue ? `${c.oldValue} → ` : ''}${c.newValue}`).join('; ');

    for (const student of affectedStudents) {
      await this.dispatchMultiChannelEvent(db, {
        recipientUserId: student.userId,
        student,
        experience,
        type: 'TRIP_SCHEDULE_CHANGED',
        title: `📅 Trip Schedule / Venue Update: ${experience.organization}`,
        message: `Important update regarding your visit to ${experience.organization}: ${changeSummary}`,
        priority: 'HIGH',
        category: 'TRIP_UPDATE',
        relatedEntityId: experience.id,
        entityType: 'EXPERIENCE',
        actionUrl: `/student/experiences/${experience.id}`,
        actionLabel: 'View Updated Itinerary',
        idempotencyKey: `trip_upd_${student.studentId}_${experience.id}_${Date.now()}`,
        emailPayload: {
          subject: `📅 Important Update – ${experience.organization} Industrial Visit`,
          headline: `Schedule / Details Update: ${experience.title}`,
          badgeText: 'Important Schedule Update',
          badgeType: 'warning',
          contentParagraphs: [
            `The faculty coordinator for <strong>${experience.organization}</strong> has published critical updates regarding the visit schedule or logistics.`,
            `Please review the updated details below to ensure timely arrival and proper preparation.`,
          ],
          keyChangeDetails: changes,
          tripDetails: {
            organization: experience.organization,
            title: experience.title,
            date: experience.date,
            reportingTime: experience.travelInfo?.reportingTime || experience.time,
            reportingLocation: experience.travelInfo?.reportingLocation,
            venueLocation: experience.location,
            statusBadge: 'Confirmed (Updated Itinerary)',
          },
        },
      });
    }
  }

  /**
   * 9. Trip Cancelled by Faculty / Admin (HIGH / CRITICAL PRIORITY)
   */
  public async notifyTripCancelled(
    db: any,
    experience: Experience,
    reason: string,
    affectedStudents: StudentProfile[]
  ) {
    for (const student of affectedStudents) {
      await this.dispatchMultiChannelEvent(db, {
        recipientUserId: student.userId,
        student,
        experience,
        type: 'EXPERIENCE_CANCELLED',
        title: `🚨 Trip Cancelled: ${experience.title}`,
        message: `The visit to ${experience.organization} scheduled for ${experience.date} has been CANCELLED. Reason: ${reason}`,
        priority: 'CRITICAL',
        category: 'CANCELLATION',
        relatedEntityId: experience.id,
        entityType: 'EXPERIENCE',
        actionUrl: `/student/experiences`,
        actionLabel: 'Browse Alternative Visits',
        idempotencyKey: `trip_canc_${student.studentId}_${experience.id}`,
        emailPayload: {
          subject: `🚨 Trip Cancelled – ${experience.organization} Industrial Visit`,
          headline: `Industrial Visit Cancelled: ${experience.title}`,
          badgeText: '🚨 TRIP CANCELLED',
          badgeType: 'danger',
          contentParagraphs: [
            `We regret to notify you that the upcoming industrial visit to <strong>${experience.organization}</strong> scheduled for <strong>${experience.date}</strong> has been cancelled by the department coordinator.`,
            `<strong>Cancellation Reason:</strong> ${reason}`,
            `All associated registrations and boarding passes have been rescinded. You are encouraged to explore other scheduled industrial visits in your department.`,
          ],
          tripDetails: {
            organization: experience.organization,
            title: experience.title,
            date: experience.date,
            statusBadge: 'CANCELLED',
          },
          importantNotes: [
            'No campus reporting or bus departure will occur for this visit.',
            'Attendance will not be marked against students for this cancelled visit.',
          ],
        },
      });
    }
  }

  /**
   * 10. Faculty Announcement Broadcast (Audience-Targeted)
   */
  public async notifyFacultyAnnouncement(
    db: any,
    experience: Experience,
    announcement: Announcement,
    recipients: StudentProfile[],
    audienceLabel: string = 'All Registered Students'
  ) {
    for (const student of recipients) {
      await this.dispatchMultiChannelEvent(db, {
        recipientUserId: student.userId,
        student,
        experience,
        type: 'ANNOUNCEMENT',
        title: `📢 Faculty Announcement: ${announcement.title}`,
        message: `[${experience.organization}] ${announcement.message}`,
        priority: 'IMPORTANT',
        category: 'ANNOUNCEMENT',
        relatedEntityId: experience.id,
        entityType: 'ANNOUNCEMENT',
        actionUrl: `/student/experiences/${experience.id}`,
        actionLabel: 'Open Announcement',
        idempotencyKey: `ann_${student.studentId}_${announcement.id}`,
        emailPayload: {
          subject: `📢 Faculty Announcement – ${experience.organization} (${announcement.title})`,
          headline: `Faculty Coordinator Broadcast`,
          badgeText: `Announcement: ${audienceLabel}`,
          badgeType: 'primary',
          contentParagraphs: [
            `A new official announcement has been issued by <strong>${announcement.authorName}</strong> for the <strong>${experience.organization} Industrial Visit</strong>:`,
            `<div style="background-color: #f1f5f9; border-left: 4px solid #0b2545; padding: 14px 16px; border-radius: 4px; margin: 12px 0; font-size: 14px; font-weight: 500; color: #1e293b;">${announcement.message}</div>`,
          ],
          tripDetails: {
            organization: experience.organization,
            title: experience.title,
            date: experience.date,
            reportingTime: experience.travelInfo?.reportingTime || experience.time,
            reportingLocation: experience.travelInfo?.reportingLocation,
            facultyCoordinator: announcement.authorName,
          },
        },
      });
    }
  }

  /**
   * 11. 24-Hour Trip Reminder
   */
  public async notifyTripReminder(
    db: any,
    experience: Experience,
    recipients: StudentProfile[]
  ) {
    const reportingTime = experience.travelInfo?.reportingTime || experience.time || '07:30 AM';
    const reportingLocation = experience.travelInfo?.reportingLocation || 'VIT Campus Gate 2 Bus Bay';

    for (const student of recipients) {
      await this.dispatchMultiChannelEvent(db, {
        recipientUserId: student.userId,
        student,
        experience,
        type: 'VISIT_REMINDER',
        title: `⏰ Trip Reminder: ${experience.organization} Visit Tomorrow!`,
        message: `Your visit to ${experience.organization} is scheduled for tomorrow (${experience.date}). Reporting time is ${reportingTime} at ${reportingLocation}.`,
        priority: 'HIGH',
        category: 'REMINDER',
        relatedEntityId: experience.id,
        entityType: 'EXPERIENCE',
        actionUrl: `/student/experiences/${experience.id}`,
        actionLabel: 'View Boarding Pass',
        idempotencyKey: `rem_24h_${student.studentId}_${experience.id}_${experience.date}`,
        emailPayload: {
          subject: `⏰ Reminder – ${experience.organization} Industrial Visit is Tomorrow!`,
          headline: `Industrial Visit Reminder: ${experience.organization}`,
          badgeText: '⏰ Tomorrow at ' + reportingTime,
          badgeType: 'warning',
          contentParagraphs: [
            `This is a friendly reminder that your industrial visit to <strong>${experience.organization}</strong> is scheduled for tomorrow, <strong>${experience.date}</strong>.`,
            `Please review your assembly time, transportation details, and safety guidelines to ensure smooth campus check-in.`,
          ],
          tripDetails: {
            organization: experience.organization,
            title: experience.title,
            date: experience.date,
            reportingTime,
            reportingLocation,
            venueLocation: experience.location,
            statusBadge: 'Confirmed for Tomorrow',
          },
          importantNotes: [
            'Physical College ID Card is MANDATORY for gate security.',
            'Keep your digital Boarding Pass ready on your phone.',
            'Dress code: Institutional formal/lab attire with closed footwear.',
            'Strictly arrive at least 15 minutes before the departure time.',
          ],
        },
      });
    }
  }

  /**
   * 12. AUTOMATIC 3-DAY PRE-TRIP MULTI-CHANNEL DISPATCH
   * Sends customized, role-specific alerts to:
   * 1) Confirmed Students (Website Notification + Email with Boarding Pass checklist)
   * 2) Faculty Coordinators (Email with operational briefing & student counts)
   * 3) College Security Guards (Email with gate clearance, bus info & expected counts)
   * 4) College Admins (Email with comprehensive operational audit summary)
   */
  public async dispatchPreTrip3DayRemindersForExperience(
    db: any,
    experience: Experience,
    options: { forceSend?: boolean; triggerSource?: 'AUTO_SCHEDULER' | 'MANUAL_TRIGGER' } = {}
  ): Promise<{
    tripId: string;
    tripTitle: string;
    tripDate: string;
    daysUntilTrip: number;
    targetDate: string;
    studentsNotified: number;
    facultyNotified: number;
    securityNotified: number;
    adminNotified: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'FAILED';
    recipientBreakdown: {
      students: { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
      faculty: { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
      security: { name: string; email: string; gate: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
      admin: { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[];
    };
    message: string;
  }> {
    const daysUntilTrip = calculateDaysUntilTrip(experience.date);
    const targetDate = experience.date;

    // If auto-scheduler and daysUntilTrip is not 3, skip unless forced
    if (!options.forceSend && daysUntilTrip !== 3) {
      return {
        tripId: experience.id,
        tripTitle: experience.title,
        tripDate: experience.date,
        daysUntilTrip,
        targetDate,
        studentsNotified: 0,
        facultyNotified: 0,
        securityNotified: 0,
        adminNotified: 0,
        totalEmailsSent: 0,
        totalEmailsFailed: 0,
        status: 'SKIPPED',
        recipientBreakdown: { students: [], faculty: [], security: [], admin: [] },
        message: `Trip is ${daysUntilTrip} day(s) away. Pre-trip 3-day reminder triggers strictly when days = 3.`,
      };
    }

    // Skip cancelled or draft trips
    if (experience.status === 'CANCELLED' || experience.status === 'DRAFT') {
      return {
        tripId: experience.id,
        tripTitle: experience.title,
        tripDate: experience.date,
        daysUntilTrip,
        targetDate,
        studentsNotified: 0,
        facultyNotified: 0,
        securityNotified: 0,
        adminNotified: 0,
        totalEmailsSent: 0,
        totalEmailsFailed: 0,
        status: 'SKIPPED',
        recipientBreakdown: { students: [], faculty: [], security: [], admin: [] },
        message: `Trip is in '${experience.status}' state. Pre-trip reminders are disabled for non-active visits.`,
      };
    }

    console.log(`[NotificationService] Processing 3-Day Pre-Trip Reminders for: "${experience.title}" (${experience.date})`);

    const reportingTime = experience.travelInfo?.reportingTime || experience.time || '07:30 AM';
    const reportingLocation = experience.travelInfo?.reportingLocation || 'VIT Campus Gate 2 Bus Bay';
    const departureTime = experience.travelInfo?.departureTime || '08:00 AM';
    const transportInfo = experience.travelInfo?.transport || 'University AC Transit Coach';

    const recipientBreakdown = {
      students: [] as { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[],
      faculty: [] as { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[],
      security: [] as { name: string; email: string; gate: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[],
      admin: [] as { name: string; email: string; status: 'SENT' | 'FAILED' | 'SKIPPED'; error?: string }[],
    };

    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;

    // 1. Resolve Confirmed Students
    const allRegistrations: Registration[] = db.getRegistrationsForExperience(experience.id) || [];
    const confirmedRegistrations = allRegistrations.filter((r) => r.status === 'REGISTERED' || r.status === 'COMPLETED');
    const waitlistEntries: WaitlistEntry[] = db.getWaitlistForExperience(experience.id) || [];
    const waitlistCount = waitlistEntries.filter((w) => w.status === 'ACTIVE').length;

    for (const reg of confirmedRegistrations) {
      try {
        const student = db.getStudentProfile(reg.studentId);
        if (!student) continue;

        const idempotencyKey = `rem_3day_${student.studentId}_${experience.id}_${experience.date}`;
        
        // Check if reminder was already dispatched
        if (!options.forceSend && db.hasTripReminderBeenSent && db.hasTripReminderBeenSent(experience.id, 'PRE_TRIP_3_DAY', experience.date, student.email)) {
          recipientBreakdown.students.push({ name: student.name, email: student.email, status: 'SKIPPED' });
          continue;
        }

        const boardingPass = db.getBoardingPassForStudentAndExperience(student.studentId, experience.id);

        const dispatchRes = await this.dispatchMultiChannelEvent(db, {
          recipientUserId: student.userId,
          student,
          experience,
          type: 'PRE_TRIP_3_DAY_REMINDER',
          title: `⏰ Trip Reminder: ${experience.organization} is in 3 days`,
          message: `Your upcoming industrial visit to ${experience.organization} is in 3 days (${experience.date}). Reporting time is ${reportingTime} sharp at ${reportingLocation}.`,
          priority: 'HIGH',
          category: 'REMINDER',
          relatedEntityId: experience.id,
          entityType: 'EXPERIENCE',
          actionUrl: `/student/experiences/${experience.id}`,
          actionLabel: 'View Boarding Pass & Checklist',
          idempotencyKey,
          emailPayload: {
            subject: `⏰ Trip Reminder – ${experience.title} is in 3 Days`,
            headline: `3-Day Pre-Trip Reminder: ${experience.organization}`,
            badgeText: '⏰ 3 DAYS TO DEPARTURE',
            badgeType: 'warning',
            contentParagraphs: [
              `Hello <strong>${student.name}</strong>, this is an automated 3-day reminder for your confirmed seat on the upcoming <strong>${experience.organization} Industrial Visit</strong> scheduled for <strong>${experience.date}</strong>.`,
              `Please double check your assembly schedule and ensure all required identity and consent clearances are prepared before departure day.`,
            ],
            tripDetails: {
              organization: experience.organization,
              title: experience.title,
              date: experience.date,
              reportingTime,
              reportingLocation,
              venueLocation: experience.location,
              statusBadge: 'Confirmed Seat',
              boardingPassNumber: boardingPass?.passNumber,
              transportInfo,
              departureTime,
            },
            importantNotes: [
              '🪪 Physical VIT College Student ID Card is MANDATORY for campus exit and company security clearance.',
              '📄 Verified Signed Parental/Guardian Consent Form must be validated in your student portal.',
              '🎟️ Digital Boarding Pass with valid QR Code must be ready for roll-call scanning.',
              '⏰ Arrive at least 15 minutes before reporting time (' + reportingTime + '); buses depart promptly at ' + departureTime + '.',
              '👔 Dress code: Institutional formal attire with sturdy closed footwear.',
            ],
            callToAction: {
              label: 'View Digital Boarding Pass',
              url: `https://vit-industrial-visit.edu.in/student/experiences/${experience.id}`,
            },
          },
        });

        if (dispatchRes.emailLog?.status === 'FAILED') {
          totalEmailsFailed++;
          recipientBreakdown.students.push({ name: student.name, email: student.email, status: 'FAILED', error: dispatchRes.emailLog.errorMessage });
        } else {
          totalEmailsSent++;
          recipientBreakdown.students.push({ name: student.name, email: student.email, status: 'SENT' });
        }
      } catch (err: any) {
        totalEmailsFailed++;
        recipientBreakdown.students.push({ name: reg.studentId, email: 'unknown', status: 'FAILED', error: err.message });
      }
    }

    // 2. Resolve Faculty Coordinators
    const facultyList = db.getAllFaculty ? db.getAllFaculty() : [];
    const assignedFaculty = facultyList.filter(
      (f: any) => f.userId === experience.primaryFacultyId || f.facultyId === experience.primaryFacultyId || f.status === 'ACTIVE'
    ).slice(0, 2); // Notify primary + lead coordinators

    const facultyNames = assignedFaculty.map((f: any) => f.name).join(', ') || 'Dr. Arvind Swaminathan';

    for (const faculty of assignedFaculty) {
      try {
        const idempotencyKey = `rem_3day_fac_${faculty.facultyId || faculty.userId}_${experience.id}_${experience.date}`;
        
        if (!options.forceSend && db.hasTripReminderBeenSent && db.hasTripReminderBeenSent(experience.id, 'PRE_TRIP_3_DAY', experience.date, faculty.email)) {
          recipientBreakdown.faculty.push({ name: faculty.name, email: faculty.email, status: 'SKIPPED' });
          continue;
        }

        const emailLogId = `eml_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const emailLog: EmailNotification = {
          id: emailLogId,
          tripId: experience.id,
          eventType: 'PRE_TRIP_3_DAY_REMINDER',
          recipientEmail: faculty.email,
          recipientName: faculty.name,
          recipientRole: 'FACULTY',
          subject: `📋 Upcoming Industrial Visit – ${experience.title} in 3 Days`,
          status: 'PENDING',
          attempts: 1,
          lastAttemptAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          idempotencyKey,
        };
        db.addEmailLog(emailLog);

        const emailRes = await emailService.sendEmail({
          to: faculty.email,
          toName: faculty.name,
          subject: `📋 Upcoming Industrial Visit – ${experience.title} in 3 Days`,
          eventType: 'PRE_TRIP_3_DAY_FACULTY',
          tripId: experience.id,
          headline: `Faculty Coordination Notice: 3 Days to Visit`,
          badgeText: '📋 3 DAYS TO DEPARTURE',
          badgeType: 'primary',
          contentParagraphs: [
            `Dear <strong>${faculty.name}</strong>, this is an automated 3-day operational reminder for the upcoming industrial exposure visit to <strong>${experience.organization}</strong> on <strong>${experience.date}</strong>.`,
            `The student cohort has been compiled. Please review the confirmed attendee roster and coordinate final bus dispatch logistics with Campus Security.`,
          ],
          tripDetails: {
            organization: experience.organization,
            title: experience.title,
            date: experience.date,
            reportingTime,
            reportingLocation,
            departureTime,
            transportInfo,
            confirmedCount: confirmedRegistrations.length,
            waitlistCount,
            facultyCoordinatorsList: facultyNames,
          },
          importantNotes: [
            'Digital attendance roll-call scanner will be activated on your Faculty Portal on visit morning.',
            'Ensure all participant consent documents are verified prior to departure.',
            'Coordinate with campus gate security for student bus entry/exit clearance.',
          ],
          callToAction: {
            label: 'Open Faculty Visit Management',
            url: `https://vit-industrial-visit.edu.in/faculty/experiences/${experience.id}`,
          },
        });

        if (emailRes.success) {
          emailLog.status = 'SENT';
          emailLog.sentAt = new Date().toISOString();
          totalEmailsSent++;
          recipientBreakdown.faculty.push({ name: faculty.name, email: faculty.email, status: 'SENT' });
        } else {
          emailLog.status = 'FAILED';
          emailLog.errorMessage = emailRes.error;
          totalEmailsFailed++;
          recipientBreakdown.faculty.push({ name: faculty.name, email: faculty.email, status: 'FAILED', error: emailRes.error });
        }
      } catch (err: any) {
        totalEmailsFailed++;
        recipientBreakdown.faculty.push({ name: faculty.name, email: faculty.email, status: 'FAILED', error: err.message });
      }
    }

    // 3. Resolve Security Team Recipients (Admin Configurable)
    const securityRecipients = db.getSecurityRecipients ? db.getSecurityRecipients().filter((s: any) => s.isActive) : [];
    
    // Default fallback if no security recipients exist
    const effectiveSecurityList = securityRecipients.length > 0 ? securityRecipients : [
      { id: 'sec_1', name: 'Campus Security Office', email: 'security@vit.edu.in', gateLocation: 'Main Gate 1 & Bus Bay' },
    ];

    for (const sec of effectiveSecurityList) {
      try {
        const idempotencyKey = `rem_3day_sec_${sec.id || sec.email}_${experience.id}_${experience.date}`;

        if (!options.forceSend && db.hasTripReminderBeenSent && db.hasTripReminderBeenSent(experience.id, 'PRE_TRIP_3_DAY', experience.date, sec.email)) {
          recipientBreakdown.security.push({ name: sec.name, email: sec.email, gate: sec.gateLocation || 'Main Gate', status: 'SKIPPED' });
          continue;
        }

        const securitySubject = `🛡️ Upcoming Industrial Visit – ${experience.title} – ${experience.date}`;

        const emailLogId = `eml_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const emailLog: EmailNotification = {
          id: emailLogId,
          tripId: experience.id,
          eventType: 'SECURITY_NOTICE',
          recipientEmail: sec.email,
          recipientName: sec.name,
          recipientRole: 'SECURITY',
          subject: securitySubject,
          status: 'PENDING',
          attempts: 1,
          lastAttemptAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          idempotencyKey,
        };
        db.addEmailLog(emailLog);

        const emailRes = await emailService.sendEmail({
          to: sec.email,
          toName: sec.name || 'Campus Security Team',
          subject: securitySubject,
          eventType: 'PRE_TRIP_3_DAY_SECURITY',
          tripId: experience.id,
          headline: `Upcoming Industrial Visit Security Notice`,
          badgeText: '🛡️ SECURITY NOTICE',
          badgeType: 'info',
          greeting: 'Dear Security Team,',
          contentParagraphs: [
            `This is a reminder that an Industrial Visit is scheduled from the college.`,
            `Please be aware of the scheduled student movement and transportation activity at the college gate during the reporting and departure time.`,
            `Kindly assist with smooth movement and coordination at the departure point as required.`,
          ],
          tripDetails: {
            organization: experience.organization,
            title: experience.title,
            date: experience.date,
            reportingTime,
            reportingLocation: sec.gateLocation || reportingLocation,
            departureTime,
            transportInfo,
            gateLocation: sec.gateLocation || reportingLocation,
            expectedStudentsCount: confirmedRegistrations.length,
          },
        });

        if (emailRes.success) {
          emailLog.status = 'SENT';
          emailLog.sentAt = new Date().toISOString();
          totalEmailsSent++;
          recipientBreakdown.security.push({ name: sec.name, email: sec.email, gate: sec.gateLocation || 'Main Gate', status: 'SENT' });
        } else {
          emailLog.status = 'FAILED';
          emailLog.errorMessage = emailRes.error;
          totalEmailsFailed++;
          recipientBreakdown.security.push({ name: sec.name, email: sec.email, gate: sec.gateLocation || 'Main Gate', status: 'FAILED', error: emailRes.error });
        }
      } catch (err: any) {
        totalEmailsFailed++;
        recipientBreakdown.security.push({ name: sec.name, email: sec.email, gate: sec.gateLocation || 'Main Gate', status: 'FAILED', error: err.message });
      }
    }

    // 4. Resolve Institutional Admins
    const allUsers = db.getAllUsers ? db.getAllUsers() : [];
    const adminUsers = allUsers.filter((u: any) => u.role === 'ADMIN' && u.status === 'ACTIVE');

    for (const admin of adminUsers) {
      try {
        const idempotencyKey = `rem_3day_adm_${admin.id}_${experience.id}_${experience.date}`;

        if (!options.forceSend && db.hasTripReminderBeenSent && db.hasTripReminderBeenSent(experience.id, 'PRE_TRIP_3_DAY', experience.date, admin.email)) {
          recipientBreakdown.admin.push({ name: admin.name, email: admin.email, status: 'SKIPPED' });
          continue;
        }

        const emailLogId = `eml_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const emailLog: EmailNotification = {
          id: emailLogId,
          tripId: experience.id,
          eventType: 'ADMIN_SUMMARY',
          recipientEmail: admin.email,
          recipientName: admin.name,
          recipientRole: 'ADMIN',
          subject: `📊 Upcoming Industrial Visit – ${experience.title} in 3 Days`,
          status: 'PENDING',
          attempts: 1,
          lastAttemptAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          idempotencyKey,
        };
        db.addEmailLog(emailLog);

        const emailRes = await emailService.sendEmail({
          to: admin.email,
          toName: admin.name,
          subject: `📊 Upcoming Industrial Visit – ${experience.title} in 3 Days`,
          eventType: 'PRE_TRIP_3_DAY_ADMIN',
          tripId: experience.id,
          headline: `Executive Visit Operational Summary`,
          badgeText: '📊 3-DAY OPERATIONAL AUDIT',
          badgeType: 'primary',
          contentParagraphs: [
            `Dear <strong>${admin.name}</strong>, here is the automated 3-day operational briefing for <strong>${experience.organization} Industrial Visit</strong> scheduled on <strong>${experience.date}</strong>.`,
            `The student cohort, faculty coordination, and security dispatch checklists have been processed by the automated scheduler.`,
          ],
          tripDetails: {
            organization: experience.organization,
            title: experience.title,
            date: experience.date,
            reportingTime,
            reportingLocation,
            departureTime,
            transportInfo,
            confirmedCount: confirmedRegistrations.length,
            waitlistCount,
            facultyCoordinatorsList: facultyNames,
          },
          importantNotes: [
            `Total confirmed registrations: ${confirmedRegistrations.length} / ${experience.capacity || 40} capacity.`,
            `Waitlist queue: ${waitlistCount} students.`,
            `Assigned faculty coordinator(s): ${facultyNames}.`,
            `Security clearance notice dispatched to ${effectiveSecurityList.length} designated gate security post(s).`,
          ],
          callToAction: {
            label: 'View Administrative Registrations Roster',
            url: `https://vit-industrial-visit.edu.in/admin/registrations`,
          },
        });

        if (emailRes.success) {
          emailLog.status = 'SENT';
          emailLog.sentAt = new Date().toISOString();
          totalEmailsSent++;
          recipientBreakdown.admin.push({ name: admin.name, email: admin.email, status: 'SENT' });
        } else {
          emailLog.status = 'FAILED';
          emailLog.errorMessage = emailRes.error;
          totalEmailsFailed++;
          recipientBreakdown.admin.push({ name: admin.name, email: admin.email, status: 'FAILED', error: emailRes.error });
        }
      } catch (err: any) {
        totalEmailsFailed++;
        recipientBreakdown.admin.push({ name: admin.name, email: admin.email, status: 'FAILED', error: err.message });
      }
    }

    const studentsNotified = recipientBreakdown.students.filter((s) => s.status === 'SENT').length;
    const facultyNotified = recipientBreakdown.faculty.filter((f) => f.status === 'SENT').length;
    const securityNotified = recipientBreakdown.security.filter((s) => s.status === 'SENT').length;
    const adminNotified = recipientBreakdown.admin.filter((a) => a.status === 'SENT').length;

    const overallStatus = totalEmailsFailed === 0 ? 'COMPLETED' : totalEmailsSent > 0 ? 'PARTIAL' : 'FAILED';

    // Record in db reminder ledger
    if (db.addTripReminderRecord) {
      db.addTripReminderRecord({
        id: `rem_rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        tripId: experience.id,
        tripTitle: experience.title,
        tripDate: experience.date,
        reminderType: 'PRE_TRIP_3_DAY',
        targetDate: experience.date,
        studentsNotified,
        facultyNotified,
        securityNotified,
        adminNotified,
        totalEmailsSent,
        totalEmailsFailed,
        dispatchedAt: new Date().toISOString(),
        status: overallStatus,
        details: `Dispatched 3-day pre-trip alerts: ${studentsNotified} students, ${facultyNotified} faculty, ${securityNotified} security, ${adminNotified} admin.`,
      });
    }

    return {
      tripId: experience.id,
      tripTitle: experience.title,
      tripDate: experience.date,
      daysUntilTrip,
      targetDate,
      studentsNotified,
      facultyNotified,
      securityNotified,
      adminNotified,
      totalEmailsSent,
      totalEmailsFailed,
      status: overallStatus,
      recipientBreakdown,
      message: `3-Day Pre-Trip Reminder dispatched successfully (${totalEmailsSent} delivered, ${totalEmailsFailed} failed).`,
    };
  }
}

/**
 * Returns current date components in Asia/Kolkata timezone (IST, UTC+5:30)
 */
export function getNowInAsiaKolkata(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  dateStr: string;
  timeStr: string;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStr = formatter.format(date); // 'YYYY-MM-DD'
  const timeStr = timeFormatter.format(date); // 'HH:mm:ss'
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day, dateStr, timeStr };
}

/**
 * Calculates calendar day difference between a trip date and reference date in Asia/Kolkata (IST) timezone.
 * Handles month rollover, leap years, and calendar boundaries cleanly.
 */
export function calculateDaysUntilTrip(tripDateStr: string, fromDate: Date = new Date()): number {
  if (!tripDateStr) return -999;
  const cleanDateStr = tripDateStr.split('T')[0];
  const tripParts = cleanDateStr.split('-');
  if (tripParts.length < 3) return -999;
  const tripYear = parseInt(tripParts[0], 10);
  const tripMonth = parseInt(tripParts[1], 10) - 1;
  const tripDay = parseInt(tripParts[2], 10);

  const tripDateUtc = new Date(Date.UTC(tripYear, tripMonth, tripDay));
  
  // Format reference date in Asia/Kolkata (IST) calendar day
  const kolkata = getNowInAsiaKolkata(fromDate);
  const todayDateUtc = new Date(Date.UTC(kolkata.year, kolkata.month - 1, kolkata.day));

  const diffTime = tripDateUtc.getTime() - todayDateUtc.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export const notificationService = new NotificationService();
