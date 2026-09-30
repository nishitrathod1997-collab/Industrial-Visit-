import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { EmailNotification } from '../src/types';

// Load .env first; fallback to .env.example if .env does not exist or lacks credentials
dotenv.config();
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      dotenv.config({ path: envExamplePath });
    }
  }
} catch {
  // Ignore fs errors in sandboxed environments
}

export interface EmailPayload {
  to: string;
  toName: string;
  subject: string;
  eventType: string;
  tripId?: string;
  studentId?: string;
  notificationId?: string;
  previewText?: string;
  headline: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  greeting?: string;
  contentParagraphs: string[];
  tripDetails?: {
    organization: string;
    title: string;
    date: string;
    reportingTime?: string;
    reportingLocation?: string;
    venueLocation?: string;
    facultyCoordinator?: string;
    statusBadge?: string;
    waitlistPosition?: number;
    boardingPassNumber?: string;
    confirmedCount?: number;
    waitlistCount?: number;
    expectedStudentsCount?: number;
    transportInfo?: string;
    departureTime?: string;
    gateLocation?: string;
    facultyCoordinatorsList?: string;
    announcementsSummary?: string;
  };
  keyChangeDetails?: Array<{
    label: string;
    oldValue?: string;
    newValue: string;
    highlight?: boolean;
  }>;
  callToAction?: {
    label: string;
    url: string;
  };
  importantNotes?: string[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private authFailed: boolean = false;
  private lastAuthErrorLoggedAt: number = 0;
  private emailMode: 'production' | 'development' | 'live' = 'live';
  private fromAddress: string = 'Industrial Visit Hub <nishitrathod010@gmail.com>';
  private testRecipient: string = 'nishitrathod010@gmail.com';
  private lastConfigSignature: string = '';

  constructor() {
    this.initTransporter();
  }

  /**
   * Helper to clean string values from environment variables
   */
  private cleanEnvValue(val?: string): string {
    if (!val) return '';
    let cleaned = val.trim();
    // Strip surrounding matching quotes if present
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.substring(1, cleaned.length - 1).trim();
    }
    return cleaned;
  }

  /**
   * Clean Gmail App Password (removes embedded spaces)
   */
  private cleanPassword(val?: string): string {
    const cleaned = this.cleanEnvValue(val);
    // Google App Passwords are 16 characters often presented with 4-character space groupings (e.g. "abcd efgh ijkl mnop")
    return cleaned.replace(/\s+/g, '');
  }

  public initTransporter(): boolean {
    const rawMode = this.cleanEnvValue(process.env.EMAIL_MODE);
    this.emailMode = (rawMode as 'production' | 'development' | 'live') || 'live';

    const host = this.cleanEnvValue(process.env.EMAIL_HOST || process.env.SMTP_HOST) || 'smtp.gmail.com';
    const port = Number(this.cleanEnvValue(process.env.EMAIL_PORT || process.env.SMTP_PORT)) || 587;
    const user = this.cleanEnvValue(process.env.EMAIL_USER || process.env.SMTP_USER) || 'nishitrathod010@gmail.com';
    const pass = this.cleanPassword(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS) || 'ajromtbjdpcqkdip';
    const secureStr = this.cleanEnvValue(process.env.EMAIL_SECURE || process.env.SMTP_SECURE);
    const secure = secureStr === 'true' || port === 465;

    this.testRecipient = this.cleanEnvValue(process.env.DEV_OVERRIDE_EMAIL || process.env.TEST_EMAIL_RECIPIENT) || 'nishitrathod010@gmail.com';

    const rawFrom = this.cleanEnvValue(process.env.EMAIL_FROM || process.env.SMTP_FROM);
    if (rawFrom) {
      this.fromAddress = rawFrom;
    } else if (user) {
      this.fromAddress = `Industrial Visit Hub <${user}>`;
    } else {
      this.fromAddress = 'Industrial Visit Hub <nishitrathod010@gmail.com>';
    }

    const currentSignature = `${host}:${port}:${user}:${pass ? 'has_pass' : 'no_pass'}:${secure}`;
    if (this.transporter && this.lastConfigSignature === currentSignature) {
      return this.isConfigured && !this.authFailed;
    }
    this.lastConfigSignature = currentSignature;
    this.authFailed = false;

    if (user && pass) {
      const isGmail = host.toLowerCase().includes('gmail.com') || user.toLowerCase().endsWith('@gmail.com');

      if (isGmail) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user, pass },
          pool: true,
          maxConnections: 1,
          maxMessages: 50,
          rateDelta: 1000,
          rateLimit: 2,
          tls: {
            rejectUnauthorized: false,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          pool: true,
          maxConnections: 2,
          maxMessages: 50,
          rateDelta: 1000,
          rateLimit: 5,
          tls: {
            rejectUnauthorized: false,
          },
        });
      }
      this.isConfigured = true;
      const maskedUser = user.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      console.log(`[EmailService] SMTP Transporter initialized for ${maskedUser} on ${host}:${port} (secure=${secure}, mode=${this.emailMode})`);
      return true;
    } else {
      this.transporter = null;
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Generates a responsive, branded HTML email template matching the VIT Industrial Exposure brand.
   */
  public generateHtmlTemplate(payload: EmailPayload): string {
    const primaryColor = '#0B2545';
    const accentColor = '#133E87';
    const goldColor = '#D97706';

    const getBadgeColors = () => {
      switch (payload.badgeType) {
        case 'success':
          return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
        case 'danger':
          return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
        case 'warning':
          return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
        case 'info':
          return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
        default:
          return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' };
      }
    };

    const badgeStyle = getBadgeColors();
    const appUrl = process.env.APP_URL || 'https://vit-industrial-visit.edu.in';
    const ctaUrl = payload.callToAction?.url ? (payload.callToAction.url.startsWith('http') ? payload.callToAction.url : `${appUrl}${payload.callToAction.url}`) : appUrl;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; }
    td { font-family: inherit; font-size: 14px; vertical-align: top; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 24px 0 32px 0; }
    .main { background: #ffffff; margin: 0 auto; max-width: 600px; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background-color: ${primaryColor}; padding: 24px 32px; text-align: left; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${badgeStyle.bg}; color: ${badgeStyle.text}; border: 1px solid ${badgeStyle.border}; margin-bottom: 16px; }
    .headline { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3; }
    .paragraph { font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0; }
    .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .details-row { padding: 6px 0; border-bottom: 1px solid #edf2f7; }
    .details-row:last-child { border-bottom: none; }
    .details-label { font-size: 12px; font-weight: 600; color: #64748b; width: 35%; display: inline-block; }
    .details-val { font-size: 13px; font-weight: 600; color: #0f172a; width: 63%; display: inline-block; }
    .cta-btn { display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(11,37,69,0.25); text-align: center; }
    .notes-box { background-color: #fffbeb; border-left: 4px solid ${goldColor}; padding: 14px 16px; border-radius: 4px; margin: 20px 0; font-size: 12px; color: #78350f; line-height: 1.5; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center" cellpadding="0" cellspacing="0">
      <!-- HEADER -->
      <tr>
        <td class="header">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display: inline-block; background: #d97706; color: #0f172a; font-weight: 900; font-size: 13px; padding: 4px 8px; border-radius: 4px; letter-spacing: 1px;">VIT</span>
                <span style="color: #ffffff; font-weight: 700; font-size: 15px; margin-left: 10px; vertical-align: middle;">Industrial Visit Hub</span>
              </td>
              <td align="right">
                <span style="color: #93c5fd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Official Notification</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTENT BODY -->
      <tr>
        <td class="content">
          ${payload.badgeText ? `<div class="badge">${payload.badgeText}</div>` : ''}
          <h2 class="headline">${payload.headline}</h2>
          
          <p class="paragraph">${payload.greeting || `Hello <strong>${payload.toName}</strong>,`}</p>

          ${payload.contentParagraphs.map((p) => `<p class="paragraph">${p}</p>`).join('')}

          ${payload.keyChangeDetails && payload.keyChangeDetails.length > 0 ? `
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 18px 0;">
              <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 13px; font-weight: 700;">Key Schedule / Itinerary Updates:</h4>
              ${payload.keyChangeDetails.map((c) => `
                <div style="padding: 4px 0; font-size: 13px;">
                  <span style="font-weight: 600; color: #475569;">${c.label}:</span>
                  ${c.oldValue ? `<span style="text-decoration: line-through; color: #94a3b8; margin-right: 6px;">${c.oldValue}</span>` : ''}
                  <strong style="color: #1e293b;">${c.newValue}</strong>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${payload.tripDetails ? `
            <div class="details-box">
              <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">${payload.eventType === 'PRE_TRIP_3_DAY_SECURITY' ? 'Trip Details' : 'Trip Particulars'}</h3>
              <div class="details-row">
                <span class="details-label">${payload.eventType === 'PRE_TRIP_3_DAY_SECURITY' ? 'Trip:' : 'Industrial Visit:'}</span>
                <span class="details-val">${payload.tripDetails.title}</span>
              </div>
              <div class="details-row">
                <span class="details-label">${payload.eventType === 'PRE_TRIP_3_DAY_SECURITY' ? 'Company:' : 'Host Organization:'}</span>
                <span class="details-val">${payload.tripDetails.organization}</span>
              </div>
              <div class="details-row">
                <span class="details-label">${payload.eventType === 'PRE_TRIP_3_DAY_SECURITY' ? 'Date:' : 'Scheduled Date:'}</span>
                <span class="details-val">📅 ${payload.tripDetails.date}</span>
              </div>
              ${payload.tripDetails.reportingTime ? `
              <div class="details-row">
                <span class="details-label">Reporting Time:</span>
                <span class="details-val">⏰ ${payload.tripDetails.reportingTime}</span>
              </div>` : ''}
              ${(payload.tripDetails.reportingLocation || payload.tripDetails.gateLocation) ? `
              <div class="details-row">
                <span class="details-label">${payload.eventType === 'PRE_TRIP_3_DAY_SECURITY' ? 'Departure Location:' : 'Assembly Point:'}</span>
                <span class="details-val">📍 ${payload.tripDetails.gateLocation || payload.tripDetails.reportingLocation}</span>
              </div>` : ''}
              ${payload.tripDetails.venueLocation ? `
              <div class="details-row">
                <span class="details-label">Location / City:</span>
                <span class="details-val">🏢 ${payload.tripDetails.venueLocation}</span>
              </div>` : ''}
              ${payload.tripDetails.statusBadge ? `
              <div class="details-row">
                <span class="details-label">Registration Status:</span>
                <span class="details-val" style="color: #059669; font-weight: 700;">${payload.tripDetails.statusBadge}</span>
              </div>` : ''}
              ${payload.tripDetails.waitlistPosition !== undefined ? `
              <div class="details-row">
                <span class="details-label">Waitlist Position:</span>
                <span class="details-val" style="color: #d97706; font-weight: 700;">Position #${payload.tripDetails.waitlistPosition}</span>
              </div>` : ''}
              ${payload.tripDetails.boardingPassNumber ? `
              <div class="details-row">
                <span class="details-label">Boarding Pass #:</span>
                <span class="details-val" style="font-family: monospace; font-weight: 700; color: #0b2545;">${payload.tripDetails.boardingPassNumber}</span>
              </div>` : ''}
              ${payload.tripDetails.facultyCoordinator ? `
              <div class="details-row">
                <span class="details-label">Faculty In-Charge:</span>
                <span class="details-val">👨‍🏫 ${payload.tripDetails.facultyCoordinator}</span>
              </div>` : ''}
              ${payload.tripDetails.facultyCoordinatorsList ? `
              <div class="details-row">
                <span class="details-label">Faculty Team:</span>
                <span class="details-val">${payload.tripDetails.facultyCoordinatorsList}</span>
              </div>` : ''}
              ${payload.tripDetails.confirmedCount !== undefined ? `
              <div class="details-row">
                <span class="details-label">Confirmed Cohort:</span>
                <span class="details-val" style="color: #059669; font-weight: 700;">👥 ${payload.tripDetails.confirmedCount} Students</span>
              </div>` : ''}
              ${payload.tripDetails.expectedStudentsCount !== undefined ? `
              <div class="details-row">
                <span class="details-label">Expected Students:</span>
                <span class="details-val" style="color: #0b2545; font-weight: 700;">👥 ${payload.tripDetails.expectedStudentsCount} Students</span>
              </div>` : ''}
              ${payload.tripDetails.waitlistCount !== undefined ? `
              <div class="details-row">
                <span class="details-label">Waitlist Queue:</span>
                <span class="details-val">⏳ ${payload.tripDetails.waitlistCount} Students</span>
              </div>` : ''}
              ${payload.tripDetails.transportInfo ? `
              <div class="details-row">
                <span class="details-label">${payload.eventType === 'PRE_TRIP_3_DAY_SECURITY' ? 'Transport:' : 'Transport / Bus:'}</span>
                <span class="details-val">🚌 ${payload.tripDetails.transportInfo}</span>
              </div>` : ''}
              ${(payload.tripDetails.departureTime && payload.eventType !== 'PRE_TRIP_3_DAY_SECURITY') ? `
              <div class="details-row">
                <span class="details-label">Bus Departure:</span>
                <span class="details-val">⏰ ${payload.tripDetails.departureTime}</span>
              </div>` : ''}
              ${(payload.tripDetails.gateLocation && payload.eventType !== 'PRE_TRIP_3_DAY_SECURITY') ? `
              <div class="details-row">
                <span class="details-label">Gate / Bus Bay:</span>
                <span class="details-val">🚪 ${payload.tripDetails.gateLocation}</span>
              </div>` : ''}
              ${payload.tripDetails.announcementsSummary ? `
              <div class="details-row">
                <span class="details-label">Announcements:</span>
                <span class="details-val">${payload.tripDetails.announcementsSummary}</span>
              </div>` : ''}
            </div>
          ` : ''}

          ${payload.importantNotes && payload.importantNotes.length > 0 ? `
            <div class="notes-box">
              <strong>Mandatory Directives:</strong>
              <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                ${payload.importantNotes.map((n) => `<li>${n}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${payload.callToAction ? `
            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${ctaUrl}" class="cta-btn" target="_blank">${payload.callToAction.label} &rarr;</a>
            </div>
          ` : ''}

          <p class="paragraph" style="margin-top: 24px; font-size: 13px; color: #64748b;">
            Please log in to the <strong>VIT Industrial Visit Hub</strong> for real-time tracking, digital boarding passes, and coordinator broadcasts.
          </p>

          <p class="paragraph" style="margin-top: 16px; margin-bottom: 0;">
            Warm regards,<br>
            <strong>Experiential Learning & Industrial Relations Cell</strong><br>
            Vidyalankar Institute of Technology, Mumbai
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td class="footer">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">Vidyalankar Institute of Technology</p>
          <p style="margin: 0 0 8px 0;">Vidyalankar Educational Campus, Wadala (East), Mumbai 400037</p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            This is an automated institutional message delivered to <strong>${payload.to}</strong>. Please do not reply directly to this email.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
    `;
  }

  /**
   * Sends transactional email to the student with full error handling, logging, and retry compatibility.
   */
  public async sendEmail(payload: EmailPayload): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    recipient: string;
    providerAccepted?: boolean;
    providerResponse?: string;
    acceptedRecipients?: string[];
    rejectedRecipients?: string[];
  }> {
    // Dynamic recipient resolution:
    // In production mode, recipient is strictly payload.to (the student's registered email).
    // In development mode, we can route all test emails to the configured test recipient if requested,
    // but we default to payload.to to verify real Gmail delivery!
    const effectiveRecipient = payload.to;

    const html = this.generateHtmlTemplate(payload);
    
    let plainText = '';
    if (payload.eventType === 'PRE_TRIP_3_DAY_SECURITY') {
      plainText = `
Subject: ${payload.subject}

Dear Security Team,

This is a reminder that an Industrial Visit is scheduled from the college.

Trip:
${payload.tripDetails?.title || 'Industrial Visit'}

Company:
${payload.tripDetails?.organization || 'Industrial Partner'}

Date:
${payload.tripDetails?.date || ''}

Reporting Time:
${payload.tripDetails?.reportingTime || '07:30 AM'}

Departure Location:
${payload.tripDetails?.gateLocation || payload.tripDetails?.reportingLocation || 'Main Campus Gate 1 & Bus Bay'}

Expected Students:
${payload.tripDetails?.expectedStudentsCount || payload.tripDetails?.confirmedCount || 0}

Transport:
${payload.tripDetails?.transportInfo || 'University AC Transit Coach'}

Please be aware of the scheduled student movement and transportation activity at the college gate during the reporting and departure time.

Kindly assist with smooth movement and coordination at the departure point as required.

Regards,
Industrial Visit Hub
Vidyalankar Institute of Technology
      `.trim();
    } else {
      plainText = `
${payload.subject}
----------------------------------------
${payload.greeting || `Hello ${payload.toName},`}

${payload.contentParagraphs.map((p) => p.replace(/<[^>]*>?/gm, '')).join('\n\n')}

${payload.tripDetails ? `
TRIP PARTICULARS:
- Organization: ${payload.tripDetails.organization}
- Title: ${payload.tripDetails.title}
- Date: ${payload.tripDetails.date}
${payload.tripDetails.reportingTime ? `- Reporting Time: ${payload.tripDetails.reportingTime}` : ''}
${payload.tripDetails.reportingLocation ? `- Assembly Point: ${payload.tripDetails.reportingLocation}` : ''}
${payload.tripDetails.statusBadge ? `- Status: ${payload.tripDetails.statusBadge}` : ''}
${payload.tripDetails.waitlistPosition ? `- Waitlist Position: #${payload.tripDetails.waitlistPosition}` : ''}
${payload.tripDetails.boardingPassNumber ? `- Boarding Pass: ${payload.tripDetails.boardingPassNumber}` : ''}
` : ''}

${payload.callToAction ? `Access on Portal: ${payload.callToAction.url || 'https://vit-industrial-visit.edu.in'}` : ''}

Regards,
VIT Industrial Visit Hub
      `.trim();
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.fromAddress,
      to: effectiveRecipient,
      subject: payload.subject,
      text: plainText,
      html: html,
    };

    console.log(`\n========================================`);
    console.log(`Email send attempted`);
    console.log(`Recipient: ${effectiveRecipient}`);
    console.log(`From: ${this.fromAddress}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Event: ${payload.eventType}`);

    this.initTransporter();

    if (!this.transporter || this.authFailed) {
      console.log(`Provider accepted: NO`);
      console.log(`Provider response: Transporter not configured or authentication failed`);
      console.log(`Message ID: N/A`);
      console.log(`========================================\n`);

      return {
        success: false,
        error: 'SMTP Transporter not configured. Please check EMAIL_USER and EMAIL_PASSWORD.',
        recipient: effectiveRecipient,
        providerAccepted: false,
        providerResponse: 'SMTP Transporter not configured',
      };
    }

    const maxSendAttempts = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxSendAttempts; attempt++) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        
        const isAccepted = Array.isArray(info.accepted) && info.accepted.map(a => String(a).toLowerCase().trim()).includes(effectiveRecipient.toLowerCase().trim());
        const isRejected = Array.isArray(info.rejected) && info.rejected.map(r => String(r).toLowerCase().trim()).includes(effectiveRecipient.toLowerCase().trim());
        const providerAccepted = isAccepted || (!isRejected && !!info.messageId);

        console.log(`Provider accepted: ${providerAccepted ? 'YES' : 'NO'}`);
        console.log(`Provider response: ${info.response || '250 OK'}`);
        console.log(`Message ID: ${info.messageId || 'N/A'}`);
        if (info.rejected && info.rejected.length > 0) {
          console.log(`Provider rejected recipients: ${info.rejected.join(', ')}`);
        }
        console.log(`========================================\n`);

        return {
          success: providerAccepted,
          messageId: info.messageId || `msg_${Date.now()}`,
          recipient: effectiveRecipient,
          providerAccepted,
          providerResponse: info.response,
          acceptedRecipients: (info.accepted || []) as string[],
          rejectedRecipients: (info.rejected || []) as string[],
        };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isAuthError = errMsg.includes('535') || errMsg.toLowerCase().includes('authentication failed') || errMsg.toLowerCase().includes('invalid login');
        const isTransientError =
          errMsg.includes('421') ||
          errMsg.includes('4.3.0') ||
          errMsg.includes('450') ||
          errMsg.includes('451') ||
          errMsg.toLowerCase().includes('temporary') ||
          errMsg.toLowerCase().includes('try again later') ||
          errMsg.includes('ECONNRESET') ||
          errMsg.includes('ETIMEDOUT') ||
          errMsg.includes('EPIPE');

        if (isAuthError) {
          this.authFailed = true;
          break; // Do not retry fatal auth errors
        }

        if (isTransientError && attempt < maxSendAttempts) {
          const backoffMs = attempt * 1200;
          console.warn(`[EmailService] Transient SMTP error on attempt ${attempt}/${maxSendAttempts}: ${errMsg}. Retrying in ${backoffMs}ms...`);
          await new Promise((res) => setTimeout(res, backoffMs));
          // Reset transporter signature to force fresh reconnect if needed
          if (attempt === 2) {
            this.lastConfigSignature = '';
            this.initTransporter();
          }
          continue;
        }

        break;
      }
    }

    const errMsg = lastError?.message || String(lastError);
    let userFriendlyError = errMsg;
    const isAuthError = errMsg.includes('535') || errMsg.toLowerCase().includes('authentication failed') || errMsg.toLowerCase().includes('invalid login');

    if (isAuthError) {
      this.authFailed = true;
      userFriendlyError = `Invalid login: 535 Authentication failed. Gmail SMTP rejected credentials.`;
    } else if (errMsg.includes('421') || errMsg.includes('4.3.0') || errMsg.toLowerCase().includes('temporary system problem')) {
      userFriendlyError = `Gmail SMTP 421 Rate-Limit / Temporary System Problem. Queued for automatic retry.`;
    }

    console.log(`Provider accepted: NO`);
    console.log(`Provider response: ${userFriendlyError}`);
    console.log(`Message ID: N/A`);
    console.log(`========================================\n`);

    return {
      success: false,
      error: userFriendlyError,
      recipient: effectiveRecipient,
      providerAccepted: false,
      providerResponse: userFriendlyError,
    };
  }

  /**
   * Diagnostic test email delivery
   */
  public async sendTestEmail(recipient: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: recipient,
      toName: 'Administrator',
      subject: '[Test] Industrial Visit Hub - Multi-Channel Notification Test',
      eventType: 'SYSTEM_TEST',
      headline: 'Multi-Channel Email Subsystem Online',
      badgeText: 'DIAGNOSTIC TEST',
      badgeType: 'info',
      contentParagraphs: [
        'This is an automated test message dispatched by the Industrial Visit Hub email subsystem.',
        'If you are reading this email, transactional SMTP delivery is functioning properly.'
      ],
      importantNotes: [
        'Timestamp: ' + new Date().toISOString(),
        'Recipient: ' + recipient
      ]
    });
  }

  /**
   * Health check and configuration verification
   */
  public async verifyConnection(): Promise<{ configured: boolean; mode: string; host?: string; error?: string }> {
    if (!this.transporter) {
      return { configured: false, mode: this.emailMode, error: 'No transporter initialized' };
    }
    try {
      await this.transporter.verify();
      return { configured: true, mode: this.emailMode, host: process.env.SMTP_HOST || 'local' };
    } catch (err: any) {
      return { configured: this.isConfigured, mode: this.emailMode, error: err.message };
    }
  }
}

export const emailService = new EmailService();
